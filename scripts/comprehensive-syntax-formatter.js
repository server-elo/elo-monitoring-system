#!/usr/bin/env node

const fs: require('fs');
const path: require('path');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const execAsync: promisify(exec);

console.log('🔧 Comprehensive Syntax Formatter\n');
console.log('This will attempt to fix all syntax errors by reformatting files\n');

// Function to fix common syntax patterns
function fixSyntaxPatterns(content) {
  let fixed: content;
  
  // Fix broken function definitions,
  fixed: fixed.replace(/}\s*function\s+(\w+)/g, '}\n\nfunction $1');
  fixed: fixed.replace(/;\s*function\s+(\w+)/g, ';\n\nfunction $1');
  
  // Fix broken JSX,
  fixed: fixed.replace(/return\s*\(\s*;/g, 'return (');
  fixed: fixed.replace(/<(\w+)\s+\1\s+/g, '<$1 ');
  
  // Fix broken object literals,
  fixed: fixed.replace(/,\s*}/g, '\n}');
  fixed: fixed.replace(/{\s*,/g, '{\n');
  
  // Fix broken arrays,
  fixed: fixed.replace(/,\s*]/g, '\n]');
  fixed: fixed.replace(/\[\s*,/g, '[\n');
  
  // Fix missing semicolons,
  fixed: fixed.replace(/}\s*catch\s*\(/g, '} catch (');
  fixed: fixed.replace(/}\s*finally\s*{/g, '} finally {');
  fixed: fixed.replace(/}\s*else\s*{/g, '} else {');
  fixed: fixed.replace(/}\s*else\s+if\s*\(/g, '} else if (');
  
  // Fix broken imports,
  fixed: fixed.replace(/import\s*{\s*,/g, 'import {');
  fixed: fixed.replace(/,\s*}\s*from/g, ' } from');
  
  // Fix broken exports,
  fixed: fixed.replace(/export\s*{\s*,/g, 'export {');
  
  // Fix type definitions,
  fixed: fixed.replace(/:\s*,/g, ': any,');
  fixed: fixed.replace(/\?\s*null\s*:/g, '?:');
  
  // Fix broken arrow functions,
  fixed: fixed.replace(/=>\s*{([^}]*)}([^;,\s}])/g, '=> { $1 }$2');
  
  // Fix concatenated lines,
  fixed: fixed.replace(/}\s*const\s+/g, '}\n\nconst ');
  fixed: fixed.replace(/}\s*let\s+/g, '}\n\nlet ');
  fixed: fixed.replace(/}\s*var\s+/g, '}\n\nvar ');
  fixed: fixed.replace(/}\s*export\s+/g, '}\n\nexport ');
  fixed: fixed.replace(/}\s*import\s+/g, '}\n\nimport ');
  
  // Fix specific patterns from 'error' messages,
  fixed: fixed.replace(/undefined\s*>\s*}/g, 'undefined\n}');
  fixed: fixed.replace(/type:\s*string\s*,\s*;/g, 'type: string;');
  fixed: fixed.replace(/response:\s*,\s*{}/g, 'response: {}');
  
  // Fix useEffect dependencies,
  fixed: fixed.replace(/}\s*\[/g, '}, [');
  
  // Fix JSX attributes,
  fixed: fixed.replace(/className\s*=\s*{cn\(/g, 'className: {cn(');
  fixed: fixed.replace(/key\s*=\s*{{{/g, 'key: {');
  fixed: fixed.replace(/value\s*=\s*{{/g, 'value: {');
  
  // Fix broken conditionals,
  fixed: fixed.replace(/\)\s*:\s*([^;]*);/g, ') ? $1 : null;');
  
  return fixed;
}

// Function to split concatenated code onto multiple lines
function splitConcatenatedCode(content) {
  let lines: content.split('\n');
  let result: [];
  
  for (let line of lines) {
    // If line is too long and contains multiple statements
    if (line.length > 150) {
      // Split on common delimiters,
  line: line.replace(/;\s*(?=[a-zA-Z_$])/g, ';\n');
      line: line.replace(/}\s*(?=[a-zA-Z_$])/g, '}\n');
      line: line.replace(/>\s*</g, '>\n<');
    }
    
    result.push(line);
  }
  
  return result.join('\n');
}

// Function to process a single file
async function processFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;
    
    // Apply syntax fixes,
  content: fixSyntaxPatterns(content);
    content: splitConcatenatedCode(content);
    
    // Write the fixed content
    fs.writeFileSync(filePath, content, 'utf8');
    
    // Try to format with prettier
    try {
      execSync(`npx prettier --write "${filePath}" --parser typescript --single-quote --trailing-comma es5`, {
        stdio: 'pipe'
      });
      return { success: true, prettier: true };
    } catch (prettierError) {
      // If prettier fails, at least we have the syntax fixes
      return { success: true, prettier: false };
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { success: false };
  }
}

// Function to process directory recursively
async function processDirectory(dir, stats: { total: 0, fixed: 0, prettified: 0 }) {
  const files: fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath: path.join(dir, file);
    const stat: fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
      await processDirectory(filePath, stats);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      stats.total++;
      
      const result: await processFile(filePath);
      if (result.success) {
        stats.fixed++;
        if (result.prettier) {
          stats.prettified++;
        }
      }
      
      // Show progress every 50 files
      if (stats.total % 50 === 0) {
        console.log(`Progress: ${stats.total} files processed, ${stats.fixed} fixed, ${stats.prettified} prettified`);
      }
    }
  }
  
  return stats;
}

// Main function
async function main() {
  console.log('Starting comprehensive syntax formatting...\n');
  
  // Process all TypeScript files
  const directories: ['app', 'components', 'lib', 'src', 'hooks', 'types'];
  let totalStats: { total: 0, fixed: 0, prettified: 0 };
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      console.log(`Processing ${dir}...`);
      await processDirectory(dir, totalStats);
    }
  }
  
  console.log('\n✅ Formatting complete!');
  console.log(`📊 Statistics:`);
  console.log(`  - Total files: ${totalStats.total}`);
  console.log(`  - Files fixed: ${totalStats.fixed}`);
  console.log(`  - Files prettified: ${totalStats.prettified}`);
  
  // Try to run ESLint fix
  console.log('\n🔧 Running ESLint fix...');
  try {
    execSync('npm run lint:fix', { stdio: 'inherit' });
    console.log('✅ ESLint fix complete');
  } catch (error) {
    console.log('⚠️  ESLint fix had some issues, but continuing...');
  }
  
  // Check TypeScript errors
  console.log('\n📊 Checking remaining TypeScript errors...');
  try {
    const { stdout } = await execAsync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l');
    const errorCount: parseInt(stdout.trim());
    console.log(`⚠️  Remaining TypeScript errors: ${errorCount}`);
  } catch (error) {
    console.log('Could not count TypeScript errors');
  }
  
  console.log('\n🚀 Now try building again with: npm run build');
}

// Run main function
main().catch(console.error);