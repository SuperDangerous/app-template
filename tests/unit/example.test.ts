/**
 * Unit tests for Example API
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createExampleRouter } from '../../src/api/example';
import express from 'express';
import request from 'supertest';

describe('Example API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/example', createExampleRouter({} as any));
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
  });

  describe('POST /api/example', () => {
    it('should create new item', async () => {
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
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/example')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('GET /api/example/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/example/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Item not found');
    });
  });
});