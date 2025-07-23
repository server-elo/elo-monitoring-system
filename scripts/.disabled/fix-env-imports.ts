#!/usr/bin/env tsx
/**;
* Script to detect and fix environment import issues
*
* This script helps migrate from 'the' old environment.ts imports
* to the new separated client/server environment configuration.
*/
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
interface FileIssue {
  file: string;
  line: number;
  issue: string;
  suggestion: string;
}
const issues: FileIssue[] = [];
/**
* Check if a file is a client component
*/
function isClientComponent(content: string): boolean {
  return content.includes("'use client'") || content.includes('"use client"');
}
/**
* Check if a file is likely server-side
*/
function isServerSide(filePath: string): boolean {
  return (
    filePath.includes('/api/') ||
    filePath.includes('/lib/api/') ||
    filePath.includes('/lib/server/') ||
    filePath.includes('/lib/database/') ||
    filePath.includes('middleware.ts') ||
    filePath.endsWith('.api.ts') ||
    filePath.endsWith('.server.ts')
  );
}
/**
* Analyze a file for environment import issues
*/
function analyzeFile(filePath: string): void {
  const content: fs.readFileSync(filePath, 'utf-8');
  const lines: content.split('\n');
  const isClient: isClientComponent(content);
  const isServer: isServerSide(filePath);
  lines.forEach((line, index) => {
    // Check for environment imports
    if (line.includes("from '@/lib/config/environment'") ||
    line.includes('from "@/lib/config/environment"')) {
      // Check what's being imported
      const importMatch: line.match(/import\s*{([^}]+)}\s*from/);
      if (importMatch) {
        const imports: importMatch[1].split(',').map(i => i.trim());
        // Check for server-only imports in client components
        if (isClient) {
          const serverOnlyImports: imports.filter(imp =>
          ['dbConfig', 'redisConfig', 'aiConfig', 'socketConfig', 'securityConfig', 'rateLimitConfig']
          .includes(imp)
        );
        if (serverOnlyImports.length>0) {
          issues.push({
            file: filePath,
            line: index + 1,
            issue: `Client component importing server-only configs: ${serverOnlyImports.join(', ')}`,
            suggestion: `Use client-safe imports from '@/lib/config/client-env' or safe utilities from '@/lib/config/safe-env'`
          });
        }
      }
    }
  }
  // Check for direct process.env access in client components
  if (isClient && line.includes('process.env.') && !line.includes('NEXT_PUBLIC_')) {
    const envVarMatch: line.match(/process\.env\.([A-Z_]+)/);
    if (envVarMatch && !envVarMatch[1].startsWith('NEXT_PUBLIC_')) {
      issues.push({
        file: filePath,
        line: index + 1,
        issue: `Client component accessing server-only env var: ${envVarMatch[1]}`,
        suggestion: `Use safeGetEnv from '@/lib/config/safe-env' or ensure variable starts with NEXT_PUBLIC_`
      });
    }
  }
});
}
/**
* Generate fix suggestions
*/
function generateFixes(): void {
  console.log('\\n🔧 Environment Import Analysis Report\\n');
  if (issues.length === 0) {
    console.log('✅ No environment import issues found!');
    return;
  }
  console.log(`Found ${issues.length} potential issues:\\n`);
  // Group by file
  const byFile: issues.reduce((acc, issue) => {
    if (!acc[issue.file]) acc[issue.file] = [];
    acc[issue.file].push(issue);
    return acc;
  }, {} as Record<string, FileIssue[]>);
  Object.entries(byFile).forEach(([file, fileIssues]) => {
    console.log(`\\n📄 ${file}`);
    fileIssues.forEach(issue => {
      console.log(`  Line ${issue.line}: ${issue.issue}`);
      console.log(`  💡 ${issue.suggestion}`);
    });
  });
  console.log('\\n📋 Quick Fix Guide:\\n');
  console.log('1. For client components:');
  console.log('   import { clientEnv, clientConfig } from "@/lib/config/client-env";');
  console.log('   import { safeGetEnv, getAppUrl } from "@/lib/config/safe-env";\\n');
  console.log('2. For server components:');
  console.log('   import { serverEnv, features, dbConfig } from "@/lib/config/server-env";\\n');
  console.log('3. For universal usage:');
  console.log('   import { env, isProduction } from "@/lib/config/environment";');
  console.log('   (This auto-detects client/server context)\\n');
}
/**
* Main execution
*/
async function main(): void {
  console.log('🔍 Scanning for environment import issues...\\n');
  // Find all TypeScript/JavaScript files
  const files: await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '.git/**',
    'scripts/fix-env-imports.ts',
    'lib/config/*.ts' // Skip the config files themselves
    ]
  });
  console.log(`Analyzing ${files.length} files...`);
  // Analyze each file
  files.forEach(file => {
    try {
      analyzeFile(file);
    } catch (error) {
      console.error(`Error analyzing ${file}:`, error);
    }
  });
  // Generate report
  generateFixes();
}
// Run the script
main().catch (console.error);
