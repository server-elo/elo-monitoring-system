import { OperationalTransform, TextOperation } from '@/lib/collaboration/OperationalTransform';
import { CollaborationClient } from '@/lib/collaboration/CollaborationClient';
import { ConnectionManager } from '@/lib/collaboration/ConnectionManager';

// Mock WebSocket for performance testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {}

  send(data: string) {
    // Simulate network latency
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }));
      }
    }, Math.random() * 10); // 0-10ms latency
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }
}

global.WebSocket = MockWebSocket as any;

describe('Collaboration Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OperationalTransform Performance', () => {
    test('should handle large text operations efficiently', () => {
      const largeText = 'A'.repeat(10000); // 10KB text
      const operation: TextOperation = {
        ops: [
          { type: 'retain', length: 5000 },
          { type: 'insert', text: 'B'.repeat(1000) },
          { type: 'retain', length: 5000 }
        ],
        baseLength: 10000,
        targetLength: 11000
      };

      const startTime = performance.now();
      const result = OperationalTransform.apply(largeText, operation);
      const endTime = performance.now();

      expect(result.length).toBe(11000);
      expect(endTime - startTime).toBeLessThan(50); // Should complete in under 50ms
    });

    test('should transform many concurrent operations efficiently', () => {
      const operations: TextOperation[] = [];
      
      // Generate 100 concurrent insert operations
      for (let i = 0; i < 100; i++) {
        operations.push({
          ops: [{ type: 'insert', text: `${i}` }],
          baseLength: 0,
          targetLength: 1
        });
      }

      const startTime = performance.now();
      
      // Transform all operations against each other
      let transformedOps = operations;
      for (let i = 0; i < operations.length - 1; i++) {
        for (let j = i + 1; j < operations.length; j++) {
          const [op1, op2] = OperationalTransform.transform(
            transformedOps[i], 
            transformedOps[j], 
            'left'
          );
          transformedOps[i] = op1;
          transformedOps[j] = op2;
        }
      }

      const endTime = performance.now();
      
      expect(transformedOps).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    test('should compose many sequential operations efficiently', () => {
      let composedOp: TextOperation = {
        ops: [],
        baseLength: 0,
        targetLength: 0
      };

      const startTime = performance.now();

      // Compose 1000 sequential operations
      for (let i = 0; i < 1000; i++) {
        const newOp: TextOperation = {
          ops: [
            { type: 'retain', length: composedOp.targetLength },
            { type: 'insert', text: `${i}` }
          ],
          baseLength: composedOp.targetLength,
          targetLength: composedOp.targetLength + 1
        };

        if (composedOp.ops.length === 0) {
          composedOp = newOp;
        } else {
          composedOp = OperationalTransform.compose(composedOp, newOp);
        }
      }

      const endTime = performance.now();

      expect(composedOp.targetLength).toBe(1000);
      expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
    });

    test('should handle rapid text changes efficiently', () => {
      let text = 'Initial text';
      const operations: TextOperation[] = [];

      // Generate 500 rapid text changes
      for (let i = 0; i < 500; i++) {
        const operation = OperationalTransform.fromTextChange(
          text,
          text + ` change${i}`
        );
        operations.push(operation);
        text = text + ` change${i}`;
      }

      const startTime = performance.now();

      // Apply all operations
      let currentText = 'Initial text';
      for (const op of operations) {
        currentText = OperationalTransform.apply(currentText, op);
      }

      const endTime = performance.now();

      expect(currentText).toContain('change499');
      expect(endTime - startTime).toBeLessThan(200); // Should complete in under 200ms
    });
  });

  describe('CollaborationClient Performance', () => {
    test('should handle high-frequency operations', async () => {
      const client = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const operations: TextOperation[] = [];
      const startTime = performance.now();

      // Send 100 operations rapidly
      for (let i = 0; i < 100; i++) {
        const operation: TextOperation = {
          ops: [{ type: 'insert', text: `${i}` }],
          baseLength: i,
          targetLength: i + 1,
          meta: {
            userId: 'user1',
            timestamp: Date.now()
          }
        };

        client.sendOperation(operation);
        operations.push(operation);
      }

      const endTime = performance.now();

      expect(operations).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should queue operations quickly
      expect(client.getPendingOperationsCount()).toBe(100);
    });

    test('should handle many concurrent users', () => {
      const clients: CollaborationClient[] = [];
      const userCount = 50;

      const startTime = performance.now();

      // Create 50 concurrent clients
      for (let i = 0; i < userCount; i++) {
        const client = new CollaborationClient(
          'ws://localhost:8080',
          `user${i}`,
          'session1'
        );
        clients.push(client);
      }

      // Each client sends a cursor update
      clients.forEach((client, index) => {
        client.sendCursorUpdate({
          position: { line: index, column: index },
          userName: `User ${index}`,
          color: `#${index.toString(16).padStart(6, '0')}`
        });
      });

      const endTime = performance.now();

      expect(clients).toHaveLength(userCount);
      expect(endTime - startTime).toBeLessThan(200); // Should handle many users efficiently
    });

    test('should maintain performance under message load', () => {
      const client = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const messageCount = 1000;
      const startTime = performance.now();

      // Send many chat messages
      for (let i = 0; i < messageCount; i++) {
        client.sendChatMessage(`Message ${i}`, 'text');
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(300); // Should handle message load efficiently
    });
  });

  describe('ConnectionManager Performance', () => {
    test('should handle offline queue efficiently', async () => {
      const mockClient = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const connectionManager = new ConnectionManager(mockClient);
      const operationCount = 500;

      const startTime = performance.now();

      // Queue many operations while offline
      for (let i = 0; i < operationCount; i++) {
        const operation: TextOperation = {
          ops: [{ type: 'insert', text: `${i}` }],
          baseLength: i,
          targetLength: i + 1
        };

        connectionManager.queueOperation(operation);
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // Should queue operations efficiently
    });

    test('should recover from connection loss quickly', async () => {
      const mockClient = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const connectionManager = new ConnectionManager(mockClient);

      const startTime = performance.now();

      // Simulate connection recovery
      await connectionManager.reconnect();

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should reconnect quickly
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory with many operations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const operation: TextOperation = {
          ops: [{ type: 'insert', text: `Operation ${i}` }],
          baseLength: 0,
          targetLength: `Operation ${i}`.length
        };

        OperationalTransform.apply('', operation);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should clean up client resources properly', () => {
      const clients: CollaborationClient[] = [];

      // Create many clients
      for (let i = 0; i < 100; i++) {
        const client = new CollaborationClient(
          'ws://localhost:8080',
          `user${i}`,
          'session1'
        );
        clients.push(client);
      }

      // Disconnect all clients
      clients.forEach(client => client.disconnect());

      // All clients should be properly cleaned up
      expect(clients.every(client => !client.isConnected())).toBe(true);
    });
  });

  describe('Latency Simulation Tests', () => {
    test('should handle high latency gracefully', async () => {
      // Mock high latency WebSocket
      class HighLatencyWebSocket extends MockWebSocket {
        send(data: string) {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(new MessageEvent('message', { data }));
            }
          }, 500); // 500ms latency
        }
      }

      global.WebSocket = HighLatencyWebSocket as any;

      const client = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const startTime = performance.now();

      // Send operation with high latency
      const operation: TextOperation = {
        ops: [{ type: 'insert', text: 'test' }],
        baseLength: 0,
        targetLength: 4
      };

      client.sendOperation(operation);

      // Should not block the main thread
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // Should return immediately
    });

    test('should batch operations under high load', () => {
      const client = new CollaborationClient(
        'ws://localhost:8080',
        'user1',
        'session1'
      );

      const operationCount = 100;
      const startTime = performance.now();

      // Send many operations rapidly
      for (let i = 0; i < operationCount; i++) {
        const operation: TextOperation = {
          ops: [{ type: 'insert', text: `${i}` }],
          baseLength: i,
          targetLength: i + 1
        };

        client.sendOperation(operation);
      }

      const endTime = performance.now();

      // Should handle batching efficiently
      expect(endTime - startTime).toBeLessThan(100);
      expect(client.getPendingOperationsCount()).toBe(operationCount);
    });
  });
});
