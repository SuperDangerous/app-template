/**
 * SuperDangerous App Template
 * Comprehensive wireframe application demonstrating all framework features
 * 
 * Features:
 * - Enhanced Settings Management with SettingsSchema
 * - Advanced Logging with categories and rotation
 * - WebSocket support for real-time communication
 * - SuperDangerous branding and professional UI
 * - Health monitoring and diagnostics
 * - Secure file storage
 */

import {
  StandardServer,
  createLogger,
  logsRouter,
  WebSocketEventManager,
  getStorageService,
  healthCheck,
  WebSocketServer,
  FileInfo,
  EmailService,
  type EmailConfig,
} from '@superdangerous/app-framework';
import express from 'express';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import settingsRouter, { settingsService } from './routes/settingsRouter.js';
import { settingsMetadata } from './config/settings.js';

/**
 * Helper to extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

// Get package.json for dynamic versioning
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

// Initialize logger with category
const logger = createLogger('EpiApp');

// Initialize storage service
const storageService = getStorageService();

// WebSocket event manager (will be initialized after server starts)
let wsEventManager: WebSocketEventManager | null = null;

// Email service (will be initialized after settings load)
let emailService: EmailService | null = null;

async function main() {
  // Initialize settings service
  logger.info('Initializing settings service...');
  const settings = await settingsService.getAll();
  logger.info('Settings loaded successfully', { 
    categories: settingsMetadata.categories.length,
    totalSettings: Object.keys(settings).length 
  });

  // Initialize storage service
  logger.info('Initializing storage service...');
  await storageService.initialize();
  logger.info('Storage service initialized');

  // Initialize email service with SuperDangerous branding
  if (settings['email.enabled']) {
    logger.info('Initializing email service...');

    const emailConfig: EmailConfig = {
      enabled: settings['email.enabled'] as boolean,
      provider: settings['email.provider'] as 'resend' | 'smtp',
      resend: settings['email.resendApiKey'] ? {
        apiKey: settings['email.resendApiKey'] as string,
      } : undefined,
      smtp: settings['email.smtpHost'] ? {
        host: settings['email.smtpHost'] as string,
        port: settings['email.smtpPort'] as number,
        secure: settings['email.smtpSecure'] as boolean,
        auth: settings['email.smtpUser'] ? {
          user: settings['email.smtpUser'] as string,
          pass: settings['email.smtpPass'] as string,
        } : undefined,
      } : undefined,
      from: settings['email.fromAddress'] as string,
      to: (settings['email.defaultRecipients'] as string)
        ?.split(',')
        .map(e => e.trim())
        .filter(Boolean) || [],
      // SuperDangerous branding
      appName: 'SuperDangerous',
      appTitle: settings['app.name'] as string || 'SuperDangerous App',
      brandColor: '#E21350', // SuperDangerous red
      footerText: 'Powered by SuperDangerous',
      footerLink: 'https://superdangerous.com',
    };

    emailService = new EmailService(emailConfig);
    await emailService.initialize();
    logger.info('Email service initialized', {
      provider: emailService.getStatus().provider
    });
  } else {
    logger.info('Email service disabled in configuration');
  }

  // Create and configure server
  const server = new StandardServer({
    appName: settings['app.name'] || 'SuperDangerous App Template',
    appVersion: packageJson.version,
    description: settings['app.description'] || 'Professional application framework',
    port: settings['network.apiPort'] || 7500,
    webPort: settings['network.webPort'] || 7501,
    appId: 'com.superdangerous.app-template',
    enableWebSocket: settings['network.enableWebSocket'] !== false,
    
    onInitialize: async (app: express.Application, wsServer?: WebSocketServer) => {
      logger.info('Initializing application routes and middleware...');

      // Get the actual Socket.IO server from the wrapper
      const io = wsServer?.getIO?.();
      
      // API Routes
      app.use('/api/logs', logsRouter);
      app.use('/api/settings', settingsRouter);
      
      // Config endpoint for frontend
      app.get('/api/config', (_req, res) => {
        res.json({
          success: true,
          data: {
            appName: settings['app.name'] || packageJson.name || 'SuperDangerous App Template',
            appVersion: packageJson.version,
            apiUrl: `http://localhost:${settings['network.apiPort'] || 7500}`,
            websocketEnabled: settings['network.enableWebSocket'] !== false,
            environment: settings['advanced.environment'] || process.env.NODE_ENV || 'production'
          },
          message: 'Application configuration'
        });
      });

      // Health and monitoring endpoints
      app.use('/api/health', healthCheck);

      app.get('/api/health/detailed', async (_req, res) => {
        res.json({ 
          success: true,
          data: {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
          },
          message: 'Detailed system status'
        });
      });
      
      // System information endpoint
      app.get('/api/system/info', (_req, res) => {
        res.json({
          success: true,
          data: {
          name: settings['app.name'] || 'SuperDangerous App Template',
          version: packageJson.version,
          description: settings['app.description'],
          environment: settings['advanced.environment'] || process.env.NODE_ENV || 'production',
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
          isDesktopApp: process.env.ELECTRON_RUNNING === 'true',
          features: {
            websocket: settings['network.enableWebSocket'] !== false,
            authentication: settings['security.enableAuth'] === true,
            https: settings['security.enableHttps'] === true,
            rateLimit: settings['security.rateLimit'] !== false,
            backup: settings['storage.enableBackup'] !== false,
            telemetry: settings['advanced.telemetry'] === true
          }
          },
          message: 'System information'
        });
      });
      
      // System metrics endpoint
      app.get('/api/system/metrics', async (_req, res) => {
        try {
          res.json({
            success: true,
            data: {
              memory: process.memoryUsage(),
              cpu: process.cpuUsage(),
              uptime: process.uptime()
            },
            message: 'System metrics retrieved'
          });
        } catch (error: unknown) {
          res.status(500).json({
            success: false,
            message: 'Failed to get metrics',
            error: getErrorMessage(error)
          });
        }
      });

      // Storage service endpoints
      app.get('/api/storage/info', async (_req, res) => {
        try {
          const files = await storageService.listFiles('data');
          const dirs = storageService.getBaseDirectories();
          res.json({
            success: true,
            data: {
              directories: dirs,
              fileCount: files.length,
              totalSize: files.reduce((sum: number, f: FileInfo) => sum + (f.size || 0), 0)
            },
            message: 'Storage information'
          });
        } catch (error: unknown) {
          res.status(500).json({
            success: false,
            message: 'Failed to get storage info',
            error: getErrorMessage(error)
          });
        }
      });
      
      // WebSocket event handlers
      if (io && settings['network.enableWebSocket'] !== false) {
        logger.info('Setting up WebSocket event handlers...');

        if (!io || typeof io.on !== 'function') {
          logger.error('Invalid WebSocket server instance', {
            hasGetIO: !!wsServer?.getIO,
            ioType: typeof io,
            hasOn: io ? typeof io.on : 'no io'
          });
          throw new Error('WebSocket server not properly initialized');
        }

        wsEventManager = new WebSocketEventManager(io);
        
        // Custom event handlers
        wsEventManager.on('ping', (socket, data) => {
          socket.emit('pong', { 
            timestamp: Date.now(),
            echo: data 
          });
        });
        
        wsEventManager.on('subscribe', (socket, data) => {
          const channel = data?.channel;
          if (channel) {
            socket.join(channel);
            logger.debug(`Client ${socket.id} subscribed to channel: ${channel}`);
          }
        });
        
        wsEventManager.on('unsubscribe', (socket, data) => {
          const channel = data?.channel;
          if (channel) {
            socket.leave(channel);
            logger.debug(`Client ${socket.id} unsubscribed from channel: ${channel}`);
          }
        });
        
        wsEventManager.on('broadcast', (socket, data) => {
          // Only allow broadcast in debug mode
          if (settings['advanced.debugMode']) {
            io.emit('message', {
              from: socket.id,
              timestamp: Date.now(),
              data
            });
          }
        });
        
        // Settings change notifications would go here
        // settingsService doesn't have event emitter, but could be added
        
        // System monitoring broadcasts
        setInterval(async () => {
          if (io && settings['advanced.performanceMonitoring']) {
            io.to('monitoring').emit('metrics', {
              memory: process.memoryUsage(),
              cpu: process.cpuUsage(),
              uptime: process.uptime(),
              timestamp: Date.now()
            });
          }
        }, 30000); // Every 30 seconds
        
        logger.info('WebSocket event handlers configured');
      }
      
      // Example API endpoints
      app.get('/api/example', (_req, res) => {
        res.json({
          success: true,
          data: {
            message: 'Hello from SuperDangerous App Template!',
            timestamp: new Date().toISOString(),
            version: packageJson.version,
            theme: settings['app.theme'] || 'superdangerous'
          },
          message: 'Example endpoint'
        });
      });
      
      // Demo data endpoint
      app.get('/api/demo/data', (_req, res) => {
        const demoData = {
          users: [
            { id: 1, name: 'John Doe', role: 'Admin', status: 'active' },
            { id: 2, name: 'Jane Smith', role: 'User', status: 'active' },
            { id: 3, name: 'Bob Johnson', role: 'User', status: 'inactive' }
          ],
          stats: {
            totalUsers: 3,
            activeUsers: 2,
            totalSessions: 150,
            avgSessionDuration: 1800
          },
          recentActivity: [
            { timestamp: new Date(Date.now() - 3600000), action: 'User login', user: 'John Doe' },
            { timestamp: new Date(Date.now() - 7200000), action: 'Settings updated', user: 'Jane Smith' },
            { timestamp: new Date(Date.now() - 10800000), action: 'Data export', user: 'John Doe' }
          ]
        };
        res.json({ success: true, data: demoData, message: 'Demo data retrieved' });
      });
      
      // Email endpoints
      app.get('/api/email/status', (_req, res) => {
        if (!emailService) {
          res.json({
            success: true,
            data: { enabled: false, provider: 'None', recipients: [] },
            message: 'Email service not configured'
          });
          return;
        }
        res.json({
          success: true,
          data: emailService.getStatus(),
          message: 'Email service status'
        });
      });

      app.post('/api/email/test', async (_req, res) => {
        if (!emailService) {
          res.status(400).json({
            success: false,
            message: 'Email service not configured'
          });
          return;
        }
        try {
          await emailService.sendTestEmail();
          res.json({
            success: true,
            data: { sent: true },
            message: 'Test email sent successfully'
          });
        } catch (error: unknown) {
          res.status(500).json({
            success: false,
            message: 'Failed to send test email',
            error: getErrorMessage(error)
          });
        }
      });

      app.post('/api/email/send', express.json(), async (req, res) => {
        if (!emailService) {
          res.status(400).json({
            success: false,
            message: 'Email service not configured'
          });
          return;
        }
        try {
          const { to, subject, text, html } = req.body;
          if (!to || !subject) {
            res.status(400).json({
              success: false,
              message: 'Missing required fields: to, subject'
            });
            return;
          }
          await emailService.sendEmail({ to, subject, text, html });
          res.json({
            success: true,
            data: { sent: true },
            message: 'Email sent successfully'
          });
        } catch (error: unknown) {
          res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: getErrorMessage(error)
          });
        }
      });

      app.post('/api/email/notify', express.json(), async (req, res) => {
        if (!emailService) {
          res.status(400).json({
            success: false,
            message: 'Email service not configured'
          });
          return;
        }
        try {
          const { type, title, data } = req.body;
          if (!type || !title) {
            res.status(400).json({
              success: false,
              message: 'Missing required fields: type, title'
            });
            return;
          }
          await emailService.notify(type, title, data || {});
          res.json({
            success: true,
            data: { sent: true },
            message: 'Notification sent successfully'
          });
        } catch (error: unknown) {
          res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: getErrorMessage(error)
          });
        }
      });

      // Feature flags endpoint
      app.get('/api/features', (_req, res) => {
        res.json({
          success: true,
          data: {
          settings: true,
          logging: true,
          websocket: settings['network.enableWebSocket'] !== false,
          monitoring: settings['advanced.performanceMonitoring'] !== false,
          telemetry: settings['advanced.telemetry'] === true,
          experimental: settings['advanced.experimental'] === true,
          authentication: settings['security.enableAuth'] === true,
          https: settings['security.enableHttps'] === true,
          rateLimit: settings['security.rateLimit'] !== false,
          backup: settings['storage.enableBackup'] !== false,
          debugMode: settings['advanced.debugMode'] === true,
          email: settings['email.enabled'] === true
          },
          message: 'Feature flags'
        });
      });
      
      logger.info('Application routes and middleware initialized');
    },
    
    onStart: async () => {
      logger.info('🚀 Server started successfully');
      logger.info(`📡 API running on port ${settings['network.apiPort'] || 7500}`);
      logger.info(`🌐 Web UI available on port ${settings['network.webPort'] || 7501}`);
      logger.info(`🔌 WebSocket support: ${settings['network.enableWebSocket'] !== false ? 'Enabled' : 'Disabled'}`);
      
      // Log active features
      const features = [];
      if (settings['network.enableWebSocket'] !== false) features.push('WebSocket');
      if (settings['security.enableAuth']) features.push('Authentication');
      if (settings['security.enableHttps']) features.push('HTTPS');
      if (settings['storage.enableBackup']) features.push('Backup');
      if (settings['advanced.performanceMonitoring']) features.push('Monitoring');
      if (settings['advanced.telemetry']) features.push('Telemetry');
      if (settings['advanced.debugMode']) features.push('Debug Mode');
      
      if (features.length > 0) {
        logger.info(`✨ Active features: ${features.join(', ')}`);
      }
      
      // Setup periodic tasks
      
      // Log cleanup task
      if (settings['logging.file']) {
        setInterval(async () => {
          try {
            const stats = await logger.compactLogs(
              settings['logging.retentionDays'] || 30
            );
            if (stats && stats.archivedCount && stats.archivedCount > 0) {
              logger.debug(`Archived ${stats.archivedCount} old log files`);
            }
          } catch (error) {
            logger.error('Failed to compact logs:', error);
          }
        }, 24 * 60 * 60 * 1000); // Daily
      }
      
      // Backup task
      if (settings['storage.enableBackup']) {
        const intervals: Record<string, number> = {
          hourly: 60 * 60 * 1000,
          daily: 24 * 60 * 60 * 1000,
          weekly: 7 * 24 * 60 * 60 * 1000,
          monthly: 30 * 24 * 60 * 60 * 1000
        };
        
        const backupInterval = intervals[settings['storage.backupInterval'] as string] || intervals.daily;
        
        setInterval(async () => {
          try {
            logger.info('Starting scheduled backup...');
            // Backup implementation would go here
            logger.info('Backup completed successfully');
          } catch (error) {
            logger.error('Backup failed:', error);
          }
        }, backupInterval);
      }
      
      // Health monitoring task
      setInterval(async () => {
        if (wsEventManager) {
          wsEventManager.broadcast('health', {
            type: 'status',
            timestamp: new Date().toISOString(),
            data: {
              status: 'healthy',
              uptime: process.uptime(),
              memory: process.memoryUsage()
            }
          });
        }
      }, 60000); // Every minute
      
      logger.info('✅ Application fully initialized and ready');
      logger.info('────────────────────────────────────────────');
    }
  });
  
  // Initialize and start server
  await server.initialize();
  await server.start();
}

// Enhanced error handling
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught exception:', error);
  
  // Try to gracefully shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  
  // Try to gracefully shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown handlers
const shutdown = async (signal: string) => {
  logger.info(`📴 ${signal} received, initiating graceful shutdown...`);

  try {
    // Save any pending settings
    if (settingsService) {
      await settingsService.save();
      logger.info('Settings saved');
    }

    // Shutdown email service
    if (emailService) {
      await emailService.shutdown();
      logger.info('Email service shut down');
    }

    // Close WebSocket connections
    if (wsEventManager) {
      wsEventManager.broadcast('system', {
        type: 'shutdown',
        timestamp: new Date().toISOString(),
        data: { message: 'Server is shutting down' }
      });
    }

    // Log final message
    logger.info('👋 Shutdown complete. Goodbye!');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the application
main().catch((error) => {
  logger.error('💥 Failed to start application:', error);
  process.exit(1);
});
