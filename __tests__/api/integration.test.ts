import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
;

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api/v1';

interface TestUser {
  id?: string;
  email: string;
  password: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
}

interface TestContext {
  adminUser: TestUser;
  instructorUser: TestUser;
  studentUser: TestUser;
}

describe('API Integration Tests', () => {
  let context: TestContext;

  beforeAll(async () => {
    // Setup test users
    context = {
      adminUser: {
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        name: 'Test Admin'
      },
      instructorUser: {
        email: 'instructor@test.com',
        password: 'InstructorPassword123!',
        name: 'Test Instructor'
      },
      studentUser: {
        email: 'student@test.com',
        password: 'StudentPassword123!',
        name: 'Test Student'
      }
    };

    // Register and authenticate test users
    await setupTestUsers(context);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(context);
  });

  beforeEach(async () => {
    // Refresh tokens if needed
    await refreshTokensIfNeeded(context);
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const testEmail = 'flowtest@example.com';
      const testPassword = 'FlowTestPassword123!';
      const testName = 'Flow Test User';

      // 1. Register new user
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          confirmPassword: testPassword,
          name: testName,
          acceptTerms: true
        })
      });

      expect(registerResponse.status).toBe(201);
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      expect(registerData.data.user.email).toBe(testEmail);
      expect(registerData.data.tokens.accessToken).toBeTruthy();

      const { accessToken, refreshToken } = registerData.data.tokens;

      // 2. Use access token to access protected endpoint
      const profileResponse = await fetch(`${API_BASE_URL}/users/${registerData.data.user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      expect(profileResponse.status).toBe(200);
      const profileData = await profileResponse.json();
      expect(profileData.data.email).toBe(testEmail);

      // 3. Refresh token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken
        })
      });

      expect(refreshResponse.status).toBe(200);
      const refreshData = await refreshResponse.json();
      expect(refreshData.data.tokens.accessToken).toBeTruthy();
      expect(refreshData.data.tokens.accessToken).not.toBe(accessToken);

      // 4. Login with credentials
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      expect(loginResponse.status).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData.data.user.email).toBe(testEmail);
    });
  });

  describe('User Management Flow', () => {
    it('should handle complete user lifecycle', async () => {
      // 1. Admin creates a new user
      const newUserData = {
        email: 'lifecycle@example.com',
        password: 'LifecyclePassword123!',
        name: 'Lifecycle Test User',
        role: 'STUDENT'
      };

      const createResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        },
        body: JSON.stringify(newUserData)
      });

      expect(createResponse.status).toBe(201);
      const createData = await createResponse.json();
      const userId = createData.data.id;

      // 2. Retrieve user details
      const getUserResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        }
      });

      expect(getUserResponse.status).toBe(200);
      const userData = await getUserResponse.json();
      expect(userData.data.email).toBe(newUserData.email);

      // 3. Update user information
      const updateData = {
        name: 'Updated Lifecycle User',
        role: 'INSTRUCTOR'
      };

      const updateResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        },
        body: JSON.stringify(updateData)
      });

      expect(updateResponse.status).toBe(200);
      const updatedData = await updateResponse.json();
      expect(updatedData.data.name).toBe(updateData.name);
      expect(updatedData.data.role).toBe(updateData.role);

      // 4. List users (should include new user)
      const listResponse = await fetch(`${API_BASE_URL}/users?search=${newUserData.email}`, {
        headers: {
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        }
      });

      expect(listResponse.status).toBe(200);
      const listData = await listResponse.json();
      expect(listData.data.length).toBeGreaterThan(0);
      expect(listData.data.some((user: any) => user.id === userId)).toBe(true);

      // 5. Delete user
      const deleteResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        }
      });

      expect(deleteResponse.status).toBe(204);

      // 6. Verify user is deleted
      const verifyDeleteResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        }
      });

      expect(verifyDeleteResponse.status).toBe(404);
    });
  });

  describe('Lesson Management Flow', () => {
    it('should handle lesson creation and management', async () => {
      // 1. Instructor creates a lesson
      const lessonData = {
        title: 'Integration Test Lesson',
        description: 'This is a test lesson for integration testing',
        content: 'This is the content of the test lesson. It contains detailed information about the topic.',
        type: 'THEORY',
        difficulty: 'BEGINNER',
        estimatedDuration: 30,
        xpReward: 100,
        prerequisites: [],
        tags: ['test', 'integration'],
        courseId: 'course_1'
      };

      const createLessonResponse = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.instructorUser.accessToken}`
        },
        body: JSON.stringify(lessonData)
      });

      expect(createLessonResponse.status).toBe(201);
      const lessonCreateData = await createLessonResponse.json();
      const lessonId = lessonCreateData.data.id;

      // 2. Student retrieves lessons list
      const lessonsResponse = await fetch(`${API_BASE_URL}/lessons`, {
        headers: {
          'Authorization': `Bearer ${context.studentUser.accessToken}`
        }
      });

      expect(lessonsResponse.status).toBe(200);
      const lessonsData = await lessonsResponse.json();
      expect(Array.isArray(lessonsData.data)).toBe(true);

      // 3. Student searches for specific lesson
      const searchResponse = await fetch(`${API_BASE_URL}/lessons?search=Integration Test`, {
        headers: {
          'Authorization': `Bearer ${context.studentUser.accessToken}`
        }
      });

      expect(searchResponse.status).toBe(200);
      const searchData = await searchResponse.json();
      expect(searchData.data.some((lesson: any) => lesson.id === lessonId)).toBe(true);

      // 4. Filter lessons by difficulty
      const filterResponse = await fetch(`${API_BASE_URL}/lessons?difficulty=BEGINNER`, {
        headers: {
          'Authorization': `Bearer ${context.studentUser.accessToken}`
        }
      });

      expect(filterResponse.status).toBe(200);
      const filterData = await filterResponse.json();
      expect(filterData.data.every((lesson: any) => lesson.difficulty === 'BEGINNER')).toBe(true);
    });
  });

  describe('Permission and Authorization Tests', () => {
    it('should enforce role-based access control', async () => {
      // 1. Student tries to create a lesson (should fail)
      const lessonData = {
        title: 'Unauthorized Lesson',
        description: 'This should not be created',
        content: 'Unauthorized content',
        type: 'THEORY',
        difficulty: 'BEGINNER',
        estimatedDuration: 30,
        xpReward: 100,
        courseId: 'course_1'
      };

      const unauthorizedCreateResponse = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${context.studentUser.accessToken}`
        },
        body: JSON.stringify(lessonData)
      });

      expect(unauthorizedCreateResponse.status).toBe(403);

      // 2. Student tries to access admin endpoint (should fail)
      const adminEndpointResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${context.studentUser.accessToken}`
        }
      });

      expect(adminEndpointResponse.status).toBe(403);

      // 3. Instructor tries to access admin endpoint (should fail)
      const instructorAdminResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${context.instructorUser.accessToken}`
        }
      });

      expect(instructorAdminResponse.status).toBe(403);

      // 4. Admin can access all endpoints
      const adminUsersResponse = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${context.adminUser.accessToken}`
        }
      });

      expect(adminUsersResponse.status).toBe(200);
    });

    it('should handle token expiration and refresh', async () => {
      // This test would require manipulating token expiration times
      // For now, we'll test the refresh mechanism
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: context.studentUser.refreshToken
        })
      });

      expect(refreshResponse.status).toBe(200);
      const refreshData = await refreshResponse.json();
      expect(refreshData.data.tokens.accessToken).toBeTruthy();
    });
  });

  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const requests = [];
      
      // Make multiple rapid requests to trigger rate limit
      for (let i = 0; i < 15; i++) {
        requests.push(
          fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
          })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Health Check Tests', () => {
    it('should return system health status', async () => {
      const healthResponse = await fetch(`${API_BASE_URL}/health`);
      
      expect(healthResponse.status).toBe(200);
      const healthData = await healthResponse.json();
      
      expect(healthData.data.status).toMatch(/^(healthy|degraded|unhealthy)$/);
      expect(healthData.data.services).toBeDefined();
      expect(healthData.data.services.database).toBeDefined();
      expect(healthData.data.uptime).toBeGreaterThan(0);
      expect(healthData.data.version).toBeTruthy();
    });
  });
});

