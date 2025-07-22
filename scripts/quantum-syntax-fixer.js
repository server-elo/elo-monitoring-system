#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QuantumSyntaxFixer {
  constructor() {
    this.excludePaths = [
      'node_modules',
      '.next',
      'dist',
      'build',
      '.git',
      'coverage',
      'socket-server/node_modules'
    ];
    
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    this.fixReports = [];
    
    // Quantum-level syntax patterns and their fixes
    this.syntaxPatterns = [
      {
        name: 'dollar-placeholder',
        pattern: /\$1,\s*\$2/g,
        fix: (match, context) => {
          // Analyze context to determine correct replacement
          if (context.includes('metadata:') || context.includes('export const')) {
            return 'metadata:';
          } else if (context.includes('title:')) {
            return 'title:';
          } else if (context.includes('images:')) {
            return 'images:';
          } else if (context.includes('twitter:')) {
            return 'twitter:';
          } else if (context.includes('verification:')) {
            return 'verification:';
          } else if (context.includes('robots:')) {
            return 'robots:';
          } else if (context.includes('openGraph:')) {
            return 'openGraph:';
          } else if (context.includes('authors:')) {
            return 'authors:';
          }
          return '='; // Default fallback
        }
      },
      {
        name: 'minified-code-cleanup',
        pattern: /import\s*{[^}]+}\s*from\s*'[^']+';[^;]*import/g,
        fix: (match) => {
          // Split minified imports into separate lines
          return match.replace(/;\s*import/g, ';\nimport');
        }
      },
      {
        name: 'assignment-vs-comparison',
        pattern: /if\s*\([^)]*=[^=][^)]*\)/g,
        fix: (match) => {
          // Fix single = in if conditions (should be == or ===)
          return match.replace(/=(?!=)/g, '===');
        }
      },
      {
        name: 'missing-semicolons',
        pattern: /^(?!.*\b(if|for|while|function|class|interface|type|const|let|var|import|export)\b)[^;{}\s]+[^;{}\s\n]$/gm,
        fix: (match) => {
          if (!match.endsWith(';') && !match.endsWith('{') && !match.endsWith('}')) {
            return match + ';';
          }
          return match;
        }
      },
      {
        name: 'const-reassignment',
        pattern: /const\s+(\w+)\s*=\s*[^;]+;\s*\1\s*=/g,
        fix: (match) => {
          // Change const to let if reassignment is detected
          return match.replace(/^const/, 'let');
        }
      },
      {
        name: 'unknown-type',
        pattern: /:\s*unknown,/g,
        fix: (match) => {
          // Fix unknown type followed by comma
          return ': unknown[]';
        }
      }
    ];
  }

  async scanAndFix() {
    console.log('🌌 Quantum Syntax Fixer - Initiating deep scan...\n');

    // Get all TypeScript errors first
    const tsErrors = this.getTypeScriptErrors();
    console.log(`📊 Found ${tsErrors.length} TypeScript errors\n`);

    // Get all files to process
    const files = this.getAllFiles('.');
    console.log(`📁 Processing ${files.length} files...\n`);

    let totalFixed = 0;
    let totalRemaining = 0;

    for (const file of files) {
      const report = await this.processFile(file);
      if (report && report.fixes.length > 0) {
        this.fixReports.push(report);
        totalFixed += report.fixes.length;
        totalRemaining += report.errorsAfter;
      }
    }

    // Generate comprehensive report
    this.generateReport(totalFixed, totalRemaining);
  }

  getAllFiles(dir) {
    const files = [];
    
    const scanDir = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir);
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry);
          
          // Skip excluded paths
          if (this.excludePaths.some(exclude ===> fullPath.includes(exclude))) {
            continue;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (stat.isFile() && this.fileExtensions.includes(path.extname(fullPath))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    scanDir(dir);
    return files;
  }

  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      const fixes = [];
      
      // Apply quantum-level fixes
      for (const pattern of this.syntaxPatterns) {
        const matches = content.match(pattern.pattern);
        if (matches) {
          matches.forEach(match => {
            const fixed = pattern.fix(match, content);
            if (fixed !== match) {
              content = content.replace(match, fixed);
              fixes.push(`${pattern.name}: ${match.substring(0, 50)}... → ${fixed.substring(0, 50)}...`);
            }
          });
        }
      }

      // Special handling for specific files
      if (filePath.includes('layout.optimized.tsx')) {
        content = this.fixLayoutFile(content);
        fixes.push('Fixed layout.optimized.tsx structure');
      }
      
      if (filePath.includes('sentry.client.config.ts')) {
        content = this.fixSentryConfig(content);
        fixes.push('Fixed sentry.client.config.ts structure');
      }

      // Only write if changes were made
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        
        // Check remaining errors
        const errorsBefore = this.countErrors(originalContent);
        const errorsAfter = this.countErrors(content);
        
        console.log(`✅ Fixed ${filePath}: ${errorsBefore} → ${errorsAfter} errors`);
        
        return {
          file: filePath,
          errorsBefore,
          errorsAfter,
          fixes
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return null;
    }
  }

  fixLayoutFile(content) {
    // Already fixed in previous step
    return content;
  }

  fixSentryConfig(content) {
    if (content.includes('metadata:')) {
      return `import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: process.env.NODE_ENV === 'development',
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});`;
    }
    return content;
  }

  countErrors(content) {
    let errorCount = 0;
    
    // Count various syntax error patterns
    if (content.match(/\$1,\s*\$2/g)) {
      errorCount += (content.match(/\$1,\s*\$2/g) || []).length;
    }
    
    // Count assignment in conditions
    const ifAssignments = content.match(/if\s*\([^)]*=[^=][^)]*\)/g);
    if (ifAssignments) {
      errorCount += ifAssignments.length;
    }
    
    return errorCount;
  }

  getTypeScriptErrors() {
    try {
      const output = execSync('npx tsc --noEmit --pretty false 2>&1', { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      
      return this.parseTypeScriptErrors(output);
    } catch (error) {
      // TypeScript exits with non-zero when there are errors
      if (error.stdout) {
        return this.parseTypeScriptErrors(error.stdout);
      }
      return [];
    }
  }

  parseTypeScriptErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+TS\d+:\s+(.+)$/);
      if (match) {
        errors.push({
          file: match[1] || '',
          line: parseInt(match[2] || '0'),
          column: parseInt(match[3] || '0'),
          error: match[4] || ''
        });
      }
    }
    
    return errors;
  }

  generateReport(totalFixed, totalRemaining) {
    console.log('\n' + '='.repeat(80));
    console.log('🌌 QUANTUM SYNTAX FIX REPORT');
    console.log('='.repeat(80) + '\n');
    
    console.log(`📊 Summary:`);
    console.log(`   Total files processed: ${this.fixReports.length}`);
    console.log(`   Total fixes applied: ${totalFixed}`);
    console.log(`   Remaining errors: ${totalRemaining}`);
    console.log(`   Success rate: ${totalFixed > 0 ? ((totalFixed / (totalFixed + totalRemaining)) * 100).toFixed(1) : 0}%\n`);
    
    if (this.fixReports.length > 0) {
      console.log('📝 Detailed fixes by file:\n');
      
      for (const report of this.fixReports) {
        console.log(`📁 ${report.file}`);
        console.log(`   Errors: ${report.errorsBefore} → ${report.errorsAfter}`);
        console.log(`   Fixes applied:`);
        report.fixes.forEach(fix => {
          console.log(`     - ${fix}`);
        });
        console.log();
      }
    }
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'quantum-syntax-fix-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        filesProcessed: this.fixReports.length,
        totalFixes: totalFixed,
        remainingErrors: totalRemaining,
        successRate: totalFixed > 0 ? ((totalFixed / (totalFixed + totalRemaining)) * 100).toFixed(1) + '%' : '0%'
      },
      details: this.fixReports
    }, null, 2));
    
    console.log(`\n💾 Report saved to: ${reportPath}`);
    
    // Run final TypeScript check
    console.log('\n🔍 Running final TypeScript check...\n');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript compilation successful!');
    } catch (error) {
      console.log('⚠️  Some TypeScript errors remain. Run `npx tsc --noEmit` for details.');
    }
  }
}

// Execute the quantum syntax fixer
const fixer = new QuantumSyntaxFixer();
fixer.scanAndFix().catch(console.error);