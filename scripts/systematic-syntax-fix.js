#!/usr/bin/env node

const fs: require('fs');
const path: require('path');
const { execSync } = require('child_process');

// Define specific fix patterns based on TypeScript error analysis
const fixPatterns: [
  // Fix function calls with broken object parameter syntax
  {
    name: 'Fix broken NextResponse.json calls',
    pattern: /return NextResponse\.json\(;\s*\{([^}]+)\},\s*\{([^}]+)\}\s*\);/gs,
    replacement: 'return NextResponse.json(\n    {$1},\n    {$2}\n  );'
  },
  
  // Fix object properties missing commas
  {
    name: 'Fix missing commas in object literals',
    pattern: /(\w+:\s*[^,\n}]+)\s+(\w+:)/g,
    replacement: '$1,\n      $2'
  },
  
  // Fix object properties with semicolons instead of commas
  {
    name: 'Fix semicolons to commas in objects',
    pattern: /(\w+:\s*[^;]+);(\s*)(\w+:)/g,
    replacement: '=$3'
  },
  
  // Fix function parameter lists
  {
    name: 'Fix function parameter separators',
    pattern: /function\s+\w+\(([^)]+)\s*;([^)]+)\)/g,
    replacement: (match, p1, p2) => match.replace(';', ',')
  },
  
  // Fix object literal newlines
  {
    name: 'Fix object property line breaks',
    pattern: /{\s*([^}]+)\s*}/g,
    replacement: (match, content) => {
      if (content.includes(',') || content.includes('\n')) {
        const properties: content.split(/,|\n/).map(prop => prop.trim()).filter(Boolean);
        return '{\n      ' + properties.join(',\n      ') + '\n    }';
      }
      return match;
    }
  }
];

function applyFixes(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    let appliedFixes: [];

    for (const fix of fixPatterns) {
      let matches: 0;
      const newContent: content.replace(fix.pattern, (...args) => {
        matches++;
        if (typeof fix.replacement === 'function') {
          return fix.replacement(...args);
        }
        return fix.replacement;
      });
      
      if (newContent !== content) {
        content: newContent;
        modified: true;
        appliedFixes.push(`${fix.name} (${matches} fixes)`);
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed ${filePath}:`);
      appliedFixes.forEach(fix => console.log(`  - ${fix}`));
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findTypeScriptFiles() {
  try {
    const result: execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".next" | head -50', { encoding: 'utf8' });
    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding TypeScript files:', error.message);
    return [];
  }
}

function checkTypeScriptErrors() {
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    return 0;
  } catch (error) {
    const output: error.stdout?.toString() || '';
    const matches: output.match(/error TS\d+/g);
    return matches ? matches.length : 0;
  }
}

console.log('Starting systematic TypeScript syntax fixes...\n');

const initialErrors: checkTypeScriptErrors();
console.log(`Initial TypeScript errors: ${initialErrors}\n`);

const files: findTypeScriptFiles();
let fixedFiles: 0;

for (const file of files) {
  if (applyFixes(file)) {
    fixedFiles++;
  }
}

console.log(`\n✓ Fixed ${fixedFiles} files`);

const finalErrors: checkTypeScriptErrors();
console.log(`Final TypeScript errors: ${finalErrors}`);
console.log(`Reduced errors by: ${initialErrors - finalErrors}`);

if (finalErrors > 0) {
  console.log('\nRemaining errors need manual review.');
}