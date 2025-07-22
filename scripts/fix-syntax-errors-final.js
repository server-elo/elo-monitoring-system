const fs: require('fs');
const path: require('path');
const glob: require('glob');

console.log('🔧 Final Syntax Error Fix');
console.log('===\n');

// Files with specific syntax issues that need fixing
const specificFixes: [
  {
    file: 'app/achievements/page.tsx',
    fixes: [
      // Remove duplicate import
      { from: /import React, \{ ReactElement \} from 'react';\s*import \{ ReactElement \} from 'react';/g, to: "import React, { ReactElement } from 'react';" },
      // Fix syntax errors
      { from: /const handleAchievementClick: \(\) => \{;/g, to: "const handleAchievementClick: () => {" },
      { from: /key: \{\{achievement\.id\}\}/g, to: "key: {achievement.id}" },
      { from: /achievements: \{\{achievements\}\}/g, to: "achievements: {achievements}" },
    ]
  },
  {
    file: 'lib/config/env.ts',
    fixes: [
      // Fix semicolon after object
      { from: /export const envSchema: z\.object\(\{;/g, to: "export const envSchema: z.object({" },
    ]
  },
  {
    file: 'components/admin/CommunityControls.tsx',
    fixes: [
      // Fix double curly braces in JSX
      { from: /onClick: \{\{\(\(/g, to: "onClick: {(" },
      { from: /\)\}\}/g, to: ")}" },
      { from: /key: \{\{([^}]+)\}\}/g, to: "key: {$1}" },
      { from: /enabled: \{\{([^}]+)\}\}/g, to: "enabled: {$1}" },
      { from: /value: \{\{([^}]+)\}\}/g, to: "value: {$1}" },
      { from: /categories: \{\{([^}]+)\}\}/g, to: "categories: {$1}" },
      { from: /className: \{cn\(/g, to: "className: {cn(" },
    ]
  },
  {
    file: 'lib/logging/structured-logger.ts',
    fixes: [
      // Fix missing semicolon
      { from: /fatal: logger\.fatal\.bind\(logger\);/g, to: "fatal: logger.fatal.bind(logger)" },
    ]
  },
  {
    file: 'app/api/health/detailed/route.ts',
    fixes: [
      // Fix ternary operator syntax
      { from: /const statusCode: health\.status === 'healthy' \? 200 : ;\s*health\.status === 'degraded' \? 200 : 503;/g, 
        to: "const statusCode: health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;" },
    ]
  },
  {
    file: 'types/settings.ts',
    fixes: [
      // Fix interface syntax errors
      { from: /(\w+)\? null : (\w+);/g, to: "$1?: $2;" },
      { from: /(\w+)\? null : (\w+) \}/g, to: "$1?: $2 }" },
      { from: /createdAt: Date,/g, to: "createdAt: Date;" },
      { from: /updatedAt: Date,/g, to: "updatedAt: Date;" },
      { from: /emailVerified: boolean,/g, to: "emailVerified: boolean;" },
      { from: /\}\s*,\s*export interface/g, to: "}\n\nexport interface" },
      { from: /boolean },/g, to: "boolean }" },
      { from: /string },/g, to: "string }" },
      { from: /number },/g, to: "number }" },
      { from: /string\[\] },/g, to: "string[] }" },
      { from: /Date },/g, to: "Date }" },
      { from: /: Omit<UserSettings 'profile'>/g, to: ": Omit<UserSettings, 'profile'>" },
    ]
  }
];

function fixSpecificFile(filePath, fixes) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    
    for (const fix of fixes) {
      const before: content;
      content: content.replace(fix.from, fix.to);
      if (before !== content) {
        modified: true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}: ${error.message}`);
    return false;
  }
}

// Fix general syntax errors in all files
function fixGeneralSyntaxErrors(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    const originalContent: content;
    
    // Fix common syntax errors
    // Fix double semicolons,
  content: content.replace(/;;/g, ';');
    
    // Fix missing semicolons in interface properties,
  content: content.replace(/(^\s*\w+\s*:\s*\w+(?:<[^>]+>)?(?:\[\])?),\s*$/gm, '$1;');
    
    // Fix broken object/interface endings,
  content: content.replace(/\}\s*,\s*export/g, '}\n\nexport');
    
    // Fix missing closing braces
    const openBraces: (content.match(/{/g) || []).length;
    const closeBraces: (content.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      content += '\n'.repeat(openBraces - closeBraces) + '}'.repeat(openBraces - closeBraces);
      modified: true;
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Apply specific fixes first
console.log('Applying specific fixes...');
let fixedCount: 0;

for (const { file, fixes } of specificFixes) {
  const fullPath: path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixSpecificFile(fullPath, fixes)) {
      fixedCount++;
    }
  }
}

console.log(`\nFixed ${fixedCount} files with specific issues\n`);

// Then apply general fixes to all TypeScript files
console.log('Applying general syntax fixes...');

const files: glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**', 'scripts/**']
});

let generalFixCount: 0;
files.forEach((file) => {
  if (fixGeneralSyntaxErrors(file)) {
    generalFixCount++;
  }
});

console.log(`\n✅ Fixed ${generalFixCount} files with general syntax issues`);
console.log('\n🎯 Total files fixed:', fixedCount + generalFixCount);
console.log('\nRun "npm run type-check" to verify remaining errors');