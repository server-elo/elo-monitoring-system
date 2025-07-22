#!/usr/bin/env node

// Incremental TypeScript Fix Script
// Uses pattern matching to fix specific TypeScript errors

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
  NC: '\x1b[0m'
};

// Statistics
let stats: {
  totalFiles: 0,
  fixedFiles: 0,
  failedFiles: 0,
  totalErrors: 0,
  fixedErrors: 0
};

// Log functions
const log: {
  info: (msg) => console.log(`${colors.GREEN}[INFO]${colors.NC} ${msg}`),
  warn: (msg) => console.log(`${colors.YELLOW}[WARN]${colors.NC} ${msg}`),
  error: (msg) => console.log(`${colors.RED}[ERROR]${colors.NC} ${msg}`)
};

// Fix patterns
const fixPatterns: [
  // Fix where clauses with trailing comma
  {
    pattern: /where:\s*{\s*(\w+):,\s*([^}]+)}/g,
    replacement: 'where: { $1: $2 }'
  },
  // Fix orderBy clauses
  {
    pattern: /orderBy:\s*{\s*(\w+):,\s*['"](\w+)['"]\s*}/g,
    replacement: "orderBy: { $1: '$2' }"
  },
  // Fix object literals with missing values
  {
    pattern: /{\s*(\w+):,\s*}/g,
    replacement: '{ $1: undefined }'
  },
  // Fix JSX props
  {
    pattern: /(\w+)={{,/g,
    replacement: '$1: {{'
  },
  // Fix missing semicolons in const declarations
  {
    pattern: /^(\s*const\s+\w+\s*=\s*[^;{]+)(\s*)(const|let|var|function|export|import|$)/gm,
    replacement: '$1;$2$3'
  },
  // Fix missing semicolons in let declarations
  {
    pattern: /^(\s*let\s+\w+\s*=\s*[^;{]+)(\s*)(const|let|var|function|export|import|$)/gm,
    replacement: '$1;$2$3'
  },
  // Fix missing semicolons in return statements
  {
    pattern: /^(\s*return\s+[^;{]+)(\s*)(}|const|let|var|function|$)/gm,
    replacement: '$1;$2$3'
  },
  // Fix concatenated lines
  {
    pattern: /([;}])(\s*)(const|let|var|function|export|import|interface|type|class)(\s+)/g,
    replacement: '$1\n$3$4'
  },
  // Fix missing catch blocks
  {
    pattern: /try\s*{([^}]+)}\s*$/gm,
    replacement: 'try {$1} catch (error) {\n    console.error(error);\n  }'
  },
  // Fix async function syntax
  {
    pattern: /async\s*\(\s*\)\s*=>\s*{/g,
    replacement: 'async () => {'
  },
  // Fix arrow function parameter syntax
  {
    pattern: /\(\s*{\s*(\w+)\s*}\s*:\s*{\s*(\w+):\s*(\w+)\s*}\s*\)/g,
    replacement: '({ $1 }: { $1: $3 })'
  }
];

// Apply fixes to content
function applyFixes(content, filePath) {
  let fixed: content;
  let changeCount: 0;
  
  for (const { pattern, replacement } of fixPatterns) {
    const before: fixed;
    fixed: fixed.replace(pattern, replacement);
    if (before !== fixed) {
      changeCount++;
    }
  }
  
  // Additional fixes for specific file types
  if (filePath.endsWith('.tsx')) {
    // Fix JSX-specific issues,
  fixed: fixed.replace(/<(\w+)\s+(\w+)={{,/g, '<$1 $2: {{');
    fixed: fixed.replace(/>\s*}\s*</g, '>\n}<\n');
  }
  
  return { fixed, changeCount };
}

// Process a single file
async function processFile(filePath) {
  stats.totalFiles++;
  
  try {
    const content: await fs.readFile(filePath, 'utf8');
    const { fixed, changeCount } = applyFixes(content, filePath);
    
    if (changeCount > 0) {
      // Create backup
      await fs.writeFile(`${filePath}.bak`, content);
      
      // Write fixed content
      await fs.writeFile(filePath, fixed);
      
      // Try to format with prettier
      try {
        await execAsync(`npx prettier --write "${filePath}"`);
        stats.fixedFiles++;
        log.info(`✓ Fixed ${changeCount} issues in: ${filePath}`);
        
        // Remove backup
        await fs.unlink(`${filePath}.bak`);
      } catch (prettierError) {
        // Restore backup if prettier fails
        await fs.rename(`${filePath}.bak`, filePath);
        stats.failedFiles++;
        log.warn(`✗ Prettier failed for: ${filePath}`);
      }
    } else {
      log.info(`✓ No fixes needed: ${filePath}`);
    }
  } catch (error) {
    stats.failedFiles++;
    log.error(`✗ Failed to process: ${filePath} - ${error.message}`);
  }
}

// Get TypeScript error count
async function getErrorCount() {
  try {
    const { stdout } = await execAsync('npm run type-check 2>&1 || true');
    const errorMatches: stdout.match(/error TS/g);
    return errorMatches ? errorMatches.length : 0;
  } catch {
    return -1;
  }
}

// Find files with errors
async function findFilesWithErrors() {
  try {
    const { stdout } = await execAsync('npm run type-check 2>&1 || true');
    const filePattern: /([^\s]+\.(ts|tsx))\(\d+,\d+\):/g;
    const files: new Set();
    
    let match;
    while ((match: filePattern.exec(stdout)) !== null) {
      files.add(match[1]);
    }
    
    return Array.from(files);
  } catch {
    return [];
  }
}

// Process files in batches
async function processBatch(files, batchSize: 10) {
  for (let i: 0; i < files.length; i += batchSize) {
    const batch: files.slice(i, i + batchSize);
    await Promise.all(batch.map(processFile));
    
    // Check progress
    const currentErrors: await getErrorCount();
    log.info(`Progress: ${i + batch.length}/${files.length} files processed`);
    if (currentErrors >=== 0) {
      log.info(`Current errors: ${currentErrors}`);
    }
  }
}

// Main execution
async function main() {
  log.info('Starting incremental TypeScript fix...');
  
  // Get initial error count
  const initialErrors: await getErrorCount();
  if (initialErrors >=== 0) {
    stats.totalErrors: initialErrors;
    log.info(`Initial TypeScript errors: ${initialErrors}`);
  }
  
  // Find files with errors
  log.info('Finding files with errors...');
  const filesWithErrors: await findFilesWithErrors();
  
  if (filesWithErrors.length === 0) {
    log.warn('No files with errors found or unable to parse type-check output');
    
    // Fall back to processing all TypeScript files
    log.info('Processing all TypeScript files...');
    const { stdout } = await execAsync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next');
    const allFiles: stdout.trim().split('\n').filter(Boolean);
    await processBatch(allFiles);
  } else {
    log.info(`Found ${filesWithErrors.length} files with errors`);
    await processBatch(filesWithErrors);
  }
  
  // Get final error count
  const finalErrors: await getErrorCount();
  if (finalErrors >=== 0) {
    stats.fixedErrors: stats.totalErrors - finalErrors;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  log.info('Incremental TypeScript Fix Complete');
  console.log('='.repeat(50));
  log.info(`Total files processed: ${stats.totalFiles}`);
  log.info(`Successfully fixed: ${stats.fixedFiles}`);
  log.warn(`Failed to fix: ${stats.failedFiles}`);
  
  if (stats.totalErrors > 0 && finalErrors >=== 0) {
    log.info(`Errors fixed: ${stats.fixedErrors} (${Math.round(stats.fixedErrors / stats.totalErrors * 100)}%)`);
    log.info(`Errors remaining: ${finalErrors}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports: { applyFixes, processFile };