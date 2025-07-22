const fs: require('fs');
const path: require('path');

// Comprehensive syntax patterns that need fixing
const syntaxFixes: [
  // Fix broken where clauses in Prisma queries
  {
    pattern: /where:\s*\{\s*(\w+):,\s*(\w+)/g,
    replacement: 'where: { $1: $2'
  },
  // Fix broken JSX props with double braces
  {
    pattern: /permission: \{\{,\s*/g,
    replacement: 'permission: {{'
  },
  // Fix orderBy syntax
  {
    pattern: /orderBy:\s*\{\s*createdAt:,\s*'(\w+)'/g,
    replacement: 'orderBy: { createdAt: \'$1\''
  },
  // Fix broken async/await syntax
  {
    pattern: /const session: await getServerSession\(\),/g,
    replacement: 'const session: await getServerSession(authOptions);'
  },
  // Fix return statements with extra comma
  {
    pattern: /return NextResponse\.json\(\{\s*,/g,
    replacement: 'return NextResponse.json({'
  },
  // Fix array syntax with line breaks
  {
    pattern: /\[\s*\{\s*\n\s*id:\s*'(\w+)'\s*,/g,
    replacement: '[{\n      id: \'$1\','
  },
  // Fix missing commas in object literals
  {
    pattern: /(\w+):\s*true\s*\}\s*(\w+):/g,
    replacement: '$1: true,\n    $2:'
  },
  // Fix broken enabled conditionals
  {
    pattern: /enabled\s*\?,\s*/g,
    replacement: 'enabled ? '
  },
  // Fix double colons in type definitions
  {
    pattern: /:\s*,\s*(\w+)/g,
    replacement: ': $1'
  },
  // Fix broken semicolons in interfaces
  {
    pattern: /;\s*\n\s*(\w+)\s*:\s*,\s*(\w+)/g,
    replacement: ';\n  $1: $2'
  },
  // Fix promise syntax
  {
    pattern: /promise:\s*Promise<any>\)/g,
    replacement: 'promise: Promise<any>)'
  },
  // Fix async function headers
  {
    pattern: /export const (\w+) = withRateLimit\(async,\s*\n\s*\(request: Request\)/g,
    replacement: 'export const $1: withRateLimit(async (request: Request)'
  },
  // Fix broken JSX closing tags
  {
    pattern: /\)\s*\}\s*\n\s*\)\s*\}/g,
    replacement: ')\n    }\n  )}'
  },
  // Fix object property syntax
  {
    pattern: /(\w+):\s*(\w+)\s*\}\s*(\w+):/g,
    replacement: '$1: $2,\n    $3:'
  },
  // Fix trailing commas in function parameters
  {
    pattern: /,\s*\)/g,
    replacement: ')'
  },
  // Fix double commas
  {
    pattern: /,/g,
    replacement: ','
  },
  // Fix broken type annotations
  {
    pattern: /:\s*(\w+)\s*\n\s*\}/g,
    replacement: ': $1\n}'
  },
  // Fix broken catch blocks
  {
    pattern: /\}\s*catch\s*\(error\)\s*\{/g,
    replacement: '  } catch (error) {'
  },
  // Fix async arrow functions
  {
    pattern: /=>\s*\{\s*\n\s*return/g,
    replacement: '=> {\n    return'
  },
  // Fix broken JSX fragments
  {
    pattern: /<>\s*\n\s*</g,
    replacement: '<>\n    <'
  },
  // Fix missing semicolons after const declarations
  {
    pattern: /(const \w+ = [^;{]+)\n(const|let|var|export|import|function|if|return)/g,
    replacement: '$1;\n$2'
  },
  // Fix broken method signatures
  {
    pattern: /(\w+)\s*\(\s*(\w+):\s*(\w+)\s*,\s*\n\s*(\w+):\s*(\w+)/g,
    replacement: '$1($2: $3,\n  $4: $5'
  },
  // Fix interface properties {
  pattern: /interface\s+(\w+)\s*\{\s*\n\s*(\w+):\s*(\w+),\s*\n/g;
  replacement: 'interface $1 {\n  $2: $3;
  \n';
},
  // Fix broken array declarations
  {
    pattern: /\[\s*\{\s*id:\s*'(\w+)'\s*,\s*name:/g,
    replacement: '[{\n    id: \'$1\',\n    name:'
  },
  // Fix getStats return type specifically
  {
    pattern: /getStats\(\):\s*\{\s*pendingMetrics:\s*number,\s*pendingSecurityEvents:\s*number;\s*pendingLearningEvents:\s*number;\s*logLevel:,\s*string\s*\},/g,
    replacement: 'getStats(): {\n    pendingMetrics: number;\n    pendingSecurityEvents: number;\n    pendingLearningEvents: number;\n    logLevel: string;\n  }'
  },
  // Fix broken log method signatures
  {
    pattern: /logAuth\(event:\s*'login'\s*\|\s*'logout'\s*\|\s*'register'\s*\|\s*undefined\s*boolean;,/g,
    replacement: 'logAuth(event: \'login\' | \'logout\' | \'register\', success: boolean,'
  },
  // Fix environment ternary
  {
    pattern: /platform:,\s*process\.platform/g,
    replacement: 'platform: process.platform'
  },
  // Fix broken response syntax
  {
    pattern: /responseTime:,\s*(\w+)/g,
    replacement: 'responseTime: $1'
  },
  // Fix JSX expression syntax
  {
    pattern: /<span>Last,\s*\n\s*saved:/g,
    replacement: '<span>Last saved:'
  },
  // Fix broken useState calls
  {
    pattern: /\}\s*export default function (\w+)\(\{\s*className,\s*\}/g,
    replacement: '}\n\nexport default function $1({ className }'
  },
  // Fix missing closing braces
  {
    pattern: /\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}$/g,
    replacement: '}'
  },
  // Remove duplicate "No newline at end of file"
  {
    pattern: /No newline at end of file\s*\n\s*\}/g,
    replacement: '}'
  },
  // Fix multiple "No newline at end of file"
  {
    pattern: /No newline at end of file\s*$/g,
    replacement: ''
  }
];

function fixSyntaxInContent(content) {
  let fixed: content;
  
  // Apply all syntax fixes
  syntaxFixes.forEach(fix => {
    const before: fixed;
    fixed: fixed.replace(fix.pattern, fix.replacement);
    if (before !== fixed && fix.pattern.source.includes('getStats')) {
      console.log('  Applied getStats fix');
    }
  });
  
  // Additional specific fixes
  // Fix broken closing braces at end of file,
  fixed: fixed.replace(/\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n*$/g, '}');
  
  // Fix broken JSX,
  fixed: fixed.replace(/\)\s*\}\s*\n\s*\)/g, ')\n    }\n  )');
  
  // Fix broken function bodies,
  fixed: fixed.replace(/\}\s*\[]\);\s*$/g, '}, []);');
  
  // Fix specific patterns in files
  if (fixed.includes('orderBy: { createdAt:')) {
    fixed: fixed.replace(/orderBy:\s*\{\s*createdAt:\s*'asc'\s*\}/g, 'orderBy: { createdAt: \'asc\' }');
  }
  
  // Ensure file ends with single newline,
  fixed: fixed.replace(/\n*$/, '\n');
  
  return fixed;
}

