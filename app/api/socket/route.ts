import { NextRequest, NextResponse } from 'next/server';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { logger } from '@/lib/monitoring/simple-logger';

// Configure for dynamic API routes
export const dynamic = 'force-dynamic';

let io: ServerIO | null = null;

export async function GET(_request: NextRequest) {
  if (!io) {
    logger.info('Initializing Socket.io server...');
    
    // Create HTTP server for Socket.io
    const httpServer = new NetServer();
    
    io = new ServerIO(httpServer, {
      path: '/api/socket',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://ezekaj.github.io'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Set up Socket.io event handlers
    io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      socket.on('join_room', (room: string) => {
        socket.join(room);
        socket.to(room).emit('user_joined', { userId: socket.id });
      });

      socket.on('leave_room', (room: string) => {
        socket.leave(room);
        socket.to(room).emit('user_left', { userId: socket.id });
      });

      socket.on('code_change', (data: { room: string; code: string; changes: any }) => {
        socket.to(data.room).emit('code_updated', {
          code: data.code,
          changes: data.changes,
          userId: socket.id,
        });
      });

      socket.on('cursor_update', (data: { room: string; line: number; column: number }) => {
        socket.to(data.room).emit('cursor_updated', {
          userId: socket.id,
          line: data.line,
          column: data.column,
        });
      });

      socket.on('chat_message', (data: { room: string; message: string; user: any }) => {
        io?.to(data.room).emit('message_received', {
          id: Date.now().toString(),
          content: data.message,
          user: data.user,
          timestamp: new Date(),
        });
      });

      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
      });
    });

    // Start the server on a different port for Socket.io
    const port = process.env.SOCKET_PORT || 3001;
    httpServer.listen(port, () => {
      logger.info(`Socket.io server running on port ${port}`);
    });
  }

  return NextResponse.json({ 
    message: 'Socket.io server initialized',
    status: 'running',
    port: process.env.SOCKET_PORT || 3001
  });
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    if (!io) {
      return NextResponse.json({ error: 'Socket.io server not initialized' }, { status: 500 });
    }

    switch (action) {
      case 'broadcast':
        io.emit(data.event, data.payload);
        break;
      
      case 'room_broadcast':
        io.to(data.room).emit(data.event, data.payload);
        break;
      
      case 'get_room_info':
        const room = io.sockets.adapter.rooms.get(data.room);
        return NextResponse.json({
          participants: room ? Array.from(room) : [],
          count: room ? room.size : 0,
        });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Socket.io API error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
