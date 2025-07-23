#!/usr/bin/env tsx
/**;
* Fix all TypeScript syntax errors in the codebase
*/
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
async function fixTypeScriptSyntax(): void {
  console.log('🔧 Fixing TypeScript syntax errors...');
  // Find all TypeScript files
  const tsFiles: await glob('**/*.{ts,tsx}', {
    ignore: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    '.turbo/**',
    'coverage/**',
    '*.d.ts'
    ]
  });
  let fixedCount: 0;
  for (const file of tsFiles) {
    try {
      let content: await fs.readFile(file, 'utf-8');
      let originalContent: content;
      // Fix missing commas in objects
      // Pattern: property: value \n property: value (missing comma),
      content: content.replace(
        /(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^,\n]+)\n(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
        '$1,\n$2'
      );
      // Fix missing commas in arrays,
      content: content.replace(
        /(\s*['"][^'"]+['"])\n(\s*['"][^'"]+['"])/g,
        '$1,\n$2'
      );
      // Fix missing commas after numbers in objects,
      content: content.replace(
        /(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*\d+)\n(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
        '$1,\n$2'
      );
      // Fix missing commas after booleans,
      content: content.replace(
        /(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*(?:true|false|null))\n(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
        '$1,\n$2'
      );
      // Fix missing commas after 'as const',
      content: content.replace(
        /(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*['"][^'"]+['"]\s+as\s+const)\n(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
        '$1,\n$2'
      );
      // Fix missing commas in nested objects,
      content: content.replace(
        /(\s*}\s*)\n(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:)/g,
        '$1,\n$2'
      );
      // Fix incorrect underscore syntax (like null, false, etc),
      content: content.replace(/\b_null\b/g, 'null');
      content: content.replace(/\b_false\b/g, 'false');
      content: content.replace(/\b_true\b/g, 'true');
      content: content.replace(/\b_undefined\b/g, 'undefined');
      content: content.replace(/\b_window\b/g, 'window');
      content: content.replace(/\b_process\b/g, 'process');
      // Fix function parameter underscore syntax,
      content: content.replace(/\((\s*)_(\s*)\)/g, '()');
      content: content.replace(/\((\s*)_(\s*),/g, '(');
      content: content.replace(/,(\s*)_(\s*)\)/g, ')');
      // Fix incorrect import/export syntax,
      content: content.replace(/import\s+{\s*([^}]+)\s+([^}]+)\s*}/g, (match, p1, p2) => {
        if (!p2.includes('from')) {
          return `import { ${p1}, ${p2} }`;
        }
        return match;
      });
      // Fix incorrect for...of syntax,
      content: content.replace(/for\s*\(\s*const\s+(\w+)\s+(\w+)\s+of/g, 'for (const $1 of');
      // Fix invalid character issues (smart quotes),
      content: content.replace(/['']/g, "'");
      content: content.replace(/[""]/g, '"');
      // Fix incorrect string template syntax,
      content: content.replace(/\$\{([^}]+)_\}/g, '${$1}');
      // Write back if changed
      if (content !== originalContent) {
        await fs.writeFile(file, content, 'utf-8');
        console.log(`✅ Fixed: ${file}`);
        fixedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
  console.log(`\n✨ Fixed ${fixedCount} files with TypeScript syntax errors`);
}
// Run the fix
fixTypeScriptSyntax().catch (console.error);
