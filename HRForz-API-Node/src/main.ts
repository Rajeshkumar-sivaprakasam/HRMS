import 'reflect-metadata';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { config } from './config';
import { logger } from './core/logging/logger';
import { initializeDatabase } from './core/db/data-source';
import { errorHandler } from './core/exceptions/handler';
import { requestIdMiddleware } from './core/middleware/requestId';
import { rateLimitMiddleware } from './core/middleware/rateLimit';

// Import routers
import { authRouter } from './modules/auth/auth.router';
import { employeesRouter } from './modules/employees/employees.router';

async function bootstrap(): Promise<void> {
  const app: Application = express();

  // Initialize database
  await initializeDatabase();
  logger.info('Database connected');

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(rateLimitMiddleware);

  // API Routes
  const apiPrefix = '/v1';
  app.use(`${apiPrefix}/auth`, authRouter);
  app.use(`${apiPrefix}/employees`, employeesRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  // Start server
  const port = config.PORT;
  app.listen(port, () => {
    logger.info(`HRForz API started on port ${port}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  logger.error({ error: err.message }, 'Failed to start application');
  process.exit(1);
});
