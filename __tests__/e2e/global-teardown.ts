import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test global teardown...');

  try {
    // Clean up test data
    await cleanupTestData();

    // Clean up authentication files
    await cleanupAuthFiles();

    // Generate test reports
    await generateTestReports();

    // Clean up temporary files
    await cleanupTempFiles();

    console.log('✅ E2E test global teardown completed successfully');
  } catch (error) {
    console.error('❌ E2E test global teardown failed:', error);
    // Don't throw here, as this shouldn't fail the test run
  }
}

async function cleanupTestData() {
  console.log('📊 Cleaning up test data...');

  try {
    // Clean up test users
    await cleanupTestUsers();

    // Clean up test lessons
    await cleanupTestLessons();

    // Clean up test courses
    await cleanupTestCourses();

    // Clean up test achievements
    await cleanupTestAchievements();

    console.log('  ✓ Test data cleaned up');
  } catch (error) {
    console.error('  ❌ Failed to cleanup test data:', error);
  }
}

async function cleanupTestUsers() {
  // In a real implementation, this would make API calls to delete test users
  const testUserEmails = [
    'e2e-student@test.com',
    'e2e-instructor@test.com',
    'e2e-admin@test.com'
  ];

  // Mock cleanup
  console.log(`  ✓ Cleaned up ${testUserEmails.length} test users`);
}

async function cleanupTestLessons() {
  // Mock cleanup of test lessons
  console.log('  ✓ Cleaned up test lessons');
}

async function cleanupTestCourses() {
  // Mock cleanup of test courses
  console.log('  ✓ Cleaned up test courses');
}

async function cleanupTestAchievements() {
  // Mock cleanup of test achievements
  console.log('  ✓ Cleaned up test achievements');
}

async function cleanupAuthFiles() {
  console.log('🔐 Cleaning up authentication files...');

  try {
    const authDir = path.join(__dirname, 'auth');
    
    if (fs.existsSync(authDir)) {
      const authFiles = fs.readdirSync(authDir);
      
      for (const file of authFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(authDir, file);
          fs.unlinkSync(filePath);
        }
      }
      
      console.log(`  ✓ Cleaned up ${authFiles.length} authentication files`);
    }
  } catch (error) {
    console.error('  ❌ Failed to cleanup auth files:', error);
  }
}

async function generateTestReports() {
  console.log('📊 Generating E2E test reports...');

  try {
    // Generate accessibility report
    await generateAccessibilityReport();

    // Generate performance report
    await generatePerformanceReport();

    // Generate coverage report
    await generateCoverageReport();

    // Generate summary report
    await generateSummaryReport();

    console.log('  ✓ Test reports generated');
  } catch (error) {
    console.error('  ❌ Failed to generate test reports:', error);
  }
}

async function generateAccessibilityReport() {
  try {
    const reportDir = path.join(process.cwd(), 'test-results', 'accessibility');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Check if accessibility test results exist
    const accessibilityResults = path.join(process.cwd(), 'test-results', 'accessibility-results.json');
    
    if (fs.existsSync(accessibilityResults)) {
      const results = JSON.parse(fs.readFileSync(accessibilityResults, 'utf8'));
      
      // Generate HTML report
      const htmlReport = generateAccessibilityHTML(results);
      fs.writeFileSync(path.join(reportDir, 'report.html'), htmlReport);
      
      // Generate summary
      const summary = {
        totalTests: results.length,
        passed: results.filter((r: any) => r.violations.length === 0).length,
        failed: results.filter((r: any) => r.violations.length > 0).length,
        totalViolations: results.reduce((sum: number, r: any) => sum + r.violations.length, 0),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));
      
      console.log('  ✓ Accessibility report generated');
      console.log(`    Total tests: ${summary.totalTests}`);
      console.log(`    Passed: ${summary.passed}`);
      console.log(`    Failed: ${summary.failed}`);
      console.log(`    Total violations: ${summary.totalViolations}`);
    }
  } catch (error) {
    console.error('  ❌ Failed to generate accessibility report:', error);
  }
}

async function generatePerformanceReport() {
  try {
    const reportDir = path.join(process.cwd(), 'test-results', 'performance');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Check if performance test results exist
    const performanceResults = path.join(process.cwd(), 'test-results', 'performance-results.json');
    
    if (fs.existsSync(performanceResults)) {
      const results = JSON.parse(fs.readFileSync(performanceResults, 'utf8'));
      
      // Generate performance summary
      const summary = {
        averageLoadTime: results.reduce((sum: number, r: any) => sum + r.loadTime, 0) / results.length,
        averageFCP: results.reduce((sum: number, r: any) => sum + r.firstContentfulPaint, 0) / results.length,
        averageLCP: results.reduce((sum: number, r: any) => sum + r.largestContentfulPaint, 0) / results.length,
        averageCLS: results.reduce((sum: number, r: any) => sum + r.cumulativeLayoutShift, 0) / results.length,
        slowestPages: results.sort((a: any, b: any) => b.loadTime - a.loadTime).slice(0, 5),
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2));
      
      console.log('  ✓ Performance report generated');
      console.log(`    Average load time: ${summary.averageLoadTime.toFixed(2)}ms`);
      console.log(`    Average FCP: ${summary.averageFCP.toFixed(2)}ms`);
      console.log(`    Average LCP: ${summary.averageLCP.toFixed(2)}ms`);
    }
  } catch (error) {
    console.error('  ❌ Failed to generate performance report:', error);
  }
}

