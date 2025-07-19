/**
 * @fileoverview Real-time Collaboration Testing
 * Tests WebSocket connections, real-time code editing, and collaborative features
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import type { Socket as ClientSocket } from 'socket.io-client';
import type { Socket as ServerSocket } from 'socket.io';

// Mock Socket.IO server setup
let io: SocketIOServer;
let serverSocket: ServerSocket;
let clientSocket: ClientSocket;
let httpServer: any;

describe('Real-time Collaboration', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  beforeEach((done) => {
    httpServer = createServer();
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    httpServer.listen(() => {
      const port = (httpServer.address() as any)?.port;
      clientSocket = Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.disconnect();
    httpServer.close();
  });

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection successfully', () => {
      expect(clientSocket.connected).toBe(true);
      expect(serverSocket).toBeDefined();
    });

    it('should handle connection authentication', (done) => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      serverSocket.on('authenticate', (userData, callback) => {
        expect(userData.token).toBe('valid-jwt-token');
        callback({ success: true, user: mockUser });
        done();
      });

      clientSocket.emit('authenticate', { token: 'valid-jwt-token' });
    });

    it('should reject invalid authentication', (done) => {
      serverSocket.on('authenticate', (userData, callback) => {
        expect(userData.token).toBe('invalid-token');
        callback({ success: false, error: 'Invalid token' });
        done();
      });

      clientSocket.emit('authenticate', { token: 'invalid-token' });
    });

    it('should handle connection disconnect', (done) => {
      serverSocket.on('disconnect', (reason) => {
        expect(reason).toBeDefined();
        done();
      });

      clientSocket.disconnect();
    });

    it('should manage multiple concurrent connections', () => {
      const connections = new Set();
      
      io.on('connection', (socket) => {
        connections.add(socket.id);
        
        socket.on('disconnect', () => {
          connections.delete(socket.id);
        });
      });

      expect(connections.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Real-time Code Editing', () => {
    it('should broadcast code changes to all participants', (done) => {
      const codeChange = {
        sessionId: 'session-123',
        userId: 'user-123',
        operation: 'insert',
        position: { line: 5, column: 10 },
        content: 'console.log("Hello World");',
        timestamp: Date.now()
      };

      let callbackCount = 0;

      // Setup multiple mock clients
      const mockClient2 = Client(`http://localhost:${(httpServer.address() as any)?.port}`);
      
      const checkCompletion = () => {
        callbackCount++;
        if (callbackCount === 2) {
          mockClient2.disconnect();
          done();
        }
      };

      clientSocket.on('code-change', (data) => {
        expect(data).toEqual(codeChange);
        checkCompletion();
      });

      mockClient2.on('connect', () => {
        mockClient2.on('code-change', (data) => {
          expect(data).toEqual(codeChange);
          checkCompletion();
        });

        // Simulate code change from one client
        serverSocket.emit('code-change', codeChange);
      });
    });

    it('should handle cursor position updates', (done) => {
      const cursorUpdate = {
        sessionId: 'session-123',
        userId: 'user-123',
        position: { line: 10, column: 5 },
        selection: { start: { line: 10, column: 5 }, end: { line: 10, column: 15 } }
      };

      clientSocket.on('cursor-update', (data) => {
        expect(data.userId).toBe('user-123');
        expect(data.position.line).toBe(10);
        done();
      });

      serverSocket.emit('cursor-update', cursorUpdate);
    });

    it('should manage operational transformation for concurrent edits', () => {
      const operation1 = {
        type: 'insert',
        position: 10,
        content: 'Hello',
        userId: 'user-1'
      };

      const operation2 = {
        type: 'insert',
        position: 15,
        content: 'World',
        userId: 'user-2'
      };

      // Mock operational transformation logic
      const transformOperations = (op1: typeof operation1, op2: typeof operation2) => {
        if (op1.position <= op2.position) {
          return [op1, { ...op2, position: op2.position + op1.content.length }];
        } else {
          return [{ ...op1, position: op1.position + op2.content.length }, op2];
        }
      };

      const [transformed1, transformed2] = transformOperations(operation1, operation2);

      expect(transformed1.position).toBe(10);
      expect(transformed2.position).toBe(20); // 15 + 5 (length of "Hello")
    });

    it('should handle code execution collaboration', (done) => {
      const executionRequest = {
        sessionId: 'session-123',
        userId: 'user-123',
        code: 'pragma solidity ^0.8.0; contract Test { }',
        language: 'solidity'
      };

      serverSocket.on('execute-code', (data, callback) => {
        expect(data.code).toContain('pragma solidity');
        
        const mockResult = {
          success: true,
          output: 'Compilation successful',
          gasEstimate: 123456,
          warnings: []
        };

        callback(mockResult);
        done();
      });

      clientSocket.emit('execute-code', executionRequest, (result: any) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Session Management', () => {
    it('should create collaborative coding session', (done) => {
      const sessionConfig = {
        courseId: 'course-123',
        lessonId: 'lesson-123',
        initiatorId: 'user-123',
        maxParticipants: 5,
        permissions: {
          canEdit: true,
          canExecute: true,
          canInvite: false
        }
      };

      serverSocket.on('create-session', (config, callback) => {
        expect(config.courseId).toBe('course-123');
        
        const session = {
          id: 'session-456',
          ...config,
          participants: [config.initiatorId],
          createdAt: new Date().toISOString()
        };

        callback({ success: true, session });
        done();
      });

      clientSocket.emit('create-session', sessionConfig);
    });

    it('should handle joining existing session', (done) => {
      const joinRequest = {
        sessionId: 'session-456',
        userId: 'user-456',
        inviteCode: 'abc123'
      };

      serverSocket.on('join-session', (data, callback) => {
        expect(data.sessionId).toBe('session-456');
        
        const response = {
          success: true,
          session: {
            id: 'session-456',
            participants: ['user-123', 'user-456'],
            currentCode: 'pragma solidity ^0.8.0;',
            cursors: {}
          }
        };

        callback(response);
        done();
      });

      clientSocket.emit('join-session', joinRequest);
    });

    it('should handle leaving session', (done) => {
      const leaveRequest = {
        sessionId: 'session-456',
        userId: 'user-456'
      };

      clientSocket.on('participant-left', (data) => {
        expect(data.userId).toBe('user-456');
        expect(data.sessionId).toBe('session-456');
        done();
      });

      serverSocket.emit('participant-left', leaveRequest);
    });

    it('should manage session permissions', () => {
      const permissions = {
        userId: 'user-123',
        sessionId: 'session-456',
        canEdit: true,
        canExecute: false,
        canInvite: true,
        isOwner: false
      };

      const hasPermission = (permission: keyof typeof permissions, userId: string) => {
        return permissions.userId === userId && permissions[permission] === true;
      };

      expect(hasPermission('canEdit', 'user-123')).toBe(true);
      expect(hasPermission('canExecute', 'user-123')).toBe(false);
      expect(hasPermission('canInvite', 'user-123')).toBe(true);
    });
  });

  describe('Real-time Communication', () => {
    it('should handle chat messages in coding session', (done) => {
      const chatMessage = {
        sessionId: 'session-123',
        userId: 'user-123',
        username: 'TestUser',
        message: 'Need help with this function',
        timestamp: Date.now(),
        type: 'text'
      };

      clientSocket.on('chat-message', (data) => {
        expect(data.message).toBe('Need help with this function');
        expect(data.userId).toBe('user-123');
        done();
      });

      serverSocket.emit('chat-message', chatMessage);
    });

    it('should handle voice chat connections', (done) => {
      const voiceRequest = {
        sessionId: 'session-123',
        userId: 'user-123',
        action: 'start-voice',
        mediaConstraints: {
          audio: true,
          video: false
        }
      };

      serverSocket.on('voice-chat', (data, callback) => {
        expect(data.action).toBe('start-voice');
        
        callback({
          success: true,
          peerId: 'peer-123',
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        done();
      });

      clientSocket.emit('voice-chat', voiceRequest);
    });

    it('should broadcast typing indicators', (done) => {
      const typingIndicator = {
        sessionId: 'session-123',
        userId: 'user-123',
        username: 'TestUser',
        isTyping: true
      };

      clientSocket.on('typing-indicator', (data) => {
        expect(data.isTyping).toBe(true);
        expect(data.userId).toBe('user-123');
        done();
      });

      serverSocket.emit('typing-indicator', typingIndicator);
    });
  });

  describe('Screen Sharing and Presentation', () => {
    it('should initiate screen sharing session', (done) => {
      const shareRequest = {
        sessionId: 'session-123',
        userId: 'user-123',
        shareType: 'screen',
        quality: 'high'
      };

      serverSocket.on('start-screen-share', (data, callback) => {
        expect(data.shareType).toBe('screen');
        
        callback({
          success: true,
          streamId: 'stream-123',
          viewers: ['user-456', 'user-789']
        });
        done();
      });

      clientSocket.emit('start-screen-share', shareRequest);
    });

    it('should handle whiteboard collaboration', (done) => {
      const drawingData = {
        sessionId: 'session-123',
        userId: 'user-123',
        tool: 'pen',
        action: 'draw',
        coordinates: [
          { x: 100, y: 150 },
          { x: 120, y: 160 },
          { x: 140, y: 170 }
        ],
        color: '#ff0000',
        strokeWidth: 2
      };

      clientSocket.on('whiteboard-update', (data) => {
        expect(data.tool).toBe('pen');
        expect(data.coordinates).toHaveLength(3);
        done();
      });

      serverSocket.emit('whiteboard-update', drawingData);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle WebSocket disconnection and reconnection', (done) => {
      let disconnectCount = 0;
      let reconnectCount = 0;

      clientSocket.on('disconnect', () => {
        disconnectCount++;
      });

      clientSocket.on('connect', () => {
        if (reconnectCount > 0) {
          expect(disconnectCount).toBe(1);
          expect(reconnectCount).toBe(1);
          done();
        }
        reconnectCount++;
      });

      // Simulate disconnect
      clientSocket.disconnect();
      
      // Simulate reconnect
      setTimeout(() => {
        clientSocket.connect();
      }, 100);
    });

    it('should handle session recovery after disconnect', (done) => {
      const recoveryData = {
        sessionId: 'session-123',
        userId: 'user-123',
        lastKnownPosition: { line: 15, column: 8 },
        timestamp: Date.now() - 5000 // 5 seconds ago
      };

      serverSocket.on('recover-session', (data, callback) => {
        expect(data.sessionId).toBe('session-123');
        
        const recovery = {
          success: true,
          missedEvents: [
            {
              type: 'code-change',
              data: { content: 'new code', position: { line: 10, column: 0 } }
            }
          ],
          currentState: {
            code: 'pragma solidity ^0.8.0;\ncontract Test {\n  new code\n}',
            participants: ['user-123', 'user-456']
          }
        };

        callback(recovery);
        done();
      });

      clientSocket.emit('recover-session', recoveryData);
    });

    it('should handle rate limiting for frequent updates', () => {
      const rateLimiter = {
        maxRequests: 10,
        windowMs: 1000,
        requests: new Map()
      };

      const checkRateLimit = (userId: string) => {
        const now = Date.now();
        const userRequests = rateLimiter.requests.get(userId) || [];
        
        // Remove old requests outside the window
        const validRequests = userRequests.filter(
          (timestamp: number) => now - timestamp < rateLimiter.windowMs
        );
        
        if (validRequests.length >= rateLimiter.maxRequests) {
          return false;
        }
        
        validRequests.push(now);
        rateLimiter.requests.set(userId, validRequests);
        return true;
      };

      // Test rate limiting
      expect(checkRateLimit('user-123')).toBe(true);
      
      // Simulate multiple rapid requests
      for (let i = 0; i < 10; i++) {
        checkRateLimit('user-123');
      }
      
      // Should be rate limited now
      expect(checkRateLimit('user-123')).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large code files efficiently', () => {
      const largeCode = 'a'.repeat(50000); // 50KB of code
      const chunkSize = 1000;
      
      const chunks = [];
      for (let i = 0; i < largeCode.length; i += chunkSize) {
        chunks.push(largeCode.slice(i, i + chunkSize));
      }

      expect(chunks.length).toBe(50);
      expect(chunks[0].length).toBe(chunkSize);
    });

    it('should optimize WebSocket message size', () => {
      const message = {
        type: 'code-change',
        sessionId: 'session-123',
        data: {
          operation: 'insert',
          position: 100,
          content: 'test content'
        }
      };

      const messageSize = JSON.stringify(message).length;
      expect(messageSize).toBeLessThan(1000); // Keep messages under 1KB
    });

    it('should handle concurrent operations efficiently', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: 'insert',
        position: i * 10,
        content: `content-${i}`
      }));

      const processOperations = async (ops: typeof operations) => {
        return Promise.all(ops.map(async (op) => {
          // Simulate async processing
          await new Promise(resolve => setTimeout(resolve, 1));
          return { ...op, processed: true };
        }));
      };

      const startTime = Date.now();
      const results = await processOperations(operations);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});