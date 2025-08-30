/**
 * Test Setup Utilities
 * Common utilities and helpers for tests
 */

import { StandardServer, ConfigManager, createLogger } from '@episensor/app-framework';
import { setupApp } from '../../src/setupApp.js';
import request from 'supertest';
import { Express } from 'express';

const logger = createLogger('TestSetup');

export interface TestServer {
  app: Express;
  server: StandardServer;
  request: request.SuperTest<request.Test>;
  configManager: ConfigManager;
}

export async function createTestServer(): Promise<TestServer> {
  // Create test configuration
  const configManager = new ConfigManager({
    mergeEnv: false,
    watchFile: false,
    schema: {
      app: {
        name: 'Test App',
        version: '1.0.0-test',
        description: 'Test Application'
      },
      server: {
        port: 3010,
        webPort: 3011
      },
      features: {
        enableWebSocket: true,
        enableAuth: false,
        enableMetrics: true
      },
      database: {
        type: 'memory',
        database: ':memory:'
      },
      logging: {
        level: 'error',
        file: false,
        console: false
      }
    }
  });

  await configManager.initialize();
  const config = configManager.get();

  // Create server instance
  const server = new StandardServer({
    appName: config.app.name,
    appVersion: config.app.version,
    description: config.app.description,
    port: config.server.port,
    webPort: config.server.webPort,
    enableWebSocket: config.features.enableWebSocket,
    
    onInitialize: async (app) => {
      await setupApp(app, configManager);
    }
  });

  // Initialize but don't start listening
  await server.initialize();
  const app = server.getServer();

  return {
    app,
    server,
    request: request(app),
    configManager
  };
}

export async function cleanupTestServer(testServer: TestServer): Promise<void> {
  try {
    // Close server connections if needed
    logger.info('Cleaning up test server');
  } catch (error) {
    logger.error('Error cleaning up test server:', error);
  }
}

export function createMockData() {
  return {
    validItem: {
      name: 'Test Item',
      description: 'A test item for testing',
      value: 42
    },
    invalidItem: {
      name: '', // Invalid - empty name
      value: 'not-a-number' // Invalid - should be number
    },
    updateData: {
      name: 'Updated Test Item',
      value: 100
    }
  };
}

export function expectSuccessResponse(response: any, expectedData?: any) {
  expect(response.body).toHaveProperty('success', true);
  if (expectedData) {
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toMatchObject(expectedData);
  }
}

export function expectErrorResponse(response: any, expectedError?: string) {
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error');
  if (expectedError) {
    expect(response.body.error).toContain(expectedError);
  }
}

export function expectValidationError(response: any) {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('error', 'Validation failed');
  expect(response.body).toHaveProperty('details');
}

export async function waitFor(condition: () => boolean | Promise<boolean>, timeout = 5000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

export function createTestUser() {
  return {
    id: 'test-user-123',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user']
  };
}

export function createTestHeaders() {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'test-client/1.0'
  };
}