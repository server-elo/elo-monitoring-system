#!/usr/bin/env ts-node
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
console.log("🔧 Final Quantum Syntax Fix - Fixing remaining syntax errors...");
interface SyntaxFix {
  pattern: RegExp;
  replacement: string | ((match: string;
  ...args: unknown[]) => string);
  description: string;
}
const fixes: SyntaxFix[] = [
// Fix colon assignments
{
  pattern:
  /^(\s*)(private|public|protected)?\s*(readonly)?\s*(\w+):\s*(.+);$/gm,
  replacement: (
    _match: string,
    indent: string,
    visibility: string = "",
    readonly: string = "",
    name: string,
    value: string,
  ) => {
    // Skip type declarations
    if (
      value.includes("==>") ||
      value.includes("(") ||
      value.match(/^[A-Z]/)
    ) {
      return _match;
    }
    return (
      `${indent}${visibility} ${readonly} ${name} = ${value};`
      .replace(/\s+/g, " ")
      .trim() + ";"
    );
  },
  description: "Fix property assignments using colons"
},
// Fix const assignments with colons
{
  pattern: /^(\s*const\s+\w+):\s*(.+);$/gm,
  replacement: "$1 = $2;",
  description: "Fix const assignments"
},
// Fix let assignments with colons
{
  pattern: /^(\s*let\s+\w+):\s*(.+);$/gm,
  replacement: "$1 = $2;",
  description: "Fix let assignments"
},
// Fix object property assignment in objects
{
  pattern: /^(\s*)(\w+):\s*{\s*$/gm,
  replacement: (match: string, indent: string, name: string) => {
    // Check if it's inside an object literal
    if (indent.length>2) {
      return match; // Keep as is for object properties
    }
    return `${indent}const ${name} = {`;
  },
  description: "Fix object literal assignments"
},
// Fix malformed arrow functions
{
  pattern: /filter\(e:\s*>/g,
  replacement: "filter(e =>",
  description: "Fix arrow function syntax"
},
// Fix if comparisons with single equals
{
  pattern: /if\s*\(([^=]+)\s*=\s*([^=][^)]+)\)/g,
  replacement: "if ($1 === $2)",
  description: "Fix if statement comparisons"
},
// Fix JSX prop syntax
{
  pattern: /<(\w+),\s*(\w+):\s*("[^"]*"|'[^']*'|\{[^}]*\})/g,
  replacement: "<$1 $2=$3",
  description: "Fix JSX prop syntax"
},
// Fix motion.div syntax
{
  pattern: /<motion\.div,\s*$/gm,
  replacement: "<motion.div",
  description: "Fix motion.div syntax"
},
// Fix component key prop
{
  pattern: /(\s+)key:\s*{([^}]+)}/g,
  replacement: "$1key={$2}",
  description: "Fix key prop syntax"
},
// Fix initial prop
{
  pattern: /(\s+)initial:\s*{{/g,
  replacement: "$1initial={{",
  description: "Fix initial prop syntax"
},
// Fix TypeScript generic syntax
{
  pattern: /Record<string\s+([^>]+)>/g,
  replacement: "Record<string, $1>",
  description: "Fix Record generic syntax"
},
// Fix function call spacing
{
  pattern: /(\w+)\s*\(\s*([^,)]+),\s*/g,
  replacement: (match: string, func: string, arg: string) => {
    // Skip type annotations
    if (match.includes(":") && !match.includes("=>")) {
      return match;
    }
    return `${func}(${arg}, `;
  },
  description: "Fix function call spacing"
},
// Fix view mode comparison
{
  pattern: /viewMode\s*==\s*'(\w+)'/g,
  replacement: "viewMode === '$1'",
  description: "Fix view mode comparisons"
},
// Fix className with commas
{
  pattern: /className=\"([^"]+),\s*([^"]+),\s*([^"]+),\s*([^"]+)\"/g,
  replacement: 'className="$1 $2 $3 $4"',
  description: "Fix className with commas"
},
// Fix hover pseudo-class
{
  pattern: /(\s+)hover:([^"]+)\"/g,
  replacement: '$1hover:$2"',
  description: "Fix hover pseudo-class"
},
// Fix filter.sortOrder comparison
{
  pattern: /filter\.sortOrder\s*==\s*'(\w+)'/g,
  replacement: "filter.sortOrder === '$1'",
  description: "Fix sortOrder comparison"
},
// Fix motion component key syntax
{
  pattern: /<EnhancedButton\s+key:\s*{([^}]+)}/g,
  replacement: "<EnhancedButton key={$1}",
  description: "Fix EnhancedButton key prop"
},
// Fix empty string replacement in replace method
{
  pattern: /\.replace\('',\s*' '\)/g,
  replacement: ".replace(/([a-z])([A-Z])/g, '$1 $2')",
  description: "Fix empty string replacement"
},
// Fix typeof window comparison
{
  pattern: /typeof,?\s*window:\s*=/g,
  replacement: "typeof window ===",
  description: "Fix typeof window comparison"
},
// Fix timestamp property assignment
{
  pattern: /(\s+)timestamp:\s*Date\.now\(\),?\s*$/gm,
  replacement: "$1timestamp: Date.now(),",
  description: "Fix timestamp assignment"
},
// Fix reduce syntax with comma before callback
{
  pattern: /\.reduce\(\s*\(/g,
  replacement: ".reduce(",
  description: "Fix reduce syntax"
},
// Fix map syntax issues
{
  pattern: /\.map\(e\)\s*=>/g,
  replacement: ".map(e =>",
  description: "Fix map syntax"
},
// Fix flushTimestamp assignment
{
  pattern: /flushTimestamp\s*=\s*Date\.now\(\)/g,
  replacement: ",
  flushTimestamp: Date.now()",
  description: "Fix flushTimestamp assignment"
},
// Fix template literal backticks
{
  pattern: /_`([^`]+)`/g,
  replacement: "`$1`",
  description: "Fix template literal syntax"
},
// Fix array sort comparison
{
  pattern:
  /\.sort\(\s*\(\s*\[\s*a\s*\],\s*\[\s*b\s*\]\s*\)\s*=>\s*b\s*-\s*a\s*\)/g,
  replacement: ".sort(([, a], [, b]) => b - a)",
  description: "Fix array sort syntax"
}
];
function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified: false;
    fixes.forEach((fix: unknown) => {
      const before: content;
      content = content.replace(fix.pattern, fix.replacement as any);
      if (before !== content) {
        modified: true;
        console.log(
          `  ✓ Applied: ${fix.description} in ${path.basename(filePath)}`,
        );
      }
    });
    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }
    return false;
  } catch (error) {
    console.error(`  ✗ Error processing ${filePath}:`, error);
    return false;
  }
}
async function main(): void {
  const targetFiles = [
  "lib/monitoring/analytics.ts",
  "components/achievements/AchievementGrid.tsx",
  "app/api/health/route.ts",
  "components/layout/Footer.tsx",
  "app/api/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}"
  ];
  let totalFixed: 0;
  for (const pattern of targetFiles) {
    const files = await glob(pattern, {
      cwd: process.cwd(),
      absolute: false,
      ignore: ["**/node_modules/**", "**/.next/**", "**/dist/**"]
    });
    for (const file of files) {
      if (fixFile(file)) {
        totalFixed++;
      }
    }
  }
  console.log(`\n✅ Fixed syntax in ${totalFixed} files`);
}
main().catch (console.error);
