/**
 * API Route Type Definitions
 * 
 * Central type definitions for API routes to replace any types
 */

import { Achievement, UserAchievement, PersonalizedChallenge, Collaboration, ChatMessage, AchievementCategory } from '@prisma/client';

// Achievement types
export interface AchievementWithUserProgress extends Omit<Achievement, 'requirement'> {
  userAchievements: UserAchievement[];
  requirement: Record<string, unknown>;
}

export interface AchievementWithProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xpReward: number;
  badgeUrl: string | null;
  requirement: Record<string, unknown>; // JSON type from Prisma
  userProgress: UserAchievement | null;
  isUnlocked: boolean;
  isCompleted: boolean;
  unlockedAt: Date | null;
  progress: number;
}

// Collaboration types
export interface CollaborationParticipant {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface CollaborationMessage extends ChatMessage {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface CollaborationWithDetails extends Collaboration {
  participants: CollaborationParticipant[];
  chatMessages: CollaborationMessage[];
}

export interface TransformedCollaboration extends Omit<CollaborationWithDetails, 'participants'> {
  maxParticipants: number;
  language: string;
  code: string;
  isActive: boolean;
  participants: Array<CollaborationParticipant & { role: string }>;
}

// Personalized Challenge types
export interface PersonalizedChallengeQuery {
  userId: string;
  isCompleted?: boolean;
}

export interface PersonalizedChallengeWithSubmissions extends PersonalizedChallenge {
  submissions: Array<{
    id: string;
    createdAt: Date;
    // Add other submission fields as needed
  }>;
}

export interface PersonalizedChallengeUpdateData {
  attempts: number;
  timeSpent: number;
  isCompleted?: boolean;
  completedAt?: Date;
  bestScore?: number;
}

// Course types for improved route
export interface CourseData {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  difficulty: string;
  estimatedHours: number;
  xpReward: number;
  price: number;
  currency: string;
  tags: string[];
  prerequisites: string[];
  status?: string;
  isPublished?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Generic pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Re-export types from Prisma
// export { SkillLevel } from '@prisma/client';