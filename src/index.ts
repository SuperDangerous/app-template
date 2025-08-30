#!/usr/bin/env node

/**
 * EpiSensor Application Template
 * A starting point for building internal applications
 */

import { StandardServer, createLogger, ConfigManager } from '@episensor/app-framework';
import { setupApp } from './setupApp.js';
import { WebSocketService } from './services/websocket.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('Main');

// Load configuration
const configPath = path.join(__dirname, '..', 'data', 'config', 'app.json');
const configManager = new ConfigManager({
  configPath,
  mergeEnv: true,
  watchFile: true,
  schema: {
    app: {
      name: 'EpiSensor App Template',
      version: '1.0.0',
      description: 'Template Application'
    },
    server: {
      port: 3000,
      webPort: 3001
    },
    features: {
      enableWebSocket: true,
      enableAuth: false,
      enableMetrics: true
    }
  }
});

// Desktop packaging support
if (process.env.DESKTOP === 'true') {
  logger.info('Running in desktop mode');
}

// Create and start the server
(async () => {
  try {
    await configManager.initialize();
    const config = configManager.get();
    
    let webSocketService: WebSocketService | undefined;
    
    const server = new StandardServer({
      appName: config.app.name,
      appVersion: config.app.version,
      description: config.app.description,
      port: config.server.port,
      webPort: config.server.webPort,
      enableWebSocket: config.features.enableWebSocket,
      
      onInitialize: async (app) => {
        // Initialize WebSocket service if enabled
        if (config.features.enableWebSocket) {
          const httpServer = server.getServer();
          webSocketService = new WebSocketService(httpServer, {
            corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
            pingInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
            pingTimeout: parseInt(process.env.WS_CONNECTION_TIMEOUT || '60000')
          });
        }
        
        // Setup all routes and middleware
        await setupApp(app, configManager, webSocketService);
      }
    });

    await server.initialize();
    await server.start();
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();