const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting final comprehensive syntax fix...');

// Find all TypeScript/JavaScript files
const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**', '**/scripts/**', '**/backup/**'],
  cwd: process.cwd()
});

let totalFixed = 0;

files.forEach(file => {
  try {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix all assignment operators with colons
    // Property assignments in objects that were incorrectly changed
    content = content.replace(/^(\s*)(this\.\w+):\s*(.+);$/gm, '$1$2 = $3;');
    
    // Fix object literal property values that were incorrectly changed
    content = content.replace(/(\w+):\s*=\s*(.+)/g, '$1: $2');
    
    // Fix arrow function parameters
    content = content.replace(/\(([\w\s,]+):\s*>\s*/g, '($1) => ');
    content = content.replace(/\s([\w]+):\s*>\s*/g, ' $1 => ');
    
    // Fix remaining equals/colon issues in assignments
    content = content.replace(/^(\s*)(timestamp|responseTime|lastCheck|uptime|version|duration)\s*=\s*([^,;]+)([,;])/gm, '$1$2: $3$4');
    
    // Fix module.exports patterns
    content = content.replace(/module\.exports:\s*{/g, 'module.exports = {');
    
    // Fix require statements
    content = content.replace(/const\s+(\w+):\s*require\(/g, 'const $1 = require(');
    content = content.replace(/let\s+(\w+):\s*require\(/g, 'let $1 = require(');
    content = content.replace(/var\s+(\w+):\s*require\(/g, 'var $1 = require(');
    
    // Fix more complex patterns
    content = content.replace(/\.filter\((\w+):\s*>\s*/g, '.filter($1 => ');
    content = content.replace(/\.map\((\w+):\s*>\s*/g, '.map($1 => ');
    content = content.replace(/\.forEach\((\w+):\s*>\s*/g, '.forEach($1 => ');
    content = content.replace(/\.reduce\((\w+):\s*>\s*/g, '.reduce($1 => ');
    
    // Fix splice and other array methods
    content = content.replace(/\.splice\(\s*(\w+),\s*(\d+)\s*\)/g, '.splice(=)');
    
    // Fix this.property: value patterns in class methods
    content = content.replace(/^(\s*)(this\.\w+):\s*([^=].+);$/gm, '$1$2 = $3;');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with final syntax issues`);