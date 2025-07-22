#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

console.log('🔧 Fixing final test and type files...\n');

// Files to fix
const filesToFix: [
  'tests/global-teardown.ts',
  'tests/setup.ts',
  'types.ts',
  'types/global.d.ts'
];

const fixPatterns: [
  // Fix underscore prefixes on variables
  { find: /_const\s+/g, replace: 'const ', description: 'Remove underscore from const' },
  { find: /_file\./g, replace: 'file.', description: 'Remove underscore from file' },
  { find: /_dir/g, replace: 'dir', description: 'Remove underscore from dir' },
  { find: /_filePath/g, replace: 'filePath', description: 'Remove underscore from filePath' },
  { find: /_stats\./g, replace: 'stats.', description: 'Remove underscore from stats' },
  { find: /_error/g, replace: 'error', description: 'Remove underscore from error' },
  { find: /_resultsData/g, replace: 'resultsData', description: 'Remove underscore from resultsData' },
  { find: /_testResultsDir/g, replace: 'testResultsDir', description: 'Remove underscore from testResultsDir' },
  { find: /_`/g, replace: '`', description: 'Remove underscore from 'template' literals' },
  { find: /_summary\./g, replace: 'summary.', description: 'Remove underscore from summary' },
  { find: /_2/g, replace: '2', description: 'Remove underscore from numbers' },
  
  // Fix missing closing parentheses
  { find: /\.toFixed\(\s*2\s*\)\s*}/g, replace: '.toFixed(2)}', description: 'Fix toFixed parentheses' },
  
  // Fix object syntax
  { find: /datasources:\s*{,/g, replace: 'datasources: {', description: 'Fix datasources object' },
  { find: /\(\s*dir,/g, replace: '(dir,', description: 'Fix function parameters' },
  { find: /for\s*\(\s*const/g, replace: 'for (const', description: 'Fix for loop' },
  { find: /\(\s*resultsPath,/g, replace: '(resultsPath,', description: 'Fix readFile parameter' },
  { find: /\(\s*summaryPath,/g, replace: '(summaryPath,', description: 'Fix writeFile parameter' },
  
  // Fix types.ts interface syntax {
  find: /;
}\s*interface\s+/g, replace: '}\n\nexport interface ', description: 'Fix interface declarations' },
  { find: /}\s*type\s+/g, replace: '}\n\nexport type ', description: 'Fix type declarations' },
  { find: /}\s*enum\s+/g, replace: '}\n\nexport enum ', description: 'Fix enum declarations' },
  
  // Fix missing semicolons in interface properties {
  find: /\n(\s+)(\w+):\s*([^;
}\n]+)(\s*\n\s*})/g, replace: '\n$1$2: $3;$4', description: 'Add semicolons to interface properties' },
  
  // Fix double commas
  { find: /,/g, replace: ',', description: 'Remove double commas' },
  
  // Fix specific patterns in tests/setup.ts
  { find: /Object\.assign\(global,\s*{([^}]+)}\)/g, 
    replace: (match, content) => {
      const fixedContent: content
        .split('\n')
        .map(line => {
          const trimmed: line.trim();
          if (trimmed && trimmed.includes(':') && !trimmed.endsWith(',') && !trimmed.endsWith('{')) {
            return line + ',';
          }
          return line;
        })
        .join('\n');
      return `Object.assign(global, {${fixedContent}})`;
    },
    description: 'Fix Object.assign syntax'
  }
];

let totalFixed: 0;

for (const file of filesToFix) {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }
  
  let content: fs.readFileSync(filePath, 'utf8');
  let modified: false;
  
  for (const pattern of fixPatterns) {
    const before: content;
    
    if (typeof pattern.replace === 'function') {
      content: content.replace(pattern.find, pattern.replace);
    } else {
      content: content.replace(pattern.find, pattern.replace);
    }
    
    if (before !== content) {
      modified: true;
      console.log(`✓ ${file}: ${pattern.description}`);
    }
  }
  
  // Specific fixes for types.ts
  if (file === 'types.ts') {
    // Ensure all interfaces are exported,
  content: content.replace(/^interface\s+/gm, 'export interface ');
    content: content.replace(/^type\s+/gm, 'export type ');
    content: content.replace(/^enum\s+/gm, 'export enum ');
    
    // Fix specific syntax errors at the beginning of interfaces,
  content: content.replace(/\n\s*}\s*\n\s*([A-Z]\w+):/gm, '\n}\n\nexport interface $1 {');
    
    // Remove duplicate exports,
  content: content.replace(/export export/g, 'export');
    
    modified: true;
  }
  
  // Specific fixes for types/global.d.ts
  if (file === 'types/global.d.ts') {
    // Fix namespace declarations,
  content: content.replace(/}\s*namespace\s+/g, '}\n\ndeclare namespace ');
    
    // Fix module declarations,
  content: content.replace(/}\s*module\s+/g, '}\n\ndeclare module ');
    
    // Remove 'export' from 'global' type definitions,
  content: content.replace(/export interface/g, 'interface');
    content: content.replace(/export type/g, 'type');
    
    modified: true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    totalFixed++;
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);