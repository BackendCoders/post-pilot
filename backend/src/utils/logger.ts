import winston from 'winston';
import path from 'path';
import Transport from 'winston-transport';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Custom transport for Email Alerts
class EmailTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
  }




  log(info: any, callback: () => void) {
    setImmediate(async () => {
      // Safeguard: Don't send email alerts for errors that are already about the email service
      // to avoid infinite loops if the SMTP server is down.
      const isEmailError = 
        info.message?.toLowerCase().includes('email') || 
        info.message?.toLowerCase().includes('smtp') ||
        info.service === 'mail-service';

      if (info.level === 'error' && !isEmailError) {
        try {
          // Dynamic import to avoid circular dependency
          const { mailService } = await import('../services/mailService');
          await mailService.sendSystemLog({
            level: info.level,
            message: info.message,
            stack: info.stack,
            context: info.metadata || info
          });
        } catch (err) {
          // Use console.error instead of logger.error here to avoid loops
          console.error('Failed to send error email alert:', err);
        }
      }
    });
    callback();
  }

}

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'backend-starter' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
    }),
    // Send email for high severity errors
    new EmailTransport({ level: 'error' }),
  ],
});


// If we're not in production then log to the console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }));
}