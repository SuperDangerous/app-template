/**
 * WebSocket Service
 * Manages real-time communication using Socket.io
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createLogger } from '@episensor/app-framework';

const logger = createLogger('WebSocketService');

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
}

export interface SocketUser {
  id: string;
  username?: string;
  roles?: string[];
  connectedAt: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients = new Map<string, SocketUser>();

  constructor(server: HTTPServer, options: any = {}) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: options.corsOrigin || 'http://localhost:3001',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: options.pingInterval || 30000,
      pingTimeout: options.pingTimeout || 60000,
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const user: SocketUser = {
        id: socket.id,
        connectedAt: new Date(),
      };
      
      this.connectedClients.set(socket.id, user);
      logger.info(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle joining rooms/channels
      socket.on('join-room', (roomName) => {
        this.handleJoinRoom(socket, roomName);
      });

      // Handle leaving rooms/channels
      socket.on('leave-room', (roomName) => {
        this.handleLeaveRoom(socket, roomName);
      });

      // Handle custom messages
      socket.on('message', (message) => {
        this.handleMessage(socket, message);
      });

      // Handle data subscriptions
      socket.on('subscribe', (subscription) => {
        this.handleSubscription(socket, subscription);
      });

      socket.on('unsubscribe', (subscription) => {
        this.handleUnsubscription(socket, subscription);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to WebSocket server',
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });
  }

  private handleAuthentication(socket: any, data: any): void {
    try {
      const user = this.connectedClients.get(socket.id);
      if (user) {
        user.username = data.username;
        user.roles = data.roles || [];
        this.connectedClients.set(socket.id, user);
        
        socket.emit('authenticated', {
          success: true,
          user: {
            id: socket.id,
            username: user.username,
            roles: user.roles,
          },
        });
        
        logger.info(`Client authenticated: ${socket.id} (${user.username})`);
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      socket.emit('authenticated', { success: false, error: 'Authentication failed' });
    }
  }

  private handleJoinRoom(socket: any, roomName: string): void {
    try {
      socket.join(roomName);
      socket.emit('room-joined', { room: roomName });
      socket.to(roomName).emit('user-joined', { 
        socketId: socket.id,
        room: roomName 
      });
      
      logger.info(`Client ${socket.id} joined room: ${roomName}`);
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private handleLeaveRoom(socket: any, roomName: string): void {
    try {
      socket.leave(roomName);
      socket.emit('room-left', { room: roomName });
      socket.to(roomName).emit('user-left', { 
        socketId: socket.id,
        room: roomName 
      });
      
      logger.info(`Client ${socket.id} left room: ${roomName}`);
    } catch (error) {
      logger.error('Error leaving room:', error);
    }
  }

  private handleMessage(socket: any, message: WebSocketMessage): void {
    try {
      const enrichedMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now(),
        userId: socket.id,
      };

      // Broadcast to all clients or specific room
      if (message.type === 'broadcast') {
        this.broadcast(enrichedMessage.data);
      } else if (message.type === 'room-message') {
        this.sendToRoom(message.data.room, enrichedMessage);
      }

      logger.debug(`Message handled from ${socket.id}:`, message.type);
    } catch (error) {
      logger.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to handle message' });
    }
  }

  private handleSubscription(socket: any, subscription: any): void {
    try {
      const { type, filters = {} } = subscription;
      
      // Join subscription-specific room
      const subscriptionRoom = `${type}_${JSON.stringify(filters)}`;
      socket.join(subscriptionRoom);
      
      socket.emit('subscribed', { 
        type,
        filters,
        room: subscriptionRoom 
      });
      
      logger.info(`Client ${socket.id} subscribed to: ${type}`);
    } catch (error) {
      logger.error('Subscription error:', error);
      socket.emit('error', { message: 'Failed to subscribe' });
    }
  }

  private handleUnsubscription(socket: any, subscription: any): void {
    try {
      const { type, filters = {} } = subscription;
      const subscriptionRoom = `${type}_${JSON.stringify(filters)}`;
      
      socket.leave(subscriptionRoom);
      socket.emit('unsubscribed', { type, filters });
      
      logger.info(`Client ${socket.id} unsubscribed from: ${type}`);
    } catch (error) {
      logger.error('Unsubscription error:', error);
    }
  }

  private handleDisconnection(socket: any, reason: string): void {
    this.connectedClients.delete(socket.id);
    logger.info(`Client disconnected: ${socket.id} (${reason})`);
  }

  // Public methods for broadcasting data

  public broadcast(data: any): void {
    this.io.emit('broadcast', {
      data,
      timestamp: Date.now(),
    });
  }

  public sendToRoom(room: string, data: any): void {
    this.io.to(room).emit('room-message', {
      room,
      data,
      timestamp: Date.now(),
    });
  }

  public sendToUser(socketId: string, data: any): void {
    this.io.to(socketId).emit('direct-message', {
      data,
      timestamp: Date.now(),
    });
  }

  public publishData(type: string, data: any, filters: any = {}): void {
    const room = `${type}_${JSON.stringify(filters)}`;
    this.io.to(room).emit('data-update', {
      type,
      data,
      filters,
      timestamp: Date.now(),
    });
  }

  // Utility methods

  public getConnectedClients(): SocketUser[] {
    return Array.from(this.connectedClients.values());
  }

  public getClientCount(): number {
    return this.connectedClients.size;
  }

  public getRoomClients(room: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.io.in(room).allSockets()
        .then(sockets => resolve(Array.from(sockets)))
        .catch(reject);
    });
  }

  public isClientConnected(socketId: string): boolean {
    return this.connectedClients.has(socketId);
  }

  public disconnectClient(socketId: string, reason?: string): void {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
      logger.info(`Force disconnected client: ${socketId}${reason ? ` (${reason})` : ''}`);
    }
  }

  public getSocketIOInstance(): SocketIOServer {
    return this.io;
  }
}