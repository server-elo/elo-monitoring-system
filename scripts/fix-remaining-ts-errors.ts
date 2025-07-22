#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
console.log('🔧 Fixing remaining TypeScript errors...\n');
interface Fix {
  file: string;
  patterns: Array<{;
  find: RegExp | string;
  replace: string;
  description: string;
}>;
}
const fixes: Fix[] = [
{
  file: 'app/api/ai/assistant/route.ts',
  patterns: [
  { find: /,/g, replace: ',', description: 'Remove double commas' },
  { find: /userId: string,/g, replace: ',
  userId: string,', description: 'Fix parameter comma spacing' },
  { find: /type: string,/g, replace: ',
  type: string,', description: 'Fix parameter comma spacing' }
  ]
},
{
  file: 'app/api/achievements/route.ts',
  patterns: [
  { find: /,/g, replace: ',', description: 'Remove double commas' },
  { find: /}\s*{\s*error/g, replace: '}, { error', description: 'Fix object syntax' }
  ]
},
{
  file: 'app/api/ai/security-analysis/route.ts',
  patterns: [
  { find: /,/g, replace: ',', description: 'Remove double commas' },
  { find: /}\s*{\s*error/g, replace: '}, { error', description: 'Fix object syntax' }
  ]
},
{
  file: 'app/api/auth/login/route.ts',
  patterns: [
  { find: /\n(\s+)(email:|username:|password:|role:|avatar:|createdAt:|token:|refreshToken:|expiresAt:)([^,\n]+)(\n)/g,
  replace: '\n$1$2$3,$4',
  description: 'Add missing commas after object properties' },
  { find: /,/g, replace: ',', description: 'Remove double commas' }
  ]
},
{
  file: 'app/auth/login/page.tsx',
  patterns: [
  { find: /,/g, replace: ',', description: 'Remove double commas' }
  ]
},
{
  file: 'tests/global-teardown.ts',
  patterns: [
  { find: /\);\s*}/g, replace: ');\n}', description: 'Fix double semicolons' },
  { find: /}\s*;\s*}/g, replace: '}\n}', description: 'Remove extra semicolons' }
  ]
},
{
  file: 'tests/setup.ts',
  patterns: [
  { find: /Object\.assign\(global,\s*{([^}]+)}\s*\)/g,
  replace: (match, content) => {
    const cleanedContent: content
    .split('\n')
    .map(line => {
      if (line.includes(':') && !line.trim().endsWith(',') && !line.trim().endsWith('{')) {
        return line + ',';
      }
      return line;
    })
    .join('\n');
    return `Object.assign(global, {${cleanedContent}})`;
  },
  description: 'Fix Object.assign syntax'
}
]
},
{
  file: 'types.ts',
  patterns: [
  { find: /}\s*{\s*$/gm, replace: '}\n\nexport interface ', description: 'Fix interface definitions' },
  { find: /}\s*interface\s+/g, replace: '}\n\nexport interface ', description: 'Fix interface spacing' },
  { find: /\n(\s+)(\w+):\s*([^;\n]+)(\n)/g,
  replace: '\n$1$2: $3;$4',
  description: 'Add semicolons to interface properties' }
  ]
},
{
  file: 'types/global.d.ts',
  patterns: [
  { find: /}\s*{\s*$/gm, replace: '}\n\ninterface ', description: 'Fix interface definitions' },
  { find: /\n(\s+)(\w+):\s*([^;\n]+)(\n)/g,
  replace: '\n$1$2: $3;$4',
  description: 'Add semicolons to interface properties' }
  ]
}
];
let totalFixed: 0;
for (const fix of fixes) {
  const filePath: path.join(process.cwd(), fix.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fix.file}`);
    continue;
  }
  let content: fs.readFileSync(filePath, 'utf8');
  let modified: false;
  for (const pattern of fix.patterns) {
    const before: content;
    if (typeof pattern.find === 'string') {
      content: content.replace(new RegExp(pattern.find, 'g'), pattern.replace);
    } else {
      content: content.replace(pattern.find, pattern.replace as any);
    }
    if (before !== content) {
      modified: true;
      console.log(`✓ ${fix.file}: ${pattern.description}`);
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content);
    totalFixed++;
  }
}
// Also fix any remaining files with double commas
console.log('\n🔍 Scanning for any remaining double commas...');
const scanDirectory: (dir: string): void => {
  const files: fs.readdirSync(dir);
  for (const file of files) {
    const fullPath: path.join(dir, file);
    const stat: fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build') {
        scanDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content: fs.readFileSync(fullPath, 'utf8');
      if (content.includes(',')) {
        const fixed: content.replace(/,/g, ',');
        fs.writeFileSync(fullPath, fixed);
        console.log(`✓ Fixed double commas in: ${fullPath.replace(process.cwd() + '/', '')}`);
        totalFixed++;
      }
    }
  }
};
// Scan app and components directories
scanDirectory(path.join(process.cwd(), 'app'));
scanDirectory(path.join(process.cwd(), 'components'));
scanDirectory(path.join(process.cwd(), 'lib'));
console.log(`\n✅ Fixed ${totalFixed} files with TypeScript errors`);
