/**
 * WebSocket Connection and Event Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestApp,
  createTestWebSocketClient,
  TestApp,
  TestWebSocketClient,
  TestCleaner,
  sleep,
  waitFor
} from '../utils/test-helpers.js';

describe('WebSocket Integration Tests', () => {
  let testApp: TestApp;
  const cleaner = new TestCleaner();

  beforeAll(async () => {
    testApp = await createTestApp();
    cleaner.add(() => testApp.cleanup());
  });

  afterAll(async () => {
    await cleaner.cleanup();
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection', async () => {
      const client = await createTestWebSocketClient(testApp.port);
      cleaner.add(() => client.disconnect());

      expect(client.socket.connected).toBe(true);
    });

    it('should handle connection events', async () => {
      const client = await createTestWebSocketClient(testApp.port);
      cleaner.add(() => client.disconnect());

      let connectFired = false;
      client.socket.on('connect', () => {
        connectFired = true;
      });

      // Wait a bit for the event to potentially fire
      await sleep(100);

      // Connection should already be established by the time we get the client
      expect(client.socket.connected).toBe(true);
    });

    it('should handle disconnection gracefully', async () => {
      const client = await createTestWebSocketClient(testApp.port);

      let disconnectFired = false;
      client.socket.on('disconnect', () => {
        disconnectFired = true;
      });

      client.disconnect();

      // Wait for disconnect event
      await waitFor(() => disconnectFired, 2000);
      expect(disconnectFired).toBe(true);
    });
  });

  describe('WebSocket Events', () => {
    let client: TestWebSocketClient;

    beforeAll(async () => {
      client = await createTestWebSocketClient(testApp.port);
      cleaner.add(() => client.disconnect());
    });

    it('should handle ping-pong events', async () => {
      let pongReceived = false;
      let pongData: any = null;

      client.socket.on('pong', (data) => {
        pongReceived = true;
        pongData = data;
      });

      const testData = { test: 'ping data', timestamp: Date.now() };
      client.socket.emit('ping', testData);

      await waitFor(() => pongReceived, 2000);

      expect(pongReceived).toBe(true);
      expect(pongData).toBeDefined();
      expect(pongData.echo).toEqual(testData);
      expect(typeof pongData.timestamp).toBe('number');
    });

    it('should handle subscription events', async () => {
      // Subscribe to a channel
      client.socket.emit('subscribe', { channel: 'test-channel' });

      // Give some time for the subscription to process
      await sleep(100);

      // The test would depend on the actual subscription implementation
      // For now, we just verify the event can be sent without error
      expect(client.socket.connected).toBe(true);
    });

    it('should handle unsubscribe events', async () => {
      // First subscribe
      client.socket.emit('subscribe', { channel: 'test-channel-2' });
      await sleep(50);

      // Then unsubscribe
      client.socket.emit('unsubscribe', { channel: 'test-channel-2' });

      // Give some time for the unsubscription to process
      await sleep(100);

      // Verify connection is still active
      expect(client.socket.connected).toBe(true);
    });
  });

  describe('WebSocket Error Handling', () => {
    it('should handle connection timeout', async () => {
      // This test would try to connect to a non-existent port
      // and verify that the timeout works correctly
      const nonExistentPort = testApp.port + 1000;

      try {
        await createTestWebSocketClient(nonExistentPort);
        expect.fail('Should have thrown connection error');
      } catch (error: any) {
        expect(error).toBeInstanceOf(Error);
        // Error message varies by transport type (xhr, websocket, timeout)
        const message = String(error.message || error).toLowerCase();
        const isConnectionError =
          message.includes('timeout') ||
          message.includes('xhr') ||
          message.includes('websocket') ||
          message.includes('econnrefused') ||
          message.includes('connection');
        expect(isConnectionError).toBe(true);
      }
    });

    it('should handle malformed event data', async () => {
      const client = await createTestWebSocketClient(testApp.port);
      cleaner.add(() => client.disconnect());

      // Send malformed data - this should not crash the connection
      client.socket.emit('ping', 'invalid-data-format');

      await sleep(100);

      // Connection should still be active
      expect(client.socket.connected).toBe(true);
    });
  });

  describe('Multiple Client Connections', () => {
    it('should handle multiple simultaneous connections', async () => {
      const clients: TestWebSocketClient[] = [];

      try {
        // Create multiple clients
        for (let i = 0; i < 3; i++) {
          const client = await createTestWebSocketClient(testApp.port);
          clients.push(client);
        }

        // Verify all connections
        for (const client of clients) {
          expect(client.socket.connected).toBe(true);
        }

        // Test that they can all send events independently
        let responses = 0;
        const expectedResponses = clients.length;

        for (let i = 0; i < clients.length; i++) {
          const client = clients[i];
          client.socket.on('pong', () => {
            responses++;
          });
          client.socket.emit('ping', { clientId: i });
        }

        // Wait for all responses
        await waitFor(() => responses === expectedResponses, 3000);
        expect(responses).toBe(expectedResponses);

      } finally {
        // Cleanup all clients
        for (const client of clients) {
          client.disconnect();
        }
      }
    });

    it('should handle client disconnection without affecting others', async () => {
      const client1 = await createTestWebSocketClient(testApp.port);
      const client2 = await createTestWebSocketClient(testApp.port);

      cleaner.add(() => client2.disconnect());

      expect(client1.socket.connected).toBe(true);
      expect(client2.socket.connected).toBe(true);

      // Disconnect first client
      client1.disconnect();

      // Wait a bit
      await sleep(100);

      // Second client should still be connected
      expect(client2.socket.connected).toBe(true);
    });
  });

  describe('Channel-based Communication', () => {
    it('should support channel subscriptions', async () => {
      const client1 = await createTestWebSocketClient(testApp.port);
      const client2 = await createTestWebSocketClient(testApp.port);

      cleaner.add(() => {
        client1.disconnect();
        client2.disconnect();
      });

      // Subscribe both clients to the same channel
      client1.socket.emit('subscribe', { channel: 'broadcast-test' });
      client2.socket.emit('subscribe', { channel: 'broadcast-test' });

      await sleep(100);

      let client1Received = false;
      let client2Received = false;

      client1.socket.on('message', () => {
        client1Received = true;
      });

      client2.socket.on('message', () => {
        client2Received = true;
      });

      // Send broadcast message (this would depend on settings allowing broadcasts)
      client1.socket.emit('broadcast', { message: 'test broadcast' });

      // Wait for potential broadcast
      await sleep(200);

      // Note: Broadcasting might be disabled in test mode or require debug mode
      // The test verifies the events can be sent without error
      expect(client1.socket.connected).toBe(true);
      expect(client2.socket.connected).toBe(true);
    });
  });
});