// Helper functions
async function setupTestUsers(context: TestContext): Promise<void> {
  // Register and authenticate each test user
  for (const [role, user] of Object.entries(context)) {
    try {
      // Try to register the user
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
        const registerData = await registerResponse.json();
        user.id = registerData.data.user.id;
        user.accessToken = registerData.data.tokens.accessToken;
        user.refreshToken = registerData.data.tokens.refreshToken;
      } else {
        // User might already exist, try to login
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

        if (loginResponse.status === 200) {
          const loginData = await loginResponse.json();
          user.id = loginData.data.user.id;
          user.accessToken = loginData.data.tokens.accessToken;
          user.refreshToken = loginData.data.tokens.refreshToken;
        }
      }
    } catch (error) {
      console.error(`Failed to setup test user ${role}:`, error);
    }
  }
}

async function refreshTokensIfNeeded(context: TestContext): Promise<void> {
  // Check if tokens need refreshing and refresh them
  for (const user of Object.values(context)) {
    if (user.refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refreshToken: user.refreshToken
          })
        });

        if (refreshResponse.status === 200) {
          const refreshData = await refreshResponse.json();
          user.accessToken = refreshData.data.tokens.accessToken;
          user.refreshToken = refreshData.data.tokens.refreshToken;
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
  }
}

async function cleanupTestData(context: TestContext): Promise<void> {
  // Clean up test data if needed
  // This would typically involve deleting test users and data
  console.log('Cleaning up test data...');
}
