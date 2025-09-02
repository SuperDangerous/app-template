/**
 * EpiSensor App Template Main Server
 * Uses @episensor/app-framework for core services
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { 
  createLogger,
  WebSocketManager
} from '@episensor/app-framework';

import { getConfig, getPort, isDevelopment, getCorsOrigins, getLogLevel } from './config.js';

const app = express();
const httpServer = createServer(app);

// Load configuration using framework's ConfigManager
const config = getConfig();
const API_PORT = getPort('api');

// Initialize logger using framework
const logger = createLogger('AppTemplate');

// EpiSensor startup banner (simplified for template)
console.log('\n' + '='.repeat(60));
console.log(`🚀 ${config.name} v${config.version}`);
console.log('='.repeat(60));
console.log(`📡 API Server:     http://localhost:${API_PORT}`);
console.log(`🔌 WebSocket:      ws://localhost:${API_PORT}`);
console.log(`📊 Health Check:   http://localhost:${API_PORT}/api/health`);

if (isDevelopment()) {
  console.log(`🌐 Web Frontend:   http://localhost:${getPort('web')}`);
  console.log(`🐛 Environment:    Development`);
  console.log(`📝 Log Level:      ${getLogLevel()}`);
} else {
  console.log(`🏭 Environment:    Production`);
}

console.log('='.repeat(60) + '\n');

// Configure CORS using framework pattern
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getCorsOrigins();
    
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (isDevelopment()) {
      logger.warn(`CORS: Allowing unregistered origin in development: ${origin}`);
      callback(null, true);
    } else {
      logger.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'error' : 'debug';
    logger[level](`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

// Initialize WebSocket using framework's WebSocketManager
const wsManager = new WebSocketManager({
  cors: corsOptions,
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
});

// Initialize WebSocket manager with HTTP server
await wsManager.initialize(httpServer);

// Basic health check endpoint - could use framework's health middleware
app.get('/api/health', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.version,
    uptime: process.uptime(),
    metrics: {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        unit: 'MB'
      },
      connections: {
        websocket: wsManager.getClientCount()
      }
    },
    environment: isDevelopment() ? 'development' : 'production'
  });
});

// Configuration endpoint
app.get('/api/config', (_req, res) => {
  res.json({
    name: config.name,
    version: config.version,
    description: config.description,
    ports: config.ports,
    features: config.features,
    environment: isDevelopment() ? 'development' : 'production'
  });
});

// WebSocket clients endpoint
app.get('/api/websocket/clients', (_req, res) => {
  const clients = wsManager.getAllClients();
  res.json({
    count: clients.length,
    clients: clients.map(client => ({
      id: client.id,
      namespace: client.namespace,
      rooms: client.rooms,
      connectedAt: client.connectedAt,
      address: client.address
    }))
  });
});

// Broadcast endpoint for testing WebSocket
app.post('/api/broadcast', (req, res) => {
  const { event, data, channel } = req.body;
  
  if (!event) {
    return res.status(400).json({ error: 'Event name is required' });
  }
  
  try {
    if (channel) {
      wsManager.broadcastToRoom(channel, event, data);
      res.json({ 
        success: true, 
        message: `Broadcast sent to channel: ${channel}`,
        event,
        data 
      });
    } else {
      wsManager.broadcast(event, data);
      res.json({ 
        success: true, 
        message: 'Broadcast sent to all clients',
        event,
        data,
        recipients: wsManager.getClientCount()
      });
    }
  } catch (error) {
    logger.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast message' });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found'
  });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  
  const message = isDevelopment() ? err.message : 'Internal server error';
  const stack = isDevelopment() ? err.stack : undefined;
  
  res.status(err.status || 500).json({
    error: message,
    stack,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown using framework pattern
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close WebSocket connections
    await wsManager.shutdown();
    logger.info('WebSocket connections closed');
    
    // Close HTTP server
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  try {
    httpServer.listen(API_PORT, '0.0.0.0', () => {
      logger.info(`🚀 ${config.name} server started successfully`);
      logger.info(`📡 API Server: http://localhost:${API_PORT}`);
      logger.info(`🔌 WebSocket: ws://localhost:${API_PORT}`);
      logger.info(`📊 Health Check: http://localhost:${API_PORT}/api/health`);
      
      if (isDevelopment()) {
        logger.info(`🌐 Web Frontend: http://localhost:${getPort('web')}`);
      }
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  logger.error('Fatal error during startup:', error);
  process.exit(1);
});

export { app, wsManager as io, config };