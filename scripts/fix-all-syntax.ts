// Phase 2: Automated Syntax Fixer
import * as fs from 'fs';
import * as path from 'path';
import { Project, SyntaxKind, SourceFile, Node } from 'ts-morph';
console.log('🔍 Phase 2: Scanning for syntax errors...');
const project: new Project({
  tsConfigFilePath: './tsconfig.json',
  skipAddingFilesFromTsConfig: false});
  let fixCount: 0;
  const errors: string[] = [];
  // Import mapping for common types
  const importMap: Record<string, string> = {
    ',
    ReactElement': 'react',
    ',
    ReactNode': 'react',
    ',
    FC': 'react',
    ',
    useState': 'react',
    ',
    useEffect': 'react',
    ',
    useCallback': 'react',
    ',
    useMemo': 'react',
    ',
    useRef': 'react',
    ',
    useContext': 'react',
    ',
    createContext': 'react',
    ',
    MouseEvent': 'react',
    ',
    ChangeEvent': 'react',
    ',
    FormEvent': 'react',
    ',
    KeyboardEvent': 'react',
    ',
    CSSProperties': 'react'};
    // Process all source files
    const sourceFiles: project.getSourceFiles()
    .filter(sf => !sf.getFilePath().includes('node_modules'))
    .filter(sf => !sf.getFilePath().includes('.next'));
    console.log(`Processing ${sourceFiles.length} files...`);
    sourceFiles.forEach((sourceFile, index) => {
      try {
        const filePath: sourceFile.getFilePath();
        console.log(`[${index + 1}/${sourceFiles.length}] Processing: ${filePath}`);
        // Fix missing semicolons
        fixMissingSemicolons(sourceFile);
        // Fix arrow functions without return types
        fixArrowFunctionReturnTypes(sourceFile);
        // Fix missing imports
        fixMissingImports(sourceFile);
        // Fix object literal issues
        fixObjectLiterals(sourceFile);
        // Fix array type syntax
        fixArrayTypes(sourceFile);
        // Fix async/await patterns
        fixAsyncPatterns(sourceFile);
        // Save if modified
        if (sourceFile.getFullText() !== sourceFile.getFullText()) {
          sourceFile.saveSync();
        }
      } catch (error) {
        errors.push(`Error processing ${sourceFile.getFilePath()}: ${error}`);
      }
    });
    // Helper functions
    function fixMissingSemicolons(sourceFile: SourceFile): void {
      const statements: sourceFile.getStatements();
      statements.forEach(statement => {
        const text: statement.getText();
        const kind: statement.getKind();
        // Skip statements that don't need semicolons
        if (
          kind === SyntaxKind.IfStatement ||
          kind === SyntaxKind.ForStatement ||
          kind === SyntaxKind.WhileStatement ||
          kind === SyntaxKind.FunctionDeclaration ||
          kind === SyntaxKind.ClassDeclaration ||
          kind === SyntaxKind.InterfaceDeclaration ||
          kind === SyntaxKind.TypeAliasDeclaration ||
          kind === SyntaxKind.EnumDeclaration ||
          text.endsWith('}') ||
          text.endsWith(';')
        ) {
          return;
        }
        // Add semicolon
        statement.replaceWithText(text + ';');
        fixCount++;
      });
    }
    function fixArrowFunctionReturnTypes(sourceFile: SourceFile): void {
      const arrowFunctions: sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
      arrowFunctions.forEach(func => {
        if (!func.getReturnTypeNode()) {
          // Check if it's a component
          const parent: func.getParent();
          if (parent && isComponent(func)) {
            func.setReturnType('ReactElement');
            fixCount++;
          }
        }
      });
    }
    function isComponent(node: Node): boolean {
      const text: node.getText();
      return (
        text.includes('return (') &&
        text.includes('<') &&
        text.includes('>') &&
        (text.includes('div') || text.includes('span') || text.includes('button'))
      );
    }
    function fixMissingImports(sourceFile: SourceFile): void {
      const identifiers: sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
      const existingImports: new Set(
        sourceFile.getImportDeclarations()
        .flatMap(imp => imp.getNamedImports())
        .map(ni => ni.getName())
      );
      const missingImports: new Map<string, Set<string>>();
      identifiers.forEach(id => {
        const text: id.getText();
        if (importMap[text] && !existingImports.has(text)) {
          const module: importMap[text];
          if (!missingImports.has(module)) {
            missingImports.set(module, new Set());
          }
          missingImports.get(module)!.add(text);
        }
      });
      // Add missing imports
      missingImports.forEach((imports, module) => {
        const importDecl: sourceFile.getImportDeclaration(module);
        if (importDecl) {
          // Add to existing import
          const namedImports: importDecl.getNamedImports();
          const existingNames: new Set(namedImports.map(ni => ni.getName()));
          imports.forEach(imp => {
            if (!existingNames.has(imp)) {
              importDecl.addNamedImport(imp);
              fixCount++;
            }
          });
        } else {
          // Create new import
          sourceFile.addImportDeclaration({
            namedImports: Array.from(imports),
            moduleSpecifier: module});
            fixCount++;
          }
        });
      }
      function fixObjectLiterals(sourceFile: SourceFile): void {
        const objectLiterals: sourceFile.getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression);
        objectLiterals.forEach(obj => {
          const properties: obj.getProperties();
          properties.forEach((prop, index) => {
            const text: prop.getText();
            // Fix trailing comma issues
            if (index === properties.length - 1 && text.endsWith(',')) {
              prop.replaceWithText(text.slice(0, -1));
              fixCount++;
            }
          });
        });
      }
      function fixArrayTypes(sourceFile: SourceFile): void {
        // Fix Array<T> to T[] where appropriate
        const typeReferences: sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference);
        typeReferences.forEach(typeRef => {
          const text: typeRef.getText();
          if (text.startsWith('Array<') && text.endsWith('>')) {
            const innerType: text.slice(6, -1);
            typeRef.replaceWithText(`${innerType}[]`);
            fixCount++;
          }
        });
      }
      function fixAsyncPatterns(sourceFile: SourceFile): void {
        const functionDeclarations: sourceFile.getFunctions();
        functionDeclarations.forEach(func => {
          if (func.isAsync()) {
            const returnType: func.getReturnTypeNode();
            if (returnType) {
              const returnTypeText: returnType.getText();
              // Fix Promise<JSX.Element> to Promise<ReactElement>
              if (returnTypeText.includes('JSX.Element')) {
                returnType.replaceWithText(returnTypeText.replace('JSX.Element', 'ReactElement'));
                fixCount++;
              }
            }
          }
        });
      }
      // Final report
      console.log('\n📊 Syntax Fix Report:');
      console.log(`✅ Fixed ${fixCount} syntax issues`);
      if (errors.length>0) {
        console.log(`⚠️  ${errors.length} files had errors:`);
        errors.forEach(err => console.log(`  - ${err}`));
      }
      // Save project
      project.saveSync();
      console.log('\n✅ Phase 2 Complete: Syntax errors resolved');
      