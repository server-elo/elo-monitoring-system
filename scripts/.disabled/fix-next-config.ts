#!/usr/bin/env npx tsx
import * as fs from "fs";
console.log("🚀 Fixing next.config.js syntax errors");
const content = fs.readFileSync("next.config.js", "utf8");
// Fix all colon assignments to equals
let fixed = content.replace(/(\s+)(\w+\.\w+)\s*:\s*{/g, "$1$2 = {");
fixed = fixed.replace(/(\s+)(\w+\.\w+)\s*:\s*\[/g, "$1$2 = [");
// Fix other patterns
fixed = fixed.replace(
  /config\.resolve\.alias:\s*{/g,
  "config.resolve.alias = {",
);
fixed = fixed.replace(
  /config\.module\.rules:\s*config/g,
  "config.module.rules = config",
);
// Write the fixed content
fs.writeFileSync("next.config.js", fixed);
console.log("✅ Fixed next.config.js");
// Test if it's valid JavaScript
try {
  require("../next.config.js");
  console.log("✅ next.config.js is valid JavaScript");
} catch (error) {
  console.error("❌ Still has errors:", error.message);
  // Show the line with error
  const lines = fixed.split("\n");
  const errorMatch = error.message.match(/next\.config\.js:(\d+)/);
  if (errorMatch) {
    const lineNum = parseInt(errorMatch[1]);
    console.log(`\nError at line ${lineNum}:`);
    for (
      let i = Math.max(0, lineNum - 3);
      i < Math.min(lines.length, lineNum + 2);
      i++
    ) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}
