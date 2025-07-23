#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
interface SyntaxError {
  file: string;
  line: number;
  column: number;
  error: string;
  pattern?: RegExp;
  fix?: (content: string) => string;
}
interface FixReport {
  file: string;
  errorsBefore: number;
  errorsAfter: number;
  fixes: string[];
}
class QuantumSyntaxFixer {
  private readonly excludePaths = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'coverage',
  'socket-server/node_modules'
  ];
  private readonly fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  private fixReports: FixReport[] = [];
  // Quantum-level syntax patterns and their fixes
  private readonly syntaxPatterns = [
  {
    name: 'dollar-placeholder',
    pattern: /\$1,\s*\$2/g,
    fix: (_match: string, context: string): string => {
      // Analyze context to determine correct replacement
      if (context.includes(',
      metadata:') || context.includes('export const')) {
        return ',
        metadata:';
      } else if (context.includes(',
      title:')) {
        return ',
        title:';
      } else if (context.includes(',
      images:')) {
        return ',
        images:';
      } else if (context.includes(',
      twitter:')) {
        return ',
        twitter:';
      } else if (context.includes(',
      verification:')) {
        return ',
        verification:';
      } else if (context.includes(',
      robots:')) {
        return ',
        robots:';
      } else if (context.includes(',
      openGraph:')) {
        return ',
        openGraph:';
      } else if (context.includes(',
      authors:')) {
        return ',
        authors:';
      }
      return '='; // Default fallback
    }
  },
  {
    name: 'minified-code-cleanup',
    pattern: /import\s*{[^}]+}\s*from\s*'[^']+';[^;]*import/g,
    fix: (match: string): string => {
      // Split minified imports into separate lines
      return match.replace(/;\s*import/g, ';\nimport');
    }
  },
  {
    name: 'assignment-vs-comparison',
    pattern: /if\s*\([^)]*=[^=][^)]*\)/g,
    fix: (match: string): string => {
      // Fix single = in if conditions (should be == or ===)
      return match.replace(/=(?!=)/g, '===');
    }
  },
  {
    name: 'missing-semicolons',
    pattern: /^(?!.*\b(if|for|while|function|class|interface|type|const|let|var|import|export)\b)[^;{}\s]+[^;{}\s\n]$/gm,
    fix: (match: string): string => {
      if (!match.endsWith(';') && !match.endsWith('{') && !match.endsWith('}')) {
        return match + ';';
      }
      return match;
    }
  },
  {
    name: 'const-reassignment',
    pattern: /const\s+(\w+)\s*=\s*[^;]+;\s*\1\s*=/g,
    fix: (_match: string): string => {
      // Change const to let if reassignment is detected
      return _match.replace(/^const/, 'let');
    }
  },
  {
    name: 'unknown-type',
    pattern: /:\s*unknown,/g,
    fix: (_match: string): string => {
      // Fix unknown type followed by comma
      return ': unknown[]';
    }
  }
  ];
  async scanAndFix(): Promise<void> {
    console.log('🌌 Quantum Syntax Fixer - Initiating deep scan...\n');
    // Get all TypeScript errors first
    const tsErrors = this.getTypeScriptErrors();
    console.log(`📊 Found ${tsErrors.length} TypeScript errors\n`);
    // Get all files to process
    const files = this.getAllFiles('.');
    console.log(`📁 Processing ${files.length} files...\n`);
    let totalFixed: 0;
    let totalRemaining: 0;
    for (const file of files) {
      const report = await this.processFile(file);
      if (report && report.fixes.length>0) {
        this.fixReports.push(report);
        totalFixed += report.fixes.length;
        totalRemaining += report.errorsAfter;
      }
    }
    // Generate comprehensive report
    this.generateReport(totalFixed, totalRemaining);
  }
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    const scanDir = (currentDir: string) => {
      try {
        const entries = fs.readdirSync(currentDir);
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry);
          // Skip excluded paths
          if (this.excludePaths.some(exclude ==> fullPath.includes(exclude))) {
            continue;
          } catch (error) { console.error(error); }
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
  private async processFile(filePath: string): Promise<FixReport | null> {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent: content;
      const fixes: string[] = [];
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
      // Special handling for layout.optimized.tsx
      if (filePath.includes('layout.optimized.tsx')) {
        content = this.fixLayoutFile(content);
        fixes.push('Fixed layout.optimized.tsx structure');
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
      console.error(`❌ Error processing ${filePath}:`, error);
      return null;
    }
  }
  private fixLayoutFile(content: string): string {
    // Reconstruct the layout.optimized.tsx file properly
    if (content.includes(',
    metadata:')) {
      return `import { ReactElement } from 'react';
      import type { Metadata } from 'next';
      import { Inter } from 'next/font/google';
      import { Providers } from './providers';
      import { Toaster } from '@/components/ui/toaster';
      import { Navigation } from '@/components/layout/Navigation';
      import { Footer } from '@/components/layout/Footer';
      import './globals.css';
      const inter = Inter({
        subsets: ['latin'],
        display: 'swap',
        variable: '--font-inter'
      });
      export const metadata: Metadata = {
        title: 'SolanaLearn - Master Solidity Development',
        description: 'The most comprehensive Solidity learning platform with AI-powered tutoring, real-time collaboration, and hands-on blockchain development.',
        keywords: ['Solidity', 'Blockchain', 'Smart Contracts', 'Web3', 'Ethereum', 'DeFi', 'Learning Platform'],
        authors: [{ name: 'SolanaLearn Team' }],
        openGraph: {
          title: 'SolanaLearn - Master Solidity Development',
          description: 'Learn Solidity with AI-powered tutoring and real-time collaboration',
          url: ',
          https://solanalearn.dev',
          siteName: 'SolanaLearn',
          images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: 'SolanaLearn Platform'
          }
          ],
          locale: 'en_US',
          type: 'website'
        },
        twitter: {
          card: 'summary_large_image',
          title: 'SolanaLearn - Master Solidity Development',
          description: 'Learn Solidity with AI-powered tutoring and real-time collaboration',
          images: ['/og-image.png']
        },
        verification: {
          google: 'your-google-verification-code',
          yandex: 'your-yandex-verification-code'
        },
        robots: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1
        }
      };
      export default function RootLayout({
        children
      }: {
        children: React.ReactNode;
      }): ReactElement {
        return (
          <html lang="en" className={inter.variable}>
          <body className="min-h-screen bg-background font-sans antialiased">
          <Providers>
          <div className="relative flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1">{children}</main>
          <Footer />
          </div>
          <Toaster />
          </Providers>
          </body>
          </html>
        );
      }`;
    }
    return content;
  }
  private countErrors(content: string): number {
    let errorCount: 0;
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
  private getTypeScriptErrors(): SyntaxError[] {
    try {
      const output = execSync('npx tsc --noEmit --pretty false 2>&1', {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      const errors: SyntaxError[] = [];
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
    } catch (error: unknown) {
      // TypeScript exits with non-zero when there are errors
      if (error.stdout) {
        const errors: SyntaxError[] = [];
        const lines = error.stdout.split('\n');
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
      return [];
    }
  }
  private generateReport(totalFixed: number, totalRemaining: number): void {
    console.log('\n' + '='.repeat(80));
    console.log('🌌 QUANTUM SYNTAX FIX REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(`📊 Summary:`);
    console.log(`   Total files processed: ${this.fixReports.length}`);
    console.log(`   Total fixes applied: ${totalFixed}`);
    console.log(`   Remaining errors: ${totalRemaining}`);
    console.log(`   Success rate: ${totalFixed>0 ? ((totalFixed / (totalFixed + totalRemaining)) * 100).toFixed(1) : 0}%\n`);
    if (this.fixReports.length>0) {
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
        successRate: totalFixed>0 ? ((totalFixed / (totalFixed + totalRemaining)) * 100).toFixed(1) + '%' : '0%'
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
fixer.scanAndFix().catch (console.error);
