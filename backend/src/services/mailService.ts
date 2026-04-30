import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

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

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      return { success: true, message: 'SMTP connection verified successfully' };
    } catch (error) {
      logger.error('SMTP connection verification failed', {
        service: 'mail-service',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        success: false,
        message: 'SMTP connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
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
        service: 'mail-service',
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

  async sendSystemLog(logData: {
    level: string;
    message: string;
    stack?: string;
    context?: any;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const emailSubject = `[BACKEND LOG] ${logData.level.toUpperCase()}: ${logData.message.slice(0, 50)}${logData.message.length > 50 ? '...' : ''}`;

    const html = `
      <div style="font-family: monospace; max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 20px; background: #fafafa;">
        <h2 style="color: ${logData.level === 'error' ? '#cc0000' : '#333'}; border-bottom: 2px solid #ddd; padding-bottom: 10px;">
          System Log Alert: ${logData.level.toUpperCase()}
        </h2>
        <p><strong>Message:</strong> ${logData.message}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        
        ${logData.context ? `
          <h3>Context:</h3>
          <pre style="background: #eee; padding: 10px; border: 1px solid #ccc; overflow: auto;">
            ${JSON.stringify(logData.context, null, 2)}
          </pre>
        ` : ''}

        ${logData.stack ? `
          <h3>Stack Trace:</h3>
          <pre style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 5px; overflow: auto; font-size: 12px; line-height: 1.5;">
            ${logData.stack}
          </pre>
        ` : ''}
      </div>
    `;

    return this.sendMail(adminEmail, emailSubject, html);
  }

  async sendSeoReport(data: {
    to: string;
    userName: string;
    pageUrl: string;
    report: any; // Using any to avoid importing ISeoReport here if it causes circular deps, or I can import it
  }) {
    const { to, userName, pageUrl, report } = data;
    const subject = `[SEO Rocket] Analysis Report for ${pageUrl}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; color: #1e293b;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 12px; text-align: center; color: white; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px;">SEO Analysis Report</h1>
          <p style="opacity: 0.8; margin: 10px 0 0 0;">Generated for ${pageUrl}</p>
        </div>

        <p>Hi ${userName},</p>
        <p>Your SEO analysis for <strong>${pageUrl}</strong> is ready. Here is a summary of our findings:</p>

        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0;">
          <div style="font-size: 48px; font-weight: bold; color: #3b82f6;">${report.totalScore}/100</div>
          <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">Grade: ${report.grade}</div>
        </div>

        <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Section Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          ${Object.entries(report.sections).map(([name, section]: [string, any]) => `
            <tr>
              <td style="padding: 10px 0; font-weight: bold; text-transform: capitalize;">${name}</td>
              <td style="padding: 10px 0; text-align: right;">
                <span style="background: ${section.score >= 90 ? '#dcfce7' : section.score >= 70 ? '#fef9c3' : '#fee2e2'}; 
                           color: ${section.score >= 90 ? '#166534' : section.score >= 70 ? '#854d0e' : '#991b1b'};
                           padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${section.score}/100
                </span>
              </td>
            </tr>
          `).join('')}
        </table>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard/seo-rocket" 
             style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Full Audit Details
          </a>
        </div>

        <p style="margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px;">
          Best regards,<br>
          The SEO Rocket Team
        </p>
      </div>
    `;

    return this.sendMail(to, subject, html);
  }
}

export const mailService = new MailService();
