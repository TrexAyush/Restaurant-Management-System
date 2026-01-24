import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoringService';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: Date;
    requestId: string;
  };
}

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: Record<string, any>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || Math.random().toString(36).substring(7);
  
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let details: Record<string, any> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    details = error.details;
  }

  const errorResponse: ErrorResponse = {
    error: {
      code,
      message: error.message,
      ...(details !== undefined && { details }),
      timestamp: new Date(),
      requestId
    }
  };

  // Log error to monitoring service
  const errorLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warning' : 'info';
  monitoringService.logError(
    errorLevel,
    `${req.method} ${req.path}: ${error.message}`,
    error,
    (req as any).user?.userId,
    `${req.method} ${req.path}`,
    {
      statusCode,
      code,
      requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      ...details
    }
  );

  // Log error for debugging
  console.error(`[${requestId}] ${error.name}: ${error.message}`, {
    stack: error.stack,
    statusCode,
    code,
    details
  });

  res.status(statusCode).json(errorResponse);
};