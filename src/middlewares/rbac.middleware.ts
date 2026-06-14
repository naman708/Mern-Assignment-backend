import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.model';
import { ApiError } from '../utils/ApiError';

/**
 * Role-Based Access Control guard. Must run after `authenticate`.
 * Usage: router.delete('/:id', authenticate, requireRole('admin'), handler)
 */
export function requireRole(...allowed: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    if (!allowed.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
