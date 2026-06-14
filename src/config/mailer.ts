import nodemailer, { Transporter } from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

let transporter: Transporter | null = null;

/**
 * Lazily creates (and memoises) a Nodemailer transport.
 *
 * - EMAIL_PROVIDER=ethereal  → a throwaway test account is generated on the fly;
 *   emails are NOT delivered but a preview URL is logged for each message.
 * - EMAIL_PROVIDER=smtp      → uses the SMTP_* env vars (Mailtrap/Gmail/SendGrid).
 */
export async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (env.email.provider === 'smtp' && env.email.smtp.host) {
    transporter = nodemailer.createTransport({
      host: env.email.smtp.host,
      port: env.email.smtp.port,
      secure: env.email.smtp.port === 465,
      auth: { user: env.email.smtp.user, pass: env.email.smtp.pass },
    });
    logger.info(`Email transport ready (SMTP: ${env.email.smtp.host})`);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    logger.info('Email transport ready (Ethereal test account — preview URLs will be logged)');
  }

  return transporter;
}
