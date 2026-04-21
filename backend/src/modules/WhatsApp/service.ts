import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WAMediaUpload,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import User from '../../models/User';
import { logger } from '../../utils/logger';
import QRCode from 'qrcode';
import Lead from '../LeadGeneration/model/lead.model';

const SESSION_DIR = './whatsapp-sessions';

interface WhatsAppSession {
  userId: string;
  phoneNumber?: string;
  state: 'DISCONNECTED' | 'AWAITING_SCAN' | 'CONNECTED';
  qr: string | null;
  connectedAt?: Date;
}

class WhatsAppService {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private connectionStates: Map<
    string,
    'DISCONNECTED' | 'AWAITING_SCAN' | 'CONNECTED'
  > = new Map();
  private qrCodes: Map<string, string | null> = new Map();

  private getSessionDir(userId: string): string {
    return path.join(SESSION_DIR, `session_${userId}`);
  }

  private ensureSessionDir(userId: string): void {
    const dir = this.getSessionDir(userId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getStatus(userId: string): Promise<WhatsAppSession> {
    const user = await User.findById(userId).select(
      'whatsappConnected whatsappConnectedAt whatsappPhoneNumber'
    );

    let state: 'DISCONNECTED' | 'AWAITING_SCAN' | 'CONNECTED' = 'DISCONNECTED';
    if (user?.whatsappConnected) {
      state = 'CONNECTED';
    } else if (this.connectionStates.has(userId)) {
      state = this.connectionStates.get(userId)!;
    }

    return {
      userId,
      phoneNumber: user?.whatsappPhoneNumber || undefined,
      state,
      qr: this.qrCodes.get(userId) || null,
      connectedAt: user?.whatsappConnectedAt,
    };
  }

  async initializeSessions(): Promise<void> {
    try {
      const users = await User.find({ whatsappConnected: true }).select('_id');
      logger.info(`Found ${users.length} connected WhatsApp sessions to resume`);
      
      for (const user of users) {
        await this.startConnection(user._id.toString(), true);
        // Add a small delay between initializations to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Failed to initialize WhatsApp sessions', { error });
    }
  }

  async startConnection(
    userId: string,
    isReconnect: boolean = false
  ): Promise<void> {
    // Immediately set to AWAITING_SCAN so the frontend knows we are working on it
    if (!isReconnect) {
      this.connectionStates.set(userId, 'AWAITING_SCAN');
      this.qrCodes.set(userId, null);
    }

    const existingSocket = this.sockets.get(userId);
    if (existingSocket) {
      if (existingSocket.user && !isReconnect) {
        logger.info('Socket already exists and is authenticated for user', {
          userId,
        });
        this.connectionStates.set(userId, 'CONNECTED');
        return;
      }
      logger.info('Terminating existing/dead socket to spin up a new one', {
        userId,
      });
      try {
        existingSocket.end(undefined);
      } catch (e) {}
      this.sockets.delete(userId);
    }

    // If this is a manual start/refresh from the frontend (isReconnect = false)
    // and the user isn't authenticated in the DB, aggressively flush potential corrupt/partial
    // session files on disk to force a brand new QR code instead of hanging.
    if (!isReconnect) {
      const user = await User.findById(userId);
      if (!user?.whatsappConnected) {
        const dir = this.getSessionDir(userId);
        if (fs.existsSync(dir)) {
          logger.info(
            'Nuking stale session directory for disconnected user to force fresh QR',
            { userId }
          );
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
    }

    this.ensureSessionDir(userId);

    logger.info('Creating new WhatsApp socket', {
      userId,
      sessionDir: this.getSessionDir(userId),
    });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(
        this.getSessionDir(userId)
      );
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        auth: state,
        version,
        browser: Browsers.macOS('Desktop'),
        printQRInTerminal: false,
      });

      this.sockets.set(userId, sock);

      sock.ev.on('creds.update', async () => {
        logger.info('Creds update event fired');
        await saveCreds();
      });

      sock.ev.on('connection.update', async (update) => {
        logger.info('Connection update', {
          connection: update.connection,
          qr: update.qr ? 'QR present' : 'No QR',
        });

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info('QR found in connection.update, storing for polling');
          try {
            const qrDataUrl = qr.startsWith('data:')
              ? qr
              : await QRCode.toDataURL(qr);
            this.connectionStates.set(userId, 'AWAITING_SCAN');
            this.qrCodes.set(userId, qrDataUrl);
          } catch (err) {
            logger.error('Failed to generate QR Data URL', { err });
          }
        }

        if (connection === 'open') {
          const phoneNumber = sock.user?.id?.split(':')[0] || '';
          logger.info('WhatsApp connected', { phoneNumber });

          const existingUser = await User.findOne({
            whatsappPhoneNumber: phoneNumber,
            _id: { $ne: userId },
            whatsappConnected: true,
          });

          if (existingUser) {
            logger.warn('Phone number already connected to another account', {
              phoneNumber,
              existingUserId: existingUser._id,
              newUserId: userId,
            });
            this.connectionStates.set(userId, 'DISCONNECTED');
            this.qrCodes.set(userId, null);
            sock.end(undefined);
            await User.findByIdAndUpdate(userId, {
              whatsappConnected: false,
              whatsappConnectedAt: null,
              whatsappPhoneNumber: '',
            });
            logger.info('Connection rejected - phone number in use by another account', { phoneNumber });
            return;
          }

          this.connectionStates.set(userId, 'CONNECTED');
          this.qrCodes.set(userId, null);
          User.findByIdAndUpdate(userId, {
            whatsappConnected: true,
            whatsappConnectedAt: new Date(),
            whatsappPhoneNumber: phoneNumber,
          }).catch((err) => logger.error('Failed to update user', { err }));
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output
            ?.statusCode;
          logger.info('Connection closed', {
            statusCode,
            reason: DisconnectReason[statusCode] || statusCode,
          });

          if (statusCode === DisconnectReason.loggedOut) {
            logger.info(
              'Session auto-expired or disconnected by user, cleaning up session data',
              { userId }
            );
            this.sockets.delete(userId);
            this.handleLogout(userId).catch((err) =>
              logger.error('Logout cleanup failed', { err })
            );
          } else {
            logger.info(
              'Connection dropped or restart required, automatically reconnecting...',
              { userId, statusCode }
            );
            // Wait briefly before reconnecting to prevent instant tight-loops
            setTimeout(() => {
              this.startConnection(userId, true).catch((err) =>
                logger.error('Failed to auto-reconnect', { err })
              );
            }, 1500);
          }
        }
      });

      // Listen for incoming messages to detect replies from leads
      sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.key.remoteJid) {
            const phoneNumber = msg.key.remoteJid.split('@')[0].replace(/[^0-9]/g, '');
            const phoneLast10 = phoneNumber.slice(-10);
            
            // Debug: Log incoming phone number
            logger.info('Incoming message from', { phoneNumber, phoneLast10 });
            
            // Check if this phone number exists in processed leads (also check saved status)
            let lead = await Lead.findOne({
              phone: { $regex: new RegExp(phoneLast10, 'i') },
              status: 'processed'
            });
            
            // If not in processed, check saved leads
            if (!lead) {
              lead = await Lead.findOne({
                phone: { $regex: new RegExp(phoneLast10, 'i') },
                status: 'saved'
              });
              
              if (lead) {
                logger.info('Found lead in saved status, updating to processed', { 
                  phone: phoneNumber,
                  leadId: lead._id,
                  oldStatus: lead.status 
                });
                
                await Lead.findByIdAndUpdate(lead._id, {
                  $set: { status: 'processed' }
                });
                continue;
              }
            }
            
            if (lead) {
              logger.info('Found processed lead, updating to converted', { 
                phone: phoneNumber,
                leadId: lead._id,
                oldStatus: lead.status 
              });
              
              // Update lead status to 'converted' to indicate they replied
              const result = await Lead.findByIdAndUpdate(lead._id, {
                $set: { status: 'converted' }
              });
              
              logger.info('Lead status updated to converted', { 
                leadId: lead._id,
                phone: phoneNumber,
                result: result ? 'success' : 'failed'
              });
            } else {
              logger.info('No matching lead found in saved/processed status', { phoneNumber, phoneLast10 });
            }
          }
        }
      });

      (sock.ev as any).on('qr', async (qr: string) => {
        logger.info('QR event fired', { qrLength: qr?.length });
        try {
          const qrDataUrl = qr.startsWith('data:')
            ? qr
            : await QRCode.toDataURL(qr);
          this.connectionStates.set(userId, 'AWAITING_SCAN');
          this.qrCodes.set(userId, qrDataUrl);
        } catch (err) {
          logger.error('Failed to generate QR Data URL', { err });
        }
      });

      // Handle errors
      (sock.ev as any).on('CB:error', (error: any) => {
        logger.error('WhatsApp error', { error });
      });
    } catch (error) {
      logger.error('Failed to create WhatsApp socket', { error });
    }
  }

  async logout(userId: string): Promise<void> {
    const sock = this.sockets.get(userId);
    if (sock) {
      try {
        await sock.logout();
      } catch (err) {
        logger.error('Logout error', { err });
      }
      sock.end(undefined);
      this.sockets.delete(userId);
    }
    await this.handleLogout(userId);
  }

  private async handleLogout(userId: string): Promise<void> {
    const dir = this.getSessionDir(userId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    this.connectionStates.set(userId, 'DISCONNECTED');
    this.qrCodes.set(userId, null);

    await User.findByIdAndUpdate(userId, {
      whatsappConnected: false,
      whatsappConnectedAt: undefined,
      whatsappPhoneNumber: '',
    });
  }

  getSocket(userId: string): ReturnType<typeof makeWASocket> | undefined {
    return this.sockets.get(userId);
  }

  async checkIsConnected(userId: string): Promise<boolean> {
    const user = await User.findById(userId).select('whatsappConnected');
    return !!user?.whatsappConnected;
  }

  formatPhoneNumber(phone: string): string {
    // Remove non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Add default India +91 code if it's 10 digits (customize as needed)
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }

    if (!cleaned.endsWith('@s.whatsapp.net')) {
      cleaned = `${cleaned}@s.whatsapp.net`;
    }
    return cleaned;
  }

  async sendMessage(userId: string, to: string, text: string): Promise<any> {
    let sock = this.getSocket(userId);
    console.log(sock);
    if (!sock) {
      const isConnected = await this.checkIsConnected(userId);
      if (isConnected) {
        logger.info('Socket missing but user connected in DB. Attempting to restore session.', { userId });
        await this.startConnection(userId, true);
        // Wait briefly for connection to establish
        await new Promise((resolve) => setTimeout(resolve, 3000));
        sock = this.getSocket(userId);
      }
      
      if (!sock) {
        throw new Error(
          'WhatsApp session not active. Please reconnect to WhatsApp.'
        );
      }
    }

    // We optionally wait for connection in real environments,
    // but assuming session is open.
    const jid = this.formatPhoneNumber(to);

    try {
      // presence subscriber if necessary, but sendMessage works directly
      const result = await sock.sendMessage(jid, { text });
      logger.info('WhatsApp message sent', { userId, to, jid });
      return result;
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { userId, to, error });
      throw new Error('Failed to send WhatsApp message');
    }
  }

  async sendBulkMessage(
    userId: string,
    phoneNumbers: string[],
    text: string
  ): Promise<any> {
    console.log(userId);
    let sock = this.getSocket(userId);
    if (!sock) {
      const isConnected = await this.checkIsConnected(userId);
      if (isConnected) {
        logger.info('Socket missing but user connected in DB. Attempting to restore session.', { userId });
        await this.startConnection(userId, true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        sock = this.getSocket(userId);
      }

      if (!sock) {
        throw new Error(
          'WhatsApp session not active. Please reconnect to WhatsApp.'
        );
      }
    }

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    // Send messages sequentially with a delay to prevent being completely banned
    for (const phone of phoneNumbers) {
      try {
        const jid = this.formatPhoneNumber(phone);
        await sock.sendMessage(jid, { text });
        results.successful.push(phone);

        // Update lead status to 'processed' if it was 'saved'
        await Lead.updateOne(
          { phone, user: userId, status: 'saved' },
          { $set: { status: 'processed' } }
        ).catch((err: unknown) => {
          logger.error('Failed to update lead status', { phone, error: err });
        });

        // Wait 1-3 seconds between messages
        const delay = Math.floor(Math.random() * 2000) + 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        logger.error('Failed to send bulk message to number', {
          userId,
          phone,
          error,
        });
        results.failed.push(phone);
      }
    }

    return results;
  }

  async sendDocument(
    userId: string,
    to: string,
    text: string,
    documentBuffer: Buffer,
    fileName: string,
    mimeType: string = 'application/pdf'
  ): Promise<any> {
    let sock = this.getSocket(userId);
    if (!sock) {
      const isConnected = await this.checkIsConnected(userId);
      if (isConnected) {
        logger.info('Socket missing but user connected in DB. Attempting to restore session.', { userId });
        await this.startConnection(userId, true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        sock = this.getSocket(userId);
      }

      if (!sock) {
        throw new Error(
          'WhatsApp session not active. Please reconnect to WhatsApp.'
        );
      }
    }

    const jid = this.formatPhoneNumber(to);

    try {
      const result = await sock.sendMessage(jid, {
        document: documentBuffer,
        fileName: fileName,
        mimetype: mimeType,
        caption: text,
      });
      logger.info('WhatsApp document sent', { userId, to, jid, fileName });
      return result;
    } catch (error) {
      logger.error('Failed to send WhatsApp document', { userId, to, error });
      throw new Error('Failed to send WhatsApp document');
    }
  }
}

export const whatsappService = new WhatsAppService();
