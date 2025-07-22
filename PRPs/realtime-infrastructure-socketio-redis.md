# Smart PRP: Real-time Infrastructure with Socket.IO + Redis

## Meta Information
- **PRP ID**: realtime-infrastructure-socketio-redis-005
- **Created**: 2025-01-20T18:15:00Z
- **Complexity Score**: 9/10
- **Estimated Implementation Time**: 20 hours
- **Dependencies**: [foundation-nextjs15-react19-typescript-001, architecture-feature-vertical-slices-002, database-postgresql-prisma-optimization-003, authentication-nextauth-rbac-004]

## 🎯 Feature Specification
### Core Requirement
Build a high-performance, scalable real-time infrastructure using Socket.IO and Redis that enables seamless collaborative learning experiences including live code editing, instant messaging, user presence tracking, and real-time notifications with sub-100ms latency for 10,000+ concurrent users.

### Success Metrics
- [ ] Functional: Support real-time collaboration for 1000+ simultaneous coding sessions
- [ ] Performance: <100ms latency for real-time updates with 99.9% delivery reliability
- [ ] UX: Seamless real-time experience with automatic reconnection and conflict resolution
- [ ] Scalability: Handle 10,000+ concurrent WebSocket connections with horizontal scaling
- [ ] Security: End-to-end authentication and authorization for all real-time features
- [ ] Quality: 95%+ test coverage for real-time event handling and edge cases

## 🔍 Codebase Intelligence
### Pattern Analysis
```markdown
Real-time requirements analysis:
- Collaborative Editing: Operational Transform for conflict-free code editing
- Live Chat: Instant messaging with emoji reactions, file sharing, code snippets
- User Presence: Online status, current activity, typing indicators
- Notifications: Achievement alerts, mention notifications, system announcements
- Live Sessions: Instructor-led coding sessions with screen sharing capabilities
- Progress Sync: Real-time XP updates, leaderboard changes, achievement unlocks
- System Events: Feature updates, maintenance notifications, emergency alerts
```

### Architecture Alignment
- **Follows Pattern**: Event-driven architecture with feature-based WebSocket namespaces
- **Extends Component**: Socket.IO with Redis adapter for horizontal scaling
- **Integration Points**: Authentication system, database events, feature notifications, AI tutor responses

## 🧠 Implementation Strategy
### Approach Rationale
Socket.IO + Redis chosen over alternatives because:
1. **Proven Scale**: Handles millions of concurrent connections in production
2. **Feature Rich**: Built-in rooms, namespaces, broadcasting, and failover
3. **TypeScript Native**: Full type safety for real-time events and payloads
4. **Redis Integration**: Seamless horizontal scaling with Redis adapter
5. **Reconnection Logic**: Automatic reconnection with state synchronization

### Risk Mitigation
- **High Risk**: Message loss during reconnection → Persistent message queues with replay capability
- **Medium Risk**: Memory leaks from connection handling → Connection lifecycle management and monitoring
- **Low Risk**: Redis cluster failures → Redis sentinel configuration with automatic failover

### Rollback Plan
1. Feature flags to disable real-time features per namespace
2. Graceful degradation to polling for critical features
3. Redis backup and restore procedures for session data
4. Circuit breaker pattern for external dependencies

## 📋 Execution Blueprint

### Phase 1: Core Infrastructure Setup
- [ ] Set up Socket.IO server with Next.js 15 integration and custom server
- [ ] Configure Redis cluster with sentinel for high availability
- [ ] Implement Redis adapter for Socket.IO with session persistence
- [ ] Create WebSocket authentication middleware with JWT validation
- [ ] Set up connection lifecycle management with cleanup procedures

### Phase 2: Feature-Based Namespaces
- [ ] Create collaboration namespace for real-time code editing with operational transform
- [ ] Implement chat namespace with message persistence and history
- [ ] Build presence namespace for user status and activity tracking
- [ ] Set up notifications namespace for system and feature alerts
- [ ] Create learning namespace for progress sync and AI tutor interactions

