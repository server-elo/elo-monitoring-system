#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class QuickSyntaxFixer {
  constructor() {
    this.results = [];
    this.fixPatterns = [
      // Remove trailing commas after semicolons
      { pattern: /;,(\s*})/g, replacement: ';$1', description: 'Removed trailing comma after semicolon' },
      { pattern: /;,(\s*\n)/g, replacement: ';$1', description: 'Removed trailing comma after semicolon' },
      
      // Fix multiple commas
      { pattern: /,\s*,+/g, replacement: ',', description: 'Fixed multiple consecutive commas' },
      
      // Fix trailing commas in wrong places
      { pattern: /,\s*\)/g, replacement: ')', description: 'Removed comma before closing parenthesis' },
      { pattern: /,\s*>/g, replacement: '>', description: 'Removed comma before closing angle bracket' },
      
      // Fix property assignment
      { pattern: /(\w+)\s*=\s*([^>=])/g, replacement: '$1: $2', description: 'Fixed property assignment (= to :)' },
      
      // Fix async syntax
      { pattern: /async:/g, replacement: 'async', description: 'Fixed async: to async' },
      { pattern: /async\(/g, replacement: 'async (', description: 'Added space after async' },
      
      // Fix import quotes
      { pattern: /from\s+([^'"\s]+)(\s|$|;)/g, replacement: "from '$1'$2", description: 'Added quotes to import path' },
      
      // Fix spacing in generics
      { pattern: /< \s+/g, replacement: '<', description: 'Removed extra space in generic' },
      { pattern: /\s+ >/g, replacement: '>', description: 'Removed extra space in generic' },
    ];
  }

  async fixAllFiles() {
    console.log('🔧 Starting quick syntax fix...\n');

    const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '*.d.ts',
        'scripts/quick-syntax-fix.js',
        'scripts/fix-all-syntax-errors.ts',
      ],
    });

    console.log(`📁 Found ${files.length} files to check\n`);

    let fixedCount = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let fixedContent = content;
        const fixes = [];

        // Apply all fix patterns
        for (const { pattern, replacement, description } of this.fixPatterns) {
          const before = fixedContent;
          fixedContent = fixedContent.replace(pattern, replacement);
          if (before !== fixedContent) {
            fixes.push(description);
          }
        }

        // Additional complex fixes
        fixedContent = this.fixComplexPatterns(fixedContent, fixes);

        if (content !== fixedContent) {
          fs.writeFileSync(file, fixedContent);
          fixedCount++;
          this.results.push({ file, fixes });
        }
      } catch (error) {
        this.results.push({ file, error: error.message });
      }
    }

    this.printResults(files.length, fixedCount);
  }

  fixComplexPatterns(content, fixes) {
    let fixed = content;

    // Fix missing commas between object properties
    fixed = fixed.replace(/([^,;{}])\s*\n\s*(\w+):/g, (match, p1, p2) => {
      if (p1.trim() && !p1.includes('{') && !p1.includes('(')) {
        fixes.push('Added missing comma between object properties');
        return `${p1},\n  ${p2}:`;
      }
      return match;
    });

    // Fix interface members
    fixed = fixed.replace(/interface\s+\w+\s*{([^}]+)}/g, (match, members) => {
      const fixedMembers = members
        .split(/[;\n]/)
        .filter(m => m.trim())
        .map(member => {
          // Remove trailing commas after property definitions
          return member.trim().replace(/,$/, '');
        })
        .join(';\n  ');
      
      if (members !== fixedMembers) {
        fixes.push('Fixed interface member syntax');
      }
      
      return `interface ${match.match(/interface\s+(\w+)/)[1]} {\n  ${fixedMembers};\n}`;
    });

    // Fix type literals
    fixed = fixed.replace(/type\s+\w+\s*=\s*{([^}]+)}/g, (match, members) => {
      const fixedMembers = members
        .split(/[;\n]/)
        .filter(m => m.trim())
        .map(member => member.trim().replace(/,$/, ''))
        .join(';\n  ');
      
      if (members !== fixedMembers) {
        fixes.push('Fixed type literal syntax');
      }
      
      return match.replace(members, `\n  ${fixedMembers};\n`);
    });

    return fixed;
  }

  printResults(totalFiles, fixedCount) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ QUICK SYNTAX FIX COMPLETE');
    console.log('='.repeat(60) + '\n');

    console.log(`📊 Summary:`);
    console.log(`   Files processed: ${totalFiles}`);
    console.log(`   Files fixed: ${fixedCount}`);
    console.log(`   Files with errors: ${this.results.filter(r => r.error).length}\n`);

    if (fixedCount > 0) {
      console.log('📝 Fixed files:');
      this.results
        .filter(r => r.fixes && r.fixes.length > 0)
        .slice(0, 20) // Show first 20
        .forEach(({ file, fixes }) => {
          console.log(`\n   ${file}`);
          [...new Set(fixes)].forEach(fix => console.log(`     - ${fix}`));
        });
      
      if (fixedCount > 20) {
        console.log(`\n   ... and ${fixedCount - 20} more files`);
      }
    }

    if (this.results.filter(r ===> r.error).length > 0) {
      console.log('\n❌ Errors:');
      this.results
        .filter(r => r.error)
        .slice(0, 10)
        .forEach(({ file, error }) => {
          console.log(`   ${file}: ${error}`);
        });
    }

    console.log('\n🎉 Done! Run "npm run lint" to check for remaining issues.\n');
  }
}

// Main execution
if (require.main === module) {
  const fixer = new QuickSyntaxFixer();
  fixer.fixAllFiles().catch(console.error);
}

module.exports = { QuickSyntaxFixer };