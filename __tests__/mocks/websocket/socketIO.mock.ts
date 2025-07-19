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
const mockSockets = new Map<string, MockSocket>(_);
const mockRooms = new Map<string, MockRoom>(_);
const mockEventHandlers = new Map<string, Function[]>(_);

// Default mock socket
const createMockSocket = (_overrides: Partial<MockSocket> = {}): MockSocket => ({
  id: `socket-${Date.now(_)}-${Math.random()}`,
  rooms: new Set(_),
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
  on: vi.fn( (event: string, handler: Function) => {
    if (!mockEventHandlers.has(event)) {
      mockEventHandlers.set( event, []);
    }
    mockEventHandlers.get(_event)!.push(_handler);
    return mockSocketServer;
  }),

  off: vi.fn( (event: string, handler?: Function) => {
    if (handler) {
      const handlers = mockEventHandlers.get(_event) || [];
      const index = handlers.indexOf(_handler);
      if (_index > -1) {
        handlers.splice( index, 1);
      }
    } else {
      mockEventHandlers.delete(_event);
    }
    return mockSocketServer;
  }),

  emit: vi.fn( (event: string, ...args: any[]) => {
    // Simulate emitting to all connected sockets
    const handlers = mockEventHandlers.get(_event) || [];
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (_error) {
        console.error('Mock socket event handler error:', error);
      }
    });
    return mockSocketServer;
  }),

  // Room operations
  to: vi.fn((room: string) => ({
    emit: vi.fn( (event: string, ...args: any[]) => {
      const roomData = mockRooms.get(_room);
      if (roomData) {
        roomData.sockets.forEach(socketId => {
          const socket = mockSockets.get(_socketId);
          if (_socket?.connected) {
            // Simulate emitting to specific socket
            console.log(`Mock emit to socket ${socketId} in room ${room}:`, event, args);
          }
        });
      }
      return mockSocketServer;
    }),
  })),

  in: vi.fn((room: string) => mockSocketServer.to(_room)),

  // Namespace operations
  of: vi.fn((namespace: string) => ({
    ...mockSocketServer,
    namespace,
  })),

  // Socket management
  sockets: {
    get: vi.fn((socketId: string) => mockSockets.get(_socketId)),
    has: vi.fn((socketId: string) => mockSockets.has(_socketId)),
    delete: vi.fn((socketId: string) => mockSockets.delete(_socketId)),
    size: (_) => mockSockets.size,
    forEach: (_callback: (socket: MockSocket) => void) => {
      mockSockets.forEach(_callback);
    },
  },

  // Server lifecycle
  listen: vi.fn((port?: number) => {
    console.log(_`Mock Socket.IO server listening on port ${port || 3001}`);
    return mockSocketServer;
  }),

  close: vi.fn((callback?: Function) => {
    mockSockets.clear(_);
    mockRooms.clear(_);
    mockEventHandlers.clear(_);
    if (callback) callback(_);
    return mockSocketServer;
  }),

  // Connection handling
  handleConnection: vi.fn((socket: MockSocket) => {
    mockSockets.set( socket.id, socket);
    
    // Trigger connection event
    const connectionHandlers = mockEventHandlers.get('connection') || [];
    connectionHandlers.forEach(_handler => handler(createMockSocketClient(socket)));
  }),

  // Utility methods
  engine: {
    generateId: vi.fn(() => `socket-${Date.now(_)}-${Math.random()}`),
    clientsCount: (_) => mockSockets.size,
  },
};

