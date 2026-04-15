import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { whatsappService } from './service';
import { JWTUtils } from '../../utils/jwt';

const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    return decoded.userId?.toString() || null;
  } catch {
    return null;
  }
};

export const getQRCode = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const token = req.query.token as string;
    if (!token) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let qrSent = false;
    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
    };

    try {
      await whatsappService.startConnection(userId, (qrCode) => {
        if (!qrSent) {
          qrSent = true;
          res.write(`data: ${JSON.stringify({ qr: qrCode })}\n\n`);
          timeout = setTimeout(() => {
            res.write(`data: ${JSON.stringify({ timeout: true })}\n\n`);
            res.end();
          }, 60000);
        }
      });

      req.on('close', () => {
        cleanup();
      });
    } catch (error) {
      cleanup();
      res.write(
        `data: ${JSON.stringify({ error: 'Failed to start connection' })}\n\n`
      );
      res.end();
    }
  }
);

export const getStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const status = await whatsappService.getStatus(userId);
    res.json({
      success: true,
      data: {
        connected: status.isConnected,
        phoneNumber: status.phoneNumber,
        connectedAt: status.connectedAt?.toISOString(),
      },
    });
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await whatsappService.logout(userId);
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  }
);

export const deleteSession = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await whatsappService.logout(userId);
    res.json({ success: true, message: 'Session deleted successfully' });
  }
);
