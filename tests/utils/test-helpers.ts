/**
 * Test Helper Utilities
 * Common utilities for testing the EpiSensor App Template
 */

import { Server } from 'http';
import { AddressInfo } from 'net';
import express from 'express';
import {
  StandardServer,
  logsRouter,
  WebSocketEventManager,
  getStorageService,
  healthCheck,
} from '@episensor/app-framework';
import settingsRouter, { settingsService } from '../../src/routes/settingsRouter.js';
import { io as Client, Socket } from 'socket.io-client';

export interface TestApp {
  server: StandardServer;
  port: number;
  baseUrl: string;
  cleanup: () => Promise<void>;
}

export interface TestWebSocketClient {
  socket: Socket;
  disconnect: () => void;
}

/**
 * Create a test instance of the application
 */
export async function createTestApp(): Promise<TestApp> {
  // Use a random port to avoid conflicts
  const testPort = Math.floor(Math.random() * 10000) + 20000;

  const storageService = getStorageService();
  await storageService.initialize();

  const settings = await settingsService.getAll();

  const server = new StandardServer({
    appName: 'Test App',
    appVersion: '1.0.0',
    description: 'Test instance',
    port: testPort,
    webPort: testPort + 1,
    appId: 'com.episensor.test',
    enableWebSocket: true,

    onInitialize: async (app: express.Application, wsServer?: any) => {
      app.use('/api/logs', logsRouter);
      app.use('/api/settings', settingsRouter);
      app.get('/api/health', healthCheck);

      app.get('/api/config', (_req, res) => {
        res.json({
          success: true,
          data: {
            appName: settings['app.name'] || 'Test App',
            appVersion: '1.0.0',
            apiUrl: `http://localhost:${testPort}`,
            websocketEnabled: settings['network.enableWebSocket'] !== false,
            environment: process.env.NODE_ENV || 'test',
          },
          message: 'Application configuration',
        });
      });

      app.get('/api/system/info', (_req, res) => {
        res.json({
          success: true,
          data: {
            name: settings['app.name'] || 'Test App',
            version: '1.0.0',
            description: settings['app.description'] || 'Test instance',
            environment: process.env.NODE_ENV || 'test',
            platform: process.platform,
            nodeVersion: process.version,
            uptime: process.uptime(),
            features: {
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
            },
          },
          message: 'System information',
        });
      });

      app.get('/api/system/metrics', (_req, res) => {
        res.json({
          success: true,
          data: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
          },
          message: 'System metrics retrieved',
        });
      });

      app.get('/api/storage/info', async (_req, res) => {
        const files = await storageService.listFiles('data');
        const directoriesRaw = storageService.getBaseDirectories();
        const directories = Array.isArray(directoriesRaw)
          ? directoriesRaw
          : Object.values(directoriesRaw ?? {});
        res.json({
          success: true,
          data: {
            directories,
            fileCount: files.length,
            totalSize: files.reduce((total, file) => total + (file.size || 0), 0),
          },
          message: 'Storage information',
        });
      });

      app.get('/api/health/detailed', (_req, res) => {
        res.json({
          success: true,
          data: {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
          message: 'Detailed system status',
        });
      });

      app.get('/api/example', (_req, res) => {
        res.json({
          success: true,
          data: {
            message: 'Hello from test app',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
          message: 'Example endpoint',
        });
      });

      app.get('/api/demo/data', (_req, res) => {
        res.json({
          success: true,
          data: {
            users: [
              { id: 1, name: 'Jane Doe', role: 'Admin', status: 'active' },
            ],
            stats: {
              totalUsers: 1,
              activeUsers: 1,
              totalSessions: 10,
              avgSessionDuration: 1200,
            },
            recentActivity: [],
          },
          message: 'Demo data retrieved',
        });
      });

      app.get('/api/features', (_req, res) => {
        const features = {
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
        };

        res.json({
          success: true,
          data: features,
          message: 'Feature flags',
        });
      });

      app.get('/test', (_req, res) => {
        res.json({ message: 'test endpoint working' });
      });

      app.get('/health', (_req, res) => {
        res.json({ status: 'healthy' });
      });

      const io = wsServer?.getIO ? wsServer.getIO() : wsServer;
      if (io) {
        const wsManager = new WebSocketEventManager(io);

        wsManager.on('ping', (socket, data) => {
          socket.emit('pong', {
            timestamp: Date.now(),
            echo: data,
          });
        });

        wsManager.on('subscribe', (socket, data) => {
          const channel = data?.channel;
          if (channel) {
            socket.join(channel);
          }
        });

        wsManager.on('unsubscribe', (socket, data) => {
          const channel = data?.channel;
          if (channel) {
            socket.leave(channel);
          }
        });
      }
    }
  });

  await server.initialize();
  await server.start();

  return {
    server,
    port: testPort,
    baseUrl: `http://localhost:${testPort}`,
    cleanup: async () => {
      // Use the correct method to stop the server
      if (server && typeof server.stop === 'function') {
        await server.stop();
      } else if (server && typeof server.close === 'function') {
        await server.close();
      }
    }
  };
}

/**
 * Create a test WebSocket client
 */
export function createTestWebSocketClient(port: number): Promise<TestWebSocketClient> {
  return new Promise((resolve, reject) => {
    const socket = Client(`http://localhost:${port}`);

    socket.on('connect', () => {
      resolve({
        socket,
        disconnect: () => socket.disconnect()
      });
    });

    socket.on('connect_error', (error) => {
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!socket.connected) {
        socket.disconnect();
        reject(new Error('WebSocket connection timeout'));
      }
    }, 5000);
  });
}

