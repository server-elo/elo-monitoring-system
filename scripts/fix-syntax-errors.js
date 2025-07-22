#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'hooks/useGasAnalysis.ts',
  'hooks/useSecurityAnalysis.ts', 
  'hooks/useSwipeGesture.ts',
  'lib/compiler/SolidityCompiler.ts',
  'lib/components/PerformanceOptimizer.tsx'
];

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Specific fixes for known issues
    if (filePath.includes('SolidityCompiler.ts')) {
      content = content.replace('SolidityCompiler.instance: new', 'SolidityCompiler.instance = new');
    }
    
    if (filePath.includes('PerformanceOptimizer.tsx')) {
      content = content.replace('prevProps: unknown;', 'prevProps: unknown,');
    }
    
    if (filePath.includes('useSwipeGesture.ts')) {
      // Fix missing spaces in conditions
      content = content.replace(/(\w)>(\w)/g, '$1 > $2');
      content = content.replace(/(\w)<(\w)/g, '$1 < $2');
    }
    
    // Fix compressed code patterns
    content = content.replace(/}\s*return\s*{/g, '}\nreturn {');
    content = content.replace(/;\s*const\s+/g, ';\nconst ');
    content = content.replace(/;\s*if\s*\(/g, ';\nif (');
    content = content.replace(/;\s*try\s*{/g, ';\ntry {');
    content = content.replace(/}\s*const\s+/g, '}\nconst ');
    content = content.replace(/}\s*export\s+/g, '}\n\nexport ');
    content = content.replace(/}\s*interface\s+/g, '}\n\ninterface ');
    content = content.replace(/}\s*function\s+/g, '}\n\nfunction ');
    content = content.replace(/}\s*catch\s*\(/g, '} catch (');
    content = content.replace(/}\s*else\s*{/g, '} else {');
    
    // Fix specific syntax errors
    content = content.replace(/editor\)/g, 'editorInstance)');
    content = content.replace(/\bRange\(/g, 'monaco.Range(');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Syntax error fixes completed!');