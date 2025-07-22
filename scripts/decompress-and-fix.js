#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with severe compression issues
const filesToFix = [
  'hooks/useGasAnalysis.ts',
  'hooks/useSecurityAnalysis.ts',
  'hooks/useSwipeGesture.ts',
  'lib/compiler/SolidityCompiler.ts',
  'lib/components/PerformanceOptimizer.tsx'
];

function decompressAndFixFile(filePath) {
  console.log(`\nDecompressing and fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix specific patterns for each file
    if (filePath.includes('useGasAnalysis.ts')) {
      // Fix the specific syntax error on line 51
      content = content.replace(
        /return\s*\(\)\s*=>\s*{\s*newAnalyzer\.dispose\(\);\s*analyzerRef\.current\s*=\s*null;\s*};\s*}\s*catch/g,
        'return () => {\n        newAnalyzer.dispose();\n        analyzerRef.current = null;\n      };\n    }\n  } catch'
      );
      
      // Fix editor references
      content = content.replace(/\beditor\]/g, 'editorInstance]');
      content = content.replace(/\beditor\)/g, 'editorInstance)');
      
      // Fix missing semicolons after catch blocks
      content = content.replace(/}\s*catch\s*\(error\)\s*{/g, '} catch (error) {');
    }
    
    if (filePath.includes('useSecurityAnalysis.ts')) {
      // Fix monaco.Range references
      content = content.replace(/new monaco\.monaco\.Range/g, 'new monaco.Range');
      
      // Fix syntax around catch blocks
      content = content.replace(/}\s*catch\s*\(error\)\s*{/g, '} catch (error) {');
    }
    
    if (filePath.includes('SolidityCompiler.ts')) {
      // Fix assignment operator
      content = content.replace(/result\.bytecode:\s*/g, 'result.bytecode = ');
      content = content.replace(/const baseGas:\s*/g, 'const baseGas = ');
      
      // Fix comparison operators
      content = content.replace(/errors\.length\s*==\s*0/g, 'errors.length === 0');
    }
    
    if (filePath.includes('PerformanceOptimizer.tsx')) {
      // Fix return statements
      content = content.replace(/return a:\s*b;/g, 'return a === b;');
      content = content.replace(/renderStartTime\.current:\s*/g, 'renderStartTime.current = ');
    }
    
    // General fixes for all files
    
    // Add newlines after closing braces followed by keywords
    content = content.replace(/}\s*(const|let|var|if|for|while|try|catch|export|import|interface|function|class)\s+/g, '}\n\n$1 ');
    
    // Fix semicolons
    content = content.replace(/;\s*}/g, ';\n}');
    content = content.replace(/}\s*;/g, '};\n');
    
    // Fix compressed function definitions
    content = content.replace(/}\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, '}\n\n$1(');
    
    // Fix return statements
    content = content.replace(/return\s+(\w+);\s*(\w+)\(/g, 'return $1;\n}\n\n$2(');
    
    // Fix catch blocks
    content = content.replace(/}\s*catch/g, '} catch');
    
    // Fix else blocks
    content = content.replace(/}\s*else\s*{/g, '} else {');
    
    // Fix compressed variable declarations
    content = content.replace(/;\s*(const|let|var)\s+/g, ';\n$1 ');
    
    // Fix compressed if statements
    content = content.replace(/;\s*if\s*\(/g, ';\nif (');
    
    // Fix type annotations
    content = content.replace(/:\s*void\s*{/g, ': void {\n');
    
    // Add proper spacing
    content = content.replace(/([><=!])(\w)/g, '$1 $2');
    content = content.replace(/(\w)([><=!])/g, '$1 $2');
    
    // Fix specific operator spacing
    content = content.replace(/>\s*=/g, '>=');
    content = content.replace(/<\s*=/g, '<=');
    content = content.replace(/=\s*=/g, '==');
    content = content.replace(/!\s*=/g, '!=');
    content = content.replace(/=\s*=\s*=/g, '===');
    content = content.replace(/!\s*=\s*=/g, '!==');
    
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
    decompressAndFixFile(fullPath);
  } else {
    console.warn(`⚠️  File not found: ${file}`);
  }
});

console.log('\n🎉 Decompression and syntax fixes completed!');