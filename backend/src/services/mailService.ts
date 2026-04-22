import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'SEO Rocket Support'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      logger.info('Email sent', { messageId: info.messageId, to });
      return info;
    } catch (error) {
      logger.error('Error sending email', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      throw error;
    }
  }

  async sendSupportNotification(data: {
    type: 'feedback' | 'error';
    userName: string;
    userEmail: string;
    subject: string;
    message: string;
    rating?: number;
    metadata?: any;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const isError = data.type === 'error';

    const emailSubject = `[${data.type.toUpperCase()}] ${data.subject}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: ${isError ? '#e11d48' : '#2563eb'}; border-bottom: 2px solid #eee; padding-bottom: 10px;">
          New Support Submission: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}
        </h2>
        <p><strong>From:</strong> ${data.userName} (&lt;${data.userEmail}&gt;)</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        ${data.rating ? `<p><strong>Rating:</strong> ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)} (${data.rating}/5)</p>` : ''}
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        ${data.metadata ? `
          <h3 style="font-size: 14px; color: #666;">Technical Details:</h3>
          <pre style="background: #1f2937; color: #f3f4f6; padding: 10px; border-radius: 5px; font-size: 12px; overflow: auto;">
            ${JSON.stringify(data.metadata, null, 2)}
          </pre>
        ` : ''}
        <p style="font-size: 12px; color: #999; margin-top: 30px;">
          This is an automated notification from SEO Rocket Dashboard.
        </p>
      </div>
    `;

    return this.sendMail(adminEmail, emailSubject, html);
  }
}

export const mailService = new MailService();
