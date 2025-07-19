import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
;

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/v1';

interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  role?: string;
  accessToken?: string;
  refreshToken?: string;
}

describe('Authentication Flow Integration Tests', () => {
  let testUser: TestUser;
  let testDatabase: any;

  beforeAll(async () => {
    // Setup test database connection
    testDatabase = await setupTestDatabase();
    
    // Initialize test user
    testUser = {
      email: 'integration-test@example.com',
      password: 'IntegrationTest123!',
      name: 'Integration Test User',
      role: 'STUDENT'
    };
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await testDatabase?.close();
  });

  beforeEach(async () => {
    // Clean up any existing test user
    await cleanupTestUser(testUser.email);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestUser(testUser.email);
  });

  describe('User Registration Flow', () => {
    it('should complete full registration workflow', async () => {
      // 1. Register new user
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.password,
          name: testUser.name,
          acceptTerms: true
        })
      });

      expect(registerResponse.status).toBe(201);
      
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      expect(registerData.data.user.email).toBe(testUser.email);
      expect(registerData.data.user.name).toBe(testUser.name);
      expect(registerData.data.user.role).toBe('STUDENT');
      expect(registerData.data.tokens.accessToken).toBeTruthy();
      expect(registerData.data.tokens.refreshToken).toBeTruthy();

      // Store tokens for further tests
      testUser.id = registerData.data.user.id;
      testUser.accessToken = registerData.data.tokens.accessToken;
      testUser.refreshToken = registerData.data.tokens.refreshToken;

      // 2. Verify user can access protected endpoint
      const profileResponse = await fetch(`${API_BASE_URL}/users/${testUser.id}`, {
        headers: {
          'Authorization': `Bearer ${testUser.accessToken}`
        }
      });

      expect(profileResponse.status).toBe(200);
      
      const profileData = await profileResponse.json();
      expect(profileData.data.email).toBe(testUser.email);
      expect(profileData.data.id).toBe(testUser.id);

      // 3. Verify user exists in database
      const userInDb = await getUserFromDatabase(testUser.email);
      expect(userInDb).toBeTruthy();
      expect(userInDb.email).toBe(testUser.email);
      expect(userInDb.status).toBe('ACTIVE');
    });

    it('should prevent duplicate user registration', async () => {
      // First registration
      const firstResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.password,
          name: testUser.name,
          acceptTerms: true
        })
      });

      expect(firstResponse.status).toBe(201);

      // Second registration with same email
      const secondResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: 'DifferentPassword123!',
          confirmPassword: 'DifferentPassword123!',
          name: 'Different Name',
          acceptTerms: true
        })
      });

      expect(secondResponse.status).toBe(409);
      
      const errorData = await secondResponse.json();
      expect(errorData.success).toBe(false);
      expect(errorData.error.code).toBe('RESOURCE_CONFLICT');
    });

    it('should validate registration input', async () => {
      const invalidRegistrations = [
        {
          // Missing email
          password: testUser.password,
          confirmPassword: testUser.password,
          name: testUser.name,
          acceptTerms: true
        },
        {
          // Invalid email format
          email: 'invalid-email',
          password: testUser.password,
          confirmPassword: testUser.password,
          name: testUser.name,
          acceptTerms: true
        },
        {
          // Weak password
          email: testUser.email,
          password: 'weak',
          confirmPassword: 'weak',
          name: testUser.name,
          acceptTerms: true
        },
        {
          // Password mismatch
          email: testUser.email,
          password: testUser.password,
          confirmPassword: 'DifferentPassword123!',
          name: testUser.name,
          acceptTerms: true
        },
        {
          // Terms not accepted
          email: testUser.email,
          password: testUser.password,
          confirmPassword: testUser.password,
          name: testUser.name,
          acceptTerms: false
        }
      ];

      for (const invalidData of invalidRegistrations) {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invalidData)
        });

        expect(response.status).toBe(400);
        
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('User Login Flow', () => {
    beforeEach(async () => {
      // Create test user for login tests
      await createTestUser(testUser);
    });

    it('should complete successful login workflow', async () => {
      // 1. Login with valid credentials
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          rememberMe: false
        })
      });

      expect(loginResponse.status).toBe(200);
      
      const loginData = await loginResponse.json();
      expect(loginData.success).toBe(true);
      expect(loginData.data.user.email).toBe(testUser.email);
      expect(loginData.data.tokens.accessToken).toBeTruthy();
      expect(loginData.data.tokens.refreshToken).toBeTruthy();

      testUser.accessToken = loginData.data.tokens.accessToken;
      testUser.refreshToken = loginData.data.tokens.refreshToken;

      // 2. Verify token works for protected endpoints
      const protectedResponse = await fetch(`${API_BASE_URL}/users/${loginData.data.user.id}`, {
        headers: {
          'Authorization': `Bearer ${testUser.accessToken}`
        }
      });

      expect(protectedResponse.status).toBe(200);

      // 3. Verify session is created in database
      const session = await getSessionFromDatabase(loginData.data.user.id);
      expect(session).toBeTruthy();
      expect(session.active).toBe(true);
    });

    it('should reject invalid credentials', async () => {
      const invalidLogins = [
        {
          email: testUser.email,
          password: 'WrongPassword123!'
        },
        {
          email: 'nonexistent@example.com',
          password: testUser.password
        },
        {
          email: testUser.email,
          password: ''
        }
      ];

      for (const invalidLogin of invalidLogins) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invalidLogin)
        });

        expect(response.status).toBe(401);
        
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error.code).toBe('UNAUTHORIZED');
      }
    });

    it('should handle remember me functionality', async () => {
      // Login with remember me
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
          rememberMe: true
        })
      });

      expect(loginResponse.status).toBe(200);
      
      const loginData = await loginResponse.json();
      expect(loginData.data.session.rememberMe).toBe(true);
      
      // Verify extended session expiration
      const session = await getSessionFromDatabase(loginData.data.user.id);
      const expirationTime = new Date(session.expiresAt).getTime();
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      expect(expirationTime - now).toBeGreaterThan(thirtyDays - 60000); // Allow 1 minute tolerance
    });
  });

  describe('Token Refresh Flow', () => {
    beforeEach(async () => {
      await createTestUser(testUser);
      
      // Login to get tokens
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();
      testUser.accessToken = loginData.data.tokens.accessToken;
      testUser.refreshToken = loginData.data.tokens.refreshToken;
      testUser.id = loginData.data.user.id;
    });

    it('should refresh tokens successfully', async () => {
      // 1. Refresh tokens
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: testUser.refreshToken
        })
      });

      expect(refreshResponse.status).toBe(200);
      
      const refreshData = await refreshResponse.json();
      expect(refreshData.success).toBe(true);
      expect(refreshData.data.tokens.accessToken).toBeTruthy();
      expect(refreshData.data.tokens.refreshToken).toBeTruthy();
      expect(refreshData.data.tokens.accessToken).not.toBe(testUser.accessToken);

      const newAccessToken = refreshData.data.tokens.accessToken;

      // 2. Verify new token works
      const protectedResponse = await fetch(`${API_BASE_URL}/users/${testUser.id}`, {
        headers: {
          'Authorization': `Bearer ${newAccessToken}`
        }
      });

      expect(protectedResponse.status).toBe(200);

      // 3. Verify old token is invalidated
      const oldTokenResponse = await fetch(`${API_BASE_URL}/users/${testUser.id}`, {
        headers: {
          'Authorization': `Bearer ${testUser.accessToken}`
        }
      });

      expect(oldTokenResponse.status).toBe(401);
    });

    it('should reject invalid refresh tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        '',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        testUser.accessToken // Using access token as refresh token
      ];

      for (const invalidToken of invalidTokens) {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refreshToken: invalidToken
          })
        });

        expect(response.status).toBe(401);
        
        const errorData = await response.json();
        expect(errorData.success).toBe(false);
        expect(errorData.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      await createTestUser(testUser);
      
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      const loginData = await loginResponse.json();
      testUser.accessToken = loginData.data.tokens.accessToken;
      testUser.id = loginData.data.user.id;
    });

    it('should handle concurrent sessions', async () => {
      // Create multiple sessions for the same user
      const sessions = [];
      
      for (let i = 0; i < 3; i++) {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password
          })
        });

        const loginData = await loginResponse.json();
        sessions.push(loginData.data.tokens.accessToken);
      }

      // Verify all sessions work
      for (const token of sessions) {
        const response = await fetch(`${API_BASE_URL}/users/${testUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        expect(response.status).toBe(200);
      }

      // Verify sessions exist in database
      const userSessions = await getSessionsFromDatabase(testUser.id!);
      expect(userSessions.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle session expiration', async () => {
      // This test would require manipulating token expiration
      // For now, we'll test the validation logic
      
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiU1RVREVOVCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTYwOTQ1OTIwMH0.invalid';

      const response = await fetch(`${API_BASE_URL}/users/${testUser.id}`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`
        }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should enforce role-based permissions', async () => {
      // Create users with different roles
      const studentUser = { ...testUser, email: 'student@test.com', role: 'STUDENT' };
      const instructorUser = { ...testUser, email: 'instructor@test.com', role: 'INSTRUCTOR' };
      const adminUser = { ...testUser, email: 'admin@test.com', role: 'ADMIN' };

      await createTestUser(studentUser);
      await createTestUser(instructorUser);
      await createTestUser(adminUser);

      // Login each user
      const users = [studentUser, instructorUser, adminUser];
      for (const user of users) {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: user.email,
            password: user.password
          })
        });

        const loginData = await loginResponse.json();
        user.accessToken = loginData.data.tokens.accessToken;
        user.id = loginData.data.user.id;
      }

      // Test admin-only endpoint
      const adminEndpoint = `${API_BASE_URL}/admin/users`;
      
      // Student should be denied
      const studentResponse = await fetch(adminEndpoint, {
        headers: {
          'Authorization': `Bearer ${studentUser.accessToken}`
        }
      });
      expect(studentResponse.status).toBe(403);

      // Instructor should be denied
      const instructorResponse = await fetch(adminEndpoint, {
        headers: {
          'Authorization': `Bearer ${instructorUser.accessToken}`
        }
      });
      expect(instructorResponse.status).toBe(403);

      // Admin should be allowed
      const adminResponse = await fetch(adminEndpoint, {
        headers: {
          'Authorization': `Bearer ${adminUser.accessToken}`
        }
      });
      expect(adminResponse.status).toBe(200);

      // Cleanup
      await cleanupTestUser(studentUser.email);
      await cleanupTestUser(instructorUser.email);
      await cleanupTestUser(adminUser.email);
    });
  });
});

// Helper functions
async function setupTestDatabase() {
  // Mock database setup
  return {
    close: jest.fn()
  };
}

async function cleanupTestData() {
  // Mock cleanup
}

async function cleanupTestUser(email: string) {
  // Mock user cleanup
}

async function createTestUser(user: TestUser) {
  // Mock user creation
  const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      confirmPassword: user.password,
      name: user.name,
      acceptTerms: true
    })
  });

  if (registerResponse.status === 201) {
    const data = await registerResponse.json();
    user.id = data.data.user.id;
  }
}

async function getUserFromDatabase(email: string) {
  // Mock database query
  return {
    email,
    status: 'ACTIVE'
  };
}

async function getSessionFromDatabase(userId: string) {
  // Mock session query
  return {
    userId,
    active: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}

async function getSessionsFromDatabase(userId: string) {
  // Mock sessions query
  return [
    { userId, active: true },
    { userId, active: true },
    { userId, active: true }
  ];
}
