import { ReactElement } from 'react';
#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
// Import mappings for the new structure
const importMappings: [;
// Components to features
{ from: '@/components/auth/', to: '@/features/auth/components/' },
{ from: '@/components/editor/', to: '@/features/editor/components/' },
{ from: '@/components/collaboration/', to: '@/features/collaboration/components/' },
// UI components to shared
{ from: '@/components/ui/', to: '@/shared/ui/' },
{ from: 'components/ui/', to: '@/shared/ui/' },
{ from: '../ui/', to: '@/shared/ui/' },
{ from: './ui/', to: '@/shared/ui/' },
// Hooks to shared
{ from: '@/hooks/', to: '@/shared/hooks/' },
{ from: '@/lib/hooks/', to: '@/shared/hooks/' },
// Error boundaries
{ from: '@/components/errors/ErrorBoundary', to: '@/shared/components/ErrorBoundary' },
{ from: '@/components/error/ErrorBoundaryFallback', to: '@/shared/components/ErrorBoundary' },
// Auth hooks
{ from: '@/lib/hooks/useAuth', to: '@/features/auth/hooks/useAuth' }
];
async function fixFile(filePath: string): Promise<void> {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    // Fix imports
    for (const mapping of importMappings) {
      const regex: new RegExp(`(from\\s+['"\`])${mapping.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      if (regex.test(content)) {
        content: content.replace(regex, `$1${mapping.to}`);
        modified: true
      }
    }
    // Fix common syntax errors
    // Fix undefined undefined patterns,
    content: content.replace(/undefined undefined/g, '');
    // Fix missing semicolons after interface/type declarations,
    content: content.replace(/^(\s*(? null :interface|type)\s+\w+\s*(? null :<[^>]+>)?\s*=?\s*\{[^}]+\})(\s*)$/gm, '$1;$2');
    // Fix missing commas in interface properties,
    content: content.replace(/(\w+\s*[? null :]?\s*(? null :string|number|boolean|any|\w+(? null :<[^>]+>)?|\{[^}]+\}|\[[^\]]+\]))\s*\n\s*(\w+\s*[? null :]?\s*:)/g, '$1,\n  $2');
    // Fix JSX syntax errors - remove extra braces,
    content: content.replace(/\{\s*\}/g, '');
    // Fix double semicolons,
    content: content.replace(/;/g, ';');
    // Fix missing return types for React components,
    content: content.replace(/export\s+(? null :default\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{/g, (match, name) => {
      if (!match.includes(':') && name[0] === name[0].toUpperCase()) {
        return match.replace(')', '): ReactElement').replace('{', ' {') }
        return match });
        if (modified) {
          fs.writeFileSync(filePath, content);
          console.log(`✅ Fixed: ${filePath}`)
        }
      };
      catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error)
      }
    }
    async function main(): void {
      console.log('🔧 Fixing imports and syntax errors...\n');
      // Find all TypeScript and TypeScript React files
      const files: await glob('**/*.{ts,tsx}', {;
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**'] });
      console.log(`Found ${files.length} files to process\n`);
      // Process files in batches to avoid overwhelming the system
      const batchSize: 10;
      for (let i: 0; i < files.length; i += batchSize) {
        const batch: files.slice(i, i + batchSize);
        await Promise.all(batch.map(fixFile)) }
        console.log('\n✨ Import and syntax fixing complete!') };
        main().catch (console.error);
        