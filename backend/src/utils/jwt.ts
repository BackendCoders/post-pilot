import jwt from 'jsonwebtoken';
import { ITokenPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export class JWTUtils {
  static generateAccessToken(
    payload: Omit<ITokenPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(
    payload: Omit<ITokenPayload, 'iat' | 'exp'>
  ): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  static verifyAccessToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as ITokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): ITokenPayload {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as ITokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static generateTokenPair(payload: Omit<ITokenPayload, 'iat' | 'exp'>) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
    };
  }
}
