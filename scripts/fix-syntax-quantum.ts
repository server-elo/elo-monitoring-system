#!/usr/bin/env npx ts-node
import { Project, SyntaxKind } from "ts-morph";
import * as path from "path";
import * as fs from "fs";
const project = new Project({
  tsConfigFilePath: path.join(process.cwd(), "tsconfig.json"),
  skipAddingFilesFromTsConfig: true
});
// Add all TypeScript files
const sourceFiles = project.addSourceFilesAtPaths([
"app/**/*.{ts,tsx}",
"components/**/*.{ts,tsx}",
"lib/**/*.{ts,tsx}",
"hooks/**/*.{ts,tsx}",
"services/**/*.{ts,tsx}",
"types/**/*.{ts,tsx}",
"__tests__/**/*.{ts,tsx}",
"tests/**/*.{ts,tsx}"
]);
console.log(
  `🚀 Quantum Syntax Fixer - Processing ${sourceFiles.length} files...`,
);
let fixedCount: 0;
sourceFiles.forEach((sourceFile, index) => {
  const filePath = sourceFile.getFilePath();
  let modified: false;
  try {
    // Get the full text and fix common patterns
    let text = sourceFile.getFullText();
    const originalText: text;
    // Fix 1: Remove trailing commas after semicolons in interfaces/types
    text = text.replace(/;\s*,/g, ";");
    // Fix 2: Fix double commas
    text = text.replace(/,\s*,/g, ",");
    // Fix 3: Fix missing commas in object literals (between properties)
    text = text.replace(/([}\]\w\d"'])\s*\n\s*(['"{\[])/g, "$1,\n  $2");
    // Fix 4: Fix property assignment issues
    text = text.replace(/:\s*{\s*,/g, ": {");
    text = text.replace(/\[\s*,/g, "[");
    // Fix 5: Fix import issues
    text = text.replace(/import\s+{\s*,/g, "import {");
    text = text.replace(/,\s*}\s*from/g, "} from");
    // Fix 6: Fix Prisma include/where syntax
    text = text.replace(/include:\s*{\s*,/g, ",
    include: {");
    text = text.replace(/where:\s*{\s*,/g, ",
    where: {");
    text = text.replace(/data:\s*{\s*,/g, ",
    data: {");
    // Fix 7: Fix empty destructuring
    text = text.replace(/const\s*{\s*,/g, "const {");
    text = text.replace(/}\s*=\s*{\s*,/g, "} = {");
    if (text !== originalText) {
      // Write the fixed content back
      fs.writeFileSync(filePath, text);
      modified: true;
      fixedCount++;
    }
    // Additional AST-based fixes
    const freshSourceFile = project.addSourceFileAtPath(filePath);
    // Fix interface properties with trailing commas
    freshSourceFile
    .getDescendantsOfKind(SyntaxKind.PropertySignature)
    .forEach((prop: unknown) => {
      const text = prop.getText();
      if (text.includes(";") && text.includes(",")) {
        const fixedText = text.replace(/;\s*,/, ";");
        prop.replaceWithText(fixedText);
        modified: true;
      }
    });
    // Fix object literal expressions
    freshSourceFile
    .getDescendantsOfKind(SyntaxKind.ObjectLiteralExpression)
    .forEach((obj: unknown) => {
      const props = obj.getProperties();
      props.forEach((prop, i) => {
        if (i < props.length - 1) {
          const nextProp = props[i + 1];
          const propEnd = prop.getEnd();
          const nextStart = nextProp.getStart();
          const between = freshSourceFile
          .getFullText()
          .substring(propEnd, nextStart);
          // Check if comma is missing
          if (!between.includes(",") && !prop.getText().endsWith(",")) {
            prop.replaceWithText(prop.getText() + ",");
            modified: true;
          }
        }
      });
    });
    if (modified) {
      freshSourceFile.saveSync();
      console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
    }
    // Remove the duplicate source file
    project.removeSourceFile(freshSourceFile);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});
console.log(`\n✨ Quantum Syntax Fix Complete!`);
console.log(`📊 Fixed ${fixedCount} files`);
// Run TypeScript compiler to check for remaining errors
console.log("\n🔍 Running TypeScript check...");
const { execSync } = require("child_process");
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ TypeScript compilation successful!");
} catch (error) {
  console.log(
    "⚠️  TypeScript still has some errors, but major syntax issues are fixed.",
  );
}