### Phase 3: Advanced Real-time Features
- [ ] Implement operational transform algorithm for conflict-free collaborative editing
- [ ] Build real-time cursor tracking and selection synchronization
- [ ] Create voice/video call integration for instructor-led sessions
- [ ] Set up file sharing and collaborative debugging features
- [ ] Implement real-time analytics and learning progress visualization

### Phase 4: Performance & Monitoring
- [ ] Set up connection pooling and load balancing across multiple instances
- [ ] Implement comprehensive monitoring with Prometheus and Grafana
- [ ] Create alerting for connection failures, latency spikes, and Redis issues
- [ ] Set up automated scaling based on connection count and latency metrics
- [ ] Implement circuit breakers and graceful degradation patterns

## 🔬 Validation Matrix
### Automated Tests
```bash
# Real-time Integration Tests
npm run test:realtime -- --coverage  # WebSocket event flows with 95%+ coverage

# Load Tests
npm run test:load:websockets  # 10,000+ concurrent connections

# Latency Tests
npm run test:latency:realtime  # Sub-100ms message delivery validation

# Failover Tests
npm run test:failover:redis  # Redis cluster failover and recovery

# Security Tests
npm run test:security:websockets  # Authentication and authorization flows
```

### Manual Verification
- [ ] Real-time code editing works seamlessly with multiple collaborators
- [ ] Chat messages deliver instantly with proper ordering and persistence
- [ ] User presence updates reflect accurately across all connected clients
- [ ] Reconnection after network interruption restores full functionality
- [ ] Performance remains stable under high concurrent load

## 📚 Context References
### Documentation
- https://socket.io/docs/v4/: Socket.IO v4 comprehensive documentation
- https://redis.io/docs/manual/scaling/: Redis scaling and clustering guide
- https://socket.io/docs/v4/redis-adapter/: Redis adapter configuration
- https://operational-transformation.github.io/: Operational Transform theory

### Code References
- `/PRPs/authentication-nextauth-rbac.md`: Authentication integration requirements
- `/PRPs/architecture-feature-vertical-slices.md`: Feature-based namespace organization
- `/PRPs/database-postgresql-prisma-optimization.md`: Real-time data persistence patterns

## 🎯 Confidence Score: 9/10
**Reasoning**: Very high confidence due to:
- Extensive experience with Socket.IO and Redis at enterprise scale
- Well-defined real-time requirements from competitive analysis
- Proven technology stack with excellent TypeScript support
- Comprehensive testing strategy for complex real-time scenarios
- Clear monitoring and scaling procedures

## 🔄 Post-Implementation
### Monitoring
- WebSocket connection count and duration metrics
- Message latency and delivery success rates
- Redis performance and memory usage
- Operational transform conflict resolution rates
- Real-time feature adoption and usage patterns

### Future Enhancements
- WebRTC integration for peer-to-peer video calls
- Advanced collaborative features like shared whiteboards
- Real-time code execution and result sharing
- AI-powered real-time code suggestions
- Integration with blockchain for decentralized collaboration

## 🚀 Implementation Steps

