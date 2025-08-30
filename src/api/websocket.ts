/**
 * WebSocket API Router
 * REST endpoints to interact with WebSocket functionality
 */

import { Router, Request, Response } from 'express';
import { createLogger } from '@episensor/app-framework';
import { WebSocketService } from '../services/websocket.js';
import { z } from 'zod';

const logger = createLogger('WebSocketAPI');

// Validation schemas
const BroadcastMessageSchema = z.object({
  message: z.string().min(1),
  type: z.string().optional().default('general'),
  data: z.any().optional(),
});

const RoomMessageSchema = z.object({
  room: z.string().min(1),
  message: z.string().min(1),
  type: z.string().optional().default('room-message'),
});

const DataPublishSchema = z.object({
  type: z.string().min(1),
  data: z.any(),
  filters: z.record(z.any()).optional().default({}),
});

export function createWebSocketRouter(wsService: WebSocketService): Router {
  const router = Router();

  // Get connected clients info
  router.get('/clients', (_req: Request, res: Response) => {
    try {
      const clients = wsService.getConnectedClients();
      const clientCount = wsService.getClientCount();

      res.json({
        success: true,
        data: {
          count: clientCount,
          clients: clients.map(client => ({
            id: client.id,
            username: client.username,
            roles: client.roles,
            connectedAt: client.connectedAt,
          })),
        },
      });
    } catch (error: any) {
      logger.error('Failed to get clients info', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get clients info',
        message: error.message,
      });
    }
  });

  // Get clients in a specific room
  router.get('/rooms/:roomName/clients', async (req: Request, res: Response) => {
    try {
      const { roomName } = req.params;
      const clients = await wsService.getRoomClients(roomName);

      res.json({
        success: true,
        data: {
          room: roomName,
          count: clients.length,
          clients,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get room clients', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get room clients',
        message: error.message,
      });
    }
  });

  // Broadcast message to all connected clients
  router.post('/broadcast', async (req: Request, res: Response) => {
    try {
      const validated = BroadcastMessageSchema.parse(req.body);
      
      wsService.broadcast({
        type: validated.type,
        message: validated.message,
        data: validated.data,
        sentBy: 'server',
        sentAt: new Date().toISOString(),
      });

      logger.info('Broadcast message sent', { type: validated.type });

      res.json({
        success: true,
        message: 'Message broadcast successfully',
        data: {
          type: validated.type,
          message: validated.message,
          clientCount: wsService.getClientCount(),
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        logger.error('Failed to broadcast message', error);
        res.status(500).json({
          success: false,
          error: 'Failed to broadcast message',
          message: error.message,
        });
      }
    }
  });

  // Send message to specific room
  router.post('/rooms/:roomName/message', async (req: Request, res: Response) => {
    try {
      const { roomName } = req.params;
      const validated = RoomMessageSchema.parse({
        ...req.body,
        room: roomName,
      });

      wsService.sendToRoom(roomName, {
        type: validated.type,
        message: validated.message,
        sentBy: 'server',
        sentAt: new Date().toISOString(),
      });

      const clientCount = await wsService.getRoomClients(roomName);
      logger.info('Room message sent', { room: roomName, clientCount: clientCount.length });

      res.json({
        success: true,
        message: 'Message sent to room successfully',
        data: {
          room: roomName,
          message: validated.message,
          clientCount: clientCount.length,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        logger.error('Failed to send room message', error);
        res.status(500).json({
          success: false,
          error: 'Failed to send room message',
          message: error.message,
        });
      }
    }
  });

  // Send direct message to specific client
  router.post('/clients/:socketId/message', async (req: Request, res: Response) => {
    try {
      const { socketId } = req.params;
      const { message, data } = req.body;

      if (!message) {
        res.status(400).json({
          success: false,
          error: 'Message is required',
        });
        return;
      }

      if (!wsService.isClientConnected(socketId)) {
        res.status(404).json({
          success: false,
          error: 'Client not found or disconnected',
        });
        return;
      }

      wsService.sendToUser(socketId, {
        message,
        data,
        sentBy: 'server',
        sentAt: new Date().toISOString(),
      });

      logger.info('Direct message sent', { socketId });

      res.json({
        success: true,
        message: 'Direct message sent successfully',
        data: {
          socketId,
          message,
        },
      });
    } catch (error: any) {
      logger.error('Failed to send direct message', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send direct message',
        message: error.message,
      });
    }
  });

  // Publish data to subscribers
  router.post('/publish', async (req: Request, res: Response) => {
    try {
      const validated = DataPublishSchema.parse(req.body);

      wsService.publishData(validated.type, validated.data, validated.filters);

      logger.info('Data published', { type: validated.type, filters: validated.filters });

      res.json({
        success: true,
        message: 'Data published successfully',
        data: {
          type: validated.type,
          filters: validated.filters,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      } else {
        logger.error('Failed to publish data', error);
        res.status(500).json({
          success: false,
          error: 'Failed to publish data',
          message: error.message,
        });
      }
    }
  });

  // Disconnect a specific client
  router.post('/clients/:socketId/disconnect', async (req: Request, res: Response) => {
    try {
      const { socketId } = req.params;
      const { reason } = req.body;

      if (!wsService.isClientConnected(socketId)) {
        res.status(404).json({
          success: false,
          error: 'Client not found or already disconnected',
        });
        return;
      }

      wsService.disconnectClient(socketId, reason);

      logger.info('Client disconnected via API', { socketId, reason });

      res.json({
        success: true,
        message: 'Client disconnected successfully',
        data: {
          socketId,
          reason: reason || 'Disconnected by server',
        },
      });
    } catch (error: any) {
      logger.error('Failed to disconnect client', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect client',
        message: error.message,
      });
    }
  });

  // WebSocket service status
  router.get('/status', (_req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        data: {
          status: 'active',
          connectedClients: wsService.getClientCount(),
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Failed to get WebSocket status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get WebSocket status',
        message: error.message,
      });
    }
  });

  return router;
}