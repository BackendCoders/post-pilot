import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import User from '../models/User';
import { PasswordUtils } from '../utils/password';
import { IApiResponse, UserRole } from '../types/index';
import { logger } from '../utils/logger';
import userService from '../services/userService';
import createBaseController from './baseController';

const base = createBaseController(userService, {
  resourceName: 'User',
  transform: (user) => ({
    id: user._id,
    email: user.email,
    userName: user.userName,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }),
  getFilter: (req) => {
    const filter: any = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    return filter;
  },
});

export const getUsers = base.list;
export const getUserById = base.getById;

export const updateUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { userName, email, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser._id.toString() !== id) {
        res.status(409).json({
          success: false,
          error: 'Email already in use',
        });
        return;
      }
    }

    if (userName !== undefined) user.userName = userName;
    if (email !== undefined) user.email = email;
    if (role !== undefined && req.user!.role === UserRole.ADMIN)
      user.role = role;
    if (isActive !== undefined && req.user!.role === UserRole.ADMIN)
      user.isActive = isActive;

    await user.save();

    const response: IApiResponse = {
      success: true,
      data: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: 'User updated successfully',
    };

    logger.info('User updated', { userId: id, updatedBy: req.user!.userId });

    res.status(200).json(response);
  }
);

export const deleteUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (id === req.user!.userId) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
      return;
    }

    return base.remove(req, res, next);
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const {
      userName,
      email,
      avatar,
      phoneNumber,
      companyName,
      companySize,
      jobTitle,
      website,
      linkedinUrl,
      timezone,
      language,
      emailNotifications,
    } = req.body;
    const userId = req.user!.userId;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already in use',
        });
        return;
      }
    }

    if (userName !== undefined) user.userName = userName;
    if (email !== undefined) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (companyName !== undefined) user.companyName = companyName;
    if (companySize !== undefined) user.companySize = companySize;
    if (jobTitle !== undefined) user.jobTitle = jobTitle;
    if (website !== undefined) user.website = website;
    if (linkedinUrl !== undefined) user.linkedinUrl = linkedinUrl;
    if (timezone !== undefined) user.timezone = timezone;
    if (language !== undefined) user.language = language;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;

    await user.save();

    const response: IApiResponse = {
      success: true,
      data: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        avatar: user.avatar,
        phoneNumber: user.phoneNumber,
        companyName: user.companyName,
        companySize: user.companySize,
        jobTitle: user.jobTitle,
        website: user.website,
        linkedinUrl: user.linkedinUrl,
        timezone: user.timezone,
        language: user.language,
        emailNotifications: user.emailNotifications,
        subscriptionPlan: user.subscriptionPlan,
        emailVerified: user.emailVerified,
        twoFactorEnabled: user.twoFactorEnabled,
        loginCount: user.loginCount,
        lastActiveAt: user.lastActiveAt,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      message: 'Profile updated successfully',
    };

    logger.info('Profile updated', { userId });

    res.status(200).json(response);
  }
);

export const changePassword = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const isCurrentPasswordValid = await PasswordUtils.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    const passwordValidation = PasswordUtils.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'New password validation failed',
        errors: { newPassword: passwordValidation.errors },
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    const response: IApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    logger.info('Password changed', { userId });

    res.status(200).json(response);
  }
);

export const completeWalkthrough = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { walkthroughKey } = req.body;

    if (!walkthroughKey || typeof walkthroughKey !== 'string') {
      res.status(400).json({
        success: false,
        error: 'walkthroughKey is required',
      });
      return;
    }

    const validKeys = ['seo-rocket', 'lead-generation'];
    if (!validKeys.includes(walkthroughKey)) {
      res.status(400).json({
        success: false,
        error: `Invalid walkthrough key. Valid keys: ${validKeys.join(', ')}`,
      });
      return;
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { completedWalkthroughs: walkthroughKey },
    });

    res.status(200).json({
      success: true,
      message: `Walkthrough '${walkthroughKey}' marked as completed`,
    });
  }
);
