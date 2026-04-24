import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import { errorHandler, notFound } from './middleware';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import socialRoutes from './routes/social';
import graphApiRoutes from './routes/graphApi';
import seoRoutes from './modules/SEO/route';
import leadGenerationRoutes from './modules/LeadGeneration/route';
import whatsappRoutes from './modules/WhatsApp';
import supportRoutes from './routes/support';
import { whatsappService } from './modules/WhatsApp/service';
import { socketService } from './services/socket.service';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSockets
socketService.init(server);

// Connect to database
connectDB().then(() => {
  whatsappService.initializeSessions().catch(err => {
    logger.error('Failed to initialize WhatsApp sessions on startup', { error: err });
  });
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/socials', socialRoutes);
app.use('/api/facebook', graphApiRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/leads', leadGenerationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/support', supportRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { port: PORT });
});

export default app;
