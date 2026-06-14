import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

interface UserLike {
  id: string;
  email: string;
  role: UserRole;
}

/** Sign a short-lived access token. */
export function signAccessToken(user: UserLike): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

/** Sign a long-lived refresh token (carries only the subject + a random jti). */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);
}

export function verifyRefreshToken(token: string): { sub: string; jti: string; exp: number } {
  return jwt.verify(token, env.jwt.refreshSecret) as { sub: string; jti: string; exp: number };
}

/** Hash a refresh token before persisting it, so a DB leak can't reuse tokens. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Issue an access+refresh pair and persist the (hashed) refresh token. Returns
 * both tokens. The persisted row drives rotation and revocation.
 */
export async function issueTokenPair(user: UserLike): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user.id);
  const decoded = verifyRefreshToken(refreshToken);

  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(decoded.exp * 1000),
  });

  return { accessToken, refreshToken };
}
