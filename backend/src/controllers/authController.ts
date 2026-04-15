import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { JWTUtils } from '../utils/jwt';
import { PasswordUtils } from '../utils/password';
import User from '../models/User';
import { ILoginResponse, IApiResponse } from '../types/index';
import { logger } from '../utils/logger';

export const register = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password, userName } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
      return;
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: 'Password validation failed',
        errors: { password: passwordValidation.errors },
      });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      userName,
    });

    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } =
      JWTUtils.generateTokenPair(tokenPayload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: IApiResponse<ILoginResponse> = {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          userName: user.userName,
          role: user.role,
        },
        token: accessToken,
        refreshToken,
      },
      message: 'User registered successfully',
    };

    logger.info('User registered successfully', {
      userId: user._id,
      email: user.email,
    });

    res.status(201).json(response);
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.compare(
      password,
      user.password
    );
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update last login and activity
    user.lastLogin = new Date();
    user.lastActiveAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    // Generate tokens
    const tokenPayload = {
      userId: user._id,
      email: user.email,
      role: user.role,
    };

    const { accessToken, refreshToken } =
      JWTUtils.generateTokenPair(tokenPayload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: IApiResponse<ILoginResponse> = {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          userName: user.userName,
          role: user.role,
        },
        token: accessToken,
        refreshToken,
      },
      message: 'Login successful',
    };

    logger.info('User logged in successfully', {
      userId: user._id,
      email: user.email,
    });

    res.status(200).json(response);
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { refreshToken: token } = req.body;
    const cookieRefreshToken = req.cookies?.refreshToken;
    const refreshTokenToUse = token || cookieRefreshToken;

    if (!refreshTokenToUse) {
      res.status(401).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshTokenToUse);

      // Check if user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'User not found or inactive',
        });
        return;
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
      };

      const { accessToken, refreshToken: newRefreshToken } =
        JWTUtils.generateTokenPair(tokenPayload);

      // Set new refresh token as httpOnly cookie
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      const response: IApiResponse<{ token: string; refreshToken: string }> = {
        success: true,
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
        },
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
      });
    }
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    const response: IApiResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    logger.info('User logged out', { userId: req.user?.userId });

    res.status(200).json(response);
  }
);

export const getMe = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = await User.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const response: IApiResponse = {
      success: true,
      data: {
        id: user._id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        isActive: user.isActive,
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
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };

    res.status(200).json(response);
  }
);
