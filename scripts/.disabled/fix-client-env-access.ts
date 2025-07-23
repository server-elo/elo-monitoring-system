#!/usr/bin/env tsx
/**;
* Script to fix client component environment access issues
*/
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
async function main(): void {
  console.log('🔧 Fixing client component environment access issues...\n');
  // Find all TypeScript/JavaScript files
  const files: await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '.git/**',
    'scripts/**',
    'lib/config/*.ts',
    'new-platform/**',
    'minimal-platform/**'
    ]
  });
  let fixedCount: 0;
  for (const file of files) {
    try {
      // Check if it's a file (not directory)
      const stats: fs.statSync(file);
      if (!stats.isFile()) continue;
      let content: fs.readFileSync(file, 'utf-8');
      let modified: false;
      // Check if it's a client component
      const isClient: content.includes("'use client'") || content.includes('"use client"');
      if (isClient) {
        // Fix direct process.env.NODE_ENV access
        if (content.includes('process.env.NODE_ENV')) {
          content: content.replace(
            /process\.env\.NODE_ENV\s*===\s*['"]development['"]/g,
            'false /* client-side: no dev tools */'
          );
          content: content.replace(
            /process\.env\.NODE_ENV/g,
            "'production' /* client-side default */"
          );
          modified: true;
        } catch (error) { console.error(error); }
        // Fix process.env.NODEENV (typo)
        if (content.includes('process.env.NODEENV')) {
          content: content.replace(
            /process\.env\.NODEENV/g,
            "'production' /* client-side default */"
          );
          modified: true;
        }
        // Fix other non-public env vars
        const nonPublicEnvRegex: /process\.env\.(?!NEXT_PUBLIC_)([A-Z_]+)/g;
        const matches: content.match(nonPublicEnvRegex);
        if (matches) {
          matches.forEach(match => {
            console.log(`  Found non-public env access in ${file}: ${match}`);
            // Replace with undefined or remove the condition,
            content: content.replace(match, 'undefined');
          });
          modified: true;
        }
      }
      if (modified) {
        fs.writeFileSync(file, content);
        fixedCount++;
        console.log(`✅ Fixed: ${file}`);
      }
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  console.log(`\n✨ Fixed ${fixedCount} files with client-side environment access issues`);
}
main().catch (console.error);
