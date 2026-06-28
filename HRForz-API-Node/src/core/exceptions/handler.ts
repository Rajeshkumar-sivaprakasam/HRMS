import { Request, Response, NextFunction } from 'express';
import { HRMSException } from './base';
import { logger } from '../logging/logger';

export interface ApiErrorResponse {
  message: string;
  response: Record<string, unknown> | null;
  code: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';

  if (err instanceof HRMSException) {
    logger.warn({
      type: 'domain_exception',
      code: err.code,
      message: err.message,
      path: req.path,
      requestId,
    });

    const response: ApiErrorResponse = {
      message: err.message,
      response: Object.keys(err.details).length > 0 ? err.details : null,
      code: err.code,
    };

    res.status(err.statusCode).json(response);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const zodErr = err as any;
    const errors: Record<string, string> = {};
    zodErr.errors?.forEach((e: any) => {
      const field = e.path.join('.');
      errors[field] = e.message;
    });

    const response: ApiErrorResponse = {
      message: 'Request validation failed',
      response: errors,
      code: 'VALIDATION_ERROR',
    };

    res.status(422).json(response);
    return;
  }

  // TypeORM unique constraint violation
  if ((err as any).code === '23505') {
    logger.error({
      type: 'db_integrity_error',
      error: err.message,
      path: req.path,
    });

    const response: ApiErrorResponse = {
      message: 'Data conflict — duplicate or constraint violation',
      response: null,
      code: 'CONFLICT',
    };

    res.status(409).json(response);
    return;
  }

  // Unhandled error
  logger.error({
    type: 'unhandled_exception',
    error: err.message,
    stack: err.stack,
    path: req.path,
    requestId,
  });

  const response: ApiErrorResponse = {
    message: 'An unexpected error occurred',
    response: null,
    code: 'INTERNAL_ERROR',
  };

  res.status(500).json(response);
}
