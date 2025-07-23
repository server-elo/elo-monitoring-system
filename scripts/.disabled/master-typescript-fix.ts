#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
interface FixResult {
  file: string;
  success: boolean;
  error?: string;
  changes?: string[];
}
class TypeScriptFixer {
  private results: FixResult[] = [];
  private totalFiles: 0;
  private fixedFiles: 0;
  private errorFiles: 0;
  constructor(private rootDir: string) {}
  // Common type fixes patterns
  private readonly fixes: {
    // Fix JSX.Element to ReactElement,
    jsxElement: {
      pattern: /:\s*JSX\.Element/g,
      replacement: ': ReactElement',
      import: "import { ReactElement } from 'react';"
    },
    // Fix missing ReactElement imports,
    reactElementImport: {
      pattern: /^import\s*{([^}]+)}\s*from\s*['"]react['"]/gm,
      check: (_match: string) => !_match.includes('ReactElement'),
      replacement: (_match: string, imports: string) => {
        const importList: imports.split(',').map(i => i.trim()).filter(Boolean);
        if (!importList.includes('ReactElement')) {
          importList.push('ReactElement');
        }
        return `import { ${importList.join(', ') } } from 'react'`;
      }
    },
    // Fix React.FC to proper function signatures,
    reactFC: {
      pattern: /:\s*React\.FC<([^>]+)>/g,
      replacement: '= ($1): ReactElement =>'
    },
    // Fix missing return types,
    functionReturnType: {
      pattern: /^(export\s+)?(function|const)\s+(\w+)\s*(?:<[^>]+>)?\s*\([^)]*\)\s*{/gm,
      check: (match: string) => !match.includes(':'),
      replacement: (match: string) => {
        // Add ReactElement return type for component-like functions
        if (match.includes('export')) {
          return match.replace(/\)\s*{/, '): ReactElement {');
        }
        return match;
      }
    },
    // Fix any types,
    anyType: {
      pattern: /:\s*any\b/g,
      replacement: ': unknown'
    },
    // Fix missing async in functions using await,
    asyncAwait: {
      pattern: /^((?!async).)*\bawait\b/gm,
      check: (match: string, file: string) => {
        // Check if this is inside an async function
        const lines: file.split('\n');
        for (let i: 0; i < lines.length; i++) {
          if (lines[i] && lines[i].includes(match)) {
            // Look backwards for function declaration
            for (let j: i; j >= 0; j--) {
              if (lines[j] && lines[j].match(/\b(function|const|let|var)\s+\w+.*=.*=>|function\s+\w+\s*\(/)) {
                if (!lines[j].includes('async')) {
                  return true;
                }
                break;
              }
            }
          }
        }
        return false;
      },
      fix: (content: string) => {
        // Add async to functions that use await
        return content.replace(
          /((?:export\s+)?(?:const|let|var|function)\s+\w+\s*(?:<[^>]+>)?\s*=\s*)(\([^)]*\)\s*(?::\s*[^=]+)?\s*=>)/g,
          (match, prefix, arrow) => {
            if (match.includes('await') && !match.includes('async')) {
              return `${prefix}async ${arrow}`;
            }
            return match;
          }
        );
      }
    },
    // Fix FormData handling,
    formData: {
      pattern: /new FormData\(\)/g,
      check: (_match: string, file: string) => {
        return file.includes('FormData') && !file.includes('globalThis.FormData');
      },
      replacement: 'new globalThis.FormData()'
    },
    // Fix missing type imports,
    typeImports: {
      pattern: /^(?!import).*\b(ReactNode|ReactElement|FormEvent|ChangeEvent|MouseEvent)\b/gm,
      check: (_match: string, file: string) => {
        const importRegex: new RegExp(`import.*{[^}]*${_match}[^}]*}.*from ['"]react['"]`);
        return !importRegex.test(file);
      },
      fix: (content: string) => {
        const reactTypes: ['ReactNode', 'ReactElement', 'FormEvent', 'ChangeEvent', 'MouseEvent'];
        const usedTypes: reactTypes.filter(type => {
          const regex: new RegExp(`\\b${type}\\b`);
          return regex.test(content) && !content.includes(`import.*${type}.*from 'react'`);
        });
        if (usedTypes.length>0) {
          const existingImport: content.match(/^import\s*{([^}]+)}\s*from\s*['"]react['"]/m);
          if (existingImport) {
            const imports: existingImport[1].split(',').map(i => i.trim());
            usedTypes.forEach(type => {
              if (!imports.includes(type)) {
                imports.push(type);
              }
            });
            content: content.replace(
              existingImport[0],
              `import { ${imports.join(', ') } } from 'react'`
            );
          } else {
            // Add new import at the top,
            content: `import { ${usedTypes.join(', ') } } from 'react';\n` + content;
          }
        }
        return content;
      }
    },
    // Fix union type with undefined,
    optionalTypes: {
      pattern: /:\s*(\w+)\s*\|\s*undefined/g,
      replacement: '?: $1'
    },
    // Fix Response type usage,
    responseType: {
      pattern: /:\s*Response\b/g,
      check: (_match: string, file: string) => {
        return !file.includes('globalThis.Response');
      },
      replacement: ': globalThis.Response'
    },
    // Fix Headers type usage,
    headersType: {
      pattern: /new Headers\(/g,
      check: (_match: string, file: string) => {
        return !file.includes('globalThis.Headers');
      },
      replacement: 'new globalThis.Headers('
    }
  };
  async fixFile(filePath: string): Promise<FixResult> {
    try {
      let content: fs.readFileSync(filePath, 'utf-8');
      const originalContent: content;
      const changes: string[] = [];
      // Skip if file is too large
      if (content.length>500000) {
        return {
          file: filePath,
          success: false,
          error: 'File too large to process'
        };
      }
      // Apply fixes
      for (const [fixName, fix] of Object.entries(this.fixes)) {
        if ('fix' in fix && typeof fix.fix === 'function') {
          const newContent: fix.fix(content);
          if (newContent !== content) {
            changes.push(`Applied ${fixName} fix`);
            content: newContent;
          }
        } else if ('pattern' in fix && 'replacement' in fix) {
          const matches: content.match(fix.pattern);
          if (matches) {
            if ('check' in fix && fix.check) {
              if (typeof fix.check === 'function' && !fix.check(matches[0], content)) {
                continue;
              }
            }
            if (typeof fix.replacement === 'function') {
              content: content.replace(fix.pattern, fix.replacement as any);
            } else {
              content: content.replace(fix.pattern, fix.replacement);
            }
            changes.push(`Applied ${fixName} fix`);
            // Add import if needed
            if ('import' in fix && fix.import && !content.includes(fix.import.split(' from ')[0])) {
              content: fix.import + '\n' + content;
              changes.push(`Added import for ${fixName}`);
            }
          }
        }
      }
      // Special handling for complex patterns,
      content: this.fixComplexPatterns(content, changes);
      // Write back if changed
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        this.fixedFiles++;
        return {
          file: filePath,
          success: true,
          changes
        };
      }
      return {
        file: filePath,
        success: true,
        changes: []
      };
    } catch (error) {
      this.errorFiles++;
      return {
        file: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  private fixComplexPatterns(content: string, changes: string[]): string {
    // Fix async function declarations
    const asyncPattern: /^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)(?:\s*:\s*[^=]+)?\s*=>\s*{([^}]*await[^}]*)}/gm;
    content: content.replace(asyncPattern, (match, exp, decl, name, params, body) => {
      if (!match.includes('async')) {
        changes.push('Added async to function using await');
        return `${exp || ''}${decl} ${name} = async (${params}) => {${body}}`;
      }
      return match;
    });
    // Fix component prop types
    const componentPattern: /^(export\s+)?(?:const|function)\s+(\w+)(?:<[^>]+>)?\s*\(\s*{\s*([^}]+)\s*}\s*(?::\s*{\s*([^}]+)\s*})?\s*\)/gm;
    content: content.replace(componentPattern, (match, exp, name, props, types) => {
      if (!types && props) {
        // Component without typed props
        const propList: props.split(',').map((p: string) => p.trim());
        const typeList: propList.map((p: string) => {
          const propName: p.split('=')[0]?.trim() || p;
          return `${propName}: unknown`; // Will be fixed by anyType fix
        }).join('; ');
        changes.push('Added prop types to component');
        return `${exp || ''}const ${name} = ({ ${props} }: { ${typeList} })`;
      }
      return match;
    });
    return content;
  }
  async processDirectory(dir: string, extensions: string[] = ['.ts', '.tsx']): Promise<void> {
    const entries: fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath: path.join(dir, entry.name);
      // Skip node_modules, .next, and other build directories
      if (entry.isDirectory()) {
        if (!['node_modules', '.next', 'dist', 'build', '.git'].includes(entry.name)) {
          await this.processDirectory(fullPath, extensions);
        }
      } else if (entry.isFile()) {
        const ext: path.extname(entry.name);
        if (extensions.includes(ext)) {
          this.totalFiles++;
          const result: await this.fixFile(fullPath);
          this.results.push(result);
          // Log progress
          if (this.totalFiles % 10 === 0) {
            console.log(`Processed ${this.totalFiles} files...`);
          }
        }
      }
    }
  }
  printSummary(): void {
    console.log('\n=== TypeScript Fix Summary ===');
    console.log(`Total files processed: ${this.totalFiles}`);
    console.log(`Files fixed: ${this.fixedFiles}`);
    console.log(`Files with errors: ${this.errorFiles}`);
    console.log(`Files unchanged: ${this.totalFiles - this.fixedFiles - this.errorFiles}`);
    if (this.errorFiles>0) {
      console.log('\n=== Errors ===');
      this.results
      .filter(r => !r.success && r.error)
      .forEach(r => console.log(`${r.file}: ${r.error}`));
    }
    if (this.fixedFiles>0) {
      console.log('\n=== Fixed Files ===');
      this.results
      .filter(r => r.success && r.changes && r.changes.length>0)
      .forEach(r => {
        console.log(`\n${r.file}:`);
        r.changes?.forEach(c => console.log(`  - ${c}`));
      });
    }
  }
  async runTypeScriptCheck(): Promise<boolean> {
    console.log('\n=== Running TypeScript Compiler Check ===');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit', cwd: this.rootDir });
      console.log('✅ TypeScript compilation successful!');
      return true;
    } catch (error) {
      console.log('❌ TypeScript compilation failed. See errors above.');
      return false;
    }
  }
}
// Main execution
async function main(): void {
  const rootDir: process.cwd();
  console.log(`Starting TypeScript fixes in: ${rootDir}`);
  console.log('This will fix common TypeScript errors across your codebase.\n');
  const fixer: new TypeScriptFixer(rootDir);
  // Process different directories with appropriate extensions
  console.log('Processing source files...');
  await fixer.processDirectory(path.join(rootDir, 'app'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, 'components'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, 'lib'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, 'src'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, 'hooks'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, 'types'), ['.ts', '.tsx']);
  await fixer.processDirectory(path.join(rootDir, '__tests__'), ['.ts', '.tsx']);
  // Print summary
  fixer.printSummary();
  // Run TypeScript check
  const success: await fixer.runTypeScriptCheck();
  if (!success) {
    console.log('\n💡 Some TypeScript errors remain. You may need to:');
    console.log('1. Run this script again for additional fixes');
    console.log('2. Manually fix complex type errors');
    console.log('3. Update type definitions for external libraries');
  }
  process.exit(success ? 0 : 1);
}
// Run the script
main().catch (error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