/**
 * Wait for a condition to be true
 */
export function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = async () => {
      try {
        const result = await condition();
        if (result) {
          resolve();
          return;
        }
      } catch (error) {
        // Continue checking
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * Wait for a specific amount of time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Make HTTP request helper
 */
export async function makeRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{
  status: number;
  headers: Headers;
  data: any;
}> {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data;
  const contentType = response.headers.get('content-type');

  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch (error) {
    // If we can't read the response body, return the status information
    data = null;
  }

  return {
    status: response.status,
    headers: response.headers,
    data
  };
}

/**
 * Check if a port is in use
 */
export function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = require('net').createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(false);
      });
      server.close();
    });

    server.on('error', () => {
      resolve(true);
    });
  });
}

/**
 * Find an available port starting from a given port
 */
export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
}

/**
 * Reset settings to test defaults
 */
export async function resetTestSettings(): Promise<void> {
  // Reset to minimal test settings
  const testSettings = {
    'app.name': 'Test App',
    'network.apiPort': 8500,
    'network.webPort': 8502,
    'network.enableWebSocket': true,
    'logging.level': 'error', // Reduce noise during tests
    'logging.console': false,
    'logging.file': false
  };

  for (const [key, value] of Object.entries(testSettings)) {
    await settingsService.set(key, value);
  }
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof response !== 'object' || response === null) {
    errors.push('Response is not an object');
    return { isValid: false, errors };
  }

  if (typeof response.success !== 'boolean') {
    errors.push('Response missing success field');
  }

  if (typeof response.message !== 'string') {
    errors.push('Response missing message field');
  }

  if (response.success && !response.data) {
    errors.push('Successful response missing data field');
  }

  if (!response.success && !response.error && !response.message) {
    errors.push('Error response missing error information');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create mock Express request object
 */
export function createMockRequest(overrides: any = {}): any {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides
  };
}

/**
 * Create mock Express response object
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: null
  };

  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };

  res.json = (data: any) => {
    res.body = data;
    return res;
  };

  res.setHeader = (name: string, value: string) => {
    res.headers[name] = value;
    return res;
  };

  return res;
}

/**
 * Assert that a function throws an error
 */
export async function assertThrows(
  fn: () => Promise<any> | any,
  expectedMessage?: string
): Promise<Error> {
  try {
    await fn();
    throw new Error('Expected function to throw an error');
  } catch (error) {
    if (error instanceof Error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
      }
      return error;
    }
    throw new Error('Expected thrown value to be an Error instance');
  }
}

/**
 * Clean up test resources
 */
export class TestCleaner {
  private cleanupTasks: Array<() => Promise<void> | void> = [];

  add(cleanup: () => Promise<void> | void): void {
    this.cleanupTasks.push(cleanup);
  }

  async cleanup(): Promise<void> {
    for (const task of this.cleanupTasks.reverse()) {
      try {
        await task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }
    this.cleanupTasks = [];
  }
}
