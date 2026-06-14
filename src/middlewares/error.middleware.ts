import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { env } from '../config/env';

/** 404 fallthrough for unmatched routes. */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/** Central error handler — normalises every thrown error to the JSON envelope. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'A record with these details already exists';
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof SequelizeValidationError) {
    statusCode = 422;
    message = 'Validation failed';
    details = err.errors.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large'
        : `Upload error: ${err.message}`;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
    ...(env.isProd ? {} : { stack: err instanceof Error ? err.stack : undefined }),
  });
}
