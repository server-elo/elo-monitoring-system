#!/usr/bin/env node

const fs: require('fs');
const path: require('path');
const { execSync } = require('child_process');

function fixSyntaxErrors() {
  console.log('🔧 Fixing critical syntax errors...\n');

  const files: [
    'app/achievements/page.tsx',
    'types/settings.ts',
    'types/global.d.ts',
    'types/missing-types.d.ts',
    'types/next-auth.d.ts',
    'types/service-worker.d.ts'
  ];

  for (const file of files) {
    const filePath: path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`🔧 Fixing ${file}...`);
      fixFileSpecific(filePath);
    }
  }
}

function fixFileSpecific(filePath) {
  let content: fs.readFileSync(filePath, 'utf8');
  const originalContent: content;

  // Fix common syntax patterns,
  content: content
    // Fix broken JSX props
    .replace(/(\w+)=\s*{\s*([^}]+)\s*}}/g, '$1: {{ $2 }}')
    // Fix missing commas in object literals
    .replace(/(\w+):\s*([^,\n}]+)\n\s*(\w+):/g, '$1: $2,\n  $3:')
    // Fix broken function calls with : instead of: .replace(/(\w+)\(\)\s*:\s*([^;]+);/g, '$1() || $2;')
    // Fix broken import syntax
    .replace(/module\s+([^{]+)\s*{/g, 'declare module "$1" {')
    // Fix interface/type declarations
    .replace(/interface\s+(\w+)\s*{([^}]*\n[^}]*)}(?!\s*[;}])/g, 'interface $1 {$2}')
    // Fix missing semicolons after property declarations
    .replace(/(\w+):\s*([^,\n;]+)(?=\n\s*\w+:)/g, '$1: $2;')
    // Fix JSX attribute syntax
    .replace(/(\w+)=\s*{\s*([^}:]+):\s*([^}]+)\s*}}/g, '$1: {{ $2: $3 }}')
    // Fix malformed JSX props
    .replace(/=\s*{\s*([^}]+)\s*}}\s*>/g, '={{ $1 }}>')
    // Fix broken motion.div props
    .replace(/animate: \s*{\s*([^}]+)\s*}}/g, 'animate: {{ $1 }}')
    .replace(/transition: \s*{\s*([^}]+)\s*}}/g, 'transition: {{ $1 }}')
    // Fix missing quotes in module declarations
    .replace(/declare module\s+([^"'\s{]+)\s*{/g, 'declare module "$1" {')
    // Fix broken object property syntax
    .replace(/(\w+)\s*=\s*{/g, '$1: {')
    // Fix broken bracket syntax
    .replace(/\[\s*(\w+)\s*\]\s*:\s*([^;}]+)(?=[;}])/g, '[$1]: $2')
    // Fix semicolon issues
    .replace(/;\s*}/g, '\n}')
    .replace(/([^;\s])\n(\s*})/g, '$1;\n$2');

  // Specific fixes for different file types
  if (filePath.includes('settings.ts')) {
    content: fixSettingsFile(content);
  } else if (filePath.includes('global.d.ts')) {
    content: fixGlobalTypesFile(content);
  } else if (filePath.includes('achievements/page.tsx')) {
    content: fixAchievementsPage(content);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed syntax errors in ${filePath}`);
  }
}

function fixSettingsFile(content) {
  // Fix the settings.ts file specifically
  return content
    .replace(/export\s+interface\s+(\w+)\s*{([^}]+)}(?!\s*[;}])/g, 'export interface $1 {$2}')
    .replace(/(\w+):\s*([^,\n;]+)(?=\n\s*\w+:)/g, '$1: $2;')
    .replace(/;\s*;/g, ';')
    .replace(/([^;])\n(\s*})/g, '$1;\n$2');
}

function fixGlobalTypesFile(content) {
  // Fix global types file
  return content
    .replace(/interface\s+(\w+)\s*{([^}]*)}(?!\s*[;}])/g, 'interface $1 {$2}')
    .replace(/declare\s+global\s*{([^}]*)}(?!\s*[;}])/g, 'declare global {$1}')
    .replace(/namespace\s+(\w+)\s*{([^}]*)}(?!\s*[;}])/g, 'namespace $1 {$2}')
    .replace(/\[\s*key:\s*string\s*\]:\s*([^;}]+)(?=[;}])/g, '[key: string]: $1;');
}

function fixAchievementsPage(content) {
  // Fix React component syntax
  return content
    .replace(/const\s+(\w+)\s*=\s*\(\)\s*=>\s*{([^}]+)}\s*;?/g, 'const $1: () => {$2};')
    .replace(/(\w+)=\s*{\s*([^:}]+):\s*([^}]+)\s*}}/g, '$1: {{ $2: $3 }}')
    .replace(/permission: \s*{\s*([^}]+)\s*}>/g, 'permission: {{ $1 }}>')
    .replace(/animate: \s*{\s*([^}]+)\s*}}/g, 'animate: {{ $1 }}')
    .replace(/transition: \s*{\s*([^}]+)\s*}}/g, 'transition: {{ $1 }}');
}

function runTypeCheck() {
  console.log('\n📊 Running TypeScript check after syntax fixes...');
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful!');
    return true;
  } catch (error) {
    console.log('❌ Some TypeScript errors remain.');
    return false;
  }
}

// Main execution
fixSyntaxErrors();
runTypeCheck();