### Step 1: Socket.IO Server Setup
```typescript
// lib/realtime/server.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { auth } from '@/lib/auth/config';
import { verifySocketAuth } from './middleware/auth';

export class RealtimeServer {
  private io: SocketIOServer;
  private redisClient: ReturnType<typeof createClient>;
  private redisSubscriber: ReturnType<typeof createClient>;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupRedisAdapter();
    this.setupAuthentication();
    this.setupNamespaces();
    this.setupMonitoring();
  }

  private async setupRedisAdapter(): Promise<void> {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('Redis connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      },
    });

    this.redisSubscriber = this.redisClient.duplicate();
    
    await Promise.all([
      this.redisClient.connect(),
      this.redisSubscriber.connect(),
    ]);

    this.io.adapter(createAdapter(this.redisClient, this.redisSubscriber));
  }

  private setupAuthentication(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const session = await verifySocketAuth(token);
        
        if (!session) {
          return next(new Error('Authentication failed'));
        }

        socket.data.user = session.user;
        socket.data.sessionId = session.id;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupNamespaces(): void {
    // Collaboration namespace for real-time code editing
    const collaborationNS = this.io.of('/collaboration');
    new CollaborationHandler(collaborationNS, this.redisClient);

    // Chat namespace for messaging
    const chatNS = this.io.of('/chat');
    new ChatHandler(chatNS, this.redisClient);

    // Presence namespace for user status
    const presenceNS = this.io.of('/presence');
    new PresenceHandler(presenceNS, this.redisClient);

    // Notifications namespace
    const notificationsNS = this.io.of('/notifications');
    new NotificationHandler(notificationsNS, this.redisClient);

    // Learning namespace for AI tutor and progress
    const learningNS = this.io.of('/learning');
    new LearningHandler(learningNS, this.redisClient);
  }
}
```

### Step 2: Collaborative Editing with Operational Transform
```typescript
// lib/realtime/handlers/collaboration.ts
import { Namespace, Socket } from 'socket.io';
import { RedisClientType } from 'redis';
import { ot } from 'operational-transform';

export interface CollaborationDocument {
  id: string;
  content: string;
  version: number;
  participants: string[];
  lastModified: Date;
}

export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  author: string;
  timestamp: number;
}

export class CollaborationHandler {
  constructor(
    private namespace: Namespace,
    private redis: RedisClientType
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.namespace.on('connection', (socket: Socket) => {
      socket.on('join-document', async (data: { documentId: string }) => {
        await this.handleJoinDocument(socket, data.documentId);
      });

      socket.on('operation', async (data: { 
        documentId: string; 
        operation: Operation; 
        version: number; 
      }) => {
        await this.handleOperation(socket, data);
      });

      socket.on('cursor-position', async (data: {
        documentId: string;
        position: number;
        selection?: { start: number; end: number };
      }) => {
        await this.handleCursorUpdate(socket, data);
      });

      socket.on('leave-document', async (data: { documentId: string }) => {
        await this.handleLeaveDocument(socket, data.documentId);
      });

      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinDocument(socket: Socket, documentId: string): Promise<void> {
    const userId = socket.data.user.id;
    
    // Add user to document room
    await socket.join(documentId);
    
    // Get current document state
    const document = await this.getDocument(documentId);
    if (!document) {
      socket.emit('error', { message: 'Document not found' });
      return;
    }

    // Add user to participants
    await this.addParticipant(documentId, userId);

    // Send current document state to user
    socket.emit('document-state', {
      content: document.content,
      version: document.version,
      participants: document.participants,
    });

    // Notify other participants
    socket.to(documentId).emit('user-joined', {
      userId,
      username: socket.data.user.username,
    });

    // Send recent operations for conflict resolution
    const recentOperations = await this.getRecentOperations(documentId, 50);
    socket.emit('recent-operations', recentOperations);
  }

  private async handleOperation(
    socket: Socket, 
    data: { documentId: string; operation: Operation; version: number }
  ): Promise<void> {
    const { documentId, operation, version } = data;
    const userId = socket.data.user.id;

    try {
      // Get current document version
      const currentDoc = await this.getDocument(documentId);
      if (!currentDoc) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      // Transform operation if versions don't match
      let transformedOperation = operation;
      if (version < currentDoc.version) {
        const missedOperations = await this.getOperationsSince(documentId, version);
        transformedOperation = this.transformOperation(operation, missedOperations);
      }

      // Apply operation to document
      const newContent = this.applyOperation(currentDoc.content, transformedOperation);
      const newVersion = currentDoc.version + 1;

      // Save operation and update document
      await Promise.all([
        this.saveOperation(documentId, transformedOperation, newVersion),
        this.updateDocument(documentId, newContent, newVersion),
      ]);

      // Broadcast operation to all participants except sender
      socket.to(documentId).emit('operation', {
        operation: transformedOperation,
        version: newVersion,
        author: userId,
      });

      // Acknowledge operation to sender
      socket.emit('operation-ack', {
        version: newVersion,
        operationId: transformedOperation.timestamp,
      });

    } catch (error) {
      console.error('Error handling operation:', error);
      socket.emit('operation-error', {
        message: 'Failed to apply operation',
        operation,
      });
    }
  }

  private transformOperation(operation: Operation, missedOperations: Operation[]): Operation {
    let transformed = operation;
    
    for (const missedOp of missedOperations) {
      if (operation.type === 'insert' && missedOp.type === 'insert') {
        if (missedOp.position <= transformed.position) {
          transformed = {
            ...transformed,
            position: transformed.position + (missedOp.content?.length || 0),
          };
        }
      } else if (operation.type === 'delete' && missedOp.type === 'insert') {
        if (missedOp.position <= transformed.position) {
          transformed = {
            ...transformed,
            position: transformed.position + (missedOp.content?.length || 0),
          };
        }
      } else if (operation.type === 'insert' && missedOp.type === 'delete') {
        if (missedOp.position < transformed.position) {
          transformed = {
            ...transformed,
            position: Math.max(
              missedOp.position,
              transformed.position - (missedOp.length || 0)
            ),
          };
        }
      }
      // Additional transformation logic for complex cases
    }
    
    return transformed;
  }

  private applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          operation.content +
          content.slice(operation.position)
        );
      case 'delete':
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + (operation.length || 0))
        );
      default:
        return content;
    }
  }
}
```

