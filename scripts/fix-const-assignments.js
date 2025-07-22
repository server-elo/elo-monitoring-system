const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting const/let assignment fix...');

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
    
    // Fix const/let/var assignments that use colons instead of equals
    // 1. Fix const variable: value -> const variable = value
    content = content.replace(/^(\s*)(const|let|var)\s+(\w+):\s*([^=\n]+);/gm, '$1$2 $3 = $4;');
    
    // 2. Fix specific patterns with function calls
    content = content.replace(/^(\s*)(const|let|var)\s+(\w+):\s*new\s+/gm, '$1$2 $3 = new ');
    
    // 3. Fix array destructuring
    content = content.replace(/^(\s*)(const|let|var)\s+\[([^\]]+)\]:\s*/gm, '$1$2 [$3] = ');
    
    // 4. Fix object destructuring
    content = content.replace(/^(\s*)(const|let|var)\s+\{([^}]+)\}:\s*/gm, '$1$2 {$3} = ');
    
    // 5. Fix property assignments inside objects/classes
    content = content.replace(/^(\s*)(private|public|protected|readonly)?\s*(\w+):\s*new\s+/gm, '$1$2 $3 = new ');
    
    // 6. Fix specific remaining patterns
    content = content.replace(/(\w+):\s*require\(/g, '$1 = require(');
    content = content.replace(/(\w+):\s*import\(/g, '$1 = import(');
    content = content.replace(/(\w+):\s*await\s+/g, '$1 = await ');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with const/let assignment issues`);