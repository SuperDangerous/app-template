/**
 * Application Setup
 * Configure your application routes and middleware here
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { 
  ConfigManager,
  configureSession,
  createLogger,
  createHealthCheckRouter,
  logsRouter as standardLogsRouter
} from '@episensor/app-framework';

// Import your custom routes
import { createExampleRouter } from './api/example.js';
import { createDataRouter } from './api/data.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('Setup');

export async function setupApp(app: Express, configManager: ConfigManager): Promise<void> {
  const config = configManager.get();
  
  // Setup middleware
  if (config.features.enableAuth) {
    configureSession(app, {
      secret: process.env.SESSION_SECRET || 'change-this-secret',
      name: 'app.sid',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CORS_ORIGIN || false
      : true,
    credentials: true
  }));

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Create health check router with custom checks
  const healthRouter = createHealthCheckRouter({
    version: config.app.version,
    customChecks: [
      {
        name: 'database',
        check: async () => ({
          name: 'database',
          status: 'healthy', // Replace with actual check
          message: 'Database connection is healthy'
        })
      }
    ]
  });

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: config.app.name,
      version: config.app.version,
      status: 'operational',
      endpoints: {
        health: '/api/health',
        logs: '/api/logs',
        example: '/api/example',
        data: '/api/data'
      }
    });
  });

  // Setup API routes
  app.use('/api/health', healthRouter);
  app.use('/api/logs', standardLogsRouter);
  app.use('/api/example', createExampleRouter(configManager));
  app.use('/api/data', createDataRouter());
  
  // Catch-all route for React app (only in production)
  if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '..', 'web', 'dist', 'index.html'));
    });
  }

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
}