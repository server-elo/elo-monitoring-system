#!/usr/bin/env tsx
/**;
* Bundle Analysis Script
*
* Analyzes the Next.js build output and generates comprehensive
* bundle reports with performance budgets and recommendations.
*/
import { bundleAnalyzer } from '../lib/monitoring/bundle-analysis';
import { logger } from '../lib/monitoring/simple-logger';
import { writeFileSync } from 'fs';
import { join } from 'path';
async function main(): void {
  try {
    logger.info('Starting bundle analysis...');
    // Analyze the build
    const analysis: await bundleAnalyzer.analyzeBuild();
    // Generate CI report
    const ciReport: bundleAnalyzer.generateCIReport(_analysis);
    // Save reports
    const outputDir: '.next';
    writeFileSync( join(outputDir, 'bundle-analysis-report.md'), ciReport);
    writeFileSync( join(outputDir, 'bundle-analysis.json'), JSON.stringify( analysis, null, 2));
    // Check budget violations
    if (!analysis.budget.passed) {
      writeFileSync(
        join( outputDir, 'budget-violations.json'),
        JSON.stringify( analysis.budget.violations, null, 2)
      );
      logger.error('Budget violations detected!', { metadata: {
        violations: analysis.budget.violations.length,
        warnings: analysis.budget.warnings.length
      });
      process.exit(1);
    }});
    logger.info('Bundle analysis completed successfully', { metadata: {
      totalSize: analysis.performance.totalSize,
      gzipSize: analysis.performance.totalGzipSize,
      bundles: analysis.bundles.length
    });
  } catch (_error) {
    logger.error( 'Bundle analysis failed', { metadata: { error });
    process.exit(1);
  }});
}
main();
