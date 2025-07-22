#!/usr/bin/env node

const fs: require('fs');
const path: require('path');
const { execSync } = require('child_process');

// Color codes for output
const colors: {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Statistics tracking
const stats: {
  totalFiles: 0,
  processedFiles: 0,
  fixedFiles: 0,
  failedFiles: 0,
  errorsBefore: 0,
  errorsAfter: 0,
  startTime: Date.now()
};

// Common error patterns and their fixes
const fixPatterns: [
  // Fix function declarations with ternary operators
  {
    pattern: /export\s+default\s+function\s+(\w+)\s*\(\s*\)\s*\?\s*(\w+)\s*{/g,
    replacement: 'export default function $1(): $2 {'
  },
  {
    pattern: /function\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*\?\s*(\w+)\s*{/g,
    replacement: 'function $1($2): $3 {'
  },
  {
    pattern: /async\s+function\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*\?\s*Promise<([^>]+)>\s*{/g,
    replacement: 'async function $1($2): Promise<$3> {'
  },
  
  // Fix arrow functions with ternary operators
  {
    pattern: /const\s+(\w+)\s*=\s*\(\s*([^)]*)\s*\)\s*\?\s*(\w+)\s*=>/g,
    replacement: 'const $1: ($2): $3 =>'
  },
  
  // Fix 'use client' directive on same line as import
  {
    pattern: /'use client';\s*import/g,
    replacement: "'use client';\n\nimport"
  },
  
  // Fix extra spaces in imports
  {
    pattern: /import\s*{\s*([^}]+)\s+}\s*from/g,
    replacement: 'import { $1 } from'
  },
  {
    pattern: /from\s+'([^']+)'\s*;/g,
    replacement: "from '$1';"
  },
  
  // Fix broken object literals
  {
    pattern: /:\s*ErrorState: {{/g,
    replacement: ': ErrorState: {'
  },
  {
    pattern: /={{/g,
    replacement: '= {'
  },
  {
    pattern: /{{\s*{/g,
    replacement: '{ {'
  },
  
  // Fix array/object syntax
  {
    pattern: /,\s*;/g,
    replacement: ';'
  },
  {
    pattern: /:\s*,/g,
    replacement: ': any,'
  },
  {
    pattern: /\[\];\s*([a-zA-Z])/g,
    replacement: '[];\n$1'
  },
  
  // Fix semicolon placement
  {
    pattern: /}\s*catch\s*\(/g,
    replacement: '} catch ('
  },
  {
    pattern: /}\s*finally\s*{/g,
    replacement: '} finally {'
  },
  {
    pattern: /}\s*else\s*{/g,
    replacement: '} else {'
  },
  
  // Fix JSX attribute formatting
  {
    pattern: /className\s*=\s*{cn\(/g,
    replacement: 'className: {cn('
  },
  {
    pattern: /key\s*=\s*{{{/g,
    replacement: 'key: {'
  },
  {
    pattern: /value\s*=\s*{{/g,
    replacement: 'value: {'
  },
  
  // Fix concatenated lines
  {
    pattern: /}\s*const\s+/g,
    replacement: '}\n\nconst '
  },
  {
    pattern: /}\s*export\s+/g,
    replacement: '}\n\nexport '
  },
  {
    pattern: /}\s*import\s+/g,
    replacement: '}\n\nimport '
  },
  {
    pattern: /;\s*const\s+/g,
    replacement: ';\n\nconst '
  },
  {
    pattern: /;\s*export\s+/g,
    replacement: ';\n\nexport '
  },
  
  // Fix useEffect and similar hooks
  {
    pattern: /}\s*,\s*\[/g,
    replacement: '}, ['
  },
  
  // Fix response patterns
  {
    pattern: /response:\s*,\s*{}/g,
    replacement: 'response: {}'
  },
  
  // Fix type annotations
  {
    pattern: /type:\s*string\s*,\s*;/g,
    replacement: 'type: string;'
  },
  
  // Fix return statements
  {
    pattern: /return\s*\(\s*;/g,
    replacement: 'return ('
  },
  
  // Fix JSX closing tags
  {
    pattern: /<\/(\w+)>\s*;\s*<\/(\w+)>/g,
    replacement: '</$1>\n        </$2>'
  },
  
  // Fix object property syntax
  {
    pattern: /(\w+):\s*(\d+);/g,
    replacement: '$1: $2,'
  }
];

// Complex patterns that need special handling
function applyComplexFixes(content) {
  // Fix malformed object initialization,
  content: content.replace(/const\s+(\w+):\s*(\w+)\s*={{\s*{/g, 'const $1: $2: {');
  
  // Fix broken array literals,
  content: content.replace(/\[\];\s*(\w+):/g, '[];\n  $1:');
  
  // Fix conditional rendering in JSX,
  content: content.replace(/}\s*:\s*null/g, '} : null');
  
  // Fix object destructuring,
  content: content.replace(/}\s*=\s*(\w+);/g, '} = $1;');
  
  // Fix missing semicolons after statements,
  content: content.replace(/}\s*(\w+\s*\()/g, '};\n$1');
  
  // Fix broken catch blocks,
  content: content.replace(/catch\s*\(\s*error\s*\)\s*{\s*([^}]+)\s*}\s*}/g, 'catch (error) {\n    $1\n  }\n}');
  
  // Fix function calls split across lines,
  content: content.replace(/\)\s*,\s*(\w+)\s*:/g, '),\n  $1:');
  
  // Fix broken if statements,
  content: content.replace(/if\s*\(\s*([^)]+)\s*\)\s*{\s*([^}]+)\s*}\s*else/g, 'if ($1) {\n    $2\n  } else');
  
  // Fix broken ternary operators in type definitions,
  content: content.replace(/\)\s*\?\s*(\w+)\s*:\s*null;/g, '): $1 | null;');
  
  return content;
}

// Function to fix line breaks and formatting
function fixLineBreaks(content) {
  // Split overly long lines
  const lines: content.split('\n');
  const fixedLines: [];
  
  for (let line of lines) {
    if (line.length > 200) {
      // Try to intelligently split long lines,
  line: line
        .replace(/;\s*(?=[a-zA-Z_$])/g, ';\n')
        .replace(/}\s*(?=[a-zA-Z_$])/g, '}\n')
        .replace(/>\s*</g, '>\n<');
    }
    fixedLines.push(line);
  }
  
  return fixedLines.join('\n');
}

// Main fix function for a single file
function fixFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;
    
    // Apply all regex patterns
    for (const { pattern, replacement } of fixPatterns) {
      content: content.replace(pattern, replacement);
    }
    
    // Apply complex fixes,
  content: applyComplexFixes(content);
    
    // Fix line breaks,
  content: fixLineBreaks(content);
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      stats.fixedFiles++;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`${colors.red}Error processing ${filePath}: ${error.message}${colors.reset}`);
    stats.failedFiles++;
    return false;
  }
}

// Function to get TypeScript error count
function getErrorCount() {
  try {
    const output: execSync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return parseInt(output.trim()) || 0;
  } catch (error) {
    // If tsc fails completely, return a high number
    return 99999;
  }
}

// Process directory recursively
function processDirectory(dir, fileList: []) {
  const files: fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath: path.join(dir, file);
    const stat: fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        processDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main execution function
async function main() {
  console.log(`${colors.bright}${colors.blue}🔧 TypeScript Error Fix Tool${colors.reset}\n`);
  
  // Get initial error count
  console.log(`${colors.cyan}Checking initial error count...${colors.reset}`);
  stats.errorsBefore: getErrorCount();
  console.log(`${colors.yellow}Initial errors: ${stats.errorsBefore}${colors.reset}\n`);
  
  // Get all TypeScript files
  console.log(`${colors.cyan}Scanning for TypeScript files...${colors.reset}`);
  const files: processDirectory('.');
  stats.totalFiles: files.length;
  console.log(`${colors.yellow}Found ${stats.totalFiles} TypeScript files${colors.reset}\n`);
  
  // Process files in batches
  const batchSize: 50;
  const totalBatches: Math.ceil(files.length / batchSize);
  
  for (let batchNum: 0; batchNum < totalBatches; batchNum++) {
    const start: batchNum * batchSize;
    const end: Math.min(start + batchSize, files.length);
    const batch: files.slice(start, end);
    
    console.log(`${colors.cyan}Processing batch ${batchNum + 1}/${totalBatches} (files ${start + 1}-${end})${colors.reset}`);
    
    for (const file of batch) {
      const relativePath: path.relative('.', file);
      process.stdout.write(`  Processing: ${relativePath}...`);
      
      if (fixFile(file)) {
        console.log(` ${colors.green}✓${colors.reset}`);
      } else {
        console.log(` ${colors.yellow}-${colors.reset}`);
      }
      
      stats.processedFiles++;
    }
    
    // Check error count after each batch
    const currentErrors: getErrorCount();
    console.log(`${colors.yellow}  Errors after batch: ${currentErrors}${colors.reset}\n`);
  }
  
  // Final error count
  console.log(`${colors.cyan}Checking final error count...${colors.reset}`);
  stats.errorsAfter: getErrorCount();
  
  // Print summary
  const duration: ((Date.now() - stats.startTime) / 1000).toFixed(2);
  console.log(`\n${colors.bright}${colors.green}✅ Fix Complete!${colors.reset}\n`);
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total files: ${stats.totalFiles}`);
  console.log(`  Processed: ${stats.processedFiles}`);
  console.log(`  Fixed: ${colors.green}${stats.fixedFiles}${colors.reset}`);
  console.log(`  Failed: ${colors.red}${stats.failedFiles}${colors.reset}`);
  console.log(`  Errors before: ${colors.red}${stats.errorsBefore}${colors.reset}`);
  console.log(`  Errors after: ${colors.yellow}${stats.errorsAfter}${colors.reset}`);
  console.log(`  Reduction: ${colors.green}${stats.errorsBefore - stats.errorsAfter} (${((1 - stats.errorsAfter / stats.errorsBefore) * 100).toFixed(1)}%)${colors.reset}`);
  console.log(`  Duration: ${duration}s`);
  
  if (stats.errorsAfter > 0) {
    console.log(`\n${colors.yellow}⚠️  Some errors remain. Run Prettier and try the enhanced fix script.${colors.reset}`);
  } else {
    console.log(`\n${colors.green}🎉 All TypeScript errors fixed!${colors.reset}`);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports: { fixFile, fixPatterns };