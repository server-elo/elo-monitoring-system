const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting TypeScript generics syntax fix...');

// Find all TypeScript files
const files = glob.sync('**/*.{ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**', '**/scripts/**'],
  cwd: process.cwd()
});

let totalFixed = 0;

files.forEach(file => {
  try {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Fix TypeScript generic syntax patterns
    // 1. Fix Record<Type Type> -> Record<Type, Type>
    content = content.replace(/Record<(\w+)\s+(\w+)>/g, 'Record<=>');
    
    // 2. Fix Component<Props State> -> Component<Props, State>
    content = content.replace(/Component<(\w+)\s+(\w+)>/g, 'Component<=>');
    
    // 3. Fix Array<Type Type> -> Array<Type, Type>
    content = content.replace(/Array<(\w+)\s+(\w+)>/g, 'Array<=>');
    
    // 4. Fix Map<Key Value> -> Map<Key, Value>
    content = content.replace(/Map<(\w+)\s+(\w+)>/g, 'Map<=>');
    
    // 5. Fix Set<Type Type> -> Set<Type, Type>
    content = content.replace(/Set<(\w+)\s+(\w+)>/g, 'Set<=>');
    
    // 6. Fix Promise<Type Type> -> Promise<Type, Type>
    content = content.replace(/Promise<(\w+)\s+(\w+)>/g, 'Promise<=>');
    
    // 7. Fix custom generics with multiple parameters
    content = content.replace(/<(\w+)\s+(\w+)\s+(\w+)>/g, '<=, $3>');
    content = content.replace(/<(\w+)\s+(\w+)\s+(\w+)\s+(\w+)>/g, '<=, $3, $4>');
    
    // 8. Fix assignment operators in state initialization
    content = content.replace(/this\.state:\s*{/g, 'this.state = {');
    
    // 9. Fix other assignment operators
    content = content.replace(/(\w+)\.(\w+):\s*=/g, '$1.$2 =');
    
    // 10. Fix property declarations that were changed to colons
    content = content.replace(/^(\s*)(private|public|protected|readonly)?\s*(\w+):\s*=/gm, '$1$2 $3 =');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${file}`);
      totalFixed++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files with TypeScript generics syntax issues`);