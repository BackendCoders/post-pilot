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
import LeadMessage from '../LeadGeneration/model/leadMessage.model';
import LeadCategory from '../LeadGeneration/model/leadCategory.model';
import { socketService } from '../../services/socket.service';

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
      } catch (e) { }
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
            const phoneNumber = msg.key.remoteJidAlt ? msg.key.remoteJidAlt.split('@')[0].replace(/[^0-9]/g, '') : msg.key.remoteJid.split('@')[0].replace(/[^0-9]/g, '');
            if (!phoneNumber) {
              console.log("NO PHONE NO.");
              continue;
            };

            const phoneLast10 = phoneNumber.slice(-10);

            // Debug: Log incoming phone number
            logger.info('Incoming message from', { phoneNumber, phoneLast10 });

            // Check if this phone number exists in leads
            let lead = await this.findLeadByPhone(userId, phoneNumber);

            if (lead) {
              // Fetch category settings for automation
              const category = await LeadCategory.findById(lead.leadCategory);

              // 1. Auto Process on Send (if not already processed/converted)
              // This is usually handled on outgoing, but good to have a fallback here if needed.
              // However, user specifically asked for "Converted when message received".

              // 2. Auto Converted on Reply
              if (category?.autoConvertOnReply) {
                logger.info('Auto-promoting lead to converted based on category setting', { leadId: lead._id });
                await Lead.findByIdAndUpdate(lead._id, { $set: { status: 'converted' } });
              }

              // Check if message already logged
              const existingMsg = await LeadMessage.findOne({ whatsappMessageId: msg.key.id });
              if (existingMsg) {
                logger.info('Message already logged, skipping', { whatsappMessageId: msg.key.id });
                continue;
              }

              // Log incoming message
              const incomingMsg = await LeadMessage.create({
                user: userId,
                lead: lead._id,
                phone: phoneNumber,
                direction: 'incoming',
                content: msg.message?.conversation
                  || msg.message?.extendedTextMessage?.text
                  || (msg.message?.imageMessage ? '[Image]' : msg.message?.documentMessage ? '[Document]' : '[Media]'),
                contentType: msg.message?.imageMessage ? 'image' : msg.message?.documentMessage ? 'document' : 'text',
                status: 'delivered',
                whatsappMessageId: msg.key.id,
              });

              // Emit real-time update
              socketService.emitToLeadChat(lead._id.toString(), 'new_message', incomingMsg);
              socketService.emitToUser(userId, 'new_message', incomingMsg);

              logger.info('Lead status updated to converted and message logged', {
                leadId: lead._id,
                phone: phoneNumber
              });
            } else {
              logger.info('No matching lead found for incoming message', { phoneNumber, phoneLast10 });
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


  private async findLeadByPhone(userId: string, phone: string) {
    const phoneDigits = phone.replace(/\D/g, '');
    const phoneLast10 = phoneDigits.slice(-10);

    logger.info('Finding lead by phone', { userId, phone, phoneDigits, phoneLast10 });

    // Try finding by status priority to handle duplicate phone numbers
    // Priority: saved > processed > any
    let lead = await Lead.findOne({
      user: userId,
      phone: { $regex: new RegExp(phoneLast10, 'i') },
      status: 'saved'
    });

    if (!lead) {
      lead = await Lead.findOne({
        user: userId,
        phone: { $regex: new RegExp(phoneLast10, 'i') },
        status: 'processed'
      });
    }

    if (!lead) {
      lead = await Lead.findOne({
        user: userId,
        phone: { $regex: new RegExp(phoneLast10, 'i') }
      });
    }

    if (lead) {
      logger.info('Lead found via regex with status priority', { leadId: lead._id, status: lead.status });
    } else {
      logger.info('Lead not found via regex, trying manual match on all user leads');
      const userLeads = await Lead.find({ user: userId }).select('phone');
      logger.info(`Checking ${userLeads.length} leads for user`);

      const matchedLead = userLeads.find(l => {
        if (!l.phone) return false;
        const leadDigits = l.phone.replace(/\D/g, '');
        const match = leadDigits.endsWith(phoneLast10);
        if (match) logger.info('Manual match found', { leadPhone: l.phone, leadId: l._id });
        return match;
      });

      if (matchedLead) {
        lead = await Lead.findById(matchedLead._id);
      } else {
        lead = null;
      }
    }

    if (!lead) {
      logger.warn(`Lead NOT found for`, { phone, phoneLast10 });
    }

    return lead;
  }

  async sendMessage(userId: string, to: string, text: string): Promise<any> {
    let sock = this.getSocket(userId);
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

      // Log outgoing message
      const lead = await this.findLeadByPhone(userId, to);

      if (lead) {
        // Fetch category settings for automation
        const category = await LeadCategory.findById(lead.leadCategory);

        logger.info('Checking auto-process on send for single message', {
          leadId: lead._id,
          categoryId: category?._id,
          autoProcessSetting: category?.autoProcessOnSend,
          currentLeadStatus: lead.status
        });

        if (category?.autoProcessOnSend && lead.status === 'saved') {
          logger.info('Auto-promoting lead to processed based on category setting', { leadId: lead._id });
          await Lead.findByIdAndUpdate(lead._id, { $set: { status: 'processed' } });
        }

        const outgoingMsg = await LeadMessage.create({
          user: userId,
          lead: lead._id,
          phone: to,
          direction: 'outgoing',
          content: text,
          contentType: 'text',
          status: 'sent',
          whatsappMessageId: result?.key?.id,
        });

        // Emit real-time update
        socketService.emitToLeadChat(lead._id.toString(), 'new_message', outgoingMsg);
        socketService.emitToUser(userId, 'new_message', outgoingMsg);
      } else {
        logger.warn('Skipping message log: Lead not found', { to });
      }

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
        const result = await sock.sendMessage(jid, { text });
        results.successful.push(phone);

        logger.info('Bulk message sent to', { phone, jid });

        // Log outgoing message
        const lead = await this.findLeadByPhone(userId, phone);

        if (lead) {
          logger.info('Logging bulk message for lead', { leadId: lead._id });

          // Fetch category settings for automation
          const category = await LeadCategory.findById(lead.leadCategory);

          logger.info('Checking auto-process on send for bulk message', {
            leadId: lead._id,
            categoryId: category?._id,
            autoProcessSetting: category?.autoProcessOnSend,
            currentLeadStatus: lead.status
          });

          if (category?.autoProcessOnSend && lead.status === 'saved') {
            logger.info('Auto-promoting lead to processed based on category setting', { leadId: lead._id });
            await Lead.findByIdAndUpdate(lead._id, { $set: { status: 'processed' } });
          }

          const outgoingMsg = await LeadMessage.create({
            user: userId,
            lead: lead._id,
            phone: phone,
            direction: 'outgoing',
            content: text,
            contentType: 'text',
            status: 'sent',
            whatsappMessageId: result?.key?.id,
          });

          // Emit real-time update
          socketService.emitToLeadChat(lead._id.toString(), 'new_message', outgoingMsg);
          socketService.emitToUser(userId, 'new_message', outgoingMsg);
        } else {
          logger.warn('Could not log bulk message: Lead not found', { phone });
        }

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
