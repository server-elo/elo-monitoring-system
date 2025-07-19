/**
 * Socket.IO Mock
 * Provides comprehensive mocking for WebSocket operations
 */

import { vi } from 'vitest';

// Mock socket data types
export interface MockSocket {
  id: string;
  userId?: string;
  sessionId?: string;
  rooms: Set<string>;
  connected: boolean;
  handshake: {
    address: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    auth: Record<string, any>;
  };
  data: Record<string, any>;
}

export interface MockRoom {
  name: string;
  sockets: Set<string>;
  metadata: Record<string, any>;
}

// Mock storage for sockets and rooms
const mockSockets = new Map<string, MockSocket>();
const mockRooms = new Map<string, MockRoom>();
const mockEventHandlers = new Map<string, Function[]>();

// Default mock socket
const createMockSocket = (overrides: Partial<MockSocket> = {}): MockSocket => ({
  id: `socket-${Date.now()}-${Math.random()}`,
  rooms: new Set(),
  connected: true,
  handshake: {
    address: '127.0.0.1',
    headers: {
      'user-agent': 'Test Client',
      'accept': '*/*',
    },
    query: {},
    auth: {},
  },
  data: {},
  ...overrides,
});

// Mock Socket.IO server implementation
export const mockSocketServer = {
  // Event handling
  on: vi.fn((event: string, handler: Function) => {
    if (!mockEventHandlers.has(event)) {
      mockEventHandlers.set(event, []);
    }
    mockEventHandlers.get(event)!.push(handler);
    return mockSocketServer;
  }),

  off: vi.fn((event: string, handler?: Function) => {
    if (handler) {
      const handlers = mockEventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      mockEventHandlers.delete(event);
    }
    return mockSocketServer;
  }),

  emit: vi.fn((event: string, ...args: any[]) => {
    // Simulate emitting to all connected sockets
    const handlers = mockEventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        console.error('Mock socket event handler error:', error);
      }
    });
    return mockSocketServer;
  }),

  // Room operations
  to: vi.fn((room: string) => ({
    emit: vi.fn((event: string, ...args: any[]) => {
      const roomData = mockRooms.get(room);
      if (roomData) {
        roomData.sockets.forEach(socketId => {
          const socket = mockSockets.get(socketId);
          if (socket?.connected) {
            // Simulate emitting to specific socket
            console.log(`Mock emit to socket ${socketId} in room ${room}:`, event, args);
          }
        });
      }
      return mockSocketServer;
    }),
  })),

  in: vi.fn((room: string) => mockSocketServer.to(room)),

  // Namespace operations
  of: vi.fn((namespace: string) => ({
    ...mockSocketServer,
    namespace,
  })),

  // Socket management
  sockets: {
    get: vi.fn((socketId: string) => mockSockets.get(socketId)),
    has: vi.fn((socketId: string) => mockSockets.has(socketId)),
    delete: vi.fn((socketId: string) => mockSockets.delete(socketId)),
    size: () => mockSockets.size,
    forEach: (callback: (socket: MockSocket) => void) => {
      mockSockets.forEach(callback);
    },
  },

  // Server lifecycle
  listen: vi.fn((port?: number) => {
    console.log(`Mock Socket.IO server listening on port ${port || 3001}`);
    return mockSocketServer;
  }),

  close: vi.fn((callback?: Function) => {
    mockSockets.clear();
    mockRooms.clear();
    mockEventHandlers.clear();
    if (callback) callback();
    return mockSocketServer;
  }),

  // Connection handling
  handleConnection: vi.fn((socket: MockSocket) => {
    mockSockets.set(socket.id, socket);
    
    // Trigger connection event
    const connectionHandlers = mockEventHandlers.get('connection') || [];
    connectionHandlers.forEach(handler => handler(createMockSocketClient(socket)));
  }),

  // Utility methods
  engine: {
    generateId: vi.fn(() => `socket-${Date.now()}-${Math.random()}`),
    clientsCount: () => mockSockets.size,
  },
};

