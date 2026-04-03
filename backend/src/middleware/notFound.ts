import { Request, Response, NextFunction } from 'express';
import { ICustomError } from '../types/index';

export const notFound = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error: ICustomError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};
