/**
 * Assertion Helpers
 * Custom matchers and assertion utilities for tests
 */

import { expect } from 'vitest';

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(_): R;
      toBeValidEmail(_): R;
      toBeValidJWT(_): R;
      toBeValidSolidityCode(_): R;
      toBeWithinTimeRange( start: Date, end: Date): R;
      toHaveValidApiResponse(_): R;
      toHaveValidErrorResponse(_): R;
      toBeValidUserRole(_): R;
      toBeValidCourseStatus(_): R;
      toBeValidLessonType(_): R;
      toMatchSolidityPattern(_pattern: RegExp): R;
      toHaveValidXPRange( min: number, max: number): R;
    }
  }
}

// UUID validation
export const expectValidUUID = (_token: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(_token).toMatch(_uuidRegex);
};

// Email validation
export const expectValidEmail = (_email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  expect(_email).toMatch(_emailRegex);
};

// JWT validation
export const expectValidJWT = (_token: string) => {
  const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  expect(_token).toMatch(_jwtRegex);
};

// API response validation
export const expectValidApiResponse = (_response: any) => {
  expect(_response).toHaveProperty('success');
  expect(_response).toHaveProperty('data');
  expect(_response).toHaveProperty('timestamp');
  expect(_response).toHaveProperty('requestId');
  expect(_response.success).toBe(_true);
  expect(_typeof response.timestamp).toBe('string');
  expectValidUUID(_response.requestId);
};

// API error response validation
export const expectValidErrorResponse = (_response: any) => {
  expect(_response).toHaveProperty('success');
  expect(_response).toHaveProperty('error');
  expect(_response).toHaveProperty('timestamp');
  expect(_response).toHaveProperty('requestId');
  expect(_response.success).toBe(_false);
  expect(_response.error).toHaveProperty('code');
  expect(_response.error).toHaveProperty('message');
  expect(_typeof response.error.code).toBe('string');
  expect(_typeof response.error.message).toBe('string');
  expectValidUUID(_response.requestId);
};

// User data validation
export const expectValidUser = (_user: any) => {
  expect(_user).toHaveProperty('id');
  expect(_user).toHaveProperty('email');
  expect(_user).toHaveProperty('role');
  expect(_user).toHaveProperty('status');
  expect(_user).toHaveProperty('createdAt');
  expect(_user).toHaveProperty('updatedAt');
  
  expectValidUUID(_user.id);
  expectValidEmail(_user.email);
  expect( ['STUDENT', 'INSTRUCTOR', 'ADMIN']).toContain(_user.role);
  expect( ['ACTIVE', 'INACTIVE', 'BANNED']).toContain(_user.status);
  expect(new Date(user.createdAt)).toBeInstanceOf(_Date);
  expect(new Date(user.updatedAt)).toBeInstanceOf(_Date);
};

