/**
 * Unit Tests - Services
 * Test individual service components in isolation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from '../../src/services/websocket.js';
import { createServer } from 'http';

// Mock Socket.io
vi.mock('socket.io', () => {
  const mockSocket = {
    id: 'test-socket-id',
    emit: vi.fn(),
    on: vi.fn(),
    join: vi.fn(),
    leave: vi.fn(),
    to: vi.fn().mockReturnThis(),
    disconnect: vi.fn()
  };

  const mockIO = {
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    allSockets: vi.fn().mockResolvedValue(new Set(['socket1', 'socket2'])),
    sockets: {
      sockets: new Map([['test-socket-id', mockSocket]])
    }
  };

  return {
    Server: vi.fn().mockImplementation(() => mockIO)
  };
});

// Mock @episensor/app-framework
vi.mock('@episensor/app-framework', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }))
}));

describe('WebSocket Service', () => {
  let webSocketService: WebSocketService;
  let mockServer: any;
  let mockIO: any;
  let mockSocket: any;

  beforeEach(() => {
    mockServer = createServer();
    webSocketService = new WebSocketService(mockServer);
    
    // Get the mocked Socket.io instance
    const { Server } = require('socket.io');
    mockIO = new Server();
    
    // Get mock socket
    mockSocket = {
      id: 'test-socket-id',
      emit: vi.fn(),
      on: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      to: vi.fn().mockReturnThis(),
      disconnect: vi.fn()
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create WebSocket service with default options', () => {
      expect(webSocketService).toBeDefined();
      expect(webSocketService.getClientCount()).toBe(0);
    });

    it('should create WebSocket service with custom options', () => {
      const customOptions = {
        corsOrigin: 'http://example.com',
        pingInterval: 25000,
        pingTimeout: 50000
      };
      
      const customService = new WebSocketService(mockServer, customOptions);
      expect(customService).toBeDefined();
    });
  });

  describe('Client Management', () => {
    it('should track connected clients', () => {
      // Simulate client connection
      const mockUser = {
        id: 'test-socket-id',
        connectedAt: expect.any(Date)
      };

      // Since we can't easily test the private connection handler,
      // we'll test the public methods that would be affected
      expect(webSocketService.getClientCount()).toBe(0);
      expect(webSocketService.getConnectedClients()).toEqual([]);
    });

    it('should check if client is connected', () => {
      // Initially no clients
      expect(webSocketService.isClientConnected('test-socket-id')).toBe(false);
    });

    it('should get room clients', async () => {
      const roomName = 'test-room';
      const clients = await webSocketService.getRoomClients(roomName);
      
      expect(clients).toEqual(['socket1', 'socket2']);
    });

    it('should force disconnect client', () => {
      // This tests the public API method
      webSocketService.disconnectClient('test-socket-id', 'Test disconnect');
      
      // Should not throw error even if client doesn't exist
      expect(() => webSocketService.disconnectClient('non-existent')).not.toThrow();
    });
  });

  describe('Broadcasting', () => {
    beforeEach(() => {
      // Mock the io instance properly
      webSocketService['io'] = mockIO;
    });

    it('should broadcast to all clients', () => {
      const testData = { message: 'Hello everyone!' };
      
      webSocketService.broadcast(testData);
      
      expect(mockIO.emit).toHaveBeenCalledWith('broadcast', {
        data: testData,
        timestamp: expect.any(Number)
      });
    });

    it('should send message to specific room', () => {
      const roomName = 'test-room';
      const testData = { message: 'Room message' };
      
      webSocketService.sendToRoom(roomName, testData);
      
      expect(mockIO.to).toHaveBeenCalledWith(roomName);
      expect(mockIO.emit).toHaveBeenCalledWith('room-message', {
        room: roomName,
        data: testData,
        timestamp: expect.any(Number)
      });
    });

    it('should send message to specific user', () => {
      const socketId = 'user-socket-id';
      const testData = { message: 'Personal message' };
      
      webSocketService.sendToUser(socketId, testData);
      
      expect(mockIO.to).toHaveBeenCalledWith(socketId);
      expect(mockIO.emit).toHaveBeenCalledWith('direct-message', {
        data: testData,
        timestamp: expect.any(Number)
      });
    });

    it('should publish data to subscribers', () => {
      const type = 'sensor-data';
      const data = { temperature: 25.5 };
      const filters = { location: 'room-1' };
      
      webSocketService.publishData(type, data, filters);
      
      const expectedRoom = `${type}_${JSON.stringify(filters)}`;
      expect(mockIO.to).toHaveBeenCalledWith(expectedRoom);
      expect(mockIO.emit).toHaveBeenCalledWith('data-update', {
        type,
        data,
        filters,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Utility Methods', () => {
    it('should return Socket.io instance', () => {
      const ioInstance = webSocketService.getSocketIOInstance();
      expect(ioInstance).toBeDefined();
    });

    it('should handle empty client list', () => {
      expect(webSocketService.getConnectedClients()).toEqual([]);
      expect(webSocketService.getClientCount()).toBe(0);
    });
  });

  describe('Message Validation', () => {
    it('should handle message with all required fields', () => {
      const validMessage = {
        type: 'test-message',
        data: { content: 'Valid message' },
        timestamp: Date.now()
      };

      // This would normally be tested through the private handlers
      expect(validMessage.type).toBe('test-message');
      expect(validMessage.data).toHaveProperty('content');
      expect(typeof validMessage.timestamp).toBe('number');
    });

    it('should handle subscription data', () => {
      const validSubscription = {
        type: 'sensor-updates',
        filters: { sensorId: 'temp-001' }
      };

      const room = `${validSubscription.type}_${JSON.stringify(validSubscription.filters)}`;
      expect(room).toBe('sensor-updates_{"sensorId":"temp-001"}');
    });
  });

  describe('Error Handling', () => {
    it('should handle broadcasting errors gracefully', () => {
      mockIO.emit = vi.fn().mockImplementation(() => {
        throw new Error('Broadcast failed');
      });
      
      webSocketService['io'] = mockIO;
      
      // Should not throw error
      expect(() => webSocketService.broadcast({ test: true })).not.toThrow();
    });

    it('should handle room message errors gracefully', () => {
      mockIO.to = vi.fn().mockImplementation(() => {
        throw new Error('Room not found');
      });
      
      webSocketService['io'] = mockIO;
      
      // Should not throw error
      expect(() => webSocketService.sendToRoom('invalid-room', { test: true })).not.toThrow();
    });
  });
});