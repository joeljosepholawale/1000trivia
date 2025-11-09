import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Import services
import { db } from './services/database';
import { authService } from './services/auth';
import { walletService } from './services/wallet';
import { gameService } from './services/game';
import { leaderboardService } from './services/leaderboard';
import { paymentService } from './services/payment';

// Import route handlers
import authRoutes from './routes/auth';
import configRoutes from './routes/config';
import walletRoutes from './routes/wallet';
import bonusRoutes from './routes/bonus';
import gameRoutes from './routes/game';
import leaderboardRoutes from './routes/leaderboard';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import userRoutes from './routes/user';
import gameModesRoutes from './routes/gameModes';

// Import cron jobs
import { startCronJobs } from './services/cronJobs';

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// Trust proxy - REQUIRED for Render.com reverse proxy
app.set('trust proxy', 1);

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - Allow all origins for mobile app
app.use(cors({
  origin: true, // Allow all origins (needed for mobile apps)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await db.healthCheck();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        version: process.env.npm_package_version || '1.0.0'
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable'
      }
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bonus', bonusRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game-modes', gameModesRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack })
    }
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  const server = app.listen();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server - Bind to 0.0.0.0 for Render
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on ${HOST}:${PORT}`);
  logger.info(`📚 API documentation available at http://localhost:${PORT}/health`);
  
  // Start cron jobs for leaderboard resets
  if (process.env.ENABLE_CRON_JOBS !== 'false') {
    startCronJobs();
    logger.info('⏰ Cron jobs started for leaderboard resets');
  }
});

export default app;