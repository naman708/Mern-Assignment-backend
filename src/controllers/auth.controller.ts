import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/ApiResponse';
import { env } from '../config/env';

/** Build a public URL for an uploaded file, if present on the request. */
function fileUrl(req: Request): string | null {
  if (!req.file) return null;
  return `${env.appUrl}/uploads/${req.file.filename}`;
}

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body;
  const user = await authService.register({
    name,
    email,
    password,
    profileImage: fileUrl(req),
  });
  sendSuccess(
    res,
    user,
    'Registration successful. Please check your email to verify your account.',
    201
  );
}

export async function createAdmin(req: Request, res: Response): Promise<void> {
  const { name, email, password, secret } = req.body;
  const user = await authService.createAdmin({ name, email, password, secret });
  sendSuccess(res, user, 'Admin created successfully. You can now log in.', 201);
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  await authService.verifyEmail(String(req.query.token));
  sendSuccess(res, null, 'Email verified successfully. You can now log in.');
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login(email, password);
  sendSuccess(res, { user, accessToken, refreshToken }, 'Logged in successfully');
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { accessToken, refreshToken } = await authService.refresh(req.body.refreshToken);
  sendSuccess(res, { accessToken, refreshToken }, 'Token refreshed');
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(req.body.refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  await authService.forgotPassword(req.body.email);
  sendSuccess(res, null, 'If that email is registered, a reset link has been sent.');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  await authService.resetPassword(req.body.token, req.body.password);
  sendSuccess(res, null, 'Password reset successfully. You can now log in.');
}
