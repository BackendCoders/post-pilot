import { Response } from 'express';
import { whatsappService } from './service';
import { AuthenticatedRequest } from './types';

export const getQRCode = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
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
    await whatsappService.startConnection(userId, async (qrCode) => {
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
    res.write(`data: ${JSON.stringify({ error: 'Failed to start connection' })}\n\n`);
    res.end();
  }
};

export const getStatus = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const status = await whatsappService.getStatus(userId);
    res.json({
      success: true,
      data: {
        connected: status.isConnected,
        phoneNumber: status.phoneNumber,
        connectedAt: status.connectedAt?.toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await whatsappService.logout(userId);
    res.json({ success: true, message: 'WhatsApp disconnected successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
};

export const deleteSession = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await whatsappService.logout(userId);
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete session' });
  }
};
