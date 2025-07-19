const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

module.exports = async () => {
  console.log('🧹 Starting global test teardown...');

  try {
    // Clean up test database
    await cleanupTestDatabase();

    // Clean up test Redis
    await cleanupTestRedis();

    // Clean up test files
    await cleanupTestFiles();

    // Generate test reports
    await generateTestReports();

    console.log('✅ Global test teardown completed successfully');
  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
  }
};

async function cleanupTestDatabase() {
  console.log('📊 Cleaning up test database...');

  try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('test')) {
      // Only clean if it's clearly a test database
      try {
        execSync('npm run db:reset:test', { stdio: 'ignore' });
        console.log('  ✓ Test database cleaned');
      } catch (error) {
        console.log('  ⚠️ Database cleanup skipped (no reset script)');
      }
    } else {
      console.log('  ⚠️ Database cleanup skipped (not a test database)');
    }
  } catch (error) {
    console.log('  ⚠️ Database cleanup warning:', error.message);
  }
}

async function cleanupTestRedis() {
  console.log('🔴 Cleaning up test Redis...');

  try {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl && redisUrl.includes('test')) {
      // Only clean if it's clearly a test Redis instance
      const redis = require('redis');
      const client = redis.createClient({ url: redisUrl });
      
      await client.connect();
      await client.flushDb();
      await client.disconnect();
      
      console.log('  ✓ Test Redis cleaned');
    } else {
      console.log('  ⚠️ Redis cleanup skipped (not a test instance)');
    }
  } catch (error) {
    console.log('  ⚠️ Redis cleanup warning:', error.message);
  }
}

async function cleanupTestFiles() {
  console.log('📁 Cleaning up test files...');

  const testDirs = [
    'tmp/test-uploads',
    'tmp/test-backups',
    'tmp/test-exports',
  ];

  try {
    for (const dir of testDirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.startsWith('test-') || file.includes('temp')) {
            await fs.unlink(path.join(dir, file));
          }
        }
        console.log(`  ✓ Cleaned ${dir}`);
      } catch (error) {
        // Directory might not exist
        console.log(`  ⚠️ ${dir} not found or empty`);
      }
    }
  } catch (error) {
    console.log('  ⚠️ File cleanup warning:', error.message);
  }
}

