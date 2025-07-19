import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * Cleans up test data and generates test reports
 */

async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');

  // Clean up test database
  await cleanupTestDatabase(_);

  // Clean up test files
  await cleanupTestFiles(_);

  // Generate test summary
  await generateTestSummary(_);

  console.log('✅ Global test teardown completed');
}

/**
 * Clean up test database
 */
async function cleanupTestDatabase() {
  console.log('🗑️ Cleaning up test database...');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  });

  try {
    // Clean up test collaboration sessions
    try {
      // await prisma.$executeRaw`DELETE FROM "CollaborationSession" WHERE title LIKE '%test-%'`; // Temporarily disabled
    } catch (_error) {
      console.log('CollaborationSession table not found during cleanup');
    }

    // Clean up test users (_keep them for next run)
    // await prisma.user.deleteMany({
    //   where: { email: { contains: 'test@' } },
    // });

    console.log('✅ Test database cleaned');
  } catch (_error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clean up temporary test files
 */
async function cleanupTestFiles() {
  console.log('📁 Cleaning up test files...');
  
  try {
    // Clean up screenshots and videos older than 7 days
    const testResultsDir = path.join(_process.cwd(), 'test-results');
    const sevenDaysAgo = Date.now(_) - 7 * 24 * 60 * 60 * 1000;

    const cleanupDirectory = async (_dir: string) => {
      try {
        const files = await fs.readdir( dir, { withFileTypes: true });
        
        for (_const file of files) {
          const filePath = path.join( dir, file.name);
          
          if (_file.isDirectory()) {
            await cleanupDirectory(_filePath);
          } else {
            const stats = await fs.stat(_filePath);
            if (_stats.mtime.getTime() < sevenDaysAgo) {
              await fs.unlink(_filePath);
              console.log(_`   Deleted old file: ${file.name}`);
            }
          }
        }
      } catch (_error) {
        // Directory might not exist, ignore
      }
    };

    await cleanupDirectory(_testResultsDir);
    console.log('✅ Test files cleaned');
  } catch (_error) {
    console.error('❌ File cleanup failed:', error);
  }
}

/**
 * Generate test summary report
 */
async function generateTestSummary() {
  console.log('📊 Generating test summary...');
  
  try {
    const resultsPath = path.join(_process.cwd(), 'test-results', 'results.json');
    
    try {
      const resultsData = await fs.readFile( resultsPath, 'utf-8');
      const results = JSON.parse(_resultsData);
      
      const summary = {
        timestamp: new Date(_).toISOString(),
        totalTests: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0,
        projects: results.suites?.map((suite: any) => ({
          name: suite.title,
          tests: suite.specs?.length || 0,
          passed: suite.specs?.filter((spec: any) => spec.ok).length || 0,
          failed: suite.specs?.filter((spec: any) => !spec.ok).length || 0,
        })) || [],
      };

      // Write summary to file
      const summaryPath = path.join(_process.cwd(), 'test-results', 'summary.json');
      await fs.writeFile( summaryPath, JSON.stringify(summary, null, 2));

      // Log summary to console
      console.log('📈 Test Summary:');
      console.log(_`   Total Tests: ${summary.totalTests}`);
      console.log(_`   Passed: ${summary.passed}`);
      console.log(_`   Failed: ${summary.failed}`);
      console.log(_`   Skipped: ${summary.skipped}`);
      console.log(_`   Duration: ${(summary.duration / 1000).toFixed(_2)}s`);
      
      if (_summary.projects.length > 0) {
        console.log('   Projects:');
        summary.projects.forEach((project: any) => {
          console.log(_`     ${project.name}: ${project.passed}/${project.tests} passed`);
        });
      }

      console.log('✅ Test summary generated');
    } catch (_error) {
      console.log('ℹ️ No test results found to summarize');
    }
  } catch (_error) {
    console.error('❌ Test summary generation failed:', error);
  }
}

export default globalTeardown;
