import { Types } from 'mongoose';

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  userName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  avatar: string;
  phoneNumber: string;
  companyName: string;
  companySize: '1-10' | '11-50' | '51-200' | '201-500' | '500+' | '';
  jobTitle: string;
  website: string;
  linkedinUrl: string;
  timezone: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | '';
  emailNotifications: boolean;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  whatsappConnected: boolean;
  whatsappConnectedAt?: Date;
  whatsappPhoneNumber: string;
  loginCount: number;
  lastActiveAt?: Date;
  deactiveReason: string;
  deletedAt?: Date;
  googleId?: string | null;
  provider?: 'local' | 'google' | null;
  completedWalkthroughs: string[];
}

export interface IAuthRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest extends IAuthRequest {
  userName: string;
}

export interface ILoginResponse {
  user: {
    id: string;
    email: string;
    userName: string;
    role: UserRole;
  };
  token: string;
  refreshToken: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string | Types.ObjectId;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> extends IApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ICustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// social interfaces

export interface SocialTypes {
  insta_auth_token?: string;
  meta_auth_token?: string;
  linkedin_auth_token?: string;
  tiktok_auth_token?: string;
  user: string;
}
