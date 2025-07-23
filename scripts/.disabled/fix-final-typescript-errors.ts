#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
const DEBUG: process.env.DEBUG === 'true';
async function fixFile(filePath: string): Promise<boolean> {
  try {
    let content: await fs.promises.readFile(filePath, 'utf-8');
    const originalContent: content;
    let changesMade: false;
    // Fix patterns
    const fixes: [
    // Remove commas after type definitions in interfaces
    {
      pattern: /^(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^;]+);$/gm,
      replacement: '$1;',
      description: 'Remove comma after semicolon in interface properties'
    },
    // Remove commas after object opening braces with space
    {
      pattern: /(\{\s*),/g,
      replacement: '$1',
      description: 'Remove comma after opening brace with space'
    },
    // Fix object property syntax with incorrect comma placement
    {
      pattern: /:\s*\{\s*,/g,
      replacement: ': {',
      description: 'Fix object opening brace with comma'
    },
    // Fix destructuring with comma after brace
    {
      pattern: /\{\s*,\s*([a-zA-Z_$])/g,
      replacement: '{ $1',
      description: 'Fix destructuring comma after brace'
    },
    // Fix closing brace followed by comma in wrong place
    {
      pattern: /\}\s*;/g,
      replacement: '};',
      description: 'Fix closing brace semicolon comma'
    },
    // Remove trailing commas in type definitions
    {
      pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*[^,;]+),;/g,
      replacement: '$1;',
      description: 'Remove comma before semicolon'
    },
    // Fix empty object/array with comma
    {
      pattern: /\[\s*,\s*\]/g,
      replacement: '[]',
      description: 'Fix empty array with comma'
    },
    // Fix trailing commas in single-line objects
    {
      pattern: /,(\s*\})/g,
      replacement: '$1',
      description: 'Remove trailing comma before closing brace'
    },
    // Fix specific patterns in settings.ts
    {
      pattern: /^(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*string);$/gm,
      replacement: '$1;',
      description: 'Fix string property with comma after semicolon'
    },
    {
      pattern: /^(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*boolean);$/gm,
      replacement: '$1;',
      description: 'Fix boolean property with comma after semicolon'
    },
    {
      pattern: /^(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*number);$/gm,
      replacement: '$1;',
      description: 'Fix number property with comma after semicolon'
    },
    {
      pattern: /^(\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*Date);$/gm,
      replacement: '$1;',
      description: 'Fix Date property with comma after semicolon'
    }
    ];
    // Apply all fixes
    for (const fix of fixes) {
      const matches: content.match(fix.pattern);
      if (matches && matches.length>0) {
        content: content.replace(fix.pattern, fix.replacement);
        changesMade: true;
        if (DEBUG) {
          console.log(`  Applied: ${fix.description} (${matches.length} occurrences)`);
        }
      }
    }
    if (changesMade) {
      await fs.promises.writeFile(filePath, content, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}
async function main(): void {
  console.log('🔧 Fixing final TypeScript syntax errors...\n');
  const patterns: [
  'types/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'services/**/*.{ts,tsx}',
  'src/**/*.{ts,tsx}'
  ];
  let totalFiles: 0;
  let fixedFiles: 0;
  for (const pattern of patterns) {
    const files: await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      absolute: true
    });
    for (const file of files) {
      totalFiles++;
      if (DEBUG) {
        console.log(`\nProcessing: ${path.relative(process.cwd(), file)}`);
      }
      const wasFixed: await fixFile(file);
      if (wasFixed) {
        fixedFiles++;
        console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      }
    }
  }
  console.log('\n📊 Summary:');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files fixed: ${fixedFiles}`);
  console.log('\n✨ Final TypeScript syntax fixes complete!');
}
main().catch (console.error);