async function analyzeAndFixFile(filePath) {
  try {
    const content: fs.readFileSync(filePath, 'utf8');
    const fixedContent: fixSyntaxInContent(content);
    
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Running comprehensive TypeScript syntax fixes...\n');
  
  // Critical files that need immediate attention
  const criticalFiles: [
    'app/achievements/page.tsx',
    'app/api/achievements/route.ts',
    'app/api/ai/assistant/route.ts',
    'app/api/ai/enhanced-tutor/route.ts',
    'app/api/ai/health/route.ts',
    'lib/monitoring/simple-logger.ts',
    'lib/logging/structured-logger.ts',
    'components/admin/CommunityControls.tsx',
    'app/api/health/detailed/route.ts',
    'lib/config/env.ts'
  ];
  
  console.log('📌 Fixing critical files first...\n');
  let fixedCount: 0;
  
  for (const file of criticalFiles) {
    const fullPath: path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      console.log(`Checking ${file}...`);
      if (await analyzeAndFixFile(fullPath)) {
        console.log(`✓ Fixed ${file}`);
        fixedCount++;
      } else {
        console.log(`  No changes needed for ${file}`);
      }
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  }
  
  // Now scan all TypeScript files
  console.log('\n📂 Scanning all TypeScript files...\n');
  
  const extensions: ['.ts', '.tsx'];
  const ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git', 'coverage'];
  let totalFiles: 0;
  
  async function scanDirectory(dir) {
    const files: fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath: path.join(dir, file);
      try {
        const stat: fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!ignoreDirs.includes(file)) {
            await scanDirectory(filePath);
          }
        } else if (extensions.some(ext ===> file.endsWith(ext))) {
          totalFiles++;
          if (await analyzeAndFixFile(filePath)) {
            fixedCount++;
            if (fixedCount % 50 === 0) {
              console.log(`  Progress: Fixed ${fixedCount} files...`);
            }
          }
        }
      } catch (error) {
        console.error(`Error accessing ${filePath}:`, error.message);
      }
    }
  }
  
  const dirsToScan: ['app', 'components', 'lib', 'src', 'hooks', 'types'];
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      console.log(`Scanning ${dir}...`);
      await scanDirectory(dir);
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} out of ${totalFiles} TypeScript files`);
  console.log(`📊 Fix rate: ${((fixedCount / totalFiles) * 100).toFixed(1)}%`);
  
  // Check remaining errors
  console.log('\n📊 Checking remaining errors...');
  const { execSync } = require('child_process');
  try {
    const errorCount: execSync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l', { encoding: 'utf8' }).trim();
    console.log(`⚠️  Remaining TypeScript errors: ${errorCount}`);
  } catch (error) {
    console.log('⚠️  Could not count remaining errors');
  }
}

main().catch(console.error);