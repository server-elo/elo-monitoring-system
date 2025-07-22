const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting comprehensive syntax fix...');

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
    
    // Fix class property initialization with colons
    content = content.replace(/^(\s*)(private|public|protected|readonly)?\s*(\w+):\s*([A-Z]\w+\.\w+\(\))/gm, '$1$2 $3 = $4');
    
    // Fix Omit<Type "property"> -> Omit<Type, "property">
    content = content.replace(/Omit<(\w+)\s+"(\w+)">/g, 'Omit<$1, "$2">');
    
    // Fix Pick<Type "property"> -> Pick<Type, "property">
    content = content.replace(/Pick<(\w+)\s+"(\w+)">/g, 'Pick<$1, "$2">');
    
    // Fix Exclude<Type "property"> -> Exclude<Type, "property">
    content = content.replace(/Exclude<(\w+)\s+"(\w+)">/g, 'Exclude<$1, "$2">');
    
    // Fix Extract<Type "property"> -> Extract<Type, "property">
    content = content.replace(/Extract<(\w+)\s+"(\w+)">/g, 'Extract<$1, "$2">');
    
    // Fix function parameters with underscore prefix
    content = content.replace(/function\s+(\w+)\s*\(_\{/g, 'function $1({');
    content = content.replace(/=\s*\(_\{/g, '= ({');
    content = content.replace(/\(\s*_\{/g, '({');
    
    // Fix array method calls
    content = content.replace(/\.splice\(\s*(\w+),\s*(\d+)\)/g, '.splice(=)');
    content = content.replace(/dispatch\(\s*\{/g, 'dispatch({');
    
    // Fix more property assignments
    content = content.replace(/^(\s*)(\w+):\s*\(([^)]+)\)\s*%/gm, '$1$2 = ($3) %');
    
    // Fix object property syntax in type definitions
    content = content.replace(/type:\s*ActionType\[/g, 'type: ActionType[');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with remaining syntax issues`);