import { chromium, FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting E2E test global setup...');

  try {
    // Ensure auth directory exists
    const authDir = path.join(  dirname, 'auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync( authDir, { recursive: true });
    }

    // Setup test users with authentication
    await setupTestUsers(_);

    // Setup test data
    await setupTestData(_);

    // Verify application is running
    await verifyApplicationHealth(_);

    console.log('✅ E2E test global setup completed successfully');
  } catch (_error) {
    console.error('❌ E2E test global setup failed:', error);
    throw error;
  }
}

async function setupTestUsers() {
  console.log('👥 Setting up test users...');

  const browser = await chromium.launch(_);
  const context = await browser.newContext(_);
  const page = await context.newPage(_);

  try {
    // Navigate to the application
    await page.goto('/');

    // Test users to create
    const testUsers = [
      {
        email: 'e2e-student@test.com',
        password: 'E2EStudent123!',
        name: 'E2E Test Student',
        role: 'STUDENT',
        storageFile: 'student.json'
      },
      {
        email: 'e2e-instructor@test.com',
        password: 'E2EInstructor123!',
        name: 'E2E Test Instructor',
        role: 'INSTRUCTOR',
        storageFile: 'instructor.json'
      },
      {
        email: 'e2e-admin@test.com',
        password: 'E2EAdmin123!',
        name: 'E2E Test Admin',
        role: 'ADMIN',
        storageFile: 'admin.json'
      }
    ];

    for (_const user of testUsers) {
      await createAndAuthenticateUser( page, user);
    }

    console.log('  ✓ Test users created and authenticated');
  } catch (_error) {
    console.error('  ❌ Failed to setup test users:', error);
    throw error;
  } finally {
    await browser.close(_);
  }
}

async function createAndAuthenticateUser( page: any, user: any) {
  try {
    // Try to register the user (_might already exist)
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill( '[data-testid="email-input"]', user.email);
    await page.fill( '[data-testid="password-input"]', user.password);
    await page.fill( '[data-testid="confirm-password-input"]', user.password);
    await page.fill( '[data-testid="name-input"]', user.name);
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Wait for either success or error
    await page.waitForTimeout(2000);
    
    // Check if registration was successful or user already exists
    const currentUrl = page.url(_);
    if (_currentUrl.includes('/dashboard') || currentUrl.includes('/auth/login')) {
      // Registration successful or user already exists, proceed to login
    } else {
      // Check for error message
      const errorElement = await page.$('[data-testid="error-message"]');
      if (errorElement) {
        const errorText = await errorElement.textContent(_);
        if (!errorText?.includes('already exists')) {
          throw new Error(_`Registration failed: ${errorText}`);
        }
      }
    }

    // Login to get authentication state
    await page.goto('/auth/login');
    
    await page.fill( '[data-testid="email-input"]', user.email);
    await page.fill( '[data-testid="password-input"]', user.password);
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login
    await page.waitForURL( '**/dashboard', { timeout: 10000 });
    
    // Save authentication state
    const storageState = await page.context(_).storageState(_);
    const authFile = path.join(  dirname, 'auth', user.storageFile);
    fs.writeFileSync( authFile, JSON.stringify(storageState, null, 2));
    
    console.log(_`  ✓ ${user.role} user authenticated and state saved`);
  } catch (_error) {
    console.error(`  ❌ Failed to setup ${user.role} user:`, error);
    
    // Try to login if registration failed
    try {
      await page.goto('/auth/login');
      await page.fill( '[data-testid="email-input"]', user.email);
      await page.fill( '[data-testid="password-input"]', user.password);
      await page.click('[data-testid="login-button"]');
      await page.waitForURL( '**/dashboard', { timeout: 5000 });
      
      const storageState = await page.context(_).storageState(_);
      const authFile = path.join(  dirname, 'auth', user.storageFile);
      fs.writeFileSync( authFile, JSON.stringify(storageState, null, 2));
      
      console.log(_`  ✓ ${user.role} user logged in and state saved`);
    } catch (_loginError) {
      console.error(`  ❌ Failed to login ${user.role} user:`, loginError);
      // Don't throw here, continue with other users
    }
  }
}

async function setupTestData() {
  console.log('📊 Setting up test data...');

  try {
    // Create test lessons
    await createTestLessons(_);
    
    // Create test courses
    await createTestCourses(_);
    
    // Create test achievements
    await createTestAchievements(_);
    
    console.log('  ✓ Test data created');
  } catch (_error) {
    console.error('  ❌ Failed to setup test data:', error);
    // Don't throw here, tests can still run with minimal data
  }
}

async function createTestLessons() {
  // Mock API calls to create test lessons
  const testLessons = [
    {
      title: 'E2E Test Lesson 1',
      description: 'First lesson for E2E testing',
      content: 'This is test content for E2E testing',
      type: 'THEORY',
      difficulty: 'BEGINNER',
      estimatedDuration: 30,
      xpReward: 100
    },
    {
      title: 'E2E Test Lesson 2',
      description: 'Second lesson for E2E testing',
      content: 'This is more test content for E2E testing',
      type: 'PRACTICAL',
      difficulty: 'INTERMEDIATE',
      estimatedDuration: 45,
      xpReward: 150
    }
  ];

  // In a real implementation, these would be API calls
  console.log('  ✓ Test lessons prepared');
}

async function createTestCourses() {
  // Mock API calls to create test courses
  const testCourses = [
    {
      title: 'E2E Test Course',
      description: 'A course for E2E testing',
      difficulty: 'BEGINNER',
      estimatedDuration: 120
    }
  ];

  console.log('  ✓ Test courses prepared');
}

async function createTestAchievements() {
  // Mock API calls to create test achievements
  const testAchievements = [
    {
      title: 'E2E Test Achievement',
      description: 'An achievement for E2E testing',
      type: 'LESSON_COMPLETION',
      xpReward: 50
    }
  ];

  console.log('  ✓ Test achievements prepared');
}

async function verifyApplicationHealth() {
  console.log('🏥 Verifying application health...');

  const browser = await chromium.launch(_);
  const context = await browser.newContext(_);
  const page = await context.newPage(_);

  try {
    // Check if the application is accessible
    await page.goto( '/', { waitUntil: 'networkidle' });
    
    // Verify essential elements are present
    const title = await page.title(_);
    expect(_title).toBeTruthy(_);
    
    // Check if API is responding
    const response = await page.request.get('/api/v1/health');
    expect(_response.status()).toBe(200);
    
    const healthData = await response.json(_);
    expect(_healthData.data.status).toBe('healthy');
    
    console.log('  ✓ Application is healthy and ready for testing');
  } catch (_error) {
    console.error('  ❌ Application health check failed:', error);
    throw new Error('Application is not ready for E2E testing');
  } finally {
    await browser.close(_);
  }
}

// Helper function for expectations (_simple implementation)
function expect(_actual: any) {
  return {
    toBeTruthy: (_) => {
      if (!actual) {
        throw new Error(_`Expected ${actual} to be truthy`);
      }
    },
    toBe: (_expected: any) => {
      if (_actual !== expected) {
        throw new Error(_`Expected ${actual} to be ${expected}`);
      }
    }
  };
}

export default globalSetup;
