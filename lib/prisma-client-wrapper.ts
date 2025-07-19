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
  create: (args: FeedbackCreateArgs) => Promise<FeedbackRecord>;
  findMany: (args?: FeedbackFindArgs) => Promise<FeedbackRecord[]>;
  findFirst: (args?: FeedbackFindArgs) => Promise<FeedbackRecord | null>;
  update: (args: FeedbackUpdateArgs) => Promise<FeedbackRecord>;
  delete: (args: FeedbackDeleteArgs) => Promise<FeedbackRecord>;
}

interface UATSessionModel {
  findMany: (args?: UATSessionFindArgs) => Promise<UATSessionRecord[]>;
  findFirst: (args?: UATSessionFindArgs) => Promise<UATSessionRecord | null>;
  update: (args: UATSessionUpdateArgs) => Promise<UATSessionRecord>;
  create: (args: UATSessionCreateArgs) => Promise<UATSessionRecord>;
}

// Create a simple wrapper that adds missing models as mock implementations
class ExtendedPrismaClient extends PrismaClient {
  declare feedback: FeedbackModel;
  declare uATSession: UATSessionModel;

  constructor() {
    super();
    this.feedback = {
    async create(args: FeedbackCreateArgs): Promise<FeedbackRecord> {
      // Mock implementation for feedback creation
      const feedbackRecord: FeedbackRecord = {
        id: `feedback_${Date.now()}`,
        ...args.data,
        steps: args.data.steps || [],
        screenRecording: args.data.screenRecording || false,
        allowFollowUp: args.data.allowFollowUp || false,
        timestamp: args.data.timestamp || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        const existingFeedback = JSON.parse(localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        existingFeedback.push(feedbackRecord);
        localStorage.setItem('uat_feedback', JSON.stringify(existingFeedback));
      }
      
      return feedbackRecord;
    },

    async findMany(args?: FeedbackFindArgs): Promise<FeedbackRecord[]> {
      // Enhanced findMany with localStorage persistence
      if (typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];

        // Apply basic filtering if provided
        if (args?.where) {
          return storedFeedback.filter((feedback: FeedbackRecord) => {
            if (args.where?.category && feedback.category !== args.where.category) return false;
            if (args.where?.priority && feedback.priority !== args.where.priority) return false;
            if (args.where?.userId && feedback.userId !== args.where.userId) return false;
            if (args.where?.id && feedback.id !== args.where.id) return false;
            return true;
          });
        }

        return storedFeedback;
      }
      return [];
    },

    async findFirst(args?: FeedbackFindArgs): Promise<FeedbackRecord | null> {
      if (typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];

        if (args?.where?.id) {
          return storedFeedback.find((feedback: FeedbackRecord) => feedback.id === args.where?.id) || null;
        }

        // Apply filtering and return first match
        if (args?.where) {
          const filtered = storedFeedback.filter((feedback: FeedbackRecord) => {
            if (args.where?.category && feedback.category !== args.where.category) return false;
            if (args.where?.priority && feedback.priority !== args.where.priority) return false;
            if (args.where?.userId && feedback.userId !== args.where.userId) return false;
            return true;
          });
          return filtered[0] || null;
        }

        return storedFeedback[0] || null;
      }
      return null;
    },

    async update(args: FeedbackUpdateArgs): Promise<FeedbackRecord> {
      // Mock update implementation
      if (typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        const index = storedFeedback.findIndex(feedback => feedback.id === args.where.id);
        
        if (index !== -1) {
          storedFeedback[index] = {
            ...storedFeedback[index],
            ...args.data,
            updatedAt: new Date(),
          };
          localStorage.setItem('uat_feedback', JSON.stringify(storedFeedback));
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
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
    },

    async delete(args: FeedbackDeleteArgs): Promise<FeedbackRecord> {
      // Mock delete implementation
      if (typeof window !== 'undefined') {
        const storedFeedback = JSON.parse(localStorage.getItem('uat_feedback') || '[]') as FeedbackRecord[];
        const index = storedFeedback.findIndex(feedback => feedback.id === args.where.id);
        
        if (index !== -1) {
          const deleted = storedFeedback.splice(index, 1)[0];
          localStorage.setItem('uat_feedback', JSON.stringify(storedFeedback));
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    };

    this.uATSession = {
    async findMany(args?: UATSessionFindArgs): Promise<UATSessionRecord[]> {
      // Enhanced UAT session management with localStorage
      if (typeof window !== 'undefined') {
        const storedSessions = JSON.parse(localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];

        // Apply filtering if provided
        if (args?.where) {
          return storedSessions.filter((session: UATSessionRecord) => {
            if (args.where?.testerId && session.testerId !== args.where.testerId) return false;
            if (args.where?.status && session.status !== args.where.status) return false;
            if (args.where?.id && session.id !== args.where.id) return false;
            return true;
          });
        }

        return storedSessions;
      }
      return [];
    },

    async findFirst(args?: UATSessionFindArgs): Promise<UATSessionRecord | null> {
      if (typeof window !== 'undefined') {
        const storedSessions = JSON.parse(localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        
        if (args?.where?.id) {
          return storedSessions.find(session => session.id === args.where?.id) || null;
        }
        
        // Apply filtering and return first match
        if (args?.where) {
          const filtered = storedSessions.filter((session: UATSessionRecord) => {
            if (args.where?.testerId && session.testerId !== args.where.testerId) return false;
            if (args.where?.status && session.status !== args.where.status) return false;
            return true;
          });
          return filtered[0] || null;
        }
        
        return storedSessions[0] || null;
      }
      
      // Fallback mock session
      if (args?.where?.id) {
        return {
          id: args.where.id,
          testerId: 'mock-tester',
          assignedTasks: [],
          status: 'in_progress',
          feedbackCount: 0,
          helpRequests: 0,
          lastFeedbackAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return null;
    },

    async update(args: UATSessionUpdateArgs): Promise<UATSessionRecord> {
      if (typeof window !== 'undefined') {
        const storedSessions = JSON.parse(localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        const index = storedSessions.findIndex(session => session.id === args.where.id);
        
        if (index !== -1) {
          storedSessions[index] = {
            ...storedSessions[index],
            ...args.data,
            updatedAt: new Date(),
          };
          localStorage.setItem('uat_sessions', JSON.stringify(storedSessions));
          return storedSessions[index];
        }
      }
      
      // Fallback mock response
      return {
        id: args.where.id,
        testerId: 'mock-tester',
        assignedTasks: [],
        status: 'in_progress',
        feedbackCount: args.data.feedbackCount || 1,
        helpRequests: 0,
        lastFeedbackAt: args.data.lastFeedbackAt || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
    },

    async create(args: UATSessionCreateArgs): Promise<UATSessionRecord> {
      const sessionData: UATSessionRecord = {
        id: `uat_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...args.data,
        status: args.data.status || 'in_progress',
        startTime: args.data.startTime || new Date(),
        endTime: args.data.endTime || null,
        taskResults: args.data.taskResults || [],
        errorsEncountered: args.data.errorsEncountered || 0,
        feedbackCount: 0,
        helpRequests: 0,
        lastFeedbackAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        const existingSessions = JSON.parse(localStorage.getItem('uat_sessions') || '[]') as UATSessionRecord[];
        existingSessions.push(sessionData);
        localStorage.setItem('uat_sessions', JSON.stringify(existingSessions));
      }

      return sessionData;
    }
    };
  }
}

// Export a singleton instance with explicit typing
export const prisma = new ExtendedPrismaClient() as ExtendedPrismaClient & {
  feedback: FeedbackModel;
  uATSession: UATSessionModel;
};
export default prisma;
