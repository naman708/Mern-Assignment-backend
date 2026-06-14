import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

function fileUrl(req: Request): string | null {
  if (!req.file) return null;
  return `${env.appUrl}/uploads/${req.file.filename}`;
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const page = (req.query.page as unknown as number) || 1;
  const limit = (req.query.limit as unknown as number) || 10;
  const search = (req.query.search as string) || '';

  const { users, meta } = await userService.listUsers({ page, limit, search });
  sendSuccess(res, users, 'Users fetched', 200, meta);
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.user!.id);
  sendSuccess(res, user, 'Profile fetched');
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  const image = fileUrl(req);
  const user = await userService.updateUser(req.user!.id, {
    name: req.body.name,
    ...(image ? { profileImage: image } : {}),
  });
  sendSuccess(res, user, 'Profile updated');
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserById(req.params.id);
  sendSuccess(res, user, 'User fetched');
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  // Guard against an admin deleting their own account via this endpoint.
  if (req.params.id === req.user!.id) {
    throw ApiError.badRequest('You cannot delete your own account from here');
  }
  await userService.deleteUser(req.params.id);
  sendSuccess(res, null, 'User deleted');
}
