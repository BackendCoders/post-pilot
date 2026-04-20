import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { whatsappService } from './service';
import { JWTUtils } from '../../utils/jwt';
import { logger } from '../../utils/logger';

// Removed unused Token verification helper

export const startConnection = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    try {
      await whatsappService.startConnection(userId);
      res.json({ success: true, message: 'Connection initialization started' });
    } catch (error) {
      logger.error('Failed to start connection', { error });
      res
        .status(500)
        .json({ success: false, error: 'Failed to start connection' });
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
        state: status.state,
        qr: status.qr,
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

export const checkAuth = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const isConnected = await whatsappService.checkIsConnected(userId);
    res.json({ success: true, isConnected });
  }
);

export const sendSingleMessage = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
      res.status(400).json({
        success: false,
        error: 'phoneNumber and message are required',
      });
      return;
    }

    try {
      await whatsappService.sendMessage(userId, phoneNumber, message);
      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send message',
      });
    }
  }
);

export const sendBulkMessage = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { phoneNumbers, message } = req.body;
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      res.status(400).json({
        success: false,
        error: 'phoneNumbers (array) and message are required',
      });
      return;
    }

    try {
      const results = await whatsappService.sendBulkMessage(
        userId,
        phoneNumbers,
        message
      );
      res.json({
        success: true,
        data: results,
        message: 'Bulk messaging completed',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send bulk message',
      });
    }
  }
);

export const sendDocument = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId?.toString();
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { phoneNumber, message, documentBase64, fileName, mimeType } = req.body;
    if (!phoneNumber || !documentBase64 || !fileName) {
      res.status(400).json({
        success: false,
        error: 'phoneNumber, documentBase64, and fileName are required',
      });
      return;
    }

    try {
      const buffer = Buffer.from(documentBase64, 'base64');
      await whatsappService.sendDocument(
        userId,
        phoneNumber,
        message || '',
        buffer,
        fileName,
        mimeType || 'application/pdf'
      );
      res.json({ success: true, message: 'Document sent successfully' });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send document',
      });
    }
  }
);
