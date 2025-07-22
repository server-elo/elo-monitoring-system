const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting clean JSX syntax fix...');

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**', '**/scripts/**'],
  cwd: process.cwd()
});

let totalFixed = 0;

files.forEach(file => {
  try {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix JSX syntax patterns
    // 1. Fix malformed JSX opening tags: <Component, prop: "value"> -> <Component prop="value">
    content = content.replace(/<(\w+),\s*([^>]+)>/g, (match, tagName, attrs) => {
      // Skip if this is inside a generic type like Array<number, string>
      if (match.includes('Array<') || match.includes('Promise<') || match.includes('Record<')) {
        return match;
      }
      
      // Convert comma-separated attributes with colons to proper JSX syntax
      const fixedAttrs = attrs
        .split(/,(?![^{]*})/) // Split by comma but not inside braces
        .map(attr => {
          const trimmed = attr.trim();
          // Handle prop: "value" -> prop="value"
          const colonMatch = trimmed.match(/^(\w+):\s*(.+)$/);
          if (colonMatch) {
            const [, propName, propValue] = colonMatch;
            return `${propName}=${propValue}`;
          }
          return trimmed;
        })
        .join(' ');
      
      return `<${tagName} ${fixedAttrs}>`;
    });
    
    // 2. Fix self-closing tags
    content = content.replace(/<(\w+),\s*([^/>]+)\s*\/>/g, (match, tagName, attrs) => {
      if (match.includes('Array<') || match.includes('Promise<') || match.includes('Record<')) {
        return match;
      }
      
      const fixedAttrs = attrs
        .split(/,(?![^{]*})/)
        .map(attr => {
          const trimmed = attr.trim();
          const colonMatch = trimmed.match(/^(\w+):\s*(.+)$/);
          if (colonMatch) {
            const [, propName, propValue] = colonMatch;
            return `${propName}=${propValue}`;
          }
          return trimmed;
        })
        .join(' ');
      
      return `<${tagName} ${fixedAttrs} />`;
    });
    
    // 3. Fix specific patterns that were incorrectly changed
    // Fix assignment operators that were changed to colons
    content = content.replace(/const\s+(\w+):\s*=/g, 'const $1 =');
    content = content.replace(/let\s+(\w+):\s*=/g, 'let $1 =');
    content = content.replace(/var\s+(\w+):\s*=/g, 'var $1 =');
    
    // Fix function calls that were changed
    content = content.replace(/line:\s*line\.replace/g, 'line = line.replace');
    content = content.replace(/content:\s*content\.replace/g, 'content = content.replace');
    content = content.replace(/content:\s*fixedLines\.join/g, 'content = fixedLines.join');
    
    // Fix array/object property access
    content = content.replace(/const\s+(\w+):\s*(\w+)\[/g, 'const $1 = $2[');
    content = content.replace(/let\s+(\w+):\s*(\w+)\[/g, 'let $1 = $2[');
    content = content.replace(/const\s+(\w+):\s*(\w+)\./g, 'const $1 = $2.');
    content = content.replace(/let\s+(\w+):\s*(\w+)\./g, 'let $1 = $2.');
    
    // Fix function calls
    content = content.replace(/const\s+(\w+):\s*(\w+)\(/g, 'const $1 = $2(');
    content = content.replace(/let\s+(\w+):\s*(\w+)\(/g, 'let $1 = $2(');
    
    // Fix loop counters
    content = content.replace(/let\s+(\w+):\s*0;/g, 'let $1 = 0;');
    content = content.replace(/let\s+(\w+):\s*(\d+);/g, 'let $1 = $2;');
    
    // Fix array initializations
    content = content.replace(/const\s+(\w+):\s*\[\]/g, 'const $1 = []');
    
    // Fix boolean assignments
    content = content.replace(/let\s+(\w+):\s*(true|false);/g, 'let $1 = $2;');
    content = content.replace(/const\s+(\w+):\s*(true|false);/g, 'const $1 = $2;');
    
    // Fix string assignments
    content = content.replace(/const\s+(\w+):\s*(['"])/g, 'const $1 = $2');
    content = content.replace(/let\s+(\w+):\s*(['"])/g, 'let $1 = $2');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with JSX syntax issues`);