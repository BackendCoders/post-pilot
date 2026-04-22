import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ICustomError } from '../types/index';
import { logger } from '../utils/logger';
import { mailService } from '../services/mailService';

export const errorHandler = (
  error: ICustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let errors: Record<string, string[]> = {};

  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send email alert for critical server errors (500)
  if (statusCode === 500) {
    mailService.sendSystemLog({
      level: 'error',
      message: message,
      stack: error.stack,
      context: {
        url: req.url,
        method: req.method,
        userId: req.user?.userId,
        ip: req.ip,
      },
    }).catch(err => logger.error('Failed to send error alert email', { err }));
  }

  // Mongoose validation error
  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation Error';
    errors = {};

    Object.keys(error.errors).forEach((key) => {
      errors[key] = [error.errors[key].message];
    });
  }

  // Mongoose duplicate key error
  else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
    const field = Object.keys((error as any).keyValue)[0];
    errors[field] = [`${field} already exists`];
  }

  // Mongoose cast error
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = 'Invalid data format';
  }

  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Custom operational errors
  else if (error.isOperational) {
    statusCode = error.statusCode || 400;
    message = error.message;
  }

  // Development vs Production error response
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      error: message,
      errors,
      stack: error.stack,
      ...(statusCode === 500 && { originalError: error.message }),
    });
  } else {
    // Don't leak error details in production
    res.status(statusCode).json({
      success: false,
      error: message,
      errors,
    });
  }
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
