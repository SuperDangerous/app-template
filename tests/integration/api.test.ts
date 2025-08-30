/**
 * Integration Tests - API Endpoints
 * Test the complete API functionality including routing, validation, and responses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { 
  createTestServer, 
  cleanupTestServer, 
  createMockData, 
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  TestServer
} from '../utils/testSetup.js';

describe('API Integration Tests', () => {
  let testServer: TestServer;
  const mockData = createMockData();

  beforeAll(async () => {
    testServer = await createTestServer();
  });

  afterAll(async () => {
    await cleanupTestServer(testServer);
  });

  describe('Root Endpoint', () => {
    it('should return application info', async () => {
      const response = await testServer.request
        .get('/')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.name).toBe('Test App');
      expect(response.body.version).toBe('1.0.0-test');
      expect(response.body.status).toBe('operational');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Health Check API', () => {
    it('should return health status', async () => {
      const response = await testServer.request
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return detailed metrics', async () => {
      const response = await testServer.request
        .get('/api/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('system');
      expect(response.body.system).toHaveProperty('cpu');
      expect(response.body.system).toHaveProperty('memory');
      expect(response.body.system).toHaveProperty('uptime');
    });

    it('should return readiness probe', async () => {
      const response = await testServer.request
        .get('/api/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('ready', true);
    });
  });

  describe('Example API', () => {
    let createdItemId: string;

    it('should get empty items list initially', async () => {
      const response = await testServer.request
        .get('/api/example')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should create a new item', async () => {
      const response = await testServer.request
        .post('/api/example')
        .send(mockData.validItem)
        .expect(201);

      expectSuccessResponse(response);
      expect(response.body.data).toMatchObject(mockData.validItem);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
      
      createdItemId = response.body.data.id;
    });

    it('should reject invalid item creation', async () => {
      const response = await testServer.request
        .post('/api/example')
        .send(mockData.invalidItem)
        .expect(400);

      expectValidationError(response);
    });

    it('should get all items after creation', async () => {
      const response = await testServer.request
        .get('/api/example')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0]).toMatchObject(mockData.validItem);
    });

    it('should get specific item by ID', async () => {
      const response = await testServer.request
        .get(`/api/example/${createdItemId}`)
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toMatchObject(mockData.validItem);
      expect(response.body.data.id).toBe(createdItemId);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await testServer.request
        .get('/api/example/non-existent-id')
        .expect(404);

      expectErrorResponse(response, 'Item not found');
    });

    it('should update existing item', async () => {
      const response = await testServer.request
        .put(`/api/example/${createdItemId}`)
        .send(mockData.updateData)
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toMatchObject(mockData.updateData);
      expect(response.body.data.id).toBe(createdItemId);
    });

    it('should reject invalid update data', async () => {
      const response = await testServer.request
        .put(`/api/example/${createdItemId}`)
        .send({ value: 'invalid-number' })
        .expect(400);

      expectValidationError(response);
    });

    it('should return 404 when updating non-existent item', async () => {
      const response = await testServer.request
        .put('/api/example/non-existent-id')
        .send(mockData.updateData)
        .expect(404);

      expectErrorResponse(response, 'Item not found');
    });

    it('should delete existing item', async () => {
      const response = await testServer.request
        .delete(`/api/example/${createdItemId}`)
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 when deleting non-existent item', async () => {
      const response = await testServer.request
        .delete('/api/example/non-existent-id')
        .expect(404);

      expectErrorResponse(response, 'Item not found');
    });
  });

  describe('Data API', () => {
    it('should get data snapshot', async () => {
      const response = await testServer.request
        .get('/api/data/snapshot')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('timestamp');
      
      // Verify data structure
      const dataPoint = response.body.data[0];
      expect(dataPoint).toHaveProperty('timestamp');
      expect(dataPoint).toHaveProperty('value');
      expect(dataPoint).toHaveProperty('unit');
      expect(dataPoint).toHaveProperty('source');
    });

    it('should get historical data with default params', async () => {
      const response = await testServer.request
        .get('/api/data/history')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('query');
    });

    it('should get historical data with custom params', async () => {
      const response = await testServer.request
        .get('/api/data/history')
        .query({
          source: 'solar',
          from: new Date(Date.now() - 3600000).toISOString(),
          to: new Date().toISOString()
        })
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.query.source).toBe('solar');
      
      // All data points should be from solar source
      response.body.data.forEach((point: any) => {
        expect(point.source).toBe('solar');
      });
    });

    it('should get statistics', async () => {
      const response = await testServer.request
        .get('/api/data/stats')
        .expect(200);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('sources');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('period');
    });

    it('should queue export job', async () => {
      const response = await testServer.request
        .post('/api/data/export')
        .send({ format: 'csv', period: '24h' })
        .expect(202);

      expectSuccessResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('format', 'csv');
      expect(response.body.data).toHaveProperty('status', 'queued');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await testServer.request
        .get('/api/non-existent-endpoint')
        .expect(404);

      expectErrorResponse(response);
    });

    it('should handle malformed JSON', async () => {
      const response = await testServer.request
        .post('/api/example')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express handles malformed JSON with 400 status
      expect(response.status).toBe(400);
    });

    it('should handle large payloads gracefully', async () => {
      const largeData = {
        name: 'x'.repeat(1000000), // 1MB string
        description: 'Large data test'
      };

      const response = await testServer.request
        .post('/api/example')
        .send(largeData);

      // Should either accept it or reject with proper error
      expect([200, 201, 413]).toContain(response.status);
    });
  });
});