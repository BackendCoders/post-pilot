import { Request } from 'express';
import { IApiResponse } from '../../types';

export interface IWhatsAppSession {
  userId: string;
  phoneNumber?: string;
  isConnected: boolean;
  connectedAt?: Date;
}

export interface WhatsAppStatusResponse extends IApiResponse {
  data?: {
    connected: boolean;
    phoneNumber?: string;
    connectedAt?: string;
  };
}

export interface WhatsAppQRResponse extends IApiResponse {
  data?: {
    qrCode?: string;
    message?: string;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
