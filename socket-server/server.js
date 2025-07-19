const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

// Configure CORS for Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for free tier (use Redis in production)
const collaborationSessions = new Map();
const userSessions = new Map();
const chatMessages = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  
  if (!userId) {
    return next(new Error('Authentication error: User ID required'));
  }
  
  // Store user info in socket
  socket.userId = userId;
  socket.userName = socket.handshake.auth.userName || `User ${userId.slice(0, 8)}`;
  
  next();
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userName} connected: ${socket.id}`);
  
  // Store user session
  userSessions.set(socket.userId, {
    socketId: socket.id,
    userName: socket.userName,
    connectedAt: new Date(),
    currentSession: null
  });

  // Handle collaboration session creation
  socket.on('create-session', (data, callback) => {
    try {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        title: data.title || 'Untitled Session',
        language: data.language || 'solidity',
        createdBy: socket.userId,
        createdAt: new Date(),
        participants: [{
          id: socket.userId,
          name: socket.userName,
          role: 'host',
          joinedAt: new Date()
        }],
        code: data.initialCode || '// Welcome to collaborative coding!\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    \n}',
        isActive: true,
        maxParticipants: data.maxParticipants || 4
      };
      
      collaborationSessions.set(sessionId, session);
      chatMessages.set(sessionId, []);
      
      // Join the session room
      socket.join(sessionId);
      
      // Update user session
      const userSession = userSessions.get(socket.userId);
      if (userSession) {
        userSession.currentSession = sessionId;
      }
      
      // Broadcast new session to all users
      socket.broadcast.emit('session-created', {
        id: sessionId,
        title: session.title,
        language: session.language,
        participantCount: 1,
        maxParticipants: session.maxParticipants
      });
      
      callback({ success: true, sessionId, session });
    } catch (error) {
      console.error('Error creating session:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle joining a session
  socket.on('join-session', (data, callback) => {
    try {
      const { sessionId } = data;
      const session = collaborationSessions.get(sessionId);
      
      if (!session) {
        return callback({ success: false, error: 'Session not found' });
      }
      
      if (!session.isActive) {
        return callback({ success: false, error: 'Session is not active' });
      }
      
      if (session.participants.length >= session.maxParticipants) {
        return callback({ success: false, error: 'Session is full' });
      }
      
      // Check if user is already in session
      const existingParticipant = session.participants.find(p => p.id === socket.userId);
      if (!existingParticipant) {
        // Add user to session
        session.participants.push({
          id: socket.userId,
          name: socket.userName,
          role: 'participant',
          joinedAt: new Date()
        });
      }
      
      // Join the session room
      socket.join(sessionId);
      
      // Update user session
      const userSession = userSessions.get(socket.userId);
      if (userSession) {
        userSession.currentSession = sessionId;
      }
      
      // Notify other participants
      socket.to(sessionId).emit('participant-joined', {
        participant: {
          id: socket.userId,
          name: socket.userName,
          joinedAt: new Date()
        }
      });
      
      callback({ success: true, session });
    } catch (error) {
      console.error('Error joining session:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle leaving a session
  socket.on('leave-session', (data) => {
    try {
      const { sessionId } = data;
      const session = collaborationSessions.get(sessionId);
      
      if (session) {
        // Remove user from participants
        session.participants = session.participants.filter(p => p.id !== socket.userId);
        
        // Leave the room
        socket.leave(sessionId);
        
        // Update user session
        const userSession = userSessions.get(socket.userId);
        if (userSession) {
          userSession.currentSession = null;
        }
        
        // Notify other participants
        socket.to(sessionId).emit('participant-left', { userId: socket.userId });
        
        // If no participants left, mark session as inactive
        if (session.participants.length === 0) {
          session.isActive = false;
        }
      }
      
      socket.emit('session-left');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  });

  // Handle code updates
  socket.on('update-code', (data) => {
    try {
      const { sessionId, code } = data;
      const session = collaborationSessions.get(sessionId);
      
      if (session && session.participants.some(p => p.id === socket.userId)) {
        session.code = code;
        session.lastUpdated = new Date();
        session.lastUpdatedBy = socket.userId;
        
        // Broadcast to other participants
        socket.to(sessionId).emit('code-updated', {
          code,
          userId: socket.userId,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating code:', error);
    }
  });

  // Handle cursor updates
  socket.on('update-cursor', (data) => {
    try {
      const { sessionId, cursor } = data;
      const session = collaborationSessions.get(sessionId);
      
      if (session && session.participants.some(p => p.id === socket.userId)) {
        // Broadcast cursor position to other participants
        socket.to(sessionId).emit('cursor-updated', {
          userId: socket.userId,
          userName: socket.userName,
          cursor,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating cursor:', error);
    }
  });

  // Handle chat messages
  socket.on('send-chat-message', (data) => {
    try {
      const { sessionId, message } = data;
      const session = collaborationSessions.get(sessionId);
      
      if (session && session.participants.some(p => p.id === socket.userId)) {
        const chatMessage = {
          id: uuidv4(),
          userId: socket.userId,
          userName: socket.userName,
          message,
          timestamp: new Date(),
          type: 'text'
        };
        
        // Store message
        const messages = chatMessages.get(sessionId) || [];
        messages.push(chatMessage);
        chatMessages.set(sessionId, messages);
        
        // Broadcast to all participants including sender
        io.to(sessionId).emit('chat-message', chatMessage);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  });

  // Handle getting available sessions
  socket.on('get-available-sessions', () => {
    try {
      const availableSessions = Array.from(collaborationSessions.values())
        .filter(session => session.isActive && session.participants.length < session.maxParticipants)
        .map(session => ({
          id: session.id,
          title: session.title,
          language: session.language,
          participantCount: session.participants.length,
          maxParticipants: session.maxParticipants,
          createdAt: session.createdAt
        }));
      
      socket.emit('available-sessions', availableSessions);
    } catch (error) {
      console.error('Error getting available sessions:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userName} disconnected: ${socket.id}`);
    
    try {
      const userSession = userSessions.get(socket.userId);
      if (userSession && userSession.currentSession) {
        const sessionId = userSession.currentSession;
        const session = collaborationSessions.get(sessionId);
        
        if (session) {
          // Remove user from participants
          session.participants = session.participants.filter(p => p.id !== socket.userId);
          
          // Notify other participants
          socket.to(sessionId).emit('participant-left', { userId: socket.userId });
          
          // If no participants left, mark session as inactive
          if (session.participants.length === 0) {
            session.isActive = false;
          }
        }
      }
      
      // Remove user session
      userSessions.delete(socket.userId);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.io server running on port ${PORT}`);
  console.log(`📡 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
});
