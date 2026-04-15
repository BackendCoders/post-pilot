import makeWASocket, { DisconnectReason, useMultiFileAuthState } from 'baileys';
import { Boom } from '@hapi/boom';
import * as fs from 'fs';
import * as path from 'path';
import User from '../../models/User';
import { logger } from '../../utils/logger';

const SESSION_DIR = './whatsapp-sessions';

interface WhatsAppSession {
  userId: string;
  phoneNumber?: string;
  isConnected: boolean;
  connectedAt?: Date;
}

class WhatsAppService {
  private sockets: Map<string, ReturnType<typeof makeWASocket>> = new Map();

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
    const user = await User.findById(userId).select('whatsappConnected whatsappConnectedAt whatsappPhoneNumber');

    return {
      userId,
      phoneNumber: user?.whatsappPhoneNumber || undefined,
      isConnected: user?.whatsappConnected || false,
      connectedAt: user?.whatsappConnectedAt,
    };
  }

  async startConnection(userId: string, onQR: (qr: string) => void): Promise<void> {
    this.ensureSessionDir(userId);

    const existingSocket = this.sockets.get(userId);
    if (existingSocket) {
      logger.info('Socket already exists for user', { userId });
      return;
    }

    logger.info('Creating new WhatsApp socket', { userId, sessionDir: this.getSessionDir(userId) });

    const { state, saveCreds } = await useMultiFileAuthState(this.getSessionDir(userId));

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    this.sockets.set(userId, sock);

    sock.ev.on('creds.update', async () => {
      logger.info('Creds update event fired');
      await saveCreds();
    });

    sock.ev.on('connection.update', (update) => {
      logger.info('Connection update', { 
        connection: update.connection, 
        qr: update.qr ? 'QR present' : 'No QR',
        received: update
      });

      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        logger.info('QR found in connection.update');
        onQR(qr);
      }

      if (connection === 'open') {
        const phoneNumber = sock.user?.id?.split(':')[0] || '';
        logger.info('WhatsApp connected', { phoneNumber });
        User.findByIdAndUpdate(userId, {
          whatsappConnected: true,
          whatsappConnectedAt: new Date(),
          whatsappPhoneNumber: phoneNumber,
        }).catch(err => logger.error('Failed to update user', { err }));
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        logger.info('Connection closed', { statusCode, shouldReconnect: statusCode !== DisconnectReason.loggedOut });
        
        if (statusCode !== DisconnectReason.loggedOut) {
          this.handleLogout(userId).catch(err => logger.error('Logout failed', { err }));
        }
      }
    });

    (sock.ev as any).on('qr', (qr: string) => {
      logger.info('QR event fired', { qrLength: qr?.length });
      onQR(qr);
    });
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
    await User.findByIdAndUpdate(userId, {
      whatsappConnected: false,
      whatsappConnectedAt: undefined,
      whatsappPhoneNumber: '',
    });
  }

  getSocket(userId: string): ReturnType<typeof makeWASocket> | undefined {
    return this.sockets.get(userId);
  }
}

export const whatsappService = new WhatsAppService();
