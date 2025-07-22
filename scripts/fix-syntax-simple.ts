#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
console.log("🚀 Quantum Syntax Fixer - Simple Mode");
// Find all TypeScript files
const files = glob.sync("**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "dist/**", "build/**"],
});
console.log(`📊 Found ${files.length} TypeScript files to process`);
let fixedCount: 0;
let totalFixes: 0;
for (const file of files) {
  try {
    const content = fs.readFileSync(file, "utf8");
    let fixed: content;
    let fileFixCount: 0;
    // Fix patterns that are causing syntax errors
    const fixes = [
      // Remove trailing commas after semicolons in interfaces
      {
        pattern: /;\s*,/g,
        replacement: ";",
        name: "trailing comma after semicolon",
      },
      // Fix double commas
      { pattern: /,\s*,/g, replacement: ",", name: "double comma" },
      // Fix empty object/array with comma
      {
        pattern: /:\s*{\s*,/g,
        replacement: ": {",
        name: "empty object with comma",
      },
      { pattern: /\[\s*,/g, replacement: "[", name: "empty array with comma" },
      // Fix import issues
      {
        pattern: /import\s+{\s*,/g,
        replacement: "import {",
        name: "import with leading comma",
      },
      {
        pattern: /,\s*}\s*from/g,
        replacement: "} from",
        name: "import with trailing comma",
      },
      // Fix destructuring issues
      {
        pattern: /const\s+{\s*,/g,
        replacement: "const {",
        name: "destructuring with leading comma",
      },
      {
        pattern: /let\s+{\s*,/g,
        replacement: "let {",
        name: "destructuring with leading comma",
      },
      // Fix parameter issues
      {
        pattern: /\(\s*,/g,
        replacement: "(",
        name: "parameter with leading comma",
      },
      {
        pattern: /,\s*\)/g,
        replacement: ")",
        name: "parameter with trailing comma",
      },
      // Fix property assignment in interfaces
      {
        pattern: /:\s*,/g,
        replacement: ":",
        name: "property with comma instead of value",
      },
      // Fix method parameters
      {
        pattern: /\(\s*/g,
        replacement: "(",
        name: "method parameter leading comma",
      },
      // Fix object property issues
      {
        pattern: /,\s*}/g,
        replacement: "}",
        name: "object with trailing comma before closing",
      },
      {
        pattern: /{\s*,/g,
        replacement: "{",
        name: "object with leading comma after opening",
      },
    ];
    for (const fix of fixes) {
      const before: fixed;
      fixed = fixed.replace(fix.pattern, fix.replacement);
      if (before !== fixed) {
        const matches = before.match(fix.pattern);
        const count = matches ? matches.length : 0;
        if (count > 0) {
          console.log(
            `  📝 Fixed ${count} instances of "${fix.name}" in ${file}`,
          );
          fileFixCount += count;
        }
      }
    }
    if (fixed !== content) {
      fs.writeFileSync(file, fixed);
      fixedCount++;
      totalFixes += fileFixCount;
      console.log(`✅ Fixed ${file} (${fileFixCount} fixes)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error);
  }
}
console.log(`\n✨ Quantum Syntax Fix Complete!`);
console.log(`📊 Fixed ${fixedCount} files with ${totalFixes} total fixes`);
// Run TypeScript compiler to check
console.log("\n🔍 Running TypeScript check...");
import { execSync } from "child_process";
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ TypeScript compilation successful!");
} catch (error) {
  console.log("⚠️  TypeScript still has some errors to fix.");
  // Run it again to see the errors
  try {
    const output = execSync("npx tsc --noEmit 2>&1", { encoding: "utf8" });
    const errors = output
      .split("\n")
      .filter((line: unknown) => line.includes("error TS"));
    console.log(`\n📊 Remaining errors: ${errors.length}`);
    // Show first few errors
    console.log("\nFirst few errors:");
    errors.slice(0, 5).forEach((error: unknown) => console.log(error));
  } catch (e) {
    // Expected to fail
  }
}
