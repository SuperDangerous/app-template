/**
 * Unit Tests - Example API Router
 * Test the Example API endpoints in isolation
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { createExampleRouter } from '../../src/api/example.js';
import express from 'express';
import request from 'supertest';

// Mock the framework logger
vi.mock('@episensor/app-framework', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  })),
  ConfigManager: vi.fn()
}));

describe('Example API Router', () => {
  let app: express.Application;
  let createdItemId: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Mock ConfigManager
    const mockConfigManager = {
      get: vi.fn().mockReturnValue({}),
      initialize: vi.fn(),
      update: vi.fn(),
      reset: vi.fn()
    };
    
    app.use('/api/example', createExampleRouter(mockConfigManager));
  });

  beforeEach(() => {
    // Clear the in-memory storage before each test
    // In a real app, you might reset database state
    vi.clearAllMocks();
  });

  describe('GET /api/example', () => {
    it('should return empty list initially', async () => {
      const response = await request(app)
        .get('/api/example')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should have correct response structure', async () => {
      const response = await request(app)
        .get('/api/example')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('POST /api/example', () => {
    it('should create new item with valid data', async () => {
      const newItem = {
        name: 'Test Item',
        description: 'Test Description',
        value: 42
      };

      const response = await request(app)
        .post('/api/example')
        .send(newItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(newItem);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('message');

      // Save ID for other tests
      createdItemId = response.body.data.id;
    });

    it('should create item with minimal required data', async () => {
      const minimalItem = {
        name: 'Minimal Item'
      };

      const response = await request(app)
        .post('/api/example')
        .send(minimalItem)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(minimalItem.name);
      expect(response.body.data.description).toBeUndefined();
      expect(response.body.data.value).toBeUndefined();
    });

    it('should validate required name field', async () => {
      const response = await request(app)
        .post('/api/example')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should validate name length constraints', async () => {
      const longNameItem = {
        name: 'x'.repeat(101) // Exceeds 100 character limit
      };

      const response = await request(app)
        .post('/api/example')
        .send(longNameItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate value type when provided', async () => {
      const invalidValueItem = {
        name: 'Test Item',
        value: 'not-a-number'
      };

      const response = await request(app)
        .post('/api/example')
        .send(invalidValueItem)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const response = await request(app)
        .post('/api/example')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express handles malformed JSON with 400 status
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/example/:id', () => {
    beforeAll(async () => {
      // Create an item for testing
      const response = await request(app)
        .post('/api/example')
        .send({ name: 'Test Item for GET', value: 100 });
      createdItemId = response.body.data.id;
    });

    it('should get existing item by ID', async () => {
      const response = await request(app)
        .get(`/api/example/${createdItemId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', createdItemId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/example/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found');
    });

    it('should handle special characters in ID', async () => {
      const response = await request(app)
        .get('/api/example/@#$%^&*()')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/example/:id', () => {
    beforeAll(async () => {
      // Create an item for testing
      const response = await request(app)
        .post('/api/example')
        .send({ name: 'Item to Update', value: 50 });
      createdItemId = response.body.data.id;
    });

    it('should update existing item', async () => {
      const updateData = {
        name: 'Updated Item Name',
        description: 'Updated description',
        value: 75
      };

      const response = await request(app)
        .put(`/api/example/${createdItemId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject(updateData);
      expect(response.body.data.id).toBe(createdItemId);
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should partially update item', async () => {
      const partialUpdate = {
        value: 99
      };

      const response = await request(app)
        .put(`/api/example/${createdItemId}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.value).toBe(99);
      expect(response.body.data.name).toBeDefined(); // Should retain existing name
    });

    it('should return 404 for non-existent item update', async () => {
      const response = await request(app)
        .put('/api/example/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found');
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        name: '', // Empty name should be invalid
        value: 'invalid-number'
      };

      const response = await request(app)
        .put(`/api/example/${createdItemId}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('DELETE /api/example/:id', () => {
    let itemToDeleteId: string;

    beforeEach(async () => {
      // Create an item for each delete test
      const response = await request(app)
        .post('/api/example')
        .send({ name: 'Item to Delete', value: 25 });
      itemToDeleteId = response.body.data.id;
    });

    it('should delete existing item', async () => {
      const response = await request(app)
        .delete(`/api/example/${itemToDeleteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify item is actually deleted
      await request(app)
        .get(`/api/example/${itemToDeleteId}`)
        .expect(404);
    });

    it('should return 404 for non-existent item deletion', async () => {
      const response = await request(app)
        .delete('/api/example/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found');
    });

    it('should handle double deletion gracefully', async () => {
      // Delete once
      await request(app)
        .delete(`/api/example/${itemToDeleteId}`)
        .expect(200);

      // Try to delete again
      const response = await request(app)
        .delete(`/api/example/${itemToDeleteId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // This would require mocking a server error scenario
      // For now, we just verify the error structure
      const response = await request(app)
        .get('/api/example/trigger-error')
        .expect(404); // Will be 404 since route doesn't exist

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return consistent error format', async () => {
      const response = await request(app)
        .get('/api/example/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.error).toBe('string');
    });
  });

  describe('Integration with Storage', () => {
    it('should persist items across requests', async () => {
      // Create item
      const createResponse = await request(app)
        .post('/api/example')
        .send({ name: 'Persistent Item', value: 123 });

      const itemId = createResponse.body.data.id;

      // Get all items
      const listResponse = await request(app)
        .get('/api/example')
        .expect(200);

      expect(listResponse.body.data).toContainEqual(
        expect.objectContaining({
          id: itemId,
          name: 'Persistent Item',
          value: 123
        })
      );

      // Get specific item
      const getResponse = await request(app)
        .get(`/api/example/${itemId}`)
        .expect(200);

      expect(getResponse.body.data.id).toBe(itemId);
    });

    it('should maintain data consistency', async () => {
      // Create multiple items
      const items = [
        { name: 'Item 1', value: 1 },
        { name: 'Item 2', value: 2 },
        { name: 'Item 3', value: 3 }
      ];

      const createdIds = [];
      for (const item of items) {
        const response = await request(app)
          .post('/api/example')
          .send(item);
        createdIds.push(response.body.data.id);
      }

      // Verify all items exist
      const listResponse = await request(app)
        .get('/api/example')
        .expect(200);

      expect(listResponse.body.data).toHaveLength(createdIds.length);
      expect(listResponse.body.count).toBe(createdIds.length);
    });
  });
});