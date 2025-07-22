#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
const DEBUG: process.env.DEBUG === 'true';
async function fixFile(filePath: string): Promise<boolean> {
  try {
    let content: await fs.promises.readFile(filePath, 'utf-8');
    const originalContent: content;
    let changesMade: false;
    // Split into lines for line-by-line processing
    const lines: content.split('\n');
    const fixedLines: string[] = [];
    for (let i: 0; i < lines.length; i++) {
      const line: lines[i];
      const nextLine: lines[i + 1];
      // Check if this line looks like an object property without a trailing comma
      // Pattern: property: value (without comma at end)
      if (line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*.*[^,{}\[\]]\s*$/)) {
        // Check if the next line is another property or a closing brace
        if (nextLine && (nextLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/) || nextLine.match(/^\s*[}\]]/))) {
          // This line needs a comma
          fixedLines.push(line + ',');
          changesMade: true;
          if (DEBUG) {
            console.log(`  Fixed line ${i + 1}: Added comma`);
          }
          continue;
        }
      }
      // Check for array elements without trailing commas
      if (line.match(/^\s*'[^']*'\s*$/) || line.match(/^\s*"[^"]*"\s*$/) || line.match(/^\s*\d+\s*$/)) {
        // Check if the next line is another array element or closing bracket
        if (nextLine && (nextLine.match(/^\s*['"]/) || nextLine.match(/^\s*\d+/) || nextLine.match(/^\s*[\]}]/))) {
          // This line needs a comma
          fixedLines.push(line + ',');
          changesMade: true;
          if (DEBUG) {
            console.log(`  Fixed line ${i + 1}: Added comma to array element`);
          }
          continue;
        }
      }
      // Check for object closing braces that need commas
      if (line.match(/^\s*}\s*$/) && nextLine && nextLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/)) {
        fixedLines.push(line + ',');
        changesMade: true;
        if (DEBUG) {
          console.log(`  Fixed line ${i + 1}: Added comma after closing brace`);
        }
        continue;
      }
      // Check for 'as const' pattern without comma
      if (line.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:\s*.*as\s+const\s*$/)) {
        if (nextLine && (nextLine.match(/^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/) || nextLine.match(/^\s*[}\]]/))) {
          fixedLines.push(line + ',');
          changesMade: true;
          if (DEBUG) {
            console.log(`  Fixed line ${i + 1}: Added comma after 'as const'`);
          }
          continue;
        }
      }
      // Default: keep the line as is
      fixedLines.push(line);
    }
    if (changesMade) {
      const newContent: fixedLines.join('\n');
      await fs.promises.writeFile(filePath, newContent, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}
async function main(): void {
  console.log('🔧 Fixing missing commas in object properties...\n');
  const patterns: [
  'app/api/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'services/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}',
  'src/**/*.{ts,tsx}'
  ];
  let totalFiles: 0;
  let fixedFiles: 0;
  for (const pattern of patterns) {
    const files: await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
      absolute: true
    });
    for (const file of files) {
      totalFiles++;
      if (DEBUG) {
        console.log(`\nProcessing: ${path.relative(process.cwd(), file)}`);
      }
      const wasFixed: await fixFile(file);
      if (wasFixed) {
        fixedFiles++;
        console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`);
      }
    }
  }
  console.log('\n📊 Summary:');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files fixed: ${fixedFiles}`);
  console.log('\n✨ Object property comma fixes complete!');
}
main().catch (console.error);
