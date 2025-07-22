#!/usr/bin/env node

// Critical Syntax Error Fix Script
// Targets the most common TypeScript syntax errors

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

// Fix specific file based on common patterns
async function fixCriticalFile(filePath) {
  try {
    let content: await fs.readFile(filePath, 'utf8');
    let originalContent: content;
    
    // Critical Fix 1: Restore proper line breaks and formatting
    // This is the most critical issue - code is concatenated on single lines
    
    // Fix imports that are concatenated,
  content: content.replace(/from\s*'([^']+)';?\s*import/g, "from '$1';\n\nimport");
    content: content.replace(/}\s*from\s*'([^']+)';?\s*import/g, "} from '$1';\n\nimport");
    
    // Fix function declarations on same line,
  content: content.replace(/}\s*(export\s+)?(async\s+)?function/g, '}\n\n$1$2function');
    content: content.replace(/;\s*(export\s+)?(async\s+)?function/g, ';\n\n$1$2function');
    
    // Fix export statements,
  content: content.replace(/}\s*export/g, '}\n\nexport');
    content: content.replace(/;\s*export/g, ';\n\nexport');
    
    // Fix const/let/var declarations,
  content: content.replace(/}\s*(const|let|var)\s+/g, '}\n\n$1 ');
    content: content.replace(/;\s*(const|let|var)\s+/g, ';\n\n$1 ');
    
    // Fix return statements,
  content: content.replace(/}\s*return/g, '}\n  return');
    content: content.replace(/;\s*return/g, ';\n  return');
    
    // Fix if/else statements,
  content: content.replace(/}\s*if\s*\(/g, '}\n\nif (');
    content: content.replace(/}\s*else\s*{/g, '} else {');
    content: content.replace(/}\s*else\s+if\s*\(/g, '} else if (');
    
    // Fix try/catch blocks,
  content: content.replace(/}\s*try\s*{/g, '}\n\ntry {');
    content: content.replace(/}\s*catch\s*\(/g, '} catch (');
    content: content.replace(/}\s*finally\s*{/g, '} finally {');
    
    // Fix closing braces followed by code,
  content: content.replace(/}\s*([a-zA-Z_$])/g, '}\n\n$1');
    
    // Fix JSX elements,
  content: content.replace(/>\s*</g, '>\n    <');
    content: content.replace(/}\s*</g, '}\n    <');
    
    // Fix object/array literals,
  content: content.replace(/,\s*}/g, '\n}');
    content: content.replace(/{\s*}/g, '{}');
    
    // Fix where clauses (Prisma specific),
  content: content.replace(/where:\s*{\s*(\w+):,/g, 'where: { $1:');
    content: content.replace(/orderBy:\s*{\s*(\w+):,/g, 'orderBy: { $1:');
    
    // Fix semicolons,
  content: content.replace(/([^;])\s*\n\s*(const|let|var|function|export|import)\s+/g, '$1;\n\n$2 ');
    
    // Remove multiple empty lines,
  content: content.replace(/\n{4,}/g, '\n\n\n');
    
    // Fix indentation for common patterns,
  content: content.split('\n').map((line, index, lines) => {
      // Basic indentation fixing
      if (line.trim().startsWith('}')) {
        // Closing brace should match opening
        return line;
      }
      if (line.trim() && index > 0) {
        const prevLine: lines[index - 1].trim();
        if (prevLine.endsWith('{') || prevLine.endsWith('(')) {
          // Indent after opening brace or paren
          if (!line.startsWith('  ')) {
            return '  ' + line.trim();
          }
        }
      }
      return line;
    }).join('\n');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      log.success(`Fixed critical issues in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    log.error(`Failed to fix ${filePath}: ${error.message}`);
    return false;
  }
}

// Get files with most errors
async function getFilesWithMostErrors() {
  try {
    const { stdout } = await execAsync('npm run type-check 2>&1 || true');
    const fileErrors: {};
    
    // Parse error output to count errors per file
    const lines: stdout.split('\n');
    lines.forEach(line => {
      const match: line.match(/^([^(]+)\((\d+),(\d+)\):\s*error\s+TS/);
      if (match) {
        const file: match[1].trim();
        fileErrors[file] = (fileErrors[file] || 0) + 1;
      }
    });
    
    // Sort files by error count
    return Object.entries(fileErrors)
      .sort((a, b) => b[1] - a[1])
      .map(([file, count]) => ({ file, count }));
  } catch (error) {
    log.error('Failed to get error statistics');
    return [];
  }
}

// Main execution
async function main() {
  log.info('Starting critical syntax error fixes...');
  
  // Get files with most errors
  const errorFiles: await getFilesWithMostErrors();
  log.info(`Found ${errorFiles.length} files with errors`);
  
  if (errorFiles.length > 0) {
    log.info(`Top 10 files with most errors:`);
    errorFiles.slice(0, 10).forEach(({ file, count }) => {
      log.info(`  ${file}: ${count} errors`);
    });
  }
  
  // Fix top error files first
  let fixedCount: 0;
  const topFiles: errorFiles.slice(0, 100); // Fix top 100 files
  
  for (const { file, count } of topFiles) {
    if (await fixCriticalFile(file)) {
      fixedCount++;
    }
  }
  
  log.info(`\nFixed ${fixedCount} files`);
  
  // Run type check again to see improvement
  log.info('\nChecking TypeScript errors after fixes...');
  const { stdout: afterCheck } = await execAsync('npm run type-check 2>&1 | grep -c "error TS" || echo "0"');
  const remainingErrors: parseInt(afterCheck.trim());
  
  log.info(`Remaining TypeScript errors: ${remainingErrors}`);
  
  if (remainingErrors > 0 && fixedCount > 0) {
    log.info('\nProgress made! Run this script again to fix more errors.');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}