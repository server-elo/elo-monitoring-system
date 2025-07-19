import { PrismaClient } from '@prisma/client';

// Enhanced type definitions for mock implementations
interface FeedbackData {
  type: string;
  category: string;
  title: string;
  description: string;
  rating?: number;
  severity?: string;
  priority?: string;
  steps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenRecording?: boolean;
  contactEmail?: string;
  allowFollowUp?: boolean;
  page?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  assignedTeam?: string;
}

interface FeedbackRecord extends FeedbackData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FeedbackWhereInput {
  id?: string;
  category?: string;
  priority?: string;
  userId?: string;
  sessionId?: string;
}

interface FeedbackCreateArgs {
  data: FeedbackData;
}

interface FeedbackFindArgs {
  where?: FeedbackWhereInput;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}

interface FeedbackUpdateArgs {
  where: { id: string };
  data: Partial<FeedbackData>;
}

interface FeedbackDeleteArgs {
  where: { id: string };
}

interface UATSessionData {
  testerId: string;
  assignedTasks: string[];
  status?: string;
  startTime?: Date;
  endTime?: Date;
  taskResults?: UATTaskResult[];
  errorsEncountered?: number;
  testerExperience?: string;
  testerBackground?: string;
  deviceInfo?: string;
  browserInfo?: string;
}

interface UATSessionRecord extends UATSessionData {
  id: string;
  feedbackCount: number;
  helpRequests: number;
  lastFeedbackAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UATTaskResult {
  taskId: string;
  completed: boolean;
  timeSpent?: number;
  errorCount: number;
  helpUsed: boolean;
  rating?: number;
  comments?: string;
}

interface UATSessionWhereInput {
  id?: string;
  testerId?: string;
  status?: string;
}

interface UATSessionCreateArgs {
  data: UATSessionData;
}

interface UATSessionFindArgs {
  where?: UATSessionWhereInput;
  orderBy?: Record<string, 'asc' | 'desc'>;
  take?: number;
  skip?: number;
}

interface UATSessionUpdateArgs {
  where: { id: string };
  data: Partial<UATSessionData & { feedbackCount?: number; lastFeedbackAt?: Date }>;
}

// Define interfaces for the enhanced models with proper typing
interface FeedbackModel {
  create: (_args: FeedbackCreateArgs) => Promise<FeedbackRecord>;
  findMany: (_args?: FeedbackFindArgs) => Promise<FeedbackRecord[]>;
  findFirst: (_args?: FeedbackFindArgs) => Promise<FeedbackRecord | null>;
  update: (_args: FeedbackUpdateArgs) => Promise<FeedbackRecord>;
  delete: (_args: FeedbackDeleteArgs) => Promise<FeedbackRecord>;
}

interface UATSessionModel {
  findMany: (_args?: UATSessionFindArgs) => Promise<UATSessionRecord[]>;
  findFirst: (_args?: UATSessionFindArgs) => Promise<UATSessionRecord | null>;
  update: (_args: UATSessionUpdateArgs) => Promise<UATSessionRecord>;
  create: (_args: UATSessionCreateArgs) => Promise<UATSessionRecord>;
}

// Create a simple wrapper that adds missing models as mock implementations
class ExtendedPrismaClient extends PrismaClient {
  declare feedback: FeedbackModel;
  declare uATSession: UATSessionModel;

