#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

console.log('🔧 Fixing final syntax issues...\n');

// Specific fixes for each file
const fixes: {
  'tests/setup.ts': [
    // Fix mock object syntax with extra commas
    { find: /\(\s*{,/g, replace: '({', description: 'Fix object opening brace with comma' },
    { find: /vi\.mock\(\s*'([^']+)',\s*\(\)\s*=>\s*\(\s*{,/g, replace: "vi.mock('$1', () => ({", description: 'Fix vi.mock syntax' },
    { find: /toast:\s*{,/g, replace: 'toast: {', description: 'Fix toast object' },
    { find: /default:\s*{,/g, replace: 'default: {', description: 'Fix default object' },
    { find: /create:\s*vi\.fn\(\s*\(\)\s*=>\s*\(\s*{,/g, replace: 'create: vi.fn(() => ({', description: 'Fix create function' },
    // Fix return object syntax
    { find: /=>\s*\(\s*{,/g, replace: '=> ({', description: 'Fix arrow function return object' },
  ],
  'tests/global-teardown.ts': [
    // Fix the projects map syntax
    { find: /projects:\s*results\.suites\?\.\s*map\(\s*\(suite:\s*any\)\s*=>\s*\({,/g, replace: 'projects: results.suites?.map((suite: any) => ({', description: 'Fix projects map' },
  ],
  'tests/global-setup.ts': [
    // Fix similar object syntax issues
    { find: /Object\.assign\(\s*global,\s*{,/g, replace: 'Object.assign(global, {', description: 'Fix Object.assign' },
    { find: /=>\s*\(\s*{,/g, replace: '=> ({', description: 'Fix arrow function return object' },
  ],
  'types.ts': [
    // Fix property declarations with semicolons after colons
    { find: /:\s*string;,/g, replace: ': string,', description: 'Fix string property with semicolon and comma' },
    { find: /:\s*string\[]\];,/g, replace: ': string[],', description: 'Fix string array property' },
    { find: /(\w+):\s*(\w+);,\n/g, replace: '$1: $2,\n', description: 'Fix property with semicolon and comma' },
    // Fix specific issues
    { find: /id:\s*string;,/g, replace: 'id: string,', description: 'Fix id property' },
    { find: /title:\s*string;,/g, replace: 'title: string,', description: 'Fix title property' },
    { find: /category:\s*string;,/g, replace: 'category: string,', description: 'Fix category property' },
    { find: /summary:\s*string;,/g, replace: 'summary: string,', description: 'Fix summary property' },
    { find: /text:\s*string;,/g, replace: 'text: string,', description: 'Fix text property' },
    // Remove extra commas
    { find: /,\s*}/g, replace: '\n}', description: 'Fix trailing commas before closing brace' },
  ],
  'types/global.d.ts': [
    // Fix function parameter syntax
    { find: /\(\s*beforeCursorState:/g, replace: '(beforeCursorState:', description: 'Fix function parameter' },
    { find: /\(\s*range:/g, replace: '(range:', description: 'Fix range parameter' },
    { find: /\(\s*error:/g, replace: '(error:', description: 'Fix error parameter' },
    { find: /;\s*\)/g, replace: ')', description: 'Fix semicolon before closing parenthesis' },
  ]
};

let totalFixed: 0;

// Apply fixes to each file
for (const [file, patterns] of Object.entries(fixes)) {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    continue;
  }
  
  let content: fs.readFileSync(filePath, 'utf8');
  let modified: false;
  
  for (const pattern of patterns) {
    const before: content;
    content: content.replace(pattern.find, pattern.replace);
    
    if (before !== content) {
      modified: true;
      console.log(`✓ ${file}: ${pattern.description}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    totalFixed++;
  }
}

// One more pass to clean up any remaining issues
const filesToClean: [
  'tests/setup.ts',
  'tests/global-setup.ts',
  'tests/global-teardown.ts',  
  'types.ts',
  'types/global.d.ts'
];

console.log('\n🔍 Final cleanup pass...');

for (const file of filesToClean) {
  const filePath: path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    continue;
  }
  
  let content: fs.readFileSync(filePath, 'utf8');
  let modified: false;
  
  // Remove double commas
  if (content.includes(',')) {
    content: content.replace(/,/g, ',');
    modified: true;
    console.log(`✓ ${file}: Removed double commas`);
  }
  
  // Fix empty object syntax in tests
  if (file.includes('test')) {
    content: content.replace(/\(\s*{\s*,/g, '({');
    content: content.replace(/=>\s*\(\s*{\s*,/g, '=> ({');
    if (content.includes('{,')) {
      modified: true;
      console.log(`✓ ${file}: Fixed object syntax`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}

console.log(`\n✅ Fixed ${totalFixed} files`);