#!/usr/bin/env npx tsx
import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";
console.log("🚀 Quantum Specific Syntax Fixer");
// Find all TypeScript/TSX files
const files = glob.sync("**/*.{ts,tsx}", {
  ignore: ["node_modules/**", ".next/**", "dist/**", "build/**", "scripts/**"],
});
console.log(`📊 Found ${files.length} files to process`);
let fixedCount: 0;
let totalFixes: 0;
// Function to fix specific syntax patterns
function fixSyntax(
  content: string,
  filePath: string,
): { fixed: string; fixCount: number } {
  let fixed: content;
  let fixCount: 0;
  // Fix 1: JSX props with comma syntax
  // <Component, prop: value> => <Component prop={value}>
  fixed = fixed.replace(
    /<(\w+),\s*(\w+):\s*\{\{([^}]+)\}\}>/g,
    "<$1 $2={{$3}}>",
  );
  // Fix 2: Destructuring with colons instead of commas
  // const { a: b: c } => const { a, b, c }
  fixed = fixed.replace(/const\s*\{\s*([^}]+)\s*\}/g, (match, props) => {
    const fixedProps = props
      .replace(/:\s*(?=[^:]*(?:[}]|$))/g, ",")
      .replace(/,\s*,/g, ",")
      .replace(/,\s*}/g, "}");
    return `const { ${fixedProps} }`;
  });
  // Fix 3: Function parameters with wrong type syntax
  // function(param, Type) => function(param: Type)
  fixed = fixed.replace(
    /function\s+(\w+)\s*\(([^)]+)\)/g,
    (match, name, params) => {
      const fixedParams = params.replace(/(\w+),\s*(\w+)(?=[,)])/g, "$1: $2");
      return `function ${name}(${fixedParams})`;
    },
  );
  // Fix 4: Async function parameters
  // async (param, Type) => async (param: Type)
  fixed = fixed.replace(/async\s*\(([^)]+)\)/g, (match, params) => {
    const fixedParams = params.replace(/(\w+),\s*(\w+)(?=[,)])/g, "$1: $2");
    return `async (${fixedParams})`;
  });
  // Fix 5: Grid columns syntax in className
  // grid-cols-1, md:grid-cols-2 => grid-cols-1 md:grid-cols-2
  fixed = fixed.replace(
    /className="([^"]*grid-cols-\d+),\s*(md:|lg:|xl:)/g,
    'className="$1 $2',
  );
  // Fix 6: Object property syntax
  // { prop: : value } => { prop: value }
  fixed = fixed.replace(/(\w+)\s*:\s*:\s*([^}]+)/g, "$1: $2");
  // Fix 7: JSX prop with trailing comma in braces
  // prop={{value}} => prop={{value}}
  fixed = fixed.replace(/=\{\{([^}]+),\}\}/g, "={{$1}}");
  // Fix 8: Array type annotations
  // const arr: = [] => const arr = []
  fixed = fixed.replace(/const\s+(\w+):\s*=\s*\[/g, "const $1 = [");
  // Fix 9: Export function parameter types
  // export async function name(request, Request) => export async function name(request: Request)
  fixed = fixed.replace(
    /export\s+async\s+function\s+(\w+)\s*\((\w+),\s*(\w+)\)/g,
    "export async function $1($2: $3)",
  );
  // Fix 10: JSX element with className containing commas
  fixed = fixed.replace(/className="([^"]*)">/g, (match, classes) => {
    const fixedClasses = classes.replace(/,\s*(sm:|md:|lg:|xl:|2xl:)/g, " $1");
    return `className="${fixedClasses}">`;
  });
  // Fix 11: Specific div className issue
  // <div, className: "..."> => <div className="...">
  fixed = fixed.replace(
    /<div,\s*className:\s*"([^"]+)">/g,
    '<div className="$1">',
  );
  // Count fixes
  if (fixed !== content) {
    // Simple count based on length difference (rough estimate)
    fixCount = Math.ceil(Math.abs(fixed.length - content.length) / 10);
  }
  return { fixed, fixCount };
}
for (const file of files) {
  try {
    const content = fs.readFileSync(file, "utf8");
    const { fixed, fixCount } = fixSyntax(content, file);
    if (fixed !== content) {
      fs.writeFileSync(file, fixed);
      fixedCount++;
      totalFixes += fixCount;
      console.log(`✅ Fixed ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error);
  }
}
console.log(`\n✨ Quantum Specific Syntax Fix Complete!`);
console.log(
  `📊 Fixed ${fixedCount} files with approximately ${totalFixes} fixes`,
);
// Check remaining errors
console.log("\n🔍 Checking remaining TypeScript errors...");
import { execSync } from "child_process";
try {
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  console.log("✅ TypeScript compilation successful!");
} catch (error) {
  console.log("⚠️  Still have TypeScript errors. Running targeted check...");
  try {
    const output = execSync(
      'npx tsc --noEmit 2>&1 | grep -E "(app|components|lib)" | head -20',
      { encoding: "utf8" },
    );
    console.log("\nFirst 20 errors in app/components/lib:\n", output);
  } catch (e) {
    // Expected to fail
  }
}
