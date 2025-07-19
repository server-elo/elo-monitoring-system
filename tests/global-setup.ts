import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

/**
 * Global setup for Playwright tests
 * Initializes test database, creates test users, and sets up authentication
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Initialize test database
  await setupTestDatabase();

  // Create test users
  await createTestUsers();

  // Setup authentication
  await setupAuthentication(config);

  console.log('✅ Global test setup completed');
}

/**
 * Setup test database with clean state
 */
async function setupTestDatabase() {
  console.log('📊 Setting up test database...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Clean existing test data
    try {
      // await prisma.$executeRaw`DELETE FROM "CollaborationSession" WHERE title LIKE '%test-%'`; // Temporarily disabled
    } catch (error) {
      console.log('CollaborationSession table not found, will be created when needed');
    }

    await prisma.user.deleteMany({
      where: { email: { contains: 'test@' } },
    });

    console.log('✅ Test database cleaned');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create test users for different scenarios
 */
async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Create main test user
    const testUser = await prisma.user.upsert({
      where: { email: 'test@soliditylearn.com' },
      update: {},
      create: {
        email: 'test@soliditylearn.com',
        name: 'Test User',
        username: 'testuser',
        image: 'https://avatars.githubusercontent.com/u/1?v=4',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create collaboration test user
    const collabUser = await prisma.user.upsert({
      where: { email: 'collab@soliditylearn.com' },
      update: {},
      create: {
        email: 'collab@soliditylearn.com',
        name: 'Collaboration User',
        username: 'collabuser',
        image: 'https://avatars.githubusercontent.com/u/2?v=4',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create admin test user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@soliditylearn.com' },
      update: {},
      create: {
        email: 'admin@soliditylearn.com',
        name: 'Admin User',
        username: 'adminuser',
        image: 'https://avatars.githubusercontent.com/u/3?v=4',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create test collaboration session (if table exists)
    try {
      // await prisma.$executeRaw`
      //   INSERT INTO "CollaborationSession" (
      //     id, title, description, code, language, "maxParticipants",
      //     "isActive", "createdAt", "updatedAt", "createdBy"
      //   ) VALUES (
      //     'test-session-1',
      //     'test-collaboration-session',
      //     'Test collaboration session for E2E testing',
      //     '// Test Solidity contract\npragma solidity ^0.8.0;\n\ncontract TestContract {\n    uint256 public value;\n    \n    function setValue(uint256 _value) public {\n        value = _value;\n    }\n}',
      //     'solidity',
      //     5,
      //     true,
      //     NOW(),
      //     NOW(),
      //     ${testUser.id}
      //   ) ON CONFLICT (id) DO UPDATE SET
      //     title = EXCLUDED.title,
      //     "updatedAt" = NOW()
      // `; // Temporarily disabled
    } catch (error) {
      console.log('CollaborationSession table not available, skipping test session creation');
    }

    console.log('✅ Test users created successfully');
    console.log(`   - Test User: ${testUser.id}`);
    console.log(`   - Collab User: ${collabUser.id}`);
    console.log(`   - Admin User: ${adminUser.id}`);
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Setup authentication for tests
 */
async function setupAuthentication(config: FullConfig) {
  console.log('🔐 Setting up authentication...');
  
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/auth/signin`);

    // Mock authentication for test user
    await page.evaluate(() => {
      // Mock NextAuth session
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@soliditylearn.com',
          name: 'Test User',
          username: 'testuser',
          image: 'https://avatars.githubusercontent.com/u/1?v=4',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Set session in localStorage for client-side access
      localStorage.setItem('test-session', JSON.stringify(mockSession));
      
      // Set authentication cookies
      document.cookie = `next-auth.session-token=test-session-token; path=/; secure; samesite=lax`;
      document.cookie = `next-auth.csrf-token=test-csrf-token; path=/; secure; samesite=lax`;
    });

    // Save authentication state
    await context.storageState({ path: 'tests/auth/user.json' });

    console.log('✅ Authentication setup completed');
  } catch (error) {
    console.error('❌ Authentication setup failed:', error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
