/**
 * EpiSensor App Template Main Server
 * Uses @episensor/app-framework StandardServer for modern desktop app support
 */

import { StandardServer, createLogger } from '@episensor/app-framework';
import express from 'express';

const logger = createLogger('AppTemplate');

async function main() {
  const server = new StandardServer({
    appName: 'EpiSensor App Template',
    appVersion: '1.0.0',
    description: 'A comprehensive template for building EpiSensor desktop applications',
    port: 7500,
    webPort: 7501, // Development web UI port
    appId: 'com.episensor.app-template', // Required for Tauri CORS configuration
    // Desktop integration will be automatically enabled when TAURI=1
    enableWebSocket: true,
    
    onInitialize: async (app: express.Application) => {
      logger.info('Setting up app-specific routes and middleware');
      
      // Add your custom middleware and routes here
      
      // Example API routes
      app.get('/api/example', (_req, res) => {
        res.json({ 
          message: 'Hello from EpiSensor App Template!',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      });
      
      // Configuration endpoint
      app.get('/api/config', (_req, res) => {
        res.json({
          name: 'EpiSensor App Template',
          version: '1.0.0',
          description: 'Template application',
          environment: process.env.NODE_ENV || 'development',
          isDesktopApp: process.env.TAURI === '1'
        });
      });
      
      logger.info('App-specific setup completed');
    },
    
    onStart: async () => {
      logger.info('🎉 EpiSensor App Template is ready!');
      logger.info('Add your custom startup logic here');
    }
  });

  // Initialize and start the server
  await server.initialize();
  await server.start();
}

// Start the application
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});