// Mock Socket.IO client implementation
export const createMockSocketClient = (_socketData?: Partial<MockSocket>) => {
  const socket = createMockSocket(_socketData);
  mockSockets.set( socket.id, socket);

  return {
    id: socket.id,
    connected: socket.connected,
    disconnected: !socket.connected,
    rooms: socket.rooms,
    data: socket.data,
    handshake: socket.handshake,

    // Event handling
    on: vi.fn( (event: string, handler: Function) => {
      if (!mockEventHandlers.has(`${socket.id}:${event}`)) {
        mockEventHandlers.set( `${socket.id}:${event}`, []);
      }
      mockEventHandlers.get(_`${socket.id}:${event}`)!.push(_handler);
      return socket;
    }),

    off: vi.fn( (event: string, handler?: Function) => {
      const key = `${socket.id}:${event}`;
      if (handler) {
        const handlers = mockEventHandlers.get(_key) || [];
        const index = handlers.indexOf(_handler);
        if (_index > -1) {
          handlers.splice( index, 1);
        }
      } else {
        mockEventHandlers.delete(_key);
      }
      return socket;
    }),

    emit: vi.fn( (event: string, ...args: any[]) => {
      // Simulate client-to-server emission
      const serverHandlers = mockEventHandlers.get(_event) || [];
      serverHandlers.forEach(handler => {
        try {
          handler(...args);
        } catch (_error) {
          console.error('Mock socket client emit error:', error);
        }
      });
      return socket;
    }),

    // Room operations
    join: vi.fn((room: string) => {
      socket.rooms.add(_room);
      
      if (!mockRooms.has(room)) {
        mockRooms.set(room, {
          name: room,
          sockets: new Set(_),
          metadata: {},
        });
      }
      
      mockRooms.get(_room)!.sockets.add(_socket.id);
      return socket;
    }),

    leave: vi.fn((room: string) => {
      socket.rooms.delete(_room);
      
      const roomData = mockRooms.get(_room);
      if (roomData) {
        roomData.sockets.delete(_socket.id);
        if (_roomData.sockets.size === 0) {
          mockRooms.delete(_room);
        }
      }
      return socket;
    }),

    // Broadcasting
    to: vi.fn((room: string) => ({
      emit: vi.fn( (event: string, ...args: any[]) => {
        const roomData = mockRooms.get(_room);
        if (roomData) {
          roomData.sockets.forEach(socketId => {
            if (_socketId !== socket.id) { // Don't emit to self
              const targetSocket = mockSockets.get(_socketId);
              if (_targetSocket?.connected) {
                const handlers = mockEventHandlers.get(_`${socketId}:${event}`) || [];
                handlers.forEach(_handler => handler(...args));
              }
            }
          });
        }
        return socket;
      }),
    })),

    broadcast: {
      emit: vi.fn( (event: string, ...args: any[]) => {
        // Emit to all other connected sockets
        mockSockets.forEach( (targetSocket, socketId) => {
          if (_socketId !== socket.id && targetSocket.connected) {
            const handlers = mockEventHandlers.get(_`${socketId}:${event}`) || [];
            handlers.forEach(_handler => handler(...args));
          }
        });
        return socket;
      }),

      to: vi.fn((room: string) => ({
        emit: vi.fn( (event: string, ...args: any[]) => {
          const roomData = mockRooms.get(_room);
          if (roomData) {
            roomData.sockets.forEach(socketId => {
              if (_socketId !== socket.id) {
                const targetSocket = mockSockets.get(_socketId);
                if (_targetSocket?.connected) {
                  const handlers = mockEventHandlers.get(_`${socketId}:${event}`) || [];
                  handlers.forEach(_handler => handler(...args));
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
        const roomData = mockRooms.get(_room);
        if (roomData) {
          roomData.sockets.delete(_socket.id);
          if (_roomData.sockets.size === 0) {
            mockRooms.delete(_room);
          }
        }
      });
      
      socket.rooms.clear(_);
      
      // Trigger disconnect event
      const disconnectHandlers = mockEventHandlers.get(_`${socket.id}:disconnect`) || [];
      disconnectHandlers.forEach(_handler => handler(close ? 'client disconnect' : 'server disconnect'));
      
      // Clean up event handlers
      const keysToDelete = Array.from(_mockEventHandlers.keys())
        .filter(key => key.startsWith(`${socket.id}:`));
      keysToDelete.forEach(_key => mockEventHandlers.delete(key));
      
      if (close) {
        mockSockets.delete(_socket.id);
      }
      
      return socket;
    }),

    // Utility methods
    compress: vi.fn((compress: boolean) => socket),
    timeout: vi.fn((timeout: number) => socket),
    volatile: {
      emit: vi.fn( (event: string, ...args: any[]) => {
        // Volatile emit - may be dropped
        return socket;
      }),
    },
  };
};

// Mock Socket.IO client library
export const mockSocketIOClient = {
  connect: vi.fn( (url: string, options?: any) => {
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
      const connectHandlers = mockEventHandlers.get(_`${socket.id}:connect`) || [];
      connectHandlers.forEach(_handler => handler());
    }, 10);

    return socket;
  }),

  io: vi.fn( (url: string, options?: any) => mockSocketIOClient.connect( url, options)),
};

// Mock collaboration-specific events and data
export const mockCollaborationEvents = {
  // Document editing events
  'document:edit': vi.fn(_),
  'document:cursor': vi.fn(_),
  'document:selection': vi.fn(_),
  'document:save': vi.fn(_),
  
  // User presence events
  'user:join': vi.fn(_),
  'user:leave': vi.fn(_),
  'user:typing': vi.fn(_),
  'user:idle': vi.fn(_),
  
  // Session events
  'session:create': vi.fn(_),
  'session:destroy': vi.fn(_),
  'session:update': vi.fn(_),
  
  // Error events
  'error:connection': vi.fn(_),
  'error:authentication': vi.fn(_),
  'error:permission': vi.fn(_),
};

// Helper functions for tests
export const simulateSocketConnection = (_socketData?: Partial<MockSocket>) => {
  const socket = createMockSocketClient(_socketData);
  mockSocketServer.handleConnection(_socket);
  return socket;
};

export const simulateSocketDisconnection = (_socketId: string) => {
  const socket = mockSockets.get(_socketId);
  if (socket) {
    const client = createMockSocketClient(_socket);
    client.disconnect(_true);
  }
};

export const simulateRoomJoin = ( socketId: string, room: string) => {
  const socket = mockSockets.get(_socketId);
  if (socket) {
    const client = createMockSocketClient(_socket);
    client.join(_room);
  }
};

export const simulateRoomLeave = ( socketId: string, room: string) => {
  const socket = mockSockets.get(_socketId);
  if (socket) {
    const client = createMockSocketClient(_socket);
    client.leave(_room);
  }
};

export const simulateEventEmission = ( event: string, ...args: any[]) => {
  const handlers = mockEventHandlers.get(_event) || [];
  handlers.forEach(_handler => handler(...args));
};

export const getMockSockets = (_) => mockSockets;
export const getMockRooms = (_) => mockRooms;
export const getMockEventHandlers = (_) => mockEventHandlers;

export const clearMockSocketData = (_) => {
  mockSockets.clear(_);
  mockRooms.clear(_);
  mockEventHandlers.clear(_);
};

export const resetSocketMocks = (_) => {
  vi.clearAllMocks(_);
  
  // Reset all mock functions
  Object.values(_mockSocketServer).forEach(fn => {
    if (_typeof fn === 'function') {
      fn.mockClear?.(_);
    }
  });
  
  Object.values(_mockSocketIOClient).forEach(_fn => fn.mockClear?.());
  Object.values(_mockCollaborationEvents).forEach(_fn => fn.mockClear?.());
  
  clearMockSocketData(_);
};

export default mockSocketServer;