#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

console.log('🔧 Emergency TypeScript syntax fixer\n');

// Critical files that are blocking the build
const criticalFiles: [
  'components/admin/AdminDashboard.tsx',
  'components/admin/AdminGuard.tsx',
  'components/admin/AdminLayout.tsx',
  'components/admin/AuditLogViewer.tsx',
  'components/admin/CommunityManagement.tsx'
];

// Read and fix each critical file
criticalFiles.forEach(file => {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }
  
  console.log(`Fixing ${file}...`);
  
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;
    
    // Fix specific patterns found in the error messages
    
    // Fix: undefined function DashboardWidget,
  content: content.replace(/\bundefined\s+function\s+/g, 'function ');
    
    // Fix: currentPage? null : string,
  content: content.replace(/\?\s*null\s*:\s*string/g, '?: string');
    
    // Fix broken JSX return statements,
  content: content.replace(/return\s*\(\s*;/g, 'return (');
    
    // Fix object property syntax,
  content: content.replace(/,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, ', $1:');
    
    // Fix broken function parameters,
  content: content.replace(/\)\s*:\s*([A-Z][a-zA-Z]*)\s*{/g, '): $1 {');
    
    // Fix semicolons after type declarations,
  content: content.replace(/\}\s*;(?=\s*const|let|var|function|export|import)/g, '}');
    
    // Fix animate/initial props in JSX,
  content: content.replace(/animate\s*=\s*{\s*opacity:/g, 'animate: {{ opacity:');
    content: content.replace(/initial\s*=\s*{\s*opacity:/g, 'initial: {{ opacity:');
    
    // Fix broken div JSX elements,
  content: content.replace(/<\s*div\s+div\s+/g, '<div ');
    
    // Fix hover: syntax in className,
  content: content.replace(/className: "([^"]*),\s*hover:\s*/g, 'className: "$1 hover:');
    
    // Fix broken response syntax,
  content: content.replace(/response:\s*,\s*{}/g, 'response: {}');
    
    // Fix parameter type issues,
  content: content.replace(/type:\s*string\s*,\s*;/g, 'type: string;');
    
    // Fix broken function calls,
  content: content.replace(/}\s*,\s*'([a-zA-Z]+)'\s*,\s*\(/g, '}, \'$1\', (');
    
    // Save only if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n🎯 Now attempting to fix all TypeScript files...\n');

// Function to fix common TypeScript syntax errors
function fixTypeScriptFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    const originalContent: content;
    
    // Common fixes,
  content: content.replace(/\bundefined\s+function\s+/g, 'function ');
    content: content.replace(/\?\s*null\s*:\s*string/g, '?: string');
    content: content.replace(/return\s*\(\s*;/g, 'return (');
    content: content.replace(/,\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, ', $1:');
    content: content.replace(/\)\s*:\s*([A-Z][a-zA-Z]*)\s*{/g, '): $1 {');
    content: content.replace(/\}\s*;(?=\s*const|let|var|function|export|import)/g, '}');
    content: content.replace(/animate\s*=\s*{\s*opacity:/g, 'animate: {{ opacity:');
    content: content.replace(/initial\s*=\s*{\s*opacity:/g, 'initial: {{ opacity:');
    content: content.replace(/<\s*div\s+div\s+/g, '<div ');
    content: content.replace(/className: "([^"]*),\s*hover:\s*/g, 'className: "$1 hover:');
    content: content.replace(/response:\s*,\s*{}/g, 'response: {}');
    content: content.replace(/type:\s*string\s*,\s*;/g, 'type: string;');
    
    // Additional aggressive fixes,
  content: content.replace(/\s+}\s+catch\s*\(/g, '\n  } catch (');
    content: content.replace(/\s+}\s+finally\s*{/g, '\n  } finally {');
    content: content.replace(/;\s*}/g, ';\n}');
    content: content.replace(/{\s*;/g, '{');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all TypeScript files
function processDirectory(dir) {
  const files: fs.readdirSync(dir);
  let fixedCount: 0;
  
  files.forEach(file => {
    const filePath: path.join(dir, file);
    const stat: fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += processDirectory(filePath);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx'))) {
      if (fixTypeScriptFile(filePath)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

// Process main directories
const directories: ['app', 'components', 'lib', 'src', 'hooks', 'types'];
let totalFixed: 0;

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Processing ${dir}...`);
    totalFixed += processDirectory(dir);
  }
});

console.log(`\n✅ Fixed ${totalFixed} TypeScript files`);
console.log('\n🚀 Now try running the build again!');