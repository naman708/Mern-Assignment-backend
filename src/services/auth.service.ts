import crypto from 'crypto';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { cache, cacheKeys } from './cache.service';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import {
  issueTokenPair,
  verifyRefreshToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
} from './token.service';

const VERIFY_TTL_SECONDS = 60 * 60 * 24; // 24h
const RESET_TTL_SECONDS = 60 * 60; // 1h

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  profileImage?: string | null;
}

/** Create an unverified user and email them a verification link. */
export async function register(input: RegisterInput): Promise<User> {
  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email,
    password: input.password,
    profileImage: input.profileImage ?? null,
  });

  const token = crypto.randomBytes(32).toString('hex');
  await cache.setEx(cacheKeys.emailVerify(token), user.id, VERIFY_TTL_SECONDS);
  await sendVerificationEmail(user.email, user.name, token);

  // Cached user lists are now stale.
  await cache.delPattern(cacheKeys.userListPattern);
  return user;
}

interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  secret: string;
}

/**
 * Create a pre-verified admin account. Gated by a shared secret (ADMIN_CREATE_SECRET)
 * so the endpoint can stay public for bootstrapping without exposing admin creation.
 */
export async function createAdmin(input: CreateAdminInput): Promise<User> {
  if (!env.adminCreateSecret || input.secret !== env.adminCreateSecret) {
    throw ApiError.forbidden('Invalid admin secret');
  }

  const email = input.email.toLowerCase().trim();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name: input.name,
    email,
    password: input.password,
    role: 'admin',
    isEmailVerified: true,
  });

  // Cached user lists are now stale.
  await cache.delPattern(cacheKeys.userListPattern);
  return user;
}

/** Validate a verification token and mark the user's email as verified. */
export async function verifyEmail(token: string): Promise<void> {
  const key = cacheKeys.emailVerify(token);
  const userId = await cache.get(key);
  if (!userId) {
    throw ApiError.badRequest('Verification link is invalid or has expired');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    await user.save();
    await cache.del(cacheKeys.user(user.id));
    await cache.delPattern(cacheKeys.userListPattern);
  }
  await cache.del(key);
}

/** Verify credentials, require a verified email, and issue a token pair. */
export async function login(
  email: string,
  password: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (!user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in');
  }

  const { accessToken, refreshToken } = await issueTokenPair(user);
  return { user, accessToken, refreshToken };
}

/**
 * Rotate a refresh token: validate it, ensure the stored copy is active, revoke
 * it, and issue a fresh pair. Reuse of a revoked/unknown token is rejected.
 */
export async function refresh(
  rawToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let payload: { sub: string; jti: string; exp: number };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const stored = await RefreshToken.findOne({
    where: { tokenHash: hashToken(rawToken), userId: payload.sub },
  });
  if (!stored || stored.revoked || stored.expiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Refresh token is no longer valid');
  }

  const user = await User.findByPk(payload.sub);
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }

  // Rotate: revoke the old token, mint and persist a new pair.
  stored.revoked = true;
  await stored.save();

  const accessToken = signAccessToken(user);
  const newRefresh = signRefreshToken(user.id);
  const decoded = verifyRefreshToken(newRefresh);
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(newRefresh),
    expiresAt: new Date(decoded.exp * 1000),
  });

  return { accessToken, refreshToken: newRefresh };
}

/** Revoke a refresh token (logout). Idempotent — unknown tokens are ignored. */
export async function logout(rawToken: string): Promise<void> {
  if (!rawToken) return;
  await RefreshToken.update(
    { revoked: true },
    { where: { tokenHash: hashToken(rawToken) } }
  );
}

/**
 * Begin a password reset. Always resolves the same way whether or not the email
 * exists, to avoid leaking which addresses are registered.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  await cache.setEx(cacheKeys.passwordReset(token), user.id, RESET_TTL_SECONDS);
  await sendPasswordResetEmail(user.email, user.name, token);
}

/** Complete a password reset and revoke all of the user's refresh tokens. */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const key = cacheKeys.passwordReset(token);
  const userId = await cache.get(key);
  if (!userId) {
    throw ApiError.badRequest('Reset link is invalid or has expired');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  user.password = newPassword;
  await user.save();
  await cache.del(key);

  // Force re-login everywhere after a password change.
  await RefreshToken.update({ revoked: true }, { where: { userId: user.id } });
}
