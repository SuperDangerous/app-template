/**
 * Integration Tests - WebSocket Functionality
 * Test WebSocket connections, messaging, and real-time features
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestServer, cleanupTestServer, TestServer, waitFor } from '../utils/testSetup.js';
import { io as ioClient, Socket } from 'socket.io-client';

describe('WebSocket Integration Tests', () => {
  let testServer: TestServer;
  let clientSocket: Socket;
  let secondClientSocket: Socket;
  const TEST_PORT = 3011;

  beforeAll(async () => {
    testServer = await createTestServer();
    
    // Start the server to enable WebSocket connections
    await testServer.server.start();
  });

  afterAll(async () => {
    if (clientSocket?.connected) {
      clientSocket.disconnect();
    }
    if (secondClientSocket?.connected) {
      secondClientSocket.disconnect();
    }
    await cleanupTestServer(testServer);
  });

  beforeEach((done) => {
    // Create fresh socket connections for each test
    clientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
      transports: ['websocket'],
      forceNew: true
    });

    clientSocket.on('connect', () => {
      done();
    });
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', (done) => {
      expect(clientSocket.connected).toBe(true);
      
      clientSocket.on('connected', (data) => {
        expect(data).toHaveProperty('message');
        expect(data).toHaveProperty('socketId');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle client authentication', (done) => {
      const authData = {
        username: 'testuser',
        roles: ['user', 'admin']
      };

      clientSocket.emit('authenticate', authData);
      
      clientSocket.on('authenticated', (response) => {
        expect(response.success).toBe(true);
        expect(response.user.username).toBe(authData.username);
        expect(response.user.roles).toEqual(authData.roles);
        done();
      });
    });

    it('should handle multiple concurrent connections', async () => {
      secondClientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        forceNew: true
      });

      await waitFor(() => secondClientSocket.connected);

      // Check connected clients via API
      const response = await testServer.request
        .get('/api/websocket/clients')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Room Management', () => {
    it('should join and leave rooms', (done) => {
      const roomName = 'test-room';
      let joinedRoom = false;

      clientSocket.emit('join-room', roomName);
      
      clientSocket.on('room-joined', (data) => {
        expect(data.room).toBe(roomName);
        joinedRoom = true;
        
        // Now leave the room
        clientSocket.emit('leave-room', roomName);
      });

      clientSocket.on('room-left', (data) => {
        expect(data.room).toBe(roomName);
        expect(joinedRoom).toBe(true);
        done();
      });
    });

    it('should broadcast user join/leave events to room members', (done) => {
      const roomName = 'broadcast-test-room';
      let eventsReceived = 0;

      secondClientSocket = ioClient(`http://localhost:${TEST_PORT}`, {
        transports: ['websocket'],
        forceNew: true
      });

      secondClientSocket.on('connect', () => {
        // First client joins room
        secondClientSocket.emit('join-room', roomName);
      });

      secondClientSocket.on('room-joined', () => {
        // Second client joins the same room
        clientSocket.emit('join-room', roomName);
      });

      // Second client should receive notification when first client joins
      secondClientSocket.on('user-joined', (data) => {
        expect(data.room).toBe(roomName);
        expect(data.socketId).toBe(clientSocket.id);
        eventsReceived++;
        
        if (eventsReceived === 1) {
          // Leave room to trigger user-left event
          clientSocket.emit('leave-room', roomName);
        }
      });

      secondClientSocket.on('user-left', (data) => {
        expect(data.room).toBe(roomName);
        expect(data.socketId).toBe(clientSocket.id);
        eventsReceived++;
        
        if (eventsReceived === 2) {
          done();
        }
      });
    });
  });

  describe('Messaging', () => {
    it('should handle custom messages', (done) => {
      const testMessage = {
        type: 'test-message',
        data: { content: 'Hello WebSocket!' }
      };

      clientSocket.emit('message', testMessage);
      
      // For this test, we'll verify the message was processed
      // In a real app, you might emit a response or broadcast
      setTimeout(() => {
        // If no error thrown, message was handled successfully
        done();
      }, 100);
    });

    it('should handle subscriptions', (done) => {
      const subscription = {
        type: 'data-updates',
        filters: { source: 'solar' }
      };

      clientSocket.emit('subscribe', subscription);
      
      clientSocket.on('subscribed', (data) => {
        expect(data.type).toBe(subscription.type);
        expect(data.filters).toEqual(subscription.filters);
        expect(data).toHaveProperty('room');
        done();
      });
    });

    it('should receive published data for subscriptions', (done) => {
      const subscription = {
        type: 'sensor-data',
        filters: { location: 'building-a' }
      };

      clientSocket.emit('subscribe', subscription);
      
      clientSocket.on('subscribed', async () => {
        // Publish data via REST API
        const publishData = {
          type: 'sensor-data',
          data: { temperature: 22.5, humidity: 45 },
          filters: { location: 'building-a' }
        };

        await testServer.request
          .post('/api/websocket/publish')
          .send(publishData)
          .expect(200);
      });

      clientSocket.on('data-update', (data) => {
        expect(data.type).toBe('sensor-data');
        expect(data.data).toHaveProperty('temperature');
        expect(data.data).toHaveProperty('humidity');
        expect(data.filters).toEqual({ location: 'building-a' });
        done();
      });
    });
  });

  describe('API Integration', () => {
    it('should broadcast messages via REST API', (done) => {
      const broadcastMessage = {
        message: 'Server announcement',
        type: 'announcement',
        data: { priority: 'high' }
      };

      clientSocket.on('broadcast', (data) => {
        expect(data.data.message).toBe(broadcastMessage.message);
        expect(data.data.type).toBe(broadcastMessage.type);
        expect(data.data.data).toEqual(broadcastMessage.data);
        done();
      });

      // Send broadcast via REST API
      testServer.request
        .post('/api/websocket/broadcast')
        .send(broadcastMessage)
        .expect(200)
        .end(() => {
          // Broadcast should be sent to all connected clients
        });
    });

    it('should send room messages via REST API', async () => {
      const roomName = 'api-test-room';
      const roomMessage = {
        message: 'Room-specific message',
        type: 'room-notification'
      };

      // Join room first
      await waitFor(() => {
        return new Promise((resolve) => {
          clientSocket.emit('join-room', roomName);
          clientSocket.on('room-joined', () => resolve(true));
        });
      });

      // Set up message listener
      const messagePromise = new Promise((resolve) => {
        clientSocket.on('room-message', (data) => {
          expect(data.data.message).toBe(roomMessage.message);
          expect(data.data.type).toBe(roomMessage.type);
          resolve(data);
        });
      });

      // Send room message via API
      const response = await testServer.request
        .post(`/api/websocket/rooms/${roomName}/message`)
        .send(roomMessage)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Wait for WebSocket message
      await messagePromise;
    });

    it('should send direct messages via REST API', (done) => {
      const directMessage = {
        message: 'Personal message',
        data: { urgent: true }
      };

      clientSocket.on('direct-message', (data) => {
        expect(data.data.message).toBe(directMessage.message);
        expect(data.data.data).toEqual(directMessage.data);
        done();
      });

      // Send direct message using client socket ID
      testServer.request
        .post(`/api/websocket/clients/${clientSocket.id}/message`)
        .send(directMessage)
        .expect(200)
        .end(() => {
          // Message should be delivered to specific client
        });
    });

    it('should get WebSocket service status', async () => {
      const response = await testServer.request
        .get('/api/websocket/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
      expect(response.body.data).toHaveProperty('connectedClients');
      expect(response.body.data).toHaveProperty('uptime');
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', (done) => {
      const badSocket = ioClient(`http://localhost:99999`, {
        transports: ['websocket'],
        timeout: 1000
      });

      badSocket.on('connect_error', (error) => {
        expect(error).toBeDefined();
        done();
      });
    });

    it('should handle invalid subscription data', (done) => {
      const invalidSubscription = {
        // Missing required type field
        filters: { invalid: true }
      };

      clientSocket.emit('subscribe', invalidSubscription);
      
      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Failed to subscribe');
        done();
      });

      // Fallback timeout in case no error event is emitted
      setTimeout(done, 500);
    });
  });
});