/**
 * Assertion Helpers
 * Custom matchers and assertion utilities for tests
 */

import { expect } from 'vitest';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidEmail(): R;
      toBeValidJWT(): R;
      toBeValidSolidityCode(): R;
      toBeWithinTimeRange(start: Date, end: Date): R;
      toHaveValidApiResponse(): R;
      toHaveValidErrorResponse(): R;
      toBeValidUserRole(): R;
      toBeValidCourseStatus(): R;
      toBeValidLessonType(): R;
      toMatchSolidityPattern(pattern: RegExp): R;
      toHaveValidXPRange(min: number, max: number): R;
    }
  }
}

// UUID validation
export const expectValidUUID = (token: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(token).toMatch(uuidRegex);
};

// Email validation
export const expectValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(email).toMatch(emailRegex);
};

// JWT validation
export const expectValidJWT = (token: string) => {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  expect(token).toMatch(jwtRegex);
};

// API response validation
export const expectValidApiResponse = (response: any) => {
  expect(response).toHaveProperty('success');
  expect(response).toHaveProperty('data');
  expect(response).toHaveProperty('timestamp');
  expect(response).toHaveProperty('requestId');
  expect(response.success).toBe(true);
  expect(typeof response.timestamp).toBe('string');
  expectValidUUID(response.requestId);
};

// API error response validation
export const expectValidErrorResponse = (response: any) => {
  expect(response).toHaveProperty('success');
  expect(response).toHaveProperty('error');
  expect(response).toHaveProperty('timestamp');
  expect(response).toHaveProperty('requestId');
  expect(response.success).toBe(false);
  expect(response.error).toHaveProperty('code');
  expect(response.error).toHaveProperty('message');
  expect(typeof response.error.code).toBe('string');
  expect(typeof response.error.message).toBe('string');
  expectValidUUID(response.requestId);
};

// User data validation
export const expectValidUser = (user: any) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('role');
  expect(user).toHaveProperty('status');
  expect(user).toHaveProperty('createdAt');
  expect(user).toHaveProperty('updatedAt');
  
  expectValidUUID(user.id);
  expectValidEmail(user.email);
  expect(['STUDENT', 'INSTRUCTOR', 'ADMIN']).toContain(user.role);
  expect(['ACTIVE', 'INACTIVE', 'BANNED']).toContain(user.status);
  expect(new Date(user.createdAt)).toBeInstanceOf(Date);
  expect(new Date(user.updatedAt)).toBeInstanceOf(Date);
};

// Course data validation
export const expectValidCourse = (course: any) => {
  expect(course).toHaveProperty('id');
  expect(course).toHaveProperty('title');
  expect(course).toHaveProperty('description');
  expect(course).toHaveProperty('difficulty');
  expect(course).toHaveProperty('status');
  expect(course).toHaveProperty('xpReward');
  expect(course).toHaveProperty('createdAt');
  expect(course).toHaveProperty('updatedAt');
  
  expectValidUUID(course.id);
  expect(typeof course.title).toBe('string');
  expect(course.title.length).toBeGreaterThan(0);
  expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(course.difficulty);
  expect(['DRAFT', 'PUBLISHED', 'ARCHIVED']).toContain(course.status);
  expect(course.xpReward).toBeGreaterThanOrEqual(0);
  expect(new Date(course.createdAt)).toBeInstanceOf(Date);
  expect(new Date(course.updatedAt)).toBeInstanceOf(Date);
};