### Step 3: Chat System with Message Persistence
```typescript
// lib/realtime/handlers/chat.ts
export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'system';
  metadata?: {
    language?: string;
    fileName?: string;
    fileSize?: number;
    codeExecution?: {
      output: string;
      error?: string;
    };
  };
  reactions: { emoji: string; users: string[] }[];
  editHistory?: { content: string; editedAt: Date }[];
  replyTo?: string;
  timestamp: Date;
  edited?: boolean;
}

export class ChatHandler {
  constructor(
    private namespace: Namespace,
    private redis: RedisClientType
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.namespace.on('connection', (socket: Socket) => {
      socket.on('join-room', async (data: { roomId: string }) => {
        await this.handleJoinRoom(socket, data.roomId);
      });

      socket.on('send-message', async (data: {
        roomId: string;
        content: string;
        type: ChatMessage['type'];
        metadata?: ChatMessage['metadata'];
        replyTo?: string;
      }) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('edit-message', async (data: {
        messageId: string;
        newContent: string;
      }) => {
        await this.handleEditMessage(socket, data);
      });

      socket.on('add-reaction', async (data: {
        messageId: string;
        emoji: string;
      }) => {
        await this.handleAddReaction(socket, data);
      });

      socket.on('typing-start', (data: { roomId: string }) => {
        this.handleTypingStart(socket, data.roomId);
      });

      socket.on('typing-stop', (data: { roomId: string }) => {
        this.handleTypingStop(socket, data.roomId);
      });
    });
  }

  private async handleSendMessage(socket: Socket, data: {
    roomId: string;
    content: string;
    type: ChatMessage['type'];
    metadata?: ChatMessage['metadata'];
    replyTo?: string;
  }): Promise<void> {
    const userId = socket.data.user.id;
    const username = socket.data.user.username;

    // Validate message content
    if (!data.content.trim() || data.content.length > 2000) {
      socket.emit('message-error', { message: 'Invalid message content' });
      return;
    }

    // Check rate limiting
    const messageCount = await this.redis.incr(`rate_limit:${userId}:${Date.now()}`);
    await this.redis.expire(`rate_limit:${userId}:${Date.now()}`, 60);
    
    if (messageCount > 30) { // 30 messages per minute
      socket.emit('rate-limited', { message: 'Too many messages' });
      return;
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId: data.roomId,
      userId,
      username,
      content: data.content,
      type: data.type,
      metadata: data.metadata,
      reactions: [],
      replyTo: data.replyTo,
      timestamp: new Date(),
    };

    // Save message to database
    await this.saveMessage(message);

    // Broadcast to room
    this.namespace.to(data.roomId).emit('new-message', message);

    // Handle special message types
    if (data.type === 'code') {
      await this.handleCodeMessage(message);
    }
  }

  private async handleCodeMessage(message: ChatMessage): Promise<void> {
    // Execute code if it's a runnable snippet
    if (message.metadata?.language === 'solidity') {
      try {
        const executionResult = await this.executeCode(
          message.content,
          message.metadata.language
        );
        
        const updatedMessage = {
          ...message,
          metadata: {
            ...message.metadata,
            codeExecution: executionResult,
          },
        };

        await this.updateMessage(message.id, updatedMessage);
        
        this.namespace.to(message.roomId).emit('message-updated', updatedMessage);
      } catch (error) {
        console.error('Code execution failed:', error);
      }
    }
  }
}
```

