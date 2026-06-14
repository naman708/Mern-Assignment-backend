import { Response } from 'express';

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard success envelope so the frontend can rely on a consistent shape. */
export function sendSuccess(
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200,
  meta?: Meta
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}
