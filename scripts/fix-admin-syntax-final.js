#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Specific admin files to fix
const adminFiles = [
  'components/admin/AdminDashboard.tsx',
  'components/admin/AdminGuard.tsx',
  'components/admin/AdminLayout.tsx',
  'components/admin/AuditLogViewer.tsx',
  'components/admin/CommunityManagement.tsx'
];

function fixFile(filePath) {
  console.log(`Fixing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix specific patterns found in the error messages
    // 1. Fix spaces in Tailwind classes
    content = content.replace(/hover:\s+/g, 'hover:');
    content = content.replace(/focus:\s+/g, 'focus:');
    content = content.replace(/disabled:\s+/g, 'disabled:');
    content = content.replace(/md:\s+/g, 'md:');
    content = content.replace(/lg:\s+/g, 'lg:');
    content = content.replace(/xl:\s+/g, 'xl:');
    content = content.replace(/sm:\s+/g, 'sm:');
    
    // 2. Fix className: " patterns
    content = content.replace(/CheckCircle className:\s*"/g, 'CheckCircle className="');
    content = content.replace(/XCircle className:\s*"/g, 'XCircle className="');
    content = content.replace(/ChevronDown className:\s*"/g, 'ChevronDown className="');
    
    // 3. Fix assignment vs comparison operators in specific contexts
    content = content.replace(/(\w+)?\.\w+:\s*=/g, '$1?.role ===');
    content = content.replace(/severity\s*==\s*'(\w+)'/g, "severity === '$1'");
    content = content.replace(/severity\s*=\s*'(\w+)'/g, "severity === '$1'");
    content = content.replace(/pagination\.page\s*==\s*(\d+)/g, 'pagination.page === $1');
    
    // 4. Fix lg = col-span patterns
    content = content.replace(/lg\s*=\s*col-span-(\d+)/g, 'lg:col-span-$1');
    
    // 5. Fix onClick handlers
    content = content.replace(/onClick=\{(\(\))/g, 'onClick={$1');
    
    // 6. Fix setFilters/setPagination patterns
    content = content.replace(/setFilters\(prev\)\s*=>/g, 'setFilters(prev =>');
    content = content.replace(/setPagination\(prev\)\s*=>/g, 'setPagination(prev =>');
    
    // 7. Fix map function syntax
    content = content.replace(/(\w+)\.map\((\w+)\)\s*=>/g, '$1.map($2 =>');
    
    // 8. Fix window.location.href: pattern
    content = content.replace(/window\.location\.href:\s*'/g, "window.location.href = '");
    
    // 9. Fix const params: { pattern
    content = content.replace(/const params:\s*\{/g, 'const params = {');
    
    // 10. Fix missing commas in object literals
    content = content.replace(/(\w+):\s*([^,\s}]+)\s+(\w+):/g, '$1: $2, $3:');
    
    // 11. Fix hover:from patterns
    content = content.replace(/hover:\s*from-(\w+-\d+)/g, 'hover:from-$1');
    content = content.replace(/hover:\s*to-(\w+-\d+)/g, 'hover:to-$1');
    
    // 12. Fix specific patterns from error messages
    content = content.replace(/currentUser\?\.\w+:\s*=\s*(\w+)/g, "currentUser?.role === '$1'");
    
    // 13. Fix success === 'true' pattern
    content = content.replace(/success:\s*filters\.success\s*!==\s*'all'\s*\?\s*filters\.success\s*=\s*'true'/g, "success: filters.success !== 'all' ? filters.success === 'true'");
    
    // 14. Fix Log, ID pattern
    content = content.replace(/Log,\s*ID:/g, 'Log ID:');
    
    // 15. Fix stand-alone class declarations
    content = content.replace(/^(\s*)(className\s*=\s*{)/gm, '$1$2');
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed ${filePath}`);
    
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
  }
}

// Fix all admin component files
adminFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fixFile(fullPath);
  } else {
    console.log(`File not found: ${fullPath}`);
  }
});

console.log('\nDone fixing admin component syntax issues.');