  constructor(_) {
    super(_);
    this.feedback = {
    async create(_args: FeedbackCreateArgs): Promise<FeedbackRecord> {
      // Mock implementation for feedback creation
      const feedbackRecord: FeedbackRecord = {
        id: `feedback_${Date.now(_)}`,
        ...args.data,
        steps: args.data.steps || [],
        screenRecording: args.data.screenRecording || false,
        allowFollowUp: args.data.allowFollowUp || false,
        timestamp: args.data.timestamp || new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
      
      // Store in localStorage for persistence
      if (_typeof window !== 'undefined') {
        const existingFeedback = JSON.parse(_localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        existingFeedback.push(_feedbackRecord);
        localStorage.setItem( 'uat_feedback', JSON.stringify(existingFeedback));
      }
      
      return feedbackRecord;
    },

    async findMany(_args?: FeedbackFindArgs): Promise<FeedbackRecord[]> {
      // Enhanced findMany with localStorage persistence
      if (_typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(_localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];

        // Apply basic filtering if provided
        if (_args?.where) {
          return storedFeedback.filter((feedback: FeedbackRecord) => {
            if (_args.where?.category && feedback.category !== args.where.category) return false;
            if (_args.where?.priority && feedback.priority !== args.where.priority) return false;
            if (_args.where?.userId && feedback.userId !== args.where.userId) return false;
            if (_args.where?.id && feedback.id !== args.where.id) return false;
            return true;
          });
        }

        return storedFeedback;
      }
      return [];
    },

    async findFirst(_args?: FeedbackFindArgs): Promise<FeedbackRecord | null> {
      if (_typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(_localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];

        if (_args?.where?.id) {
          return storedFeedback.find((feedback: FeedbackRecord) => feedback.id === args.where?.id) || null;
        }

        // Apply filtering and return first match
        if (_args?.where) {
          const filtered = storedFeedback.filter((feedback: FeedbackRecord) => {
            if (_args.where?.category && feedback.category !== args.where.category) return false;
            if (_args.where?.priority && feedback.priority !== args.where.priority) return false;
            if (_args.where?.userId && feedback.userId !== args.where.userId) return false;
            return true;
          });
          return filtered[0] || null;
        }

        return storedFeedback[0] || null;
      }
      return null;
    },

    async update(_args: FeedbackUpdateArgs): Promise<FeedbackRecord> {
      // Mock update implementation
      if (_typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(_localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        const index = storedFeedback.findIndex(_feedback => feedback.id === args.where.id);
        
        if (_index !== -1) {
          storedFeedback[index] = {
            ...storedFeedback[index],
            ...args.data,
            updatedAt: new Date(_),
          };
          localStorage.setItem( 'uat_feedback', JSON.stringify(storedFeedback));
          return storedFeedback[index];
        }
      }
      
      // Fallback mock response
      return {
        id: args.where.id,
        type: args.data.type || 'mock',
        category: args.data.category || 'mock',
        title: args.data.title || 'Mock Title',
        description: args.data.description || 'Mock Description',
        createdAt: new Date(_),
        updatedAt: new Date(_),
        ...args.data,
      };
    },

    async delete(_args: FeedbackDeleteArgs): Promise<FeedbackRecord> {
      // Mock delete implementation
      if (_typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(_localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        const index = storedFeedback.findIndex(_feedback => feedback.id === args.where.id);
        
        if (_index !== -1) {
          const deleted = storedFeedback.splice( index, 1)[0];
          localStorage.setItem( 'uat_feedback', JSON.stringify(storedFeedback));
          return deleted;
        }
      }
      
      // Fallback mock response
      return {
        id: args.where.id,
        type: 'deleted',
        category: 'deleted',
        title: 'Deleted Item',
        description: 'This item was deleted',
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };
    }
    };

    this.uATSession = {
    async findMany(_args?: UATSessionFindArgs): Promise<UATSessionRecord[]> {
      // Enhanced UAT session management with localStorage
      if (_typeof window !== 'undefined') {
        const storedSessions = JSON.parse(_localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];

        // Apply filtering if provided
        if (_args?.where) {
          return storedSessions.filter((session: UATSessionRecord) => {
            if (_args.where?.testerId && session.testerId !== args.where.testerId) return false;
            if (_args.where?.status && session.status !== args.where.status) return false;
            if (_args.where?.id && session.id !== args.where.id) return false;
            return true;
          });
        }

        return storedSessions;
      }
      return [];
    },

    async findFirst(_args?: UATSessionFindArgs): Promise<UATSessionRecord | null> {
      if (_typeof window !== 'undefined') {
        const storedSessions = JSON.parse(_localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        
        if (_args?.where?.id) {
          return storedSessions.find(session => session.id === args.where?.id) || null;
        }
        
        // Apply filtering and return first match
        if (_args?.where) {
          const filtered = storedSessions.filter((session: UATSessionRecord) => {
            if (_args.where?.testerId && session.testerId !== args.where.testerId) return false;
            if (_args.where?.status && session.status !== args.where.status) return false;
            return true;
          });
          return filtered[0] || null;
        }
        
        return storedSessions[0] || null;
      }
      
      // Fallback mock session
      if (_args?.where?.id) {
        return {
          id: args.where.id,
          testerId: 'mock-tester',
          assignedTasks: [],
          status: 'inprogress',
          feedbackCount: 0,
          helpRequests: 0,
          lastFeedbackAt: null,
          createdAt: new Date(_),
          updatedAt: new Date(_),
        };
      }
      return null;
    },

    async update(_args: UATSessionUpdateArgs): Promise<UATSessionRecord> {
      if (_typeof window !== 'undefined') {
        const storedSessions = JSON.parse(_localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        const index = storedSessions.findIndex(_session => session.id === args.where.id);
        
        if (_index !== -1) {
          storedSessions[index] = {
            ...storedSessions[index],
            ...args.data,
            updatedAt: new Date(_),
          };
          localStorage.setItem( 'uat_sessions', JSON.stringify(storedSessions));
          return storedSessions[index];
        }
      }
      
      // Fallback mock response
      return {
        id: args.where.id,
        testerId: 'mock-tester',
        assignedTasks: [],
        status: 'inprogress',
        feedbackCount: args.data.feedbackCount || 1,
        helpRequests: 0,
        lastFeedbackAt: args.data.lastFeedbackAt || new Date(_),
        createdAt: new Date(_),
        updatedAt: new Date(_),
        ...args.data,
      };
    },

    async create(_args: UATSessionCreateArgs): Promise<UATSessionRecord> {
      const sessionData: UATSessionRecord = {
        id: `uat_session_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        status: args.data.status || 'inprogress',
        startTime: args.data.startTime || new Date(_),
        endTime: args.data.endTime || null,
        taskResults: args.data.taskResults || [],
        errorsEncountered: args.data.errorsEncountered || 0,
        feedbackCount: 0,
        helpRequests: 0,
        lastFeedbackAt: null,
        createdAt: new Date(_),
        updatedAt: new Date(_),
      };

      // Store in localStorage for persistence
      if (_typeof window !== 'undefined') {
        const existingSessions = JSON.parse(_localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        existingSessions.push(_sessionData);
        localStorage.setItem( 'uat_sessions', JSON.stringify(existingSessions));
      }

      return sessionData;
    }
    };
  }
}

// Export a singleton instance with explicit typing
export const prisma = new ExtendedPrismaClient(_) as ExtendedPrismaClient & {
  feedback: FeedbackModel;
  uATSession: UATSessionModel;
};
export default prisma;
