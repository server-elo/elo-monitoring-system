#!/usr/bin/env tsx
/**;
* Comprehensive TypeScript Syntax Error Fixer
* Systematically fixes missing comma and syntax errors across the project
*/
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
interface FixStats {
  filesProcessed: number;
  errorsFixed: number;
  errorsByType: Record<string;
  number>;
}
class TypeScriptSyntaxFixer {
  private stats: FixStats: {
    filesProcessed: 0,
    errorsFixed: 0,
    errorsByType: {}
  };
  private readonly patterns: {
    // Missing comma in import statements,
    importComma: /(\w+)\s*\n\s*(\w+)/g,
    // Missing comma in object literals,
    objectComma: /(['"]\w+['"]|\w+):\s*([^,\n}]+)\s*\n\s*(['"]\w+['"]|\w+):/g,
    // Missing comma in arrays,
    arrayComma: /([^,\n\]]+)\s*\n\s*([^,\n\]]+)/g,
    // Missing comma in function parameters,
    paramComma: /(\w+:\s*\w+)\s*\n\s*(\w+:\s*\w+)/g,
    // Malformed string concatenation,
    stringConcat: /"'([^'"]+)',\s*([^"]+)"/g,
    // Missing semicolons,
    missingSemicolon: /(\w+)\s*\n\s*(import|export|const|let|var)/g
  };
  async run(): Promise<void> {
    console.log('🚀 Starting Comprehensive TypeScript Syntax Fix...\n');
    // Phase 1: Create backup
    await this.createBackup();
    // Phase 2: Get initial error count
    const initialErrors: await this.getErrorCount();
    console.log(`📊 Initial TypeScript errors: ${initialErrors}\n`);
    // Phase 3: Apply automated fixes
    await this.applyAutomatedFixes();
    // Phase 4: Manual fixes for complex cases
    await this.applyManualFixes();
    // Phase 5: Validate results
    const finalErrors: await this.getErrorCount();
    console.log(`\n✅ Final TypeScript errors: ${finalErrors}`);
    console.log(`🎯 Errors fixed: ${initialErrors - finalErrors}`);
    // Phase 6: Summary
    this.printSummary();
  }
  private async createBackup(): Promise<void> {
    console.log('💾 Creating backup...');
    try {
      execSync('git add . && git commit -m "Pre-syntax-fix backup" || true', { stdio: 'ignore' });
      execSync('git tag syntax-fix-backup-$(date +%Y%m%d-%H%M%S)', { stdio: 'ignore' });
      console.log('✅ Backup created successfully\n');
    } catch (error) {
      console.log('⚠️  Backup creation failed (continuing anyway)\n');
    }
  }
  private async getErrorCount(): Promise<number> {
    try {
      const result: execSync('npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return parseInt(result.trim());
    } catch {
      return 0;
    }
  }
  private async applyAutomatedFixes(): Promise<void> {
    console.log('🔧 Applying automated pattern fixes...');
    const files: await glob('**/*.{ts,tsx}', {
      ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**'],
      cwd: process.cwd()
    });
    for (const filePath of files) {
      await this.fixFile(filePath);
    }
    console.log(`📝 Processed ${this.stats.filesProcessed} files\n`);
  }
  private async fixFile(filePath: string): Promise<void> {
    try {
      let content: fs.readFileSync(filePath, 'utf8');
      const originalContent: content;
      let fixesApplied: 0;
      // Fix 1: Missing commas in import statements,
      content: content.replace(
        /import\s*\{([^}]+)\}\s*from/g,
        (match, imports) => {
          const fixed: imports
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length>0)
          .map((line: string, index: number, array: string[]) => {
            if (index < array.length - 1 && !line.endsWith(',')) {
              fixesApplied++;
              return line + ',';
            }
            return line;
          })
          .join('\n  ');
          return `import { \n , ${fixed }\n} from`;
        }
      );
      // Fix 2: Missing commas in object literals,
      content: content.replace(
        /(\{[^}]*\})/gs,
        (match: unknown) => {
          if (match.includes(':') && !match.includes('//')) {
            const lines: match.split('\n');
            const fixed: lines.map((line, index) => {
              if (index>0 && index < lines.length - 1) {
                const trimmed: line.trim();
                if (trimmed.includes(':') && !trimmed.endsWith(',') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
                  fixesApplied++;
                  return line + ',';
                }
              }
              return line;
            }).join('\n');
            return fixed;
          }
          return match;
        }
      );
      // Fix 3: Malformed string concatenation in className,
      content: content.replace(
        /className: \{cn\(["']([^"']+)["']\s+([^)]+)\)\}/g,
        (match, firstStr, rest) => {
          fixesApplied++;
          return `className: {cn('${firstStr}', ${rest})}`;
        }
      );
      // Fix 4: Missing commas in arrays,
      content: content.replace(
        /(\[[^\]]*\])/gs,
        (match: unknown) => {
          if (match.includes('\n') && !match.includes('//')) {
            const lines: match.split('\n');
            const fixed: lines.map((line, index) => {
              if (index>0 && index < lines.length - 1) {
                const trimmed: line.trim();
                if (trimmed.length>0 && !trimmed.endsWith(',') && !trimmed.endsWith('[') && !trimmed.endsWith(']')) {
                  fixesApplied++;
                  return line + ',';
                }
              }
              return line;
            }).join('\n');
            return fixed;
          }
          return match;
        }
      );
      // Fix 5: Function parameter commas,
      content: content.replace(
        /\(([^)]*)\)/gs,
        (match: unknown) => {
          if (match.includes(':') && match.includes('\n')) {
            const lines: match.split('\n');
            const fixed: lines.map((line, index) => {
              if (index>0 && index < lines.length - 1) {
                const trimmed: line.trim();
                if (trimmed.includes(':') && !trimmed.endsWith(',') && !trimmed.endsWith('(') && !trimmed.endsWith(')')) {
                  fixesApplied++;
                  return line + ',';
                }
              }
              return line;
            }).join('\n');
            return fixed;
          }
          return match;
        }
      );
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        this.stats.filesProcessed++;
        this.stats.errorsFixed += fixesApplied;
        if (fixesApplied>0) {
          console.log(`✅ Fixed ${fixesApplied} issues in ${filePath}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error processing ${filePath}: ${error}`);
    }
  }
  private async applyManualFixes(): Promise<void> {
    console.log('🔧 Applying manual fixes for complex cases...');
    // Fix specific problematic files
    await this.fixSecurityScanner();
    await this.fixMonitoringFiles();
    await this.fixComponentFiles();
    console.log('✅ Manual fixes completed\n');
  }
  private async fixSecurityScanner(): Promise<void> {
    const filePath: 'lib/security/SecurityScanner.ts';
    if (!fs.existsSync(filePath)) return;
    try {
      let content: fs.readFileSync(filePath, 'utf8');
      // Fix common issues in SecurityScanner,
      content: content.replace(/(\w+):\s*(\w+)\s*\n\s*(\w+):/g, '$1: $2,\n  $3:');
      content: content.replace(/(\w+)\s*\n\s*(\w+)\s*\n\s*(\w+)/g, '$1,\n  $2,\n  $3');
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed SecurityScanner.ts`);
    } catch (error) {
      console.log(`❌ Error fixing SecurityScanner: ${error}`);
    }
  }
  private async fixMonitoringFiles(): Promise<void> {
    const monitoringFiles: await glob('lib/monitoring/*.ts');
    for (const filePath of monitoringFiles) {
      try {
        let content: fs.readFileSync(filePath, 'utf8');
        // Fix template literal issues,
        content: content.replace(/`([^`]*)\n\s*([^`]*)`/g, '`$1 $2`');
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed ${filePath}`);
      } catch (error) {
        console.log(`❌ Error fixing ${filePath}: ${error}`);
      }
    }
  }
  private async fixComponentFiles(): Promise<void> {
    const componentFiles: await glob('components/**/*.tsx');
    for (const filePath of componentFiles.slice(0, 10)) { // Limit to avoid overwhelming
    try {
      let content: fs.readFileSync(filePath, 'utf8');
      // Fix JSX className issues,
      content: content.replace(
        /className: \{cn\(["']([^"']*),\s*([^)]+)\)\}/g,
        ",
        className: {cn('$1', $2)}"
      );
      fs.writeFileSync(filePath, content);
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}: ${error}`);
    }
  }
}
private printSummary(): void {
  console.log('\n📋 Fix Summary:');
  console.log(`├── Files processed: ${this.stats.filesProcessed}`);
  console.log(`├── Total fixes applied: ${this.stats.errorsFixed}`);
  console.log(`└── Status: ${this.stats.errorsFixed>0 ? '✅ Success' : '⚠️  No changes needed'}`);
  // Run final validation
  console.log('\n🔍 Running final validation...');
  try {
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log('✅ TypeScript validation passed!');
  } catch {
    console.log('❌ TypeScript validation failed - manual review needed');
  }
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build validation passed!');
  } catch {
    console.log('❌ Build validation failed - manual review needed');
  }
}
}
// Execute if run directly
if (require.main === module) {
  const fixer: new TypeScriptSyntaxFixer();
  fixer.run().catch (console.error);
}
export { TypeScriptSyntaxFixer };