// Mock Socket.IO client implementation
export const createMockSocketClient = (socketData?: Partial<MockSocket>) => {
  const socket = createMockSocket(socketData);
  mockSockets.set(socket.id, socket);

  return {
    id: socket.id,
    connected: socket.connected,
    disconnected: !socket.connected,
    rooms: socket.rooms,
    data: socket.data,
    handshake: socket.handshake,

    // Event handling
    on: vi.fn((event: string, handler: Function) => {
      if (!mockEventHandlers.has(`${socket.id}:${event}`)) {
        mockEventHandlers.set(`${socket.id}:${event}`, []);
      }
      mockEventHandlers.get(`${socket.id}:${event}`)!.push(handler);
      return socket;
    }),

    off: vi.fn((event: string, handler?: Function) => {
      const key = `${socket.id}:${event}`;
      if (handler) {
        const handlers = mockEventHandlers.get(key) || [];
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      } else {
        mockEventHandlers.delete(key);
      }
      return socket;
    }),

    emit: vi.fn((event: string, ...args: any[]) => {
      // Simulate client-to-server emission
      const serverHandlers = mockEventHandlers.get(event) || [];
      serverHandlers.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error('Mock socket client emit error:', error);
        }
      });
      return socket;
    }),

    // Room operations
    join: vi.fn((room: string) => {
      socket.rooms.add(room);
      
      if (!mockRooms.has(room)) {
        mockRooms.set(room, {
          name: room,
          sockets: new Set(),
          metadata: {},
        });
      }
      
      mockRooms.get(room)!.sockets.add(socket.id);
      return socket;
    }),

    leave: vi.fn((room: string) => {
      socket.rooms.delete(room);
      
      const roomData = mockRooms.get(room);
      if (roomData) {
        roomData.sockets.delete(socket.id);
        if (roomData.sockets.size === 0) {
          mockRooms.delete(room);
        }
      }
      return socket;
    }),

    // Broadcasting
    to: vi.fn((room: string) => ({
      emit: vi.fn((event: string, ...args: any[]) => {
        const roomData = mockRooms.get(room);
        if (roomData) {
          roomData.sockets.forEach(socketId => {
            if (socketId !== socket.id) { // Don't emit to self
              const targetSocket = mockSockets.get(socketId);
              if (targetSocket?.connected) {
                const handlers = mockEventHandlers.get(`${socketId}:${event}`) || [];
                handlers.forEach(handler => handler(...args));
              }
            }
          });
        }
        return socket;
      }),
    })),

    broadcast: {
      emit: vi.fn((event: string, ...args: any[]) => {
        // Emit to all other connected sockets
        mockSockets.forEach((targetSocket, socketId) => {
          if (socketId !== socket.id && targetSocket.connected) {
            const handlers = mockEventHandlers.get(`${socketId}:${event}`) || [];
            handlers.forEach(handler => handler(...args));
          }
        });
        return socket;
      }),

      to: vi.fn((room: string) => ({
        emit: vi.fn((event: string, ...args: any[]) => {
          const roomData = mockRooms.get(room);
          if (roomData) {
            roomData.sockets.forEach(socketId => {
              if (socketId !== socket.id) {
                const targetSocket = mockSockets.get(socketId);
                if (targetSocket?.connected) {
                  const handlers = mockEventHandlers.get(`${socketId}:${event}`) || [];
                  handlers.forEach(handler => handler(...args));
                }
              }
            });
          }
          return socket;
        }),
      })),
    },

    // Connection management
    disconnect: vi.fn((close?: boolean) => {
      socket.connected = false;
      
      // Leave all rooms
      socket.rooms.forEach(room => {
        const roomData = mockRooms.get(room);
        if (roomData) {
          roomData.sockets.delete(socket.id);
          if (roomData.sockets.size === 0) {
            mockRooms.delete(room);
          }
        }
      });
      
      socket.rooms.clear();
      
      // Trigger disconnect event
      const disconnectHandlers = mockEventHandlers.get(`${socket.id}:disconnect`) || [];
      disconnectHandlers.forEach(handler => handler(close ? 'client disconnect' : 'server disconnect'));
      
      // Clean up event handlers
      const keysToDelete = Array.from(mockEventHandlers.keys())
        .filter(key => key.startsWith(`${socket.id}:`));
      keysToDelete.forEach(key => mockEventHandlers.delete(key));
      
      if (close) {
        mockSockets.delete(socket.id);
      }
      
      return socket;
    }),

    // Utility methods
    compress: vi.fn((compress: boolean) => socket),
    timeout: vi.fn((timeout: number) => socket),
    volatile: {
      emit: vi.fn((event: string, ...args: any[]) => {
        // Volatile emit - may be dropped
        return socket;
      }),
    },
  };
};

