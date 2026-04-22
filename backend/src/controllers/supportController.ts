import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import Support from '../models/Support';
import User from '../models/User';
import { mailService } from '../services/mailService';
import { IApiResponse } from '../types/index';
import { logger } from '../utils/logger';

export const createSubmission = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { type, subject, message, metadata, rating } = req.body;

    if (!type || !subject || !message) {
      res.status(400).json({
        success: false,
        error: 'Type, subject, and message are required',
      });
      return;
    }

    // Get user details for email
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // 1. Store in Database
    const submission = await Support.create({
      userId,
      type,
      subject,
      message,
      rating,
      metadata,
    });

    // 2. Send Email Notification
    try {
      await mailService.sendSupportNotification({
        type,
        userName: user.userName,
        userEmail: user.email,
        subject,
        message,
        rating,
        metadata,
      });
    } catch (emailError) {
      // We don't fail the request if email fails, but we log it
      logger.error('Failed to send support email notification', { emailError });
    }

    const response: IApiResponse = {
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} submitted successfully`,
      data: submission,
    };

    res.status(201).json(response);
  }
);

export const getMySubmissions = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const submissions = await Support.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: submissions,
    });
  }
);
