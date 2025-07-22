#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'components/admin/AdminDashboard.tsx',
  'components/admin/AdminGuard.tsx',
  'components/admin/AdminLayout.tsx',
  'components/admin/AuditLogViewer.tsx'
];

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix common syntax patterns
    // 1. Fix function definitions that are on one line
    content = content.replace(/(\w+)\s*\(\s*{([^}]+)}\s*:\s*{([^}]+)}\s*\)\s*{/g, (match, funcName, params, types) => {
      return `${funcName}({ ${params} }: { ${types} }) {`;
    });
    
    // 2. Fix semicolons after JSX
    content = content.replace(/(<\/\w+>);\s*}/g, '$1\n}');
    
    // 3. Fix missing semicolons in object literals
    content = content.replace(/(\w+):\s*(\d+),\s*(\w+):\s*(\d+)\s+(\w+):/g, '$1: $2, $3: $4, $5:');
    
    // 4. Fix assignment operators in conditions
    content = content.replace(/if\s*\(\s*(\w+)\s*=\s*'([^']+)'\s*\)/g, "if ($1 === '$2')");
    content = content.replace(/if\s*\(\s*(\w+)\s*=\s*"([^"]+)"\s*\)/g, 'if ($1 === "$2")');
    
    // 5. Fix JSX formatting - break after opening tags
    content = content.replace(/>([^<\s])/g, '>\n$1');
    content = content.replace(/}\s*</g, '}\n<');
    
    // 6. Fix function calls on same line
    content = content.replace(/;\s*(\w+\()/g, ';\n$1');
    
    // 7. Fix missing spaces around operators
    content = content.replace(/(\w+)=(\w+)/g, '$1 = $2');
    content = content.replace(/(\w+):(\w+)/g, '$1: $2');
    
    // 8. Break long lines at logical points
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let line of lines) {
      if (line.length > 200) {
        // Break at semicolons
        line = line.replace(/;\s*/g, ';\n');
        // Break at opening braces
        line = line.replace(/{\s*/g, '{\n');
        // Break at closing braces
        line = line.replace(/}\s*/g, '}\n');
        // Break at JSX tags
        line = line.replace(/<(\w+)/g, '\n<$1');
      }
      fixedLines.push(line);
    }
    
    content = fixedLines.join('\n');
    
    // Remove duplicate newlines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('\nDone fixing admin component syntax issues.');