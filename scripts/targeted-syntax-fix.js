#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class TargetedSyntaxFixer {
  constructor() {
    this.results = [];
    this.fixPatterns = [
      // Critical syntax fixes
      { pattern: /;,(\s*[}\n])/g, replacement: ';$1', description: 'Removed trailing comma after semicolon' },
      { pattern: /,\s*,+/g, replacement: ',', description: 'Fixed multiple consecutive commas' },
      { pattern: /,\s*\)/g, replacement: ')', description: 'Removed comma before closing parenthesis' },
      { pattern: /,\s*>/g, replacement: '>', description: 'Removed comma before closing angle bracket' },
      { pattern: /async:/g, replacement: 'async', description: 'Fixed async: to async' },
      { pattern: /from\s+([^'"\s]+)(\s|$|;)/g, replacement: "from '$1'$2", description: 'Added quotes to import path' },
    ];
  }

  async fixTargetedFiles() {
    console.log('🎯 Starting targeted syntax fix...\n');

    // Focus on specific directories
    const targetPatterns = [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'services/**/*.{ts,tsx}',
      'types/**/*.{ts,tsx}',
      '__tests__/**/*.{ts,tsx}',
    ];

    let allFiles = [];
    for (const pattern of targetPatterns) {
      const files = glob.sync(pattern, {
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
      });
      allFiles = allFiles.concat(files);
    }

    // Remove duplicates
    allFiles = [...new Set(allFiles)];

    console.log(`📁 Found ${allFiles.length} source files to fix\n`);

    let fixedCount = 0;
    let currentFile = 0;

    for (const file of allFiles) {
      currentFile++;
      
      // Progress indicator
      if (currentFile % 10 === 0 || currentFile === allFiles.length) {
        process.stdout.write(`\rProgress: ${currentFile}/${allFiles.length} files (${Math.round(currentFile/allFiles.length*100)}%)`);
      }

      try {
        const content = fs.readFileSync(file, 'utf8');
        let fixedContent = content;
        const fixes = [];

        // Apply basic patterns
        for (const { pattern, replacement, description } of this.fixPatterns) {
          const before = fixedContent;
          fixedContent = fixedContent.replace(pattern, replacement);
          if (before !== fixedContent) {
            fixes.push(description);
          }
        }

        // Apply targeted fixes for common issues
        fixedContent = this.fixInterfaceSyntax(fixedContent, fixes);
        fixedContent = this.fixObjectPropertySyntax(fixedContent, fixes);
        fixedContent = this.fixFunctionParameterSyntax(fixedContent, fixes);

        if (content !== fixedContent) {
          fs.writeFileSync(file, fixedContent);
          fixedCount++;
          this.results.push({ file, fixes });
        }
      } catch (error) {
        this.results.push({ file, error: error.message });
      }
    }

    console.log('\n'); // Clear progress line
    this.printResults(allFiles.length, fixedCount);
  }

  fixInterfaceSyntax(content, fixes) {
    // Fix interface members with trailing commas after semicolons
    let fixed = content.replace(
      /(interface\s+\w+\s*(?:<[^>]+>)?\s*{[^}]+})/g,
      (match) => {
        const fixedMatch = match.replace(/;,/g, ';');
        if (match !== fixedMatch) {
          fixes.push('Fixed interface member syntax');
        }
        return fixedMatch;
      }
    );

    // Fix type literals
    fixed = fixed.replace(
      /(type\s+\w+\s*=\s*{[^}]+})/g,
      (match) => {
        const fixedMatch = match.replace(/;,/g, ';');
        if (match !== fixedMatch) {
          fixes.push('Fixed type literal syntax');
        }
        return fixedMatch;
      }
    );

    return fixed;
  }

  fixObjectPropertySyntax(content, fixes) {
    // Fix missing commas between object properties
    let fixed = content.replace(
      /(['"]\w+['"]:\s*[^,}\n]+)\n\s*(['"]\w+['"]:\s*)/g,
      '$1,\n  $2'
    );

    // Fix property assignment with = instead of :
    fixed = fixed.replace(
      /({[^}]*?)(\w+)\s*=\s*([^,}]+)/g,
      (match, prefix, key, value) => {
        if (!value.includes('===>')) {
          fixes.push('Fixed property assignment (= to :)');
          return `${prefix}${key}: ${value}`;
        }
        return match;
      }
    );

    return fixed;
  }

  fixFunctionParameterSyntax(content, fixes) {
    // Fix missing commas in function parameters
    let fixed = content.replace(
      /\(([^)]+)\)/g,
      (match, params) => {
        // Skip if it's empty or has no parameters
        if (!params.trim()) return match;
        
        // Check for missing commas between parameters
        const fixedParams = params.replace(
          /([^,\s])(\s+)([a-zA-Z_$][\w$]*\s*:)/g,
          '=$3'
        );
        
        if (params !== fixedParams) {
          fixes.push('Added missing comma between parameters');
        }
        
        return `(${fixedParams})`;
      }
    );

    return fixed;
  }

  printResults(totalFiles, fixedCount) {
    console.log('='.repeat(60));
    console.log('✅ TARGETED SYNTAX FIX COMPLETE');
    console.log('='.repeat(60) + '\n');

    console.log(`📊 Summary:`);
    console.log(`   Source files processed: ${totalFiles}`);
    console.log(`   Files fixed: ${fixedCount}`);
    console.log(`   Success rate: ${Math.round(fixedCount/totalFiles*100)}%\n`);

    // Show sample of fixed files
    const fixedFiles = this.results.filter(r => r.fixes && r.fixes.length > 0);
    if (fixedFiles.length > 0) {
      console.log('📝 Sample of fixed files:');
      fixedFiles.slice(0, 10).forEach(({ file, fixes }) => {
        console.log(`\n   ${file}`);
        [...new Set(fixes)].forEach(fix => console.log(`     ✓ ${fix}`));
      });
      
      if (fixedFiles.length > 10) {
        console.log(`\n   ... and ${fixedFiles.length - 10} more files`);
      }
    }

    // Show errors if any
    const errorFiles = this.results.filter(r => r.error);
    if (errorFiles.length > 0) {
      console.log('\n⚠️  Files with errors:');
      errorFiles.slice(0, 5).forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }

    console.log('\n✨ Next steps:');
    console.log('   1. Run "npm run lint" to check for remaining issues');
    console.log('   2. Run "npm run type-check" to verify TypeScript compilation');
    console.log('   3. Review changes with "git diff"\n');
  }
}

// Main execution
if (require.main === module) {
  const fixer = new TargetedSyntaxFixer();
  fixer.fixTargetedFiles().catch(console.error);
}

module.exports = { TargetedSyntaxFixer };