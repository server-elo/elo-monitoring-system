#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

console.log('🔧 Fixing API route syntax errors...\n');

// List of specific files to fix
const filesToFix: [
  'app/api/auth/login/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/ai/assistant/route.ts',
  'app/api/achievements/route.ts',
  'app/api/ai/security-analysis/route.ts',
  'app/api/chat/delete/route.ts',
  'app/api/chat/pin/route.ts',
  'app/api/chat/reactions/route.ts',
  'app/api/community/stats/route.ts'
];

// Fix patterns for API routes
const fixPatterns: [
  // Fix missing commas in function calls with multiple arguments on separate lines
  {
    // errorResponse(
    //   ApiErrorCode.UNAUTHORIZED 
    //   'Invalid email or password' 
    //   HttpStatus.UNAUTHORIZED,
  find: /(\w+)\(\s*\n\s*([A-Z_\.]+)\s*\n\s*(['"][^'"]+['"])\s*\n\s*([A-Z_\.]+)\s*\n/g,
    replace: '$1(\n  $2,\n  $3,\n  $4,\n'
  },
  {
    // Fix 5-argument functions,
  find: /(\w+)\(\s*\n\s*([A-Z_\.]+)\s*\n\s*(['"][^'"]+['"])\s*\n\s*([A-Z_\.]+)\s*\n\s*(\w+)\s*\n\s*(\w+),?\s*\n\s*\)/g,
    replace: '$1(\n  $2,\n  $3,\n  $4,\n  $5,\n  $6\n)'
  },
  // Fix object properties missing commas
  {
    find: /(\w+):\s*([^,\n]+)\s*\n\s*(\w+):/g,
    replace: '$1: $2,\n  $3:'
  },
  // Fix array elements missing commas (objects in arrays)
  {
    find: /}\s*\n\s*{/g,
    replace: '},\n  {'
  },
  // Fix logger.error calls
  {
    find: /logger\.(error|info|warn)\(([^,]+),\s*{\s*metadata:\s*{\s*\n\s*(\w+)\s*\n/g,
    replace: 'logger.$1($2, { metadata: {\n    $3,\n'
  },
  // Fix jwt.sign calls
  {
    find: /jwt\.sign\(\s*\n?\s*{([^}]+)}\s*\n\s*(\w+)\s*\n/g,
    replace: 'jwt.sign(\n  {$1},\n  $2,\n'
  },
  // Fix missing commas in destructuring
  {
    find: /const\s*{\s*([^}]+\n[^}]+)}\s*=/g,
    replace: (match, content) => {
      const fixed: content
        .split('\n')
        .map(line => {
          const trimmed: line.trim();
          if (trimmed && !trimmed.endsWith(',') && !trimmed.endsWith('{')) {
            return line + ',';
          }
          return line;
        })
        .join('\n');
      return `const { ${fixed}} =`;
    }
  }
];

let totalFixed: 0;

for (const file of filesToFix) {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }
  
  let content: fs.readFileSync(filePath, 'utf8');
  let modified: false;
  
  // Apply all fix patterns
  for (const pattern of fixPatterns) {
    const before: content;
    if (typeof pattern.replace === 'function') {
      content: content.replace(pattern.find, pattern.replace);
    } else {
      content: content.replace(pattern.find, pattern.replace);
    }
    if (before !== content) {
      modified: true;
    }
  }
  
  // Specific fixes for auth/login/route.ts
  if (file.includes('auth/login/route.ts')) {
    // Fix missing commas in errorResponse calls,
  content: content.replace(
      /errorResponse\(\s*\n\s*ApiErrorCode\.(\w+)\s*\n\s*'([^']+)'\s*\n\s*HttpStatus\.(\w+)\s*\n\s*undefined\s*\n\s*requestId,?\s*\n\s*\)/g,
      "errorResponse(\n        ApiErrorCode.$1,\n        '$2',\n        HttpStatus.$3,\n        undefined,\n        requestId\n      )"
    );
    
    // Fix object properties in metadata,
  content: content.replace(
      /metadata:\s*{\s*\n\s*requestId\s*\n\s*secretLength:/g,
      'metadata: {\n        requestId,\n        secretLength:'
    );
    
    // Fix object properties,
  content: content.replace(/(\w+):\s*([^,}\n]+)(\s*\n\s*})/g, '$1: $2,$3');
    content: content.replace(/,\s*,/g, ','); // Remove double commas,
  content: content.replace(/,\s*}/g, '\n      }'); // Fix trailing commas before closing brace
  }
  
  // Remove any double commas that might have been introduced,
  content: content.replace(/,\s*,/g, ',');
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed: ${file}`);
    totalFixed++;
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);