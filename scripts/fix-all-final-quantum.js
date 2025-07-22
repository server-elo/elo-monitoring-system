#!/usr/bin/env node

const fs = require('fs');
const { glob } = require('glob');

console.log('🔧 Final comprehensive syntax fix...');

async function fixAnalytics() {
  const content = fs.readFileSync('lib/monitoring/analytics.ts', 'utf8');
  let fixed = content;
  
  // Fix indentation
  fixed = fixed.replace(/^private initialized = false;$/m, '  private initialized = false;');
  
  // Fix timestamp fields  
  fixed = fixed.replace(/(\s+)timestamp: Date\.now\(\)\s*$/gm, '$1timestamp: Date.now()');
  
  // Fix userSessions.set spacing
  fixed = fixed.replace(/this\.userSessions\.set\(\s*userId,/g, 'this.userSessions.set(userId,');
  
  // Fix getStats return type
  fixed = fixed.replace(/getStats\(\): \{\s*pendingEvents\s*===\s*number;[\s\S]*?activeSessions\s*=\s*number;\s*\}/g, 
    `getStats(): {
    pendingEvents: number;
    learningEvents: number;
    collaborationEvents: number;
    performanceMetrics: number;
    activeSessions: number;
  }`);
  
  // Fix map syntax
  fixed = fixed.replace(/\.map\([^(]*\]\) => \(/g, '.map(([name, count]) => (');
  
  // Fix reduce spacing
  fixed = fixed.replace(/\.reduce\(\s*\(/g, '.reduce(');
  
  // Fix logger.info metadata
  fixed = fixed.replace(/logger\.info\('Analytics events flushed', \{ metadata: \{/g, 
    "logger.info('Analytics events flushed', {");
  
  // Fix closing braces
  fixed = fixed.replace(/}\s*}\s*\);\s*}\s*}\);/g, `      }
    });
  }`);
  
  fs.writeFileSync('lib/monitoring/analytics.ts', fixed);
  console.log('✓ Fixed analytics.ts');
}

async function fixAllFiles() {
  const patterns = [
    'app/api/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}'
  ];
  
  const fixes = [
    // Fix remaining double semicolons
    { pattern: /;;/g, replacement: ';' },
    
    // Fix remaining === assignments
    { pattern: /(\w+)\s*===\s*([^=])/g, replacement: '$1 = $2' },
    
    // Fix remaining colon assignments (not in interfaces)
    { pattern: /^(\s*)(const|let|var)\s+(\w+):\s*(.+);$/gm, replacement: '$1$2 $3 = $4;' },
    
    // Fix remaining == comparisons
    { pattern: /if\s*\(([^=]+)\s*==\s*([^=])/g, replacement: 'if ($1 === $2' },
    
    // Fix remaining function call spacing
    { pattern: /(\w+)\s*\(\s*(\w+):\s*string/g, replacement: '$1($2: string' },
    
    // Fix className with commas
    { pattern: /className="([^"]+),\s*([^"]+)"/g, replacement: 'className="$1 $2"' },
    
    // Fix motion component spacing
    { pattern: /<motion\.\w+,\s*$/gm, replacement: (match) => match.replace(',', '') },
    
    // Fix key prop syntax
    { pattern: /\s+key:\s*{([^}]+)}/g, replacement: ' key={$1}' },
    
    // Fix map/filter/reduce spacing
    { pattern: /\.(map|filter|reduce)\(\s*\(/g, replacement: '.$1(' }
  ];
  
  let totalFixed = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
    });
    
    for (const file of files) {
      try {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;
        
        fixes.forEach(fix => {
          const before = content;
          content = content.replace(fix.pattern, fix.replacement);
          if (before !== content) {
            modified = true;
          }
        });
        
        if (modified) {
          fs.writeFileSync(file, content);
          totalFixed++;
        }
      } catch (err) {
        // Skip files with errors
      }
    }
  }
  
  console.log(`✓ Fixed ${totalFixed} files`);
}

async function main() {
  await fixAnalytics();
  await fixAllFiles();
  console.log('\n✅ All syntax fixes complete');
}

main().catch(console.error);