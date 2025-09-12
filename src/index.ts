/**
 * EpiSensor App Template Main Server
 * Uses @episensor/app-framework with enhanced settings and logging
 */

import { StandardServer, createLogger, logsRouter } from '@episensor/app-framework';
import express from 'express';

const logger = createLogger('AppTemplate');

async function main() {
  const server = new StandardServer({
    appName: 'EpiSensor App Template',
    appVersion: '1.1.0',
    description: 'A comprehensive template for building EpiSensor desktop applications',
    port: 7500,
    webPort: 7501, // Development web UI port
    appId: 'com.episensor.app-template', // Required for Tauri CORS configuration
    enableWebSocket: true,
    
    onInitialize: async (app: express.Application) => {
      logger.info('Setting up app-specific routes and middleware');
      
      // Add logs router
      app.use('/api/logs', logsRouter);
      
      // Example API routes
      app.get('/api/example', (_req, res) => {
        res.json({ 
          message: 'Hello from EpiSensor App Template!',
          timestamp: new Date().toISOString(),
          version: '1.1.0'
        });
      });
      
      // Configuration endpoint
      app.get('/api/config', (_req, res) => {
        res.json({
          name: 'EpiSensor App Template',
          version: '1.1.0',
          description: 'Template application',
          environment: process.env.NODE_ENV || 'development',
          isDesktopApp: process.env.TAURI === '1'
        });
      });
      
      // Health check
      app.get('/api/health', (_req, res) => {
        res.json({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
      });
      
      logger.info('App-specific setup completed');
    },
    
    onStart: async () => {
      logger.info('Server started successfully');
      logger.info(`API running on port 7500`);
      logger.info(`Web UI available on port 7501`);
      
      // Setup periodic log cleanup
      setInterval(async () => {
        try {
          const stats = await logger.compactLogs(30);
          if (stats && stats.archivedCount && stats.archivedCount > 0) {
            logger.info(`Archived ${stats.archivedCount} old log files`);
          }
        } catch (error) {
          logger.error('Failed to compact logs:', error);
        }
      }, 24 * 60 * 60 * 1000); // Run daily
    }
  });
  
  await server.initialize();
  await server.start();
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the application
main().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});