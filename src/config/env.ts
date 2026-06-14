import dotenv from 'dotenv';

dotenv.config();

/** Read a required env var, throwing a clear error if it is missing. */
function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function boolean(key: string, fallback = false): boolean {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function number(key: string, fallback: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const nodeEnv = optional('NODE_ENV', 'development');

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: number('PORT', 3000),
  appUrl: optional('APP_URL', 'http://localhost:3000'),
  clientUrl: optional('CLIENT_URL', 'http://localhost:5173'),

  db: {
    url: optional('DATABASE_URL'),
    host: optional('DB_HOST', 'localhost'),
    port: number('DB_PORT', 3306),
    name: optional('DB_NAME', 'mern_assignment'),
    user: optional('DB_USER', 'root'),
    password: optional('DB_PASSWORD'),
    ssl: boolean('DB_SSL', false),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
  },

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  email: {
    provider: optional('EMAIL_PROVIDER', 'ethereal'),
    from: optional('EMAIL_FROM', 'MERN Assignment <no-reply@example.com>'),
    smtp: {
      host: optional('SMTP_HOST'),
      port: number('SMTP_PORT', 587),
      user: optional('SMTP_USER'),
      pass: optional('SMTP_PASS'),
    },
  },

  upload: {
    maxBytes: number('MAX_UPLOAD_BYTES', 2 * 1024 * 1024),
    dir: 'uploads',
  },

  // Shared secret gating POST /api/auth/create-admin. Empty disables the endpoint.
  adminCreateSecret: optional('ADMIN_CREATE_SECRET', ''),
} as const;

export type Env = typeof env;