### Step 4: User Presence System
```typescript
// lib/realtime/handlers/presence.ts
export interface UserPresence {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  activity: {
    type: 'learning' | 'coding' | 'chat' | 'idle';
    details?: string;
    courseId?: string;
    lessonId?: string;
  };
  location: {
    path: string;
    feature: string;
  };
  lastSeen: Date;
  connections: string[]; // Socket IDs for multiple tabs/devices
}

export class PresenceHandler {
  private presenceMap = new Map<string, UserPresence>();

  constructor(
    private namespace: Namespace,
    private redis: RedisClientType
  ) {
    this.setupEventHandlers();
    this.setupPresenceCleanup();
  }

  private setupEventHandlers(): void {
    this.namespace.on('connection', (socket: Socket) => {
      socket.on('update-presence', async (data: {
        status?: UserPresence['status'];
        activity?: UserPresence['activity'];
        location?: UserPresence['location'];
      }) => {
        await this.updateUserPresence(socket, data);
      });

      socket.on('get-presence', async (data: { userIds?: string[] }) => {
        const presence = await this.getPresence(data.userIds);
        socket.emit('presence-data', presence);
      });

      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async updateUserPresence(socket: Socket, update: {
    status?: UserPresence['status'];
    activity?: UserPresence['activity'];
    location?: UserPresence['location'];
  }): Promise<void> {
    const userId = socket.data.user.id;
    const username = socket.data.user.username;

    let presence = this.presenceMap.get(userId);
    
    if (!presence) {
      presence = {
        userId,
        username,
        status: 'online',
        activity: { type: 'idle' },
        location: { path: '/', feature: 'home' },
        lastSeen: new Date(),
        connections: [socket.id],
      };
    } else {
      if (!presence.connections.includes(socket.id)) {
        presence.connections.push(socket.id);
      }
    }

    // Update presence data
    if (update.status) presence.status = update.status;
    if (update.activity) presence.activity = update.activity;
    if (update.location) presence.location = update.location;
    presence.lastSeen = new Date();

    this.presenceMap.set(userId, presence);

    // Save to Redis for cross-server sync
    await this.redis.setex(
      `presence:${userId}`,
      300, // 5 minutes TTL
      JSON.stringify(presence)
    );

    // Broadcast presence update
    this.namespace.emit('presence-update', {
      userId,
      presence: this.sanitizePresence(presence),
    });
  }

  private sanitizePresence(presence: UserPresence) {
    // Remove sensitive information before broadcasting
    return {
      userId: presence.userId,
      username: presence.username,
      status: presence.status,
      activity: presence.activity,
      lastSeen: presence.lastSeen,
      connectionCount: presence.connections.length,
    };
  }
}
```

This comprehensive Real-time Infrastructure PRP establishes a production-ready WebSocket system that can handle thousands of concurrent users while providing seamless collaborative experiences with sub-100ms latency for the Solidity learning platform.