// Mock Socket.IO client library
export const mockSocketIOClient = {
  connect: vi.fn((url: string, options?: any) => {
    const socket = createMockSocketClient({
      handshake: {
        address: '127.0.0.1',
        headers: options?.headers || {},
        query: options?.query || {},
        auth: options?.auth || {},
      },
      data: options?.data || {},
    });

    // Simulate connection delay
    setTimeout(() => {
      const connectHandlers = mockEventHandlers.get(`${socket.id}:connect`) || [];
      connectHandlers.forEach(handler => handler());
    }, 10);

    return socket;
  }),

  io: vi.fn((url: string, options?: any) => mockSocketIOClient.connect(url, options)),
};

// Mock collaboration-specific events and data
export const mockCollaborationEvents = {
  // Document editing events
  'document:edit': vi.fn(),
  'document:cursor': vi.fn(),
  'document:selection': vi.fn(),
  'document:save': vi.fn(),
  
  // User presence events
  'user:join': vi.fn(),
  'user:leave': vi.fn(),
  'user:typing': vi.fn(),
  'user:idle': vi.fn(),
  
  // Session events
  'session:create': vi.fn(),
  'session:destroy': vi.fn(),
  'session:update': vi.fn(),
  
  // Error events
  'error:connection': vi.fn(),
  'error:authentication': vi.fn(),
  'error:permission': vi.fn(),
};

// Helper functions for tests
export const simulateSocketConnection = (socketData?: Partial<MockSocket>) => {
  const socket = createMockSocketClient(socketData);
  mockSocketServer.handleConnection(socket);
  return socket;
};

export const simulateSocketDisconnection = (socketId: string) => {
  const socket = mockSockets.get(socketId);
  if (socket) {
    const client = createMockSocketClient(socket);
    client.disconnect(true);
  }
};

export const simulateRoomJoin = (socketId: string, room: string) => {
  const socket = mockSockets.get(socketId);
  if (socket) {
    const client = createMockSocketClient(socket);
    client.join(room);
  }
};

export const simulateRoomLeave = (socketId: string, room: string) => {
  const socket = mockSockets.get(socketId);
  if (socket) {
    const client = createMockSocketClient(socket);
    client.leave(room);
  }
};

export const simulateEventEmission = (event: string, ...args: any[]) => {
  const handlers = mockEventHandlers.get(event) || [];
  handlers.forEach(handler => handler(...args));
};

export const getMockSockets = () => mockSockets;
export const getMockRooms = () => mockRooms;
export const getMockEventHandlers = () => mockEventHandlers;

export const clearMockSocketData = () => {
  mockSockets.clear();
  mockRooms.clear();
  mockEventHandlers.clear();
};

export const resetSocketMocks = () => {
  vi.clearAllMocks();
  
  // Reset all mock functions
  Object.values(mockSocketServer).forEach(fn => {
    if (typeof fn === 'function') {
      fn.mockClear?.();
    }
  });
  
  Object.values(mockSocketIOClient).forEach(fn => fn.mockClear?.());
  Object.values(mockCollaborationEvents).forEach(fn => fn.mockClear?.());
  
  clearMockSocketData();
};

export default mockSocketServer;