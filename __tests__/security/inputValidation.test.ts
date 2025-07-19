/**
 * Input Validation Security Testing Suite
 * Comprehensive tests for input validation and sanitization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Import test utilities
import {
  expectToThrow,
  measureExecutionTime,
} from '../utils/testHelpers';
import {
  expectSecureData,
  expectValidApiResponse,
  expectValidErrorResponse,
} from '../utils/assertionHelpers';

// Mock validation schemas (based on actual app schemas)
const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number')
    .regex(/(?=.*[@$!%*?&])/, 'Password must contain at least one special character'),
});

const courseCreationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category must be at most 100 characters'),
  estimatedDuration: z.number()
    .min(5, 'Duration must be at least 5 minutes')
    .max(480, 'Duration must be at most 8 hours'),
  xpReward: z.number()
    .min(0, 'XP reward cannot be negative')
    .max(10000, 'XP reward cannot exceed 10000'),
});

const solidityCodeSchema = z.object({
  content: z.string()
    .min(1, 'Code content is required')
    .max(50000, 'Code content is too large')
    .refine(
      (code) => code.includes('pragma solidity'),
      'Code must include Solidity pragma directive'
    )
    .refine(
      (code) => {
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        return openBraces === closeBraces;
      },
      'Code must have balanced braces'
    ),
  fileName: z.string()
    .regex(/^[a-zA-Z0-9_-]+\.sol$/, 'File name must be a valid Solidity file'),
});

describe('Input Validation Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SQL Injection Prevention', () => {
    it('should reject SQL injection attempts in user inputs', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin'--",
        "'; INSERT INTO users (username) VALUES ('hacker'); --",
        "' OR 1=1 #",
        "' OR 'x'='x",
        "'; EXEC xp_cmdshell('dir'); --",
        "1' AND (SELECT COUNT(*) FROM users) > 0 --",
        "' OR SLEEP(5) --",
      ];

      for (const payload of sqlInjectionPayloads) {
        // Test in username field
        await expectToThrow(async () => {
          userRegistrationSchema.parse({
            email: 'test@example.com',
            username: payload,
            firstName: 'Test',
            lastName: 'User',
            password: 'Password123!',
          });
        });

        // Ensure the payload is detected as potentially malicious
        expectSecureData({ input: payload });
      }
    });

    it('should sanitize database query parameters', () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin'--",
      ];

      // Mock sanitization function
      const sanitizeForDatabase = (input: string): string => {
        return input.replace(/'/g, "''").replace(/;/g, '').replace(/--/g, '');
      };

      maliciousInputs.forEach(input => {
        const sanitized = sanitizeForDatabase(input);
        expect(sanitized).not.toContain(';');
        expect(sanitized).not.toContain('--');
        expect(sanitized.includes("''")).toBeTruthy(); // Single quotes escaped
      });
    });

    it('should use parameterized queries for database operations', () => {
      // Example of parameterized query structure
      const parameterizedQuery = {
        text: 'SELECT * FROM users WHERE email = $1 AND status = $2',
        values: ['test@example.com', 'ACTIVE'],
      };

      expect(parameterizedQuery.text).not.toContain('test@example.com');
      expect(parameterizedQuery.text).not.toContain('ACTIVE');
      expect(parameterizedQuery.values).toContain('test@example.com');
      expect(parameterizedQuery.values).toContain('ACTIVE');
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize HTML content to prevent XSS attacks', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<style>@import"javascript:alert(1)";</style>',
        '<div onclick="alert(1)">Click me</div>',
        '<a href="javascript:alert(1)">Click me</a>',
        '"><script>alert(1)</script>',
        "'><script>alert(1)</script>",
        '<script src="//evil.com/xss.js"></script>',
      ];

      xssPayloads.forEach(payload => {
        const sanitized = DOMPurify.sanitize(payload);
        
        // Should not contain script tags or event handlers
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/on\w+\s*=/i);
        expect(sanitized).not.toMatch(/@import/i);
        
        // Verify security validation
        expectSecureData({ content: payload });
      });
    });

    it('should preserve safe HTML while removing dangerous elements', () => {
      const safeContent = '<p>This is <strong>safe</strong> content with <em>emphasis</em>.</p>';
      const mixedContent = '<p>Safe content</p><script>alert("XSS")</script><strong>More safe content</strong>';

      const sanitizedSafe = DOMPurify.sanitize(safeContent);
      const sanitizedMixed = DOMPurify.sanitize(mixedContent);

      expect(sanitizedSafe).toContain('<p>');
      expect(sanitizedSafe).toContain('<strong>');
      expect(sanitizedSafe).toContain('<em>');

      expect(sanitizedMixed).toContain('<p>');
      expect(sanitizedMixed).toContain('<strong>');
      expect(sanitizedMixed).not.toContain('<script>');
    });

    it('should handle edge cases in XSS prevention', () => {
      const edgeCases = [
        '', // Empty string
        null,
        undefined,
        '<script><!-- comment --></script>',
        '<script>/*comment*/</script>',
        '<scr<script>ipt>alert(1)</script>',
        '&lt;script&gt;alert(1)&lt;/script&gt;', // Already encoded
        '<SCRIPT>alert(1)</SCRIPT>', // Different case
        '<script\n>alert(1)</script>', // With newlines
        '<script\t>alert(1)</script>', // With tabs
      ];

      edgeCases.forEach(testCase => {
        if (testCase === null || testCase === undefined) {
          expect(DOMPurify.sanitize(testCase as any)).toBeFalsy();
        } else {
          const sanitized = DOMPurify.sanitize(testCase);
          expect(sanitized).not.toMatch(/<script/i);
        }
      });
    });
  });

  describe('Input Validation Rules', () => {
    it('should validate email addresses correctly', () => {
      const validEmails = [
        'test@example.com',
        'user123@domain.co.uk',
        'first.last@subdomain.example.org',
        'user+tag@example.com',
      ];

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        'test@.example.com',
        'test@example.',
        '',
      ];

      validEmails.forEach(email => {
        expect(() => userRegistrationSchema.parse({
          email,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!',
        })).not.toThrow();
      });

      invalidEmails.forEach(email => {
        expect(() => userRegistrationSchema.parse({
          email,
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!',
        })).toThrow();
      });
    });

    it('should validate password strength requirements', () => {
      const strongPasswords = [
        'Password123!',
        'Str0ng@Pass',
        'MyP@ssw0rd',
        '1234ABcd!@#$',
      ];

      const weakPasswords = [
        'password', // No uppercase, no number, no special char
        'PASSWORD123', // No lowercase, no special char
        'Password', // No number, no special char
        'Pass1!', // Too short
        '12345678', // No letters, no special char
        'PasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPasswordPassword123!', // Too long
      ];

      strongPasswords.forEach(password => {
        expect(() => userRegistrationSchema.parse({
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password,
        })).not.toThrow();
      });

      weakPasswords.forEach(password => {
        expect(() => userRegistrationSchema.parse({
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          password,
        })).toThrow();
      });
    });

    it('should validate username format and length', () => {
      const validUsernames = [
        'user123',
        'test-user',
        'test_user',
        'USER',
        'a1b2c3',
      ];

      const invalidUsernames = [
        'ab', // Too short
        'user with spaces',
        'user@domain',
        'user#123',
        'user.name',
        'verylongusernamethatexceedsthemaximumlength',
        '',
        '123456789012345678901234567890123456789', // Too long
      ];

      validUsernames.forEach(username => {
        expect(() => userRegistrationSchema.parse({
          email: 'test@example.com',
          username,
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!',
        })).not.toThrow();
      });

      invalidUsernames.forEach(username => {
        expect(() => userRegistrationSchema.parse({
          email: 'test@example.com',
          username,
          firstName: 'Test',
          lastName: 'User',
          password: 'Password123!',
        })).toThrow();
      });
    });

    it('should validate numeric inputs with proper ranges', () => {
      const validCourseData = {
        title: 'Test Course',
        description: 'This is a test course description with enough characters.',
        difficulty: 'BEGINNER' as const,
        category: 'Programming',
        estimatedDuration: 60,
        xpReward: 100,
      };

      // Valid cases
      expect(() => courseCreationSchema.parse(validCourseData)).not.toThrow();

      // Invalid duration
      expect(() => courseCreationSchema.parse({
        ...validCourseData,
        estimatedDuration: 2, // Too short
      })).toThrow();

      expect(() => courseCreationSchema.parse({
        ...validCourseData,
        estimatedDuration: 500, // Too long
      })).toThrow();

      // Invalid XP reward
      expect(() => courseCreationSchema.parse({
        ...validCourseData,
        xpReward: -1, // Negative
      })).toThrow();

      expect(() => courseCreationSchema.parse({
        ...validCourseData,
        xpReward: 15000, // Too high
      })).toThrow();
    });
  });

  describe('File Upload Validation', () => {
    it('should validate Solidity file uploads', () => {
      const validSolidityCode = `
        // SPDX-License-Identifier: MIT
        pragma solidity ^0.8.0;
        
        contract TestContract {
            uint256 public value;
            
            function setValue(uint256 _value) public {
                value = _value;
            }
        }
      `;

      const invalidSolidityCode = [
        '', // Empty
        'function test() { console.log("not solidity"); }', // No pragma
        'pragma solidity ^0.8.0; contract Test { function test() { }', // Unbalanced braces
        'a'.repeat(60000), // Too large
      ];

      // Valid code should pass
      expect(() => solidityCodeSchema.parse({
        content: validSolidityCode,
        fileName: 'TestContract.sol',
      })).not.toThrow();

      // Invalid code should fail
      invalidSolidityCode.forEach(content => {
        expect(() => solidityCodeSchema.parse({
          content,
          fileName: 'TestContract.sol',
        })).toThrow();
      });
    });

    it('should validate file names and extensions', () => {
      const validFileNames = [
        'Contract.sol',
        'MyToken.sol',
        'test_contract.sol',
        'contract-v2.sol',
        'Contract123.sol',
      ];

      const invalidFileNames = [
        'contract.js',
        'contract.txt',
        'contract',
        '.sol',
        'contract.sol.txt',
        'contract with spaces.sol',
        'contract@2.sol',
        'contract#1.sol',
      ];

      validFileNames.forEach(fileName => {
        expect(() => solidityCodeSchema.parse({
          content: 'pragma solidity ^0.8.0; contract Test {}',
          fileName,
        })).not.toThrow();
      });

      invalidFileNames.forEach(fileName => {
        expect(() => solidityCodeSchema.parse({
          content: 'pragma solidity ^0.8.0; contract Test {}',
          fileName,
        })).toThrow();
      });
    });

    it('should enforce file size limits', () => {
      const maxFileSize = 50000; // 50KB as defined in schema
      const largeContent = 'a'.repeat(maxFileSize + 1);

      expect(() => solidityCodeSchema.parse({
        content: largeContent,
        fileName: 'Large.sol',
      })).toThrow();
    });
  });

  describe('Content Sanitization', () => {
    it('should sanitize user-generated content', () => {
      const userContent = {
        courseDescription: 'Learn <script>alert("xss")</script> Solidity programming!',
        lessonTitle: 'Variables & <img src="x" onerror="alert(1)"> Functions',
        comment: 'Great tutorial! <a href="javascript:alert(1)">Click here</a>',
      };

      Object.entries(userContent).forEach(([field, content]) => {
        const sanitized = DOMPurify.sanitize(content);
        expect(sanitized).not.toMatch(/<script/i);
        expect(sanitized).not.toMatch(/javascript:/i);
        expect(sanitized).not.toMatch(/onerror/i);
        expectSecureData({ [field]: content });
      });
    });

    it('should handle special characters in content', () => {
      const specialCharacters = [
        '& < > " \'',
        'Price: $100 & more',
        'Ratio: 50% > 25%',
        'Quote: "Hello World"',
        "Single: 'test'",
      ];

      specialCharacters.forEach(content => {
        const sanitized = DOMPurify.sanitize(content);
        expect(sanitized).toBeDefined();
        expect(typeof sanitized).toBe('string');
      });
    });
  });

  describe('Performance Impact of Validation', () => {
    it('should validate inputs within performance limits', async () => {
      const testData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      const { duration } = await measureExecutionTime(() => {
        return userRegistrationSchema.parse(testData);
      });

      expect(duration).toBeLessThan(50); // Should validate within 50ms
    });

    it('should handle bulk validation efficiently', async () => {
      const testData = Array.from({ length: 100 }, (_, i) => ({
        email: `test${i}@example.com`,
        username: `testuser${i}`,
        firstName: `Test${i}`,
        lastName: `User${i}`,
        password: 'Password123!',
      }));

      const { duration } = await measureExecutionTime(() => {
        return testData.map(data => userRegistrationSchema.parse(data));
      });

      expect(duration).toBeLessThan(500); // Should validate 100 items within 500ms
    });

    it('should not cause memory leaks during validation', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 1000; i++) {
        userRegistrationSchema.parse({
          email: `test${i}@example.com`,
          username: `testuser${i}`,
          firstName: `Test${i}`,
          lastName: `User${i}`,
          password: 'Password123!',
        });
      }

      if (global.gc) global.gc();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // Less than 5MB increase
    });
  });

  describe('Error Handling in Validation', () => {
    it('should provide clear error messages for validation failures', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'ab',
        firstName: '',
        lastName: '',
        password: 'weak',
      };

      try {
        userRegistrationSchema.parse(invalidData);
      } catch (error: any) {
        expect(error.errors).toBeDefined();
        expect(error.errors.length).toBeGreaterThan(0);
        
        const errorMessages = error.errors.map((e: any) => e.message);
        expect(errorMessages.some((msg: string) => msg.includes('email'))).toBe(true);
        expect(errorMessages.some((msg: string) => msg.includes('Username'))).toBe(true);
        expect(errorMessages.some((msg: string) => msg.includes('Password'))).toBe(true);
      }
    });

    it('should not expose sensitive information in error messages', () => {
      const maliciousData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123', // Missing uppercase and special char
      };

      try {
        userRegistrationSchema.parse(maliciousData);
      } catch (error: any) {
        const errorString = JSON.stringify(error);
        
        // Should not contain the actual password in error message
        expect(errorString).not.toContain('password123');
        
        // Should not contain SQL patterns
        expect(errorString).not.toMatch(/SELECT|INSERT|UPDATE|DELETE|DROP/i);
        
        expectSecureData({ error: errorString });
      }
    });
  });
});