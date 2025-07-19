const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  console.log('🚀 Starting global test setup...');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
    process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379/1';
    process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
    process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.CACHE_ENABLED = 'false';
    process.env.LOG_LEVEL = 'error';

    // Setup test database
    await setupTestDatabase();

    // Setup test Redis
    await setupTestRedis();

    // Setup test file system
    await setupTestFileSystem();

    // Initialize test data
    await initializeTestData();

    console.log('✅ Global test setup completed successfully');
  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    process.exit(1);
  }
};

async function setupTestDatabase() {
  console.log('📊 Setting up test database...');

  try {
    // Check if database exists and create if needed
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('postgresql://')) {
      // For PostgreSQL
      const dbName = dbUrl.split('/').pop();
      const baseUrl = dbUrl.substring(0, dbUrl.lastIndexOf('/'));
      
      try {
        // Try to connect to the test database
        execSync(`psql "${dbUrl}" -c "SELECT 1;" 2>/dev/null`, { stdio: 'ignore' });
        console.log('  ✓ Test database exists');
      } catch (error) {
        // Database doesn't exist, create it
        try {
          execSync(`psql "${baseUrl}/postgres" -c "CREATE DATABASE ${dbName};" 2>/dev/null`, { stdio: 'ignore' });
          console.log('  ✓ Test database created');
        } catch (createError) {
          console.log('  ⚠️ Could not create test database (may already exist)');
        }
      }

      // Run migrations
      try {
        execSync('npm run db:migrate:test', { stdio: 'ignore' });
        console.log('  ✓ Database migrations applied');
      } catch (error) {
        console.log('  ⚠️ Database migrations skipped (no migration script)');
      }
    } else {
      console.log('  ⚠️ Using in-memory database for tests');
    }
  } catch (error) {
    console.log('  ⚠️ Database setup skipped:', error.message);
  }
}

async function setupTestRedis() {
  console.log('🔴 Setting up test Redis...');

  try {
    // Check if Redis is available
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      // Try to connect to Redis
      const redis = require('redis');
      const client = redis.createClient({ url: redisUrl });
      
      await client.connect();
      await client.flushDb(); // Clear test database
      await client.disconnect();
      
      console.log('  ✓ Test Redis connected and cleared');
    } else {
      console.log('  ⚠️ Redis not configured, using in-memory cache');
    }
  } catch (error) {
    console.log('  ⚠️ Redis setup skipped:', error.message);
  }
}

async function setupTestFileSystem() {
  console.log('📁 Setting up test file system...');

  const fs = require('fs').promises;
  const testDirs = [
    'tmp/test-uploads',
    'tmp/test-backups',
    'tmp/test-exports',
    'coverage',
    '__tests__/fixtures/uploads',
    '__tests__/fixtures/exports',
  ];

  try {
    for (const dir of testDirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
    console.log('  ✓ Test directories created');
  } catch (error) {
    console.log('  ⚠️ File system setup warning:', error.message);
  }
}

async function initializeTestData() {
  console.log('🌱 Initializing test data...');

  try {
    // Create test fixtures
    const fs = require('fs').promises;
    
    // Sample test data
    const testUsers = [
      {
        id: 'test-user-1',
        email: 'student@test.com',
        name: 'Test Student',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      {
        id: 'test-user-2',
        email: 'instructor@test.com',
        name: 'Test Instructor',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      },
      {
        id: 'test-user-3',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    ];

    const testLessons = [
      {
        id: 'test-lesson-1',
        title: 'Introduction to Solidity',
        description: 'Learn the basics of Solidity',
        type: 'THEORY',
        difficulty: 'BEGINNER',
        estimatedDuration: 30,
        xpReward: 100,
      },
      {
        id: 'test-lesson-2',
        title: 'Smart Contract Development',
        description: 'Build your first smart contract',
        type: 'PRACTICAL',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 60,
        xpReward: 200,
      },
    ];

    // Write test fixtures
    await fs.writeFile(
      '__tests__/fixtures/users.json',
      JSON.stringify(testUsers, null, 2)
    );

    await fs.writeFile(
      '__tests__/fixtures/lessons.json',
      JSON.stringify(testLessons, null, 2)
    );

    // Create sample files for upload tests
    await fs.writeFile(
      '__tests__/fixtures/uploads/sample.txt',
      'This is a sample file for testing uploads'
    );

    await fs.writeFile(
      '__tests__/fixtures/uploads/sample.json',
      JSON.stringify({ test: true, data: 'sample' }, null, 2)
    );

    console.log('  ✓ Test fixtures created');
  } catch (error) {
    console.log('  ⚠️ Test data initialization warning:', error.message);
  }
}

// Utility functions for tests
global.testSetup = {
  // Database utilities
  async cleanDatabase() {
    // Clean test database between tests
    if (process.env.DATABASE_URL) {
      try {
        const { execSync } = require('child_process');
        execSync('npm run db:reset:test', { stdio: 'ignore' });
      } catch (error) {
        console.warn('Database cleanup failed:', error.message);
      }
    }
  },

  // Redis utilities
  async cleanRedis() {
    // Clean test Redis between tests
    if (process.env.REDIS_URL) {
      try {
        const redis = require('redis');
        const client = redis.createClient({ url: process.env.REDIS_URL });
        await client.connect();
        await client.flushDb();
        await client.disconnect();
      } catch (error) {
        console.warn('Redis cleanup failed:', error.message);
      }
    }
  },

  // File system utilities
  async cleanFileSystem() {
    // Clean test files between tests
    const fs = require('fs').promises;
    const testDirs = ['tmp/test-uploads', 'tmp/test-exports'];
    
    for (const dir of testDirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.startsWith('test-')) {
            await fs.unlink(path.join(dir, file));
          }
        }
      } catch (error) {
        // Directory might not exist or be empty
      }
    }
  },

  // Load test fixtures
  async loadFixture(name) {
    const fs = require('fs').promises;
    try {
      const data = await fs.readFile(`__tests__/fixtures/${name}.json`, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Failed to load fixture ${name}:`, error.message);
      return null;
    }
  },

  // Create test file
  async createTestFile(name, content) {
    const fs = require('fs').promises;
    const filePath = path.join('tmp/test-uploads', name);
    await fs.writeFile(filePath, content);
    return filePath;
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test data
  generateTestUser(overrides = {}) {
    return {
      id: `test-user-${Date.now()}`,
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'STUDENT',
      status: 'ACTIVE',
      ...overrides,
    };
  },

  generateTestLesson(overrides = {}) {
    return {
      id: `test-lesson-${Date.now()}`,
      title: 'Test Lesson',
      description: 'A test lesson',
      type: 'THEORY',
      difficulty: 'BEGINNER',
      estimatedDuration: 30,
      xpReward: 100,
      ...overrides,
    };
  },
};