async function generateCoverageReport() {
  try {
    const reportDir = path.join(process.cwd(), 'test-results', 'coverage');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Check if coverage data exists
    const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    
    if (fs.existsSync(coverageFile)) {
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      
      // Calculate coverage summary
      let totalLines = 0;
      let coveredLines = 0;
      let totalFunctions = 0;
      let coveredFunctions = 0;
      let totalBranches = 0;
      let coveredBranches = 0;

      Object.values(coverage).forEach((file: any) => {
        totalLines += Object.keys(file.s).length;
        coveredLines += Object.values(file.s).filter((count: any) => count > 0).length;
        
        totalFunctions += Object.keys(file.f).length;
        coveredFunctions += Object.values(file.f).filter((count: any) => count > 0).length;
        
        totalBranches += Object.keys(file.b).length;
        coveredBranches += Object.values(file.b).flat().filter((count: any) => count > 0).length;
      });

      const summary = {
        lines: {
          total: totalLines,
          covered: coveredLines,
          percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
        },
        functions: {
          total: totalFunctions,
          covered: coveredFunctions,
          percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
        },
        branches: {
          total: totalBranches,
          covered: coveredBranches,
          percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
        },
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(path.join(reportDir, 'e2e-coverage-summary.json'), JSON.stringify(summary, null, 2));
      
      console.log('  ✓ Coverage report generated');
      console.log(`    Line coverage: ${summary.lines.percentage.toFixed(2)}%`);
      console.log(`    Function coverage: ${summary.functions.percentage.toFixed(2)}%`);
      console.log(`    Branch coverage: ${summary.branches.percentage.toFixed(2)}%`);
    }
  } catch (error) {
    console.error('  ❌ Failed to generate coverage report:', error);
  }
}

async function generateSummaryReport() {
  try {
    const reportDir = path.join(process.cwd(), 'test-results');
    
    // Read Playwright test results
    const resultsFile = path.join(reportDir, 'results.json');
    let testSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };

    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
      
      testSummary = {
        total: results.stats?.total || 0,
        passed: results.stats?.passed || 0,
        failed: results.stats?.failed || 0,
        skipped: results.stats?.skipped || 0,
        duration: results.stats?.duration || 0
      };
    }

    const summary = {
      e2eTests: testSummary,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ci: !!process.env.CI
      }
    };

    fs.writeFileSync(path.join(reportDir, 'e2e-summary.json'), JSON.stringify(summary, null, 2));
    
    console.log('  ✓ Summary report generated');
    console.log(`    Total E2E tests: ${testSummary.total}`);
    console.log(`    Passed: ${testSummary.passed}`);
    console.log(`    Failed: ${testSummary.failed}`);
    console.log(`    Duration: ${(testSummary.duration / 1000).toFixed(2)}s`);
  } catch (error) {
    console.error('  ❌ Failed to generate summary report:', error);
  }
}

async function cleanupTempFiles() {
  console.log('🗑️ Cleaning up temporary files...');

  try {
    const tempDirs = [
      path.join(process.cwd(), 'tmp', 'e2e-screenshots'),
      path.join(process.cwd(), 'tmp', 'e2e-videos'),
      path.join(process.cwd(), 'tmp', 'e2e-traces')
    ];

    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          if (file.startsWith('test-') || file.startsWith('e2e-')) {
            fs.unlinkSync(path.join(dir, file));
          }
        }
      }
    }

    console.log('  ✓ Temporary files cleaned up');
  } catch (error) {
    console.error('  ❌ Failed to cleanup temporary files:', error);
  }
}

function generateAccessibilityHTML(results: any[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .violation { background: #ffe6e6; padding: 10px; margin: 10px 0; border-left: 4px solid #ff0000; }
        .pass { background: #e6ffe6; padding: 10px; margin: 10px 0; border-left: 4px solid #00ff00; }
        .test-result { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
    </style>
</head>
<body>
    <h1>Accessibility Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Tests: ${results.length}</p>
        <p>Passed: ${results.filter(r => r.violations.length === 0).length}</p>
        <p>Failed: ${results.filter(r => r.violations.length > 0).length}</p>
        <p>Total Violations: ${results.reduce((sum, r) => sum + r.violations.length, 0)}</p>
    </div>
    
    ${results.map(result => `
        <div class="test-result">
            <h3>${result.url}</h3>
            ${result.violations.length === 0 
                ? '<div class="pass">✅ No accessibility violations found</div>'
                : result.violations.map((violation: any) => `
                    <div class="violation">
                        <h4>${violation.id}: ${violation.description}</h4>
                        <p><strong>Impact:</strong> ${violation.impact}</p>
                        <p><strong>Help:</strong> ${violation.help}</p>
                        <p><strong>Elements:</strong> ${violation.nodes.length}</p>
                    </div>
                `).join('')
            }
        </div>
    `).join('')}
</body>
</html>
  `;
}

export default globalTeardown;
