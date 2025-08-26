/**
 * Example API Router
 * Demonstrates basic CRUD operations
 */

import { Router, Request, Response } from 'express';
import { createLogger, ConfigManager } from '@episensor/app-framework';
import { z } from 'zod';

const logger = createLogger('ExampleAPI');

// Validation schemas
const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  value: z.number().optional()
});

const UpdateItemSchema = CreateItemSchema.partial();

// In-memory storage for demonstration
const items = new Map<string, any>();

export function createExampleRouter(configManager: ConfigManager): Router {
  const router = Router();

  // Get all items
  router.get('/', (_req: Request, res: Response) => {
    try {
      const itemsList = Array.from(items.values());
      res.json({
        success: true,
        data: itemsList,
        count: itemsList.length
      });
    } catch (error: any) {
      logger.error('Failed to get items', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve items',
        message: error.message
      });
    }
  });

  // Get item by ID
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const item = items.get(req.params.id);
      
      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        });
        return;
      }

      res.json({
        success: true,
        data: item
      });
    } catch (error: any) {
      logger.error('Failed to get item', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve item',
        message: error.message
      });
    }
  });

  // Create new item
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validated = CreateItemSchema.parse(req.body);
      const id = `item-${Date.now()}`;
      
      const item = {
        id,
        ...validated,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      items.set(id, item);
      
      logger.info('Created new item', { id, name: validated.name });
      
      res.status(201).json({
        success: true,
        data: item,
        message: 'Item created successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('Failed to create item', error);
        res.status(500).json({
          success: false,
          error: 'Failed to create item',
          message: error.message
        });
      }
    }
  });

  // Update item
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const item = items.get(req.params.id);
      
      if (!item) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        });
        return;
      }

      const validated = UpdateItemSchema.parse(req.body);
      const updated = {
        ...item,
        ...validated,
        updatedAt: new Date().toISOString()
      };
      
      items.set(req.params.id, updated);
      
      logger.info('Updated item', { id: req.params.id });
      
      res.json({
        success: true,
        data: updated,
        message: 'Item updated successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      } else {
        logger.error('Failed to update item', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update item',
          message: error.message
        });
      }
    }
  });

  // Delete item
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      if (!items.has(req.params.id)) {
        res.status(404).json({
          success: false,
          error: 'Item not found'
        });
        return;
      }

      items.delete(req.params.id);
      
      logger.info('Deleted item', { id: req.params.id });
      
      res.json({
        success: true,
        message: 'Item deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete item', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete item',
        message: error.message
      });
    }
  });

  return router;
}