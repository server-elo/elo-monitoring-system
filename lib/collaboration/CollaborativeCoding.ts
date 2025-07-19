/**
 * Collaborative Coding Platform
 * Real-time collaborative coding with shared security analysis and gas optimization insights
 */

import { Server as SocketIOServer } from 'socket.io';
import { SecurityScanner } from '@/lib/security/SecurityScanner';
import { GasOptimizationAnalyzer } from '@/lib/gas/GasOptimizationAnalyzer';

export interface CollaborationSession {
  id: string;
  name: string;
  createdBy: string;
  participants: Participant[];
  code: string;
  language: 'solidity';
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
  sharedAnalysis: SharedAnalysis;
}

export interface Participant {
  userId: string;
  username: string;
  role: 'owner' | 'collaborator' | 'viewer';
  cursor: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  isActive: boolean;
  joinedAt: Date;
}

export interface SharedAnalysis {
  security: any;
  gasOptimization: any;
  lastUpdated: Date;
  triggeredBy: string;
}

export class CollaborativeCoding {
  private io: SocketIOServer;
  private sessions: Map<string, CollaborationSession> = new Map();
  private securityScanner: SecurityScanner;
  private gasAnalyzer: GasOptimizationAnalyzer;

  constructor(
    io: SocketIOServer,
    securityScanner: SecurityScanner,
    gasAnalyzer: GasOptimizationAnalyzer
  ) {
    this.io = io;
    this.securityScanner = securityScanner;
    this.gasAnalyzer = gasAnalyzer;
    this.setupSocketHandlers();
  }

  async createSession(
    userId: string,
    username: string,
    sessionName: string
  ): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${Date.now()}`,
      name: sessionName,
      createdBy: userId,
      participants: [{
        userId,
        username,
        role: 'owner',
        cursor: { line: 1, column: 1 },
        isActive: true,
        joinedAt: new Date()
      }],
      code: '// Start coding together!\npragma solidity ^0.8.20;\n\ncontract MyContract {\n    \n}',
      language: 'solidity',
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
      sharedAnalysis: {
        security: null,
        gasOptimization: null,
        lastUpdated: new Date(),
        triggeredBy: userId
      }
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async joinSession(sessionId: string, userId: string, username: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const participant: Participant = {
      userId,
      username,
      role: 'collaborator',
      cursor: { line: 1, column: 1 },
      isActive: true,
      joinedAt: new Date()
    };

    session.participants.push(participant);
    session.lastActivity = new Date();

    // Notify all participants
    this.io.to(sessionId).emit('participant-joined', participant);
  }

  async updateCode(sessionId: string, userId: string, newCode: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.code = newCode;
    session.lastActivity = new Date();

    // Broadcast code change to all participants except sender
    this.io.to(sessionId).except(userId).emit('code-updated', {
      code: newCode,
      updatedBy: userId,
      timestamp: new Date()
    });

    // Trigger shared analysis after debounce
    this.scheduleSharedAnalysis(sessionId, userId);
  }

  private async performSharedAnalysis(sessionId: string, triggeredBy: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Run security and gas analysis
      const [securityResult, gasResult] = await Promise.all([
        this.securityScanner.performAnalysis(),
        this.gasAnalyzer.analyzeGasUsage(triggeredBy)
      ]);

      session.sharedAnalysis = {
        security: securityResult,
        gasOptimization: gasResult,
        lastUpdated: new Date(),
        triggeredBy
      };

      // Broadcast analysis results to all participants
      this.io.to(sessionId).emit('analysis-updated', session.sharedAnalysis);
    } catch (error) {
      console.error('Shared analysis failed:', error);
    }
  }

  private scheduleSharedAnalysis(sessionId: string, userId: string): void {
    // Debounce analysis to avoid excessive API calls
    setTimeout(() => {
      this.performSharedAnalysis(sessionId, userId);
    }, 2000);
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      socket.on('join-session', async (data) => {
        await this.joinSession(data.sessionId, data.userId, data.username);
        socket.join(data.sessionId);
      });

      socket.on('code-change', async (data) => {
        await this.updateCode(data.sessionId, data.userId, data.code);
      });

      socket.on('cursor-move', (data) => {
        socket.to(data.sessionId).emit('cursor-updated', {
          userId: data.userId,
          cursor: data.cursor
        });
      });
    });
  }
}

export function createCollaborativeCoding(
  io: SocketIOServer,
  securityScanner: SecurityScanner,
  gasAnalyzer: GasOptimizationAnalyzer
): CollaborativeCoding {
  return new CollaborativeCoding(io, securityScanner, gasAnalyzer);
}