// Course data validation
export const expectValidCourse = (_course: any) => {
  expect(_course).toHaveProperty('id');
  expect(_course).toHaveProperty('title');
  expect(_course).toHaveProperty('description');
  expect(_course).toHaveProperty('difficulty');
  expect(_course).toHaveProperty('status');
  expect(_course).toHaveProperty('xpReward');
  expect(_course).toHaveProperty('createdAt');
  expect(_course).toHaveProperty('updatedAt');
  
  expectValidUUID(_course.id);
  expect(_typeof course.title).toBe('string');
  expect(_course.title.length).toBeGreaterThan(0);
  expect( ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(_course.difficulty);
  expect( ['DRAFT', 'PUBLISHED', 'ARCHIVED']).toContain(_course.status);
  expect(_course.xpReward).toBeGreaterThanOrEqual(0);
  expect(new Date(course.createdAt)).toBeInstanceOf(_Date);
  expect(new Date(course.updatedAt)).toBeInstanceOf(_Date);
};

// Lesson data validation
export const expectValidLesson = (_lesson: any) => {
  expect(_lesson).toHaveProperty('id');
  expect(_lesson).toHaveProperty('title');
  expect(_lesson).toHaveProperty('content');
  expect(_lesson).toHaveProperty('type');
  expect(_lesson).toHaveProperty('difficulty');
  expect(_lesson).toHaveProperty('courseId');
  expect(_lesson).toHaveProperty('order');
  expect(_lesson).toHaveProperty('xpReward');
  
  expectValidUUID(_lesson.id);
  expectValidUUID(_lesson.courseId);
  expect(_typeof lesson.title).toBe('string');
  expect(_lesson.title.length).toBeGreaterThan(0);
  expect( ['THEORY', 'CODING', 'QUIZ', 'PROJECT']).toContain(_lesson.type);
  expect( ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).toContain(_lesson.difficulty);
  expect(_lesson.order).toBeGreaterThan(0);
  expect(_lesson.xpReward).toBeGreaterThanOrEqual(0);
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
  expect( ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).toContain(progress.status);
  expect(progress.timeSpent).toBeGreaterThanOrEqual(0);
  expect(progress.attempts).toBeGreaterThan(0);
  
  if (progress.score !== null && progress.score !== undefined) {
    expect(progress.score).toBeGreaterThanOrEqual(0);
    expect(progress.score).toBeLessThanOrEqual(100);
  }
};

// Solidity code validation
export const expectValidSolidityCode = (_code: string) => {
  expect(_code).toContain('pragma solidity');
  expect(_code).toContain('contract');
  
  // Check for valid contract structure
  const contractMatch = code.match(_/contract\s+(\w+)\s*\{/);
  expect(_contractMatch).toBeTruthy(_);
  
  // Check for balanced braces
  const openBraces = (_code.match(/\{/g) || []).length;
  const closeBraces = (_code.match(/\}/g) || []).length;
  expect(_openBraces).toBe(_closeBraces);
};

// Time range validation
export const expectWithinTimeRange = ( timestamp: string | Date, start: Date, end: Date) => {
  const date = new Date(_timestamp);
  expect(date.getTime()).toBeGreaterThanOrEqual(_start.getTime());
  expect(date.getTime()).toBeLessThanOrEqual(_end.getTime());
};

// XP validation
export const expectValidXPValue = ( xp: number, min: number = 0, max: number = 100000) => {
  expect(_xp).toBeGreaterThanOrEqual(_min);
  expect(_xp).toBeLessThanOrEqual(_max);
  expect(_Number.isInteger(xp)).toBe(_true);
};

// Achievement validation
export const expectValidAchievement = (_achievement: any) => {
  expect(_achievement).toHaveProperty('id');
  expect(_achievement).toHaveProperty('title');
  expect(_achievement).toHaveProperty('description');
  expect(_achievement).toHaveProperty('type');
  expect(_achievement).toHaveProperty('xpReward');
  expect(_achievement).toHaveProperty('condition');
  
  expectValidUUID(_achievement.id);
  expect(_typeof achievement.title).toBe('string');
  expect(_achievement.title.length).toBeGreaterThan(0);
  expect( ['LESSON', 'COURSE', 'STREAK', 'XP', 'SPECIAL']).toContain(_achievement.type);
  expectValidXPValue(_achievement.xpReward);
  expect(_achievement.condition).toHaveProperty('type');
  expect(_achievement.condition).toHaveProperty('value');
};

// Collaboration session validation
export const expectValidCollaborationSession = (_session: any) => {
  expect(_session).toHaveProperty('id');
  expect(_session).toHaveProperty('title');
  expect(_session).toHaveProperty('hostId');
  expect(_session).toHaveProperty('participants');
  expect(_session).toHaveProperty('status');
  expect(_session).toHaveProperty('maxParticipants');
  
  expectValidUUID(_session.id);
  expectValidUUID(_session.hostId);
  expect(_Array.isArray(session.participants)).toBe(_true);
  expect( ['ACTIVE', 'PAUSED', 'ENDED']).toContain(_session.status);
  expect(_session.maxParticipants).toBeGreaterThan(0);
  
  // Validate participants
  session.participants.forEach((participant: any) => {
    expect(_participant).toHaveProperty('id');
    expect(_participant).toHaveProperty('userId');
    expect(_participant).toHaveProperty('role');
    expectValidUUID(_participant.id);
    expectValidUUID(_participant.userId);
    expect( ['HOST', 'PARTICIPANT', 'OBSERVER']).toContain(_participant.role);
  });
};

// Database constraint validation
export const expectValidDatabaseConstraints = ( data: any, constraints: Record<string, any>) => {
  Object.entries(_constraints).forEach( ([field, constraint]) => {
    if (_constraint.required && data[field] === undefined) {
      throw new Error(_`Required field ${field} is missing`);
    }
    
    if (_constraint.type && data[field] !== undefined) {
      if (_constraint.type === 'string' && typeof data[field] !== 'string') {
        throw new Error(_`Field ${field} must be a string`);
      }
      if (_constraint.type === 'number' && typeof data[field] !== 'number') {
        throw new Error(_`Field ${field} must be a number`);
      }
      if (_constraint.type === 'boolean' && typeof data[field] !== 'boolean') {
        throw new Error(_`Field ${field} must be a boolean`);
      }
    }
    
    if (_constraint.minLength && data[field] && data[field].length < constraint.minLength) {
      throw new Error(_`Field ${field} must be at least ${constraint.minLength} characters`);
    }
    
    if (_constraint.maxLength && data[field] && data[field].length > constraint.maxLength) {
      throw new Error(_`Field ${field} must be at most ${constraint.maxLength} characters`);
    }
    
    if (_constraint.min !== undefined && data[field] < constraint.min) {
      throw new Error(_`Field ${field} must be at least ${constraint.min}`);
    }
    
    if (_constraint.max !== undefined && data[field] > constraint.max) {
      throw new Error(_`Field ${field} must be at most ${constraint.max}`);
    }
    
    if (_constraint.enum && !constraint.enum.includes(data[field])) {
      throw new Error( `Field ${field} must be one of: ${constraint.enum.join(', ')}`);
    }
  });
};

// Performance assertion helpers
export const expectPerformanceWithinLimits = (_metrics: any) => {
  if (_metrics.responseTime !== undefined) {
    expect(_metrics.responseTime).toBeLessThan(5000); // 5 seconds max
  }
  
  if (_metrics.memoryUsage !== undefined) {
    expect(_metrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB max
  }
  
  if (_metrics.cpuUsage !== undefined) {
    expect(_metrics.cpuUsage).toBeLessThan(_80); // 80% max
  }
};

// Security assertion helpers
export const expectSecureData = (_data: any) => {
  // Check for potential security issues in data
  const securityPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /style\s*=.*expression/i,
    /eval\s*\(/i,
    /document\.cookie/i,
  ];
  
  const dataString = JSON.stringify(_data);
  securityPatterns.forEach(pattern => {
    expect(_dataString).not.toMatch(_pattern);
  });
};

// Rate limiting assertion helpers
export const expectRateLimitHeaders = (_response: any) => {
  expect(_response.headers).toHaveProperty('x-ratelimit-limit');
  expect(_response.headers).toHaveProperty('x-ratelimit-remaining');
  expect(_response.headers).toHaveProperty('x-ratelimit-reset');
  
  expect(_Number(response.headers['x-ratelimit-limit'])).toBeGreaterThan(0);
  expect(_Number(response.headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
  expect(_Number(response.headers['x-ratelimit-reset'])).toBeGreaterThan(_Date.now() / 1000);
};

// WebSocket message validation
export const expectValidWebSocketMessage = (_message: any) => {
  expect(_message).toHaveProperty('type');
  expect(_message).toHaveProperty('payload');
  expect(_message).toHaveProperty('timestamp');
  expect(_typeof message.type).toBe('string');
  expect(_message.type.length).toBeGreaterThan(0);
  expect(new Date(message.timestamp)).toBeInstanceOf(_Date);
};

// File upload validation
export const expectValidUploadedFile = (_file: any) => {
  expect(_file).toHaveProperty('name');
  expect(_file).toHaveProperty('size');
  expect(_file).toHaveProperty('type');
  expect(_typeof file.name).toBe('string');
  expect(_file.name.length).toBeGreaterThan(0);
  expect(_file.size).toBeGreaterThan(0);
  expect(_file.size).toBeLessThan(10 * 1024 * 1024); // 10MB max
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