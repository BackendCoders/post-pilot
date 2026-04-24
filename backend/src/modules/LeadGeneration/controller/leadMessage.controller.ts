import { Request, Response } from 'express';
import LeadMessage from '../model/leadMessage.model';
import Lead from '../model/lead.model';
import { whatsappService } from '../../WhatsApp/service';
import mongoose from 'mongoose';

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Aggregate to get the last message for each lead
    const conversations = await LeadMessage.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$lead',
          lastMessage: { $first: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'leads',
          localField: '_id',
          foreignField: '_id',
          as: 'leadInfo',
        },
      },
      { $unwind: '$leadInfo' },
      {
        $lookup: {
          from: 'leadcategories',
          localField: 'leadInfo.leadCategory',
          foreignField: '_id',
          as: 'categoryDetail',
        },
      },
      {
        $addFields: {
          'leadInfo.categoryName': { $arrayElemAt: ['$categoryDetail.title', 0] }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getThread = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = (req as any).user.userId;

    const messages = await LeadMessage.find({
      user: userId,
      lead: leadId,
    })
      .sort({ createdAt: 1 })
      .limit(50); // Hard limit to 50 as requested

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message thread' });
  }
};

export const sendReply = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { text } = req.body;
    const userId = (req as any).user.userId;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Use WhatsApp service to send the message
    // Note: WhatsAppService.sendMessage already handles logging to LeadMessage and emitting events
    await whatsappService.sendMessage(userId.toString(), lead.phone, text);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message || 'Failed to send reply' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const userId = (req as any).user.userId;

    await LeadMessage.updateMany(
      {
        user: userId,
        lead: leadId,
        direction: 'incoming',
        status: { $ne: 'read' },
      },
      { $set: { status: 'read' } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const unreadCount = await LeadMessage.countDocuments({
      user: userId,
      direction: 'incoming',
      status: { $ne: 'read' },
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};