// Lesson data validation
export const expectValidLesson = (lesson: any) => {
  expect(lesson).toHaveProperty('id');
  expect(lesson).toHaveProperty('title');
  expect(lesson).toHaveProperty('content');
  expect(lesson).toHaveProperty('type');
  expect(lesson).toHaveProperty('difficulty');
  expect(lesson).toHaveProperty('courseId');
  expect(lesson).toHaveProperty('order');
  expect(lesson).toHaveProperty('xpReward');
  
  expectValidUUID(lesson.id);
  expectValidUUID(lesson.courseId);
  expect(typeof lesson.title).toBe('string');
  expect(lesson.title.length).toBeGreaterThan(0);
  expect(['THEORY', 'CODING', 'QUIZ', 'PROJECT']).toContain(lesson.type);
  expect(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(lesson.difficulty);
  expect(lesson.order).toBeGreaterThan(0);
  expect(lesson.xpReward).toBeGreaterThanOrEqual(0);
};

// Progress data validation
export const expectValidProgress = (progress: any) => {
  expect(progress).toHaveProperty('id');
  expect(progress).toHaveProperty('userId');
  expect(progress).toHaveProperty('lessonId');
  expect(progress).toHaveProperty('courseId');
  expect(progress).toHaveProperty('status');
  expect(progress).toHaveProperty('timeSpent');
  expect(progress).toHaveProperty('attempts');
  
  expectValidUUID(progress.id);
  expectValidUUID(progress.userId);
  expectValidUUID(progress.lessonId);
  expectValidUUID(progress.courseId);
  expect(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).toContain(progress.status);
  expect(progress.timeSpent).toBeGreaterThanOrEqual(0);
  expect(progress.attempts).toBeGreaterThan(0);
  
  if (progress.score !== null && progress.score !== undefined) {
    expect(progress.score).toBeGreaterThanOrEqual(0);
    expect(progress.score).toBeLessThanOrEqual(100);
  }
};

// Solidity code validation
export const expectValidSolidityCode = (code: string) => {
  expect(code).toContain('pragma solidity');
  expect(code).toContain('contract');
  
  // Check for valid contract structure
  const contractMatch = code.match(/contract\s+(\w+)\s*\{/);
  expect(contractMatch).toBeTruthy();
  
  // Check for balanced braces
  const openBraces = (code.match(/\{/g) || []).length;
  const closeBraces = (code.match(/\}/g) || []).length;
  expect(openBraces).toBe(closeBraces);
};

// Time range validation
export const expectWithinTimeRange = (timestamp: string | Date, start: Date, end: Date) => {
  const date = new Date(timestamp);
  expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
  expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
};

// XP validation
export const expectValidXPValue = (xp: number, min: number = 0, max: number = 100000) => {
  expect(xp).toBeGreaterThanOrEqual(min);
  expect(xp).toBeLessThanOrEqual(max);
  expect(Number.isInteger(xp)).toBe(true);
};

// Achievement validation
export const expectValidAchievement = (achievement: any) => {
  expect(achievement).toHaveProperty('id');
  expect(achievement).toHaveProperty('title');
  expect(achievement).toHaveProperty('description');
  expect(achievement).toHaveProperty('type');
  expect(achievement).toHaveProperty('xpReward');
  expect(achievement).toHaveProperty('condition');
  
  expectValidUUID(achievement.id);
  expect(typeof achievement.title).toBe('string');
  expect(achievement.title.length).toBeGreaterThan(0);
  expect(['LESSON', 'COURSE', 'STREAK', 'XP', 'SPECIAL']).toContain(achievement.type);
  expectValidXPValue(achievement.xpReward);
  expect(achievement.condition).toHaveProperty('type');
  expect(achievement.condition).toHaveProperty('value');
};

// Collaboration session validation
export const expectValidCollaborationSession = (session: any) => {
  expect(session).toHaveProperty('id');
  expect(session).toHaveProperty('title');
  expect(session).toHaveProperty('hostId');
  expect(session).toHaveProperty('participants');
  expect(session).toHaveProperty('status');
  expect(session).toHaveProperty('maxParticipants');
  
  expectValidUUID(session.id);
  expectValidUUID(session.hostId);
  expect(Array.isArray(session.participants)).toBe(true);
  expect(['ACTIVE', 'PAUSED', 'ENDED']).toContain(session.status);
  expect(session.maxParticipants).toBeGreaterThan(0);
  
  // Validate participants
  session.participants.forEach((participant: any) => {
    expect(participant).toHaveProperty('id');
    expect(participant).toHaveProperty('userId');
    expect(participant).toHaveProperty('role');
    expectValidUUID(participant.id);
    expectValidUUID(participant.userId);
    expect(['HOST', 'PARTICIPANT', 'OBSERVER']).toContain(participant.role);
  });
};

// Database constraint validation
export const expectValidDatabaseConstraints = (data: any, constraints: Record<string, any>) => {
  Object.entries(constraints).forEach(([field, constraint]) => {
    if (constraint.required && data[field] === undefined) {
      throw new Error(`Required field ${field} is missing`);
    }
    
    if (constraint.type && data[field] !== undefined) {
      if (constraint.type === 'string' && typeof data[field] !== 'string') {
        throw new Error(`Field ${field} must be a string`);
      }
      if (constraint.type === 'number' && typeof data[field] !== 'number') {
        throw new Error(`Field ${field} must be a number`);
      }
      if (constraint.type === 'boolean' && typeof data[field] !== 'boolean') {
        throw new Error(`Field ${field} must be a boolean`);
      }
    }
    
    if (constraint.minLength && data[field] && data[field].length < constraint.minLength) {
      throw new Error(`Field ${field} must be at least ${constraint.minLength} characters`);
    }
    
    if (constraint.maxLength && data[field] && data[field].length > constraint.maxLength) {
      throw new Error(`Field ${field} must be at most ${constraint.maxLength} characters`);
    }
    
    if (constraint.min !== undefined && data[field] < constraint.min) {
      throw new Error(`Field ${field} must be at least ${constraint.min}`);
    }
    
    if (constraint.max !== undefined && data[field] > constraint.max) {
      throw new Error(`Field ${field} must be at most ${constraint.max}`);
    }
    
    if (constraint.enum && !constraint.enum.includes(data[field])) {
      throw new Error(`Field ${field} must be one of: ${constraint.enum.join(', ')}`);
    }
  });
};

// Performance assertion helpers
export const expectPerformanceWithinLimits = (metrics: any) => {
  if (metrics.responseTime !== undefined) {
    expect(metrics.responseTime).toBeLessThan(5000); // 5 seconds max
  }
  
  if (metrics.memoryUsage !== undefined) {
    expect(metrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB max
  }
  
  if (metrics.cpuUsage !== undefined) {
    expect(metrics.cpuUsage).toBeLessThan(80); // 80% max
  }
};

// Security assertion helpers
export const expectSecureData = (data: any) => {
  // Check for potential security issues in data
  const securityPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /style\s*=.*expression/i,
    /eval\s*\(/i,
    /document\.cookie/i,
  ];
  
  const dataString = JSON.stringify(data);
  securityPatterns.forEach(pattern => {
    expect(dataString).not.toMatch(pattern);
  });
};

// Rate limiting assertion helpers
export const expectRateLimitHeaders = (response: any) => {
  expect(response.headers).toHaveProperty('x-ratelimit-limit');
  expect(response.headers).toHaveProperty('x-ratelimit-remaining');
  expect(response.headers).toHaveProperty('x-ratelimit-reset');
  
  expect(Number(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
  expect(Number(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
  expect(Number(response.headers['x-ratelimit-reset'])).toBeGreaterThan(Date.now() / 1000);
};

// WebSocket message validation
export const expectValidWebSocketMessage = (message: any) => {
  expect(message).toHaveProperty('type');
  expect(message).toHaveProperty('payload');
  expect(message).toHaveProperty('timestamp');
  expect(typeof message.type).toBe('string');
  expect(message.type.length).toBeGreaterThan(0);
  expect(new Date(message.timestamp)).toBeInstanceOf(Date);
};

// File upload validation
export const expectValidUploadedFile = (file: any) => {
  expect(file).toHaveProperty('name');
  expect(file).toHaveProperty('size');
  expect(file).toHaveProperty('type');
  expect(typeof file.name).toBe('string');
  expect(file.name.length).toBeGreaterThan(0);
  expect(file.size).toBeGreaterThan(0);
  expect(file.size).toBeLessThan(10 * 1024 * 1024); // 10MB max
};

// Export all assertion helpers
export default {
  expectValidUUID,
  expectValidEmail,
  expectValidJWT,
  expectValidApiResponse,
  expectValidErrorResponse,
  expectValidUser,
  expectValidCourse,
  expectValidLesson,
  expectValidProgress,
  expectValidSolidityCode,
  expectWithinTimeRange,
  expectValidXPValue,
  expectValidAchievement,
  expectValidCollaborationSession,
  expectValidDatabaseConstraints,
  expectPerformanceWithinLimits,
  expectSecureData,
  expectRateLimitHeaders,
  expectValidWebSocketMessage,
  expectValidUploadedFile,
};