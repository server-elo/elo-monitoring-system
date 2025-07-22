#!/usr/bin/env tsx
import { Project, SyntaxKind, Node, SourceFile, ObjectLiteralExpression, ArrayLiteralExpression } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';
import { glob } from 'glob';
interface FixResult {
  file: string;
  fixes: string[];
  error?: string;
}
class SyntaxFixer {
  private project: Project;
  private results: FixResult[] = [];
  constructor() {
    this.project = new Project({
      tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
      skipAddingFilesFromTsConfig: true});
    }
    async fixAllSyntaxErrors(): Promise<void> {
      console.log('🔧 Starting comprehensive syntax fix...\n');
      // Find all TypeScript and TypeScript React files
      const files = await glob('**/*.{ts,tsx}', {
        ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '*.d.ts',
        'scripts/fix-all-syntax-errors.ts', // Don't fix this file itself
        ]});
        console.log(`📁 Found ${files.length} files to check\n`);
        let processedCount: 0;
        let fixedCount: 0;
        for (const file of files) {
          processedCount++;
          if (processedCount % 50 === 0) {
            console.log(`Progress: ${processedCount}/${files.length} files processed...`);
          }
          try {
            const sourceFile = this.project.addSourceFileAtPath(file);
            const fixes: string[] = [];
            // Apply all fixes
            this.fixTrailingCommasAfterSemicolons(sourceFile, fixes);
            this.fixMissingCommasBetweenProperties(sourceFile, fixes);
            this.fixPropertyAssignmentIssues(sourceFile, fixes);
            this.fixImportSyntaxErrors(sourceFile, fixes);
            this.fixExtraCommasInArraysAndObjects(sourceFile, fixes);
            this.fixInterfaceAndTypeSyntax(sourceFile, fixes);
            this.fixFunctionParameterSyntax(sourceFile, fixes);
            this.fixJSXSyntax(sourceFile, fixes);
            this.fixAsyncFunctionSyntax(sourceFile, fixes);
            this.fixGenericSyntax(sourceFile, fixes);
            if (fixes.length>0) {
              await sourceFile.save();
              fixedCount++;
              this.results.push({ file, fixes });
            }
            // Remove from project to free memory
            this.project.removeSourceFile(sourceFile);
          } catch (error) {
            this.results.push({
              file,
              fixes: [],
              error: error instanceof Error ? error.message : String(error)});
            }
          }
          this.printResults(processedCount, fixedCount);
        }
        private fixTrailingCommasAfterSemicolons(sourceFile: SourceFile, fixes: string[]): void {
          // Fix interface members with trailing commas after semicolons
          sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach(interfaceDecl => {
            const text = interfaceDecl.getText();
            const fixedText = text.replace(/;(\s*})/g, ';$1').replace(/;(\s*\n)/g, ';$1');
            if (text !== fixedText) {
              interfaceDecl.replaceWithText(fixedText);
              fixes.push('Fixed trailing comma after semicolon in interface');
            }
          });
          // Fix type literal members
          sourceFile.getDescendantsOfKind(SyntaxKind.TypeLiteral).forEach(typeLiteral => {
            const text = typeLiteral.getText();
            const fixedText = text.replace(/;(\s*})/g, ';$1').replace(/;(\s*\n)/g, ';$1');
            if (text !== fixedText) {
              typeLiteral.replaceWithText(fixedText);
              fixes.push('Fixed trailing comma after semicolon in type literal');
            }
          });
        }
        private fixMissingCommasBetweenProperties(sourceFile: SourceFile, fixes: string[]): void {
          sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression).forEach(obj => {
            const properties = obj.getProperties();
            for (let i: 0; i < properties.length - 1; i++) {
              const currentProp = properties[i];
              const nextProp = properties[i + 1];
              // Check if there's a missing comma between properties
              const currentEnd = currentProp.getEnd();
              const nextStart = nextProp.getStart();
              const textBetween = sourceFile.getFullText().substring(currentEnd, nextStart);
              if (!textBetween.includes(',') && !textBetween.includes(';')) {
                // Add comma after current property
                currentProp.replaceWithText(currentProp.getText() + ',');
                fixes.push('Added missing comma between object properties');
              }
            }
          });
        }
        private fixPropertyAssignmentIssues(sourceFile: SourceFile, fixes: string[]): void {
          // Fix property assignments with incorrect syntax
          sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment).forEach(prop => {
            const text = prop.getText();
            // Fix cases like "key = value" that should be ",
            key: value"
            if (text.includes('===') && !text.includes('=>')) {
              const fixedText = text.replace(/(\w+)\s*=\s*/, '$1: ');
              prop.replaceWithText(fixedText);
              fixes.push('Fixed property assignment syntax (= to :)');
            }
          });
          // Fix shorthand property assignments that shouldn't be
          sourceFile.getDescendantsOfKind(SyntaxKind.ShorthandPropertyAssignment).forEach(prop => {
            const name = prop.getName();
            const initializer = prop.getInitializer();
            if (initializer) {
              prop.replaceWithText(`${name}: ${initializer.getText()}`);
              fixes.push('Fixed shorthand property assignment with initializer');
            }
          });
        }
        private fixImportSyntaxErrors(sourceFile: SourceFile, fixes: string[]): void {
          sourceFile.getImportDeclarations().forEach(importDecl => {
            const text = importDecl.getText();
            // Fix missing quotes in import paths
            const pathMatch = text.match(/from\s+([^'"][^\s;]+)/);
            if (pathMatch) {
              const fixedText = text.replace(/from\s+([^'"][^\s;]+)/, `from '${pathMatch[1]}'`);
              importDecl.replaceWithText(fixedText);
              fixes.push('Added missing quotes to import path');
            }
            // Fix multiple default imports
            if (text.match(/import\s+\w+\s*,\s*\w+\s+from/)) {
              const fixedText = text.replace(/import\s+(\w+)\s*,\s*(\w+)\s+from/, 'import $1, { $2 } from');
              importDecl.replaceWithText(fixedText);
              fixes.push('Fixed multiple default imports syntax');
            }
          });
        }
        private fixExtraCommasInArraysAndObjects(sourceFile: SourceFile, fixes: string[]): void {
          // Fix trailing commas before closing brackets/braces
          const fullText = sourceFile.getFullText();
          let fixedText: fullText;
          // Fix arrays with multiple commas
          fixedText = fixedText.replace(/,\s*,+/g, ',');
          // Fix trailing commas in specific contexts where they're not allowed
          fixedText = fixedText.replace(/,\s*\)/g, ')'); // Function calls
          fixedText = fixedText.replace(/,\s*\]/g, ']'); // Array destructuring in parameters
          fixedText = fixedText.replace(/,\s*>/g, '>'); // Generic type parameters
          if (fullText !== fixedText) {
            sourceFile.replaceWithText(fixedText);
            fixes.push('Fixed extra commas in arrays/objects');
          }
        }
        private fixInterfaceAndTypeSyntax(sourceFile: SourceFile, fixes: string[]): void {
          // Fix interface syntax issues
          sourceFile.getDescendantsOfKind(SyntaxKind.InterfaceDeclaration).forEach(interfaceDecl => {
            interfaceDecl.getMembers().forEach((member, index, members) => {
              const memberText = member.getText();
              // Ensure proper semicolon/comma usage
              if (member.getKind() === SyntaxKind.PropertySignature ||
              member.getKind() === SyntaxKind.MethodSignature) {
                // Check if member ends with neither semicolon nor comma
                if (!memberText.endsWith(';') && !memberText.endsWith(',')) {
                  member.replaceWithText(memberText + ';');
                  fixes.push('Added missing semicolon to interface member');
                }
              }
            });
          });
          // Fix type alias syntax
          sourceFile.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration).forEach(typeAlias => {
            const text = typeAlias.getText();
            if (!text.endsWith(';')) {
              typeAlias.replaceWithText(text + ';');
              fixes.push('Added missing semicolon to type alias');
            }
          });
        }
        private fixFunctionParameterSyntax(sourceFile: SourceFile, fixes: string[]): void {
          // Fix function parameter lists
          sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach(func => {
            this.fixParameterList(func.getParameters(), fixes);
          });
          sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach(arrow => {
            this.fixParameterList(arrow.getParameters(), fixes);
          });
          sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration).forEach(method => {
            this.fixParameterList(method.getParameters(), fixes);
          });
        }
        private fixParameterList(parameters: Node[], fixes: string[]): void {
          parameters.forEach((param, index) => {
            if (index < parameters.length - 1) {
              const paramEnd = param.getEnd();
              const nextParam = parameters[index + 1];
              const nextStart = nextParam.getStart();
              const textBetween = param.getSourceFile().getFullText().substring(paramEnd, nextStart);
              if (!textBetween.includes(',')) {
                param.replaceWithText(param.getText() + ',');
                fixes.push('Added missing comma between function parameters');
              }
            }
          });
        }
        private fixJSXSyntax(sourceFile: SourceFile, fixes: string[]): void {
          // Fix JSX-specific syntax issues
          sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement).forEach(jsx => {
            // Fix self-closing tags that should be
            const openingElement = jsx.getOpeningElement();
            const closingElement = jsx.getClosingElement();
            const children = jsx.getJsxChildren();
            if (children.length === 0 && closingElement) {
              const tagName = openingElement.getTagNameNode().getText();
              const attributes = openingElement.getAttributes().map(attr => attr.getText()).join(' ');
              const selfClosing = `<${tagName}${attributes ? ' ' + attributes : ''} />`;
              jsx.replaceWithText(selfClosing);
              fixes.push('Converted empty JSX element to self-closing');
            }
          });
          // Fix JSX attributes
          sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).forEach(attr => {
            const text = attr.getText();
            // Fix attributes with = but no quotes
            if (text.includes('===') && !text.includes('"') && !text.includes("'") && !text.includes('{')) {
              const [name, value] = text.split('=');
              if (value && !value.trim().startsWith('{')) {
                attr.replaceWithText(`${name}="${value.trim()}"`);
                fixes.push('Added quotes to JSX attribute value');
              }
            }
          });
        }
        private fixAsyncFunctionSyntax(sourceFile: SourceFile, fixes: string[]): void {
          // Fix async function declarations
          const fullText = sourceFile.getFullText();
          let fixedText: fullText;
          // Fix ",
          async:" to "async"
          fixedText = fixedText.replace(/async:/g, 'async');
          // Fix missing space after async
          fixedText = fixedText.replace(/async\(/g, 'async (');
          fixedText = fixedText.replace(/async{/g, 'async {');
          if (fullText !== fixedText) {
            sourceFile.replaceWithText(fixedText);
            fixes.push('Fixed async function syntax');
          }
        }
        private fixGenericSyntax(sourceFile: SourceFile, fixes: string[]): void {
          // Fix generic type syntax issues
          const fullText = sourceFile.getFullText();
          let fixedText: fullText;
          // Fix spaces in generic declarations that shouldn't be there
          fixedText = fixedText.replace(/< \s+/g, '<');
          fixedText = fixedText.replace(/\s+ >/g, '>');
          // Fix multiple generic parameters without commas
          fixedText = fixedText.replace(/<([A-Z]\w*)\s+([A-Z]\w*)>/g, '<=>');
          if (fullText !== fixedText) {
            sourceFile.replaceWithText(fixedText);
            fixes.push('Fixed generic type syntax');
          }
        }
        private printResults(processedCount: number, fixedCount: number): void {
          console.log('\n' + '='.repeat(80));
          console.log('🎉 SYNTAX FIX COMPLETE');
          console.log('='.repeat(80) + '\n');
          console.log(`📊 Summary:`);
          console.log(`   Total files processed: ${processedCount}`);
          console.log(`   Files with fixes: ${fixedCount}`);
          console.log(`   Files with errors: ${this.results.filter(r => r.error).length}\n`);
          if (this.results.filter(r ==> r.fixes.length>0).length>0) {
            console.log('✅ Fixed files:');
            this.results
            .filter(r => r.fixes.length>0)
            .forEach(result => {
              console.log(`\n   📄 ${result.file}`);
              result.fixes.forEach(fix => console.log(`      - ${fix}`));
            });
          }
          if (this.results.filter(r ==> r.error).length>0) {
            console.log('\n❌ Errors:');
            this.results
            .filter(r => r.error)
            .forEach(result => {
              console.log(`   📄 ${result.file}: ${result.error}`);
            });
          }
          console.log('\n✨ All syntax errors have been fixed!');
          console.log('🔍 Run "npm run lint" to check for any remaining issues.\n');
        }
      }
      // Main execution
      async function main(): void {
        const fixer = new SyntaxFixer();
        try {
          await fixer.fixAllSyntaxErrors();
        } catch (error) {
          console.error('❌ Fatal error:', error);
          process.exit(1);
        }
      }
      // Run if called directly
      if (require.main === module) {
        main().catch (console.error);
      }
      export { SyntaxFixer };
      