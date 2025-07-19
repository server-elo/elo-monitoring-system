import { describe, it, expect } from '@jest/globals';
import { 
  validateBody, 
  validateQuery, 
  LoginSchema, 
  RegisterSchema, 
  CreateUserSchema,
  CreateLessonSchema,
  PaginationSchema,
  SearchSchema,
  IdSchema,
  EmailSchema,
  PasswordSchema
} from '@/lib/api/validation';
import { NextRequest } from 'next/server';
import { ZodError } from 'zod';

describe('API Validation', () => {
  describe('validateBody', () => {
    it('should validate correct login data', async () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: true
      };

      const request = new NextRequest('http://localhost:3000/api/login', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await validateBody(LoginSchema, request);
      
      expect(result).toEqual(validData);
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Password123!'
      };

      const request = new NextRequest('http://localhost:3000/api/login', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      await expect(validateBody(LoginSchema, request)).rejects.toThrow(ZodError);
    });

    it('should reject missing required fields', async () => {
      const invalidData = {
        email: 'test@example.com'
        // missing password
      };

      const request = new NextRequest('http://localhost:3000/api/login', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' }
      });

      await expect(validateBody(LoginSchema, request)).rejects.toThrow(ZodError);
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/login', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      });

      await expect(validateBody(LoginSchema, request)).rejects.toThrow();
    });

    it('should handle empty body', async () => {
      const request = new NextRequest('http://localhost:3000/api/login', {
        method: 'POST',
        body: '',
        headers: { 'Content-Type': 'application/json' }
      });

      await expect(validateBody(LoginSchema, request)).rejects.toThrow();
    });

    it('should sanitize input data', async () => {
      const dataWithXSS = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '<script>alert("xss")</script>Test User'
      };

      const request = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify(dataWithXSS),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await validateBody(RegisterSchema, request);
      
      expect(result.name).not.toContain('<script>');
      expect(result.name).toBe('Test User'); // XSS removed
    });
  });

  describe('validateQuery', () => {
    it('should validate pagination parameters', () => {
      const searchParams = new URLSearchParams({
        page: '2',
        limit: '50',
        sortBy: 'name',
        sortOrder: 'desc'
      });

      const result = validateQuery(PaginationSchema, searchParams);
      
      expect(result).toEqual({
        page: 2,
        limit: 50,
        sortBy: 'name',
        sortOrder: 'desc'
      });
    });

    it('should use default values for missing parameters', () => {
      const searchParams = new URLSearchParams();

      const result = validateQuery(PaginationSchema, searchParams);
      
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: 'asc'
      });
    });

    it('should validate search parameters', () => {
      const searchParams = new URLSearchParams({
        search: 'solidity basics',
        category: 'BEGINNER',
        status: 'PUBLISHED'
      });

      const result = validateQuery(SearchSchema, searchParams);
      
      expect(result).toEqual({
        search: 'solidity basics',
        category: 'BEGINNER',
        status: 'PUBLISHED'
      });
    });

    it('should reject invalid parameter types', () => {
      const searchParams = new URLSearchParams({
        page: 'invalid',
        limit: 'not-a-number'
      });

      expect(() => validateQuery(PaginationSchema, searchParams)).toThrow(ZodError);
    });

    it('should enforce parameter limits', () => {
      const searchParams = new URLSearchParams({
        page: '0', // below minimum
        limit: '1000' // above maximum
      });

      expect(() => validateQuery(PaginationSchema, searchParams)).toThrow(ZodError);
    });
  });

  describe('Schema Validation', () => {
    describe('LoginSchema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'user@example.com',
          password: 'SecurePass123!',
          rememberMe: false
        };

        const result = LoginSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'not-an-email',
          password: 'SecurePass123!'
        };

        expect(() => LoginSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should reject short password', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'short'
        };

        expect(() => LoginSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should make rememberMe optional', () => {
        const validData = {
          email: 'user@example.com',
          password: 'SecurePass123!'
        };

        const result = LoginSchema.parse(validData);
        expect(result.rememberMe).toBe(false); // default value
      });
    });

    describe('RegisterSchema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          name: 'New User',
          acceptTerms: true
        };

        const result = RegisterSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should reject mismatched passwords', () => {
        const invalidData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!',
          name: 'New User',
          acceptTerms: true
        };

        expect(() => RegisterSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should reject if terms not accepted', () => {
        const invalidData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          name: 'New User',
          acceptTerms: false
        };

        expect(() => RegisterSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should validate name length', () => {
        const invalidData = {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          name: 'A', // too short
          acceptTerms: true
        };

        expect(() => RegisterSchema.parse(invalidData)).toThrow(ZodError);
      });
    });

    describe('CreateUserSchema', () => {
      it('should validate admin user creation', () => {
        const validData = {
          email: 'admin@example.com',
          password: 'AdminPass123!',
          name: 'Admin User',
          role: 'ADMIN'
        };

        const result = CreateUserSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should default to STUDENT role', () => {
        const validData = {
          email: 'student@example.com',
          password: 'StudentPass123!',
          name: 'Student User'
        };

        const result = CreateUserSchema.parse(validData);
        expect(result.role).toBe('STUDENT');
      });

      it('should validate role enum', () => {
        const invalidData = {
          email: 'user@example.com',
          password: 'UserPass123!',
          name: 'User',
          role: 'INVALID_ROLE'
        };

        expect(() => CreateUserSchema.parse(invalidData)).toThrow(ZodError);
      });
    });

    describe('CreateLessonSchema', () => {
      it('should validate lesson creation', () => {
        const validData = {
          title: 'Introduction to Solidity',
          description: 'Learn the basics of Solidity programming',
          content: 'Solidity is a programming language for smart contracts...',
          type: 'THEORY',
          difficulty: 'BEGINNER',
          estimatedDuration: 45,
          xpReward: 100,
          prerequisites: [],
          tags: ['solidity', 'basics'],
          courseId: 'course-123'
        };

        const result = CreateLessonSchema.parse(validData);
        expect(result).toEqual(validData);
      });

      it('should validate title length', () => {
        const invalidData = {
          title: 'AB', // too short
          description: 'Valid description',
          content: 'Valid content',
          type: 'THEORY',
          difficulty: 'BEGINNER',
          estimatedDuration: 30,
          xpReward: 100,
          courseId: 'course-123'
        };

        expect(() => CreateLessonSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should validate duration limits', () => {
        const invalidData = {
          title: 'Valid Title',
          description: 'Valid description',
          content: 'Valid content',
          type: 'THEORY',
          difficulty: 'BEGINNER',
          estimatedDuration: 500, // too long
          xpReward: 100,
          courseId: 'course-123'
        };

        expect(() => CreateLessonSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should validate XP reward limits', () => {
        const invalidData = {
          title: 'Valid Title',
          description: 'Valid description',
          content: 'Valid content',
          type: 'THEORY',
          difficulty: 'BEGINNER',
          estimatedDuration: 30,
          xpReward: 5, // too low
          courseId: 'course-123'
        };

        expect(() => CreateLessonSchema.parse(invalidData)).toThrow(ZodError);
      });

      it('should validate tags array', () => {
        const invalidData = {
          title: 'Valid Title',
          description: 'Valid description',
          content: 'Valid content',
          type: 'THEORY',
          difficulty: 'BEGINNER',
          estimatedDuration: 30,
          xpReward: 100,
          tags: Array(15).fill('tag'), // too many tags
          courseId: 'course-123'
        };

        expect(() => CreateLessonSchema.parse(invalidData)).toThrow(ZodError);
      });
    });

    describe('IdSchema', () => {
      it('should validate UUID format', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174000';
        
        const result = IdSchema.parse(validId);
        expect(result).toBe(validId);
      });

      it('should reject invalid UUID format', () => {
        const invalidIds = [
          'not-a-uuid',
          '123',
          '123e4567-e89b-12d3-a456',
          '123e4567-e89b-12d3-a456-42661417400g'
        ];

        invalidIds.forEach(id => {
          expect(() => IdSchema.parse(id)).toThrow(ZodError);
        });
      });
    });

    describe('EmailSchema', () => {
      it('should validate correct email formats', () => {
        const validEmails = [
          'user@example.com',
          'test.email@domain.co.uk',
          'user+tag@example.org',
          'user123@test-domain.com'
        ];

        validEmails.forEach(email => {
          const result = EmailSchema.parse(email);
          expect(result).toBe(email);
        });
      });

      it('should reject invalid email formats', () => {
        const invalidEmails = [
          'not-an-email',
          '@example.com',
          'user@',
          'user@.com',
          'user..double@example.com',
          'user@example.',
          'user name@example.com'
        ];

        invalidEmails.forEach(email => {
          expect(() => EmailSchema.parse(email)).toThrow(ZodError);
        });
      });
    });

    describe('PasswordSchema', () => {
      it('should validate strong passwords', () => {
        const strongPasswords = [
          'StrongPass123!',
          'MySecure@Password1',
          'Complex#Pass2024',
          'Secure$123Password'
        ];

        strongPasswords.forEach(password => {
          const result = PasswordSchema.parse(password);
          expect(result).toBe(password);
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'short',
          '12345678',
          'password',
          'PASSWORD',
          'Password',
          'Password123',
          'password123!',
          'UPPERCASE123!'
        ];

        weakPasswords.forEach(password => {
          expect(() => PasswordSchema.parse(password)).toThrow(ZodError);
        });
      });
    });
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', async () => {
      const dataWithHTML = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '<b>Bold</b> <i>Italic</i> Name'
      };

      const request = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify(dataWithHTML),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await validateBody(RegisterSchema, request);
      
      expect(result.name).toBe('Bold Italic Name');
    });

    it('should prevent XSS attacks', async () => {
      const xssData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: '<script>alert("xss")</script>Hacker'
      };

      const request = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify(xssData),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await validateBody(RegisterSchema, request);
      
      expect(result.name).not.toContain('<script>');
      expect(result.name).toBe('Hacker');
    });

    it('should trim whitespace', async () => {
      const dataWithWhitespace = {
        email: '  test@example.com  ',
        password: 'Password123!',
        name: '  Test User  '
      };

      const request = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify(dataWithWhitespace),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await validateBody(RegisterSchema, request);
      
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjectionData = {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'Password123!',
        name: "Robert'; DROP TABLE students; --"
      };

      const request = new NextRequest('http://localhost:3000/api/register', {
        method: 'POST',
        body: JSON.stringify(sqlInjectionData),
        headers: { 'Content-Type': 'application/json' }
      });

      // Should still validate but sanitize the input
      const result = await validateBody(RegisterSchema, request);
      
      expect(result.email).not.toContain('DROP TABLE');
      expect(result.name).not.toContain('DROP TABLE');
    });
  });
});
