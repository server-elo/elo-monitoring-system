#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
console.log("🚀 Quantum JSX Syntax Fixer");
// Find all TypeScript/TSX files
const files = glob.sync("**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "dist/**", "build/**"],
});
console.log(`📊 Found ${files.length} files to process`);
let fixedCount: 0;
let totalFixes: 0;
for (const file of files) {
  try {
    const content = fs.readFileSync(file, "utf8");
    let fixed: content;
    let fileFixCount: 0;
    // JSX-specific fixes
    const fixes = [
      // Fix malformed JSX props like <Component, prop: value>
      {
        pattern: /<(\w+),\s*(\w+):\s*\{\{([^}]+)\}\}>/g,
        replacement: "<$1 $2={{$3}}>",
        name: "malformed JSX prop syntax",
      },
      // Fix route handler patterns
      {
        pattern: /export\s+async\s+function\s+(\w+)\(request,\s*Request\)/g,
        replacement: "export async function $1(request: Request)",
        name: "route handler parameter type",
      },
      // Fix double arrow in arrow functions
      {
        pattern: /=>\s*=>/g,
        replacement: "=>",
        name: "double arrow function",
      },
      // Fix type annotations in destructuring
      {
        pattern: /const\s+\{\s*(\w+):\s*=\s*([^}]+)\}/g,
        replacement: "const { $1 = $2 }",
        name: "destructuring with type annotation",
      },
      // Fix async function parameters
      {
        pattern: /async\s+\((\w+),\s*(\w+)\)/g,
        replacement: "async ($1: $2)",
        name: "async function parameter types",
      },
      // Fix object property syntax errors
      {
        pattern: /(\w+):\s*:\s*(\w+)/g,
        replacement: "$1: $2",
        name: "double colon in object property",
      },
      // Fix array destructuring with types
      {
        pattern: /const\s+\[(\w+):\s*(\w+)\]/g,
        replacement: "const [$1]: [$2]",
        name: "array destructuring with type",
      },
      // Fix parameter destructuring
      {
        pattern: /\(\s*\{\s*(\w+)\s*\},\s*(\w+)\s*\)/g,
        replacement: "({ $1 }: $2)",
        name: "parameter object destructuring",
      },
      // Fix JSX closing tags
      {
        pattern: /<\/(\w+),>/g,
        replacement: "</$1>",
        name: "malformed closing tag",
      },
      // Fix component prop syntax
      {
        pattern: /(\w+)={{([^}]+)}},/g,
        replacement: "$1={{$2}}",
        name: "prop with trailing comma",
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
console.log(`\n✨ Quantum JSX Fix Complete!`);
console.log(`📊 Fixed ${fixedCount} files with ${totalFixes} total fixes`);
// Show remaining errors
console.log("\n🔍 Checking remaining TypeScript errors...");
import { execSync } from "child_process";
try {
  const output = execSync("npx tsc --noEmit 2>&1 | head -20", {
    encoding: "utf8",
  });
  console.log("First 20 errors:\n", output);
} catch (e) {
  // Expected to fail
}
