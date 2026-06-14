import nodemailer from 'nodemailer';
import { getTransporter } from '../config/mailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function send({ to, subject, html }: SendArgs): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.email.from, to, subject, html });

  // For the Ethereal dev transport, surface the preview URL so the reviewer can
  // open the email straight from the server logs.
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    logger.info(`Email sent to ${to} — preview: ${preview}`);
  } else {
    logger.info(`Email sent to ${to} (subject: ${subject})`);
  }
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const link = `${env.appUrl}/api/auth/verify-email?token=${token}`;
  await send({
    to,
    subject: 'Verify your email address',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Please confirm your email address to activate your account.</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>If the button doesn't work, paste this link into your browser:</p>
      <p>${link}</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  // The reset page lives in the frontend app; the backend just mints the token.
  const link = `${env.clientUrl}/reset-password?token=${token}`;
  await send({
    to,
    subject: 'Reset your password',
    html: `
      <h2>Hi ${name},</h2>
      <p>We received a request to reset your password.</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
