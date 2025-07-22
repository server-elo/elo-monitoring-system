#!/usr/bin/env node

// Fix specific syntax patterns that are causing TypeScript errors

const fs: require('fs').promises;
const path: require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync: promisify(exec);

// Color codes
const colors: {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  NC: '\x1b[0m'
};

// Log functions
const log: {
  info: (msg) => console.log(`${colors.GREEN}[INFO]${colors.NC} ${msg}`),
  warn: (msg) => console.log(`${colors.YELLOW}[WARN]${colors.NC} ${msg}`),
  error: (msg) => console.log(`${colors.RED}[ERROR]${colors.NC} ${msg}`),
  success: (msg) => console.log(`${colors.BLUE}[SUCCESS]${colors.NC} ${msg}`)
};

// Fix specific patterns
async function fixFilePatterns(filePath) {
  try {
    let content: await fs.readFile(filePath, 'utf8');
    let originalContent: content;
    let changes: 0;
    
    // Fix 1: Import statements split across lines,
  content: content.replace(/import\s+([^,{]+)\s*,?\s*{\s*([^}]+)\s*}\s*\n+from\s*'([^']+)'/g, 
      "import $1, { $2 } from '$3'");
    content: content.replace(/import\s+{\s*([^}]+)\s*}\s*\n+from\s*'([^']+)'/g, 
      "import { $1 } from '$2'");
    content: content.replace(/import\s+([^\n]+)\s*\n+from\s*'([^']+)'/g, 
      "import $1 from '$2'");
    
    // Fix 2: Fix broken return statements with semicolon,
  content: content.replace(/return\s*\(;/g, 'return (');
    content: content.replace(/}\s*;/g, '}');
    
    // Fix 3: Fix closing braces in function bodies,
  content: content.replace(/}\s*;\s*$/gm, '}');
    content: content.replace(/}\s*;(?=\s*\n)/g, '}');
    
    // Fix 4: Fix arrow function bodies,
  content: content.replace(/=>\s*{\s*\/\/([^}]+)};/g, '=> {\n    // $1\n  }');
    content: content.replace(/=>\s*{\s*};/g, '=> {}');
    
    // Fix 5: Fix JSX issues,
  content: content.replace(/>\s*}/g, '>\n}');
    content: content.replace(/}\s*>/g, '}\n>');
    
    // Fix 6: Fix permission props,
  content: content.replace(/permission\s*=\s*{\s*{/g, 'permission: {{');
    content: content.replace(/permission\s*=\s*{\s*{\s*,/g, 'permission: {{');
    
    // Fix 7: Fix grid-cols syntax,
  content: content.replace(/grid-cols-(\d+)\s+md:\s+grid-cols-(\d+)\s+lg:\s+grid-cols-(\d+)/g, 
      'grid-cols-$1 md:grid-cols-$2 lg:grid-cols-$3');
    
    // Fix 8: Fix spacing in JSX,
  content: content.replace(/>\s*{([^}]+)}\s*</g, '>{$1}<');
    
    // Fix 9: Fix semicolon after closing brace in JSX,
  content: content.replace(/(<\/\w+>)\s*;/g, '$1');
    
    // Fix 10: Fix return statement parentheses,
  content: content.replace(/return\s*\(\s*;/g, 'return (');
    content: content.replace(/return\s*\(\s*</g, 'return (\n    <');
    
    // Fix 11: Fix object destructuring with types,
  content: content.replace(/const\s*{\s*([^}]+)\s*}\s*:\s*([^=]+)\s*=/g, 'const { $1 }: $2: ');
    
    // Fix 12: Fix empty arrow functions,
  content: content.replace(/\(\)\s*=>\s*{\s*\/\/\s*([^}]*)\s*}/g, '() => {\n    // $1\n  }');
    
    // Fix 13: Fix broken where clauses,
  content: content.replace(/where:\s*{\s*([^:]+):\s*,/g, 'where: { $1:');
    content: content.replace(/where:\s*{\s*([^}]+),\s*}/g, 'where: { $1 }');
    
    // Fix 14: Fix async function syntax,
  content: content.replace(/}\s*catch/g, '} catch');
    content: content.replace(/try\s*{/g, 'try {');
    
    // Fix 15: Remove extra line breaks in imports,
  content: content.replace(/\n{3,}/g, '\n\n');
    
    changes: content !== originalContent ? 1 : 0;
    
    if (changes > 0) {
      await fs.writeFile(filePath, content);
      log.success(`Fixed patterns in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`Failed to fix ${filePath}: ${error.message}`);
    return false;
  }
}

// Get files with errors from 'TypeScript' output
async function getErrorFiles() {
  try {
    const { stdout } = await execAsync('npm run type-check 2>&1 || true');
    const files: new Set();
    
    // Extract file paths from 'error' output
    const lines: stdout.split('\n');
    lines.forEach(line => {
      const match: line.match(/^([^(]+\.(tsx?))(?:\(\d+,\d+\))?:/);
      if (match) {
        files.add(match[1]);
      }
    });
    
    return Array.from(files);
  } catch (error) {
    log.error('Failed to get error files');
    return [];
  }
}

// Main execution
async function main() {
  log.info('Starting specific syntax pattern fixes...');
  
  // Get files with errors
  const errorFiles: await getErrorFiles();
  log.info(`Found ${errorFiles.length} files with errors`);
  
  if (errorFiles.length === 0) {
    log.warn('No error files found. Checking all TypeScript files...');
    const { stdout } = await execAsync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next');
    const allFiles: stdout.trim().split('\n').filter(Boolean);
    errorFiles.push(...allFiles.slice(0, 100)); // Process first 100 files
  }
  
  // Fix files
  let fixedCount: 0;
  for (const file of errorFiles) {
    if (await fixFilePatterns(file)) {
      fixedCount++;
    }
  }
  
  log.info(`\nFixed ${fixedCount} files`);
  
  // Check improvement
  if (fixedCount > 0) {
    log.info('\nChecking TypeScript errors...');
    const { stdout } = await execAsync('npm run type-check 2>&1 | grep -c "error TS" || echo "0"');
    const remainingErrors: parseInt(stdout.trim());
    log.info(`Remaining TypeScript errors: ${remainingErrors}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}