async function generateTestReports() {
  console.log('📊 Generating test reports...');

  try {
    // Ensure coverage directory exists
    try {
      await fs.mkdir('coverage', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Generate coverage summary
    const coverageExists = await fs.access('coverage/lcov.info').then(() => true).catch(() => false);
    
    if (coverageExists) {
      try {
        // Generate coverage badge
        execSync('npx coverage-badges-cli --output coverage/badges', { stdio: 'ignore' });
        console.log('  ✓ Coverage badges generated');
      } catch (error) {
        console.log('  ⚠️ Coverage badges generation skipped');
      }

      // Generate coverage summary
      try {
        const lcovData = await fs.readFile('coverage/lcov.info', 'utf8');
        const summary = parseLcovSummary(lcovData);
        
        await fs.writeFile(
          'coverage/summary.json',
          JSON.stringify(summary, null, 2)
        );
        
        console.log('  ✓ Coverage summary generated');
        console.log(`    Lines: ${summary.lines.pct}%`);
        console.log(`    Functions: ${summary.functions.pct}%`);
        console.log(`    Branches: ${summary.branches.pct}%`);
        console.log(`    Statements: ${summary.statements.pct}%`);
      } catch (error) {
        console.log('  ⚠️ Coverage summary generation failed:', error.message);
      }
    }

    // Generate test results summary
    try {
      const junitExists = await fs.access('coverage/junit.xml').then(() => true).catch(() => false);
      
      if (junitExists) {
        const junitData = await fs.readFile('coverage/junit.xml', 'utf8');
        const testSummary = parseJunitSummary(junitData);
        
        await fs.writeFile(
          'coverage/test-summary.json',
          JSON.stringify(testSummary, null, 2)
        );
        
        console.log('  ✓ Test summary generated');
        console.log(`    Total tests: ${testSummary.total}`);
        console.log(`    Passed: ${testSummary.passed}`);
        console.log(`    Failed: ${testSummary.failed}`);
        console.log(`    Skipped: ${testSummary.skipped}`);
      }
    } catch (error) {
      console.log('  ⚠️ Test summary generation failed:', error.message);
    }

    // Generate performance report
    await generatePerformanceReport();

  } catch (error) {
    console.log('  ⚠️ Report generation warning:', error.message);
  }
}

function parseLcovSummary(lcovData) {
  const lines = lcovData.split('\n');
  let totalLines = 0, hitLines = 0;
  let totalFunctions = 0, hitFunctions = 0;
  let totalBranches = 0, hitBranches = 0;
  let totalStatements = 0, hitStatements = 0;

  for (const line of lines) {
    if (line.startsWith('LF:')) {
      totalLines += parseInt(line.split(':')[1]);
    } else if (line.startsWith('LH:')) {
      hitLines += parseInt(line.split(':')[1]);
    } else if (line.startsWith('FNF:')) {
      totalFunctions += parseInt(line.split(':')[1]);
    } else if (line.startsWith('FNH:')) {
      hitFunctions += parseInt(line.split(':')[1]);
    } else if (line.startsWith('BRF:')) {
      totalBranches += parseInt(line.split(':')[1]);
    } else if (line.startsWith('BRH:')) {
      hitBranches += parseInt(line.split(':')[1]);
    }
  }

  // Statements are typically the same as lines in most coverage tools
  totalStatements = totalLines;
  hitStatements = hitLines;

  return {
    lines: {
      total: totalLines,
      covered: hitLines,
      pct: totalLines > 0 ? Math.round((hitLines / totalLines) * 100) : 0
    },
    functions: {
      total: totalFunctions,
      covered: hitFunctions,
      pct: totalFunctions > 0 ? Math.round((hitFunctions / totalFunctions) * 100) : 0
    },
    branches: {
      total: totalBranches,
      covered: hitBranches,
      pct: totalBranches > 0 ? Math.round((hitBranches / totalBranches) * 100) : 0
    },
    statements: {
      total: totalStatements,
      covered: hitStatements,
      pct: totalStatements > 0 ? Math.round((hitStatements / totalStatements) * 100) : 0
    }
  };
}

function parseJunitSummary(junitData) {
  // Simple XML parsing for test results
  const testsuiteMatch = junitData.match(/<testsuite[^>]*tests="(\d+)"[^>]*failures="(\d+)"[^>]*skipped="(\d+)"/);
  
  if (testsuiteMatch) {
    const total = parseInt(testsuiteMatch[1]);
    const failed = parseInt(testsuiteMatch[2]);
    const skipped = parseInt(testsuiteMatch[3]);
    const passed = total - failed - skipped;

    return {
      total,
      passed,
      failed,
      skipped,
      success: failed === 0
    };
  }

  return {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    success: false
  };
}

async function generatePerformanceReport() {
  try {
    // Check if performance data exists
    const perfDataExists = await fs.access('coverage/performance.json').then(() => true).catch(() => false);
    
    if (perfDataExists) {
      const perfData = JSON.parse(await fs.readFile('coverage/performance.json', 'utf8'));
      
      // Generate performance summary
      const summary = {
        timestamp: new Date().toISOString(),
        testDuration: perfData.testDuration || 0,
        slowestTests: perfData.slowestTests || [],
        memoryUsage: perfData.memoryUsage || {},
        apiResponseTimes: perfData.apiResponseTimes || {},
        recommendations: generatePerformanceRecommendations(perfData)
      };

      await fs.writeFile(
        'coverage/performance-summary.json',
        JSON.stringify(summary, null, 2)
      );

      console.log('  ✓ Performance report generated');
    }
  } catch (error) {
    console.log('  ⚠️ Performance report generation skipped:', error.message);
  }
}

function generatePerformanceRecommendations(perfData) {
  const recommendations = [];

  if (perfData.testDuration > 300000) { // 5 minutes
    recommendations.push('Consider parallelizing tests or optimizing slow test cases');
  }

  if (perfData.memoryUsage && perfData.memoryUsage.peak > 512 * 1024 * 1024) { // 512MB
    recommendations.push('High memory usage detected - review memory leaks in tests');
  }

  if (perfData.apiResponseTimes) {
    const slowEndpoints = Object.entries(perfData.apiResponseTimes)
      .filter(([_, time]) => time > 1000) // 1 second
      .map(([endpoint]) => endpoint);

    if (slowEndpoints.length > 0) {
      recommendations.push(`Slow API endpoints detected: ${slowEndpoints.join(', ')}`);
    }
  }

  return recommendations;
}

// Cleanup utility functions
global.testTeardown = {
  async cleanupTestData() {
    await cleanupTestDatabase();
    await cleanupTestRedis();
    await cleanupTestFiles();
  },

  async generateReports() {
    await generateTestReports();
  }
};
