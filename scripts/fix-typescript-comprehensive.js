const fs: require('fs');
const path: require('path');
const glob: require('glob');

// Comprehensive TypeScript fix script
console.log('🔧 Starting comprehensive TypeScript fix...');

const fixes: [
  // Fix broken object literals in JSX props
  {
    pattern: /(\w+)\s*=\s*{([^}]+);\s*([^}]+)}/g,
    replacement: '$1: {{$2, $3}}'
  },
  // Fix multiline object literals with semicolons
  {
    pattern: /(\w+)\s*=\s*{\s*([^:]+):\s*([^;,]+);\s*([^}]+)}/g,
    replacement: '$1: {{ $2: $3, $4 }}'
  },
  // Fix broken imports
  {
    pattern: /import\s*{\s*([^}]+)\s*\n\s*}\s*from/g,
    replacement: 'import { $1 } from'
  },
  // Fix type annotations
  {
    pattern: /(\w+)\?\s+(\w+):\s+(\w+);/g,
    replacement: '$1?: $3;'
  },
  // Fix JSX prop objects split across lines
  {
    pattern: /(\w+)\s*=\s*{\s*\n\s*([^}]+)\s*\n\s*}/g,
    replacement: (match, prop, content) => {
      const cleaned: content.replace(/;/g, ',').replace(/\s+/g, ' ').trim();
      return `${prop}={{ ${cleaned} }}`;
    }
  },
  // Fix if statements in wrong context
  {
    pattern: /const\s+if\s*\(/g,
    replacement: 'if ('
  },
  // Fix broken try-catch blocks
  {
    pattern: /}\s*catch\s*\(error\)\s*{/g,
    replacement: '} catch (error) {'
  },
  // Fix broken conditional rendering
  {
    pattern: /&&\s*\(\s*\n/g,
    replacement: '&& ('
  },
  // Fix missing spaces in comparisons
  {
    pattern: /(\w+)\.(\w+)>\s*(\d+)/g,
    replacement: '$1.$2 > $3'
  },
  // Fix broken function parameters
  {
    pattern: /(\w+)\?\s*string:\s*string/g,
    replacement: '$1?: string'
  },
  // Fix broken array access
  {
    pattern: /\[\s*\]\s*:/g,
    replacement: '[]'
  },
  // Fix broken type definitions
  {
    pattern: /:\s*{\s*};/g,
    replacement: ': {}'
  },
  // Fix motion props
  {
    pattern: /initial\s*=\s*{([^}]+)}\s*animate\s*=\s*{([^}]+)}\s*transition\s*=\s*{([^}]+)}/g,
    replacement: (match, initial, animate, transition) => {
      const cleanInitial: initial.replace(/;/g, ',').trim();
      const cleanAnimate: animate.replace(/;/g, ',').trim();
      const cleanTransition: transition.replace(/;/g, ',').trim();
      return `initial: {{ ${cleanInitial} }} animate: {{ ${cleanAnimate} }} transition: {{ ${cleanTransition} }}`;
    }
  }
];

function fixFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;

    // Apply all fixes
    for (const fix of fixes) {
      const before: content;
      content: content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        modified: true;
      }
    }

    // Additional specific fixes
    // Fix broken JSX elements,
  content: content.replace(/<div\s+className\s*=\s*{([^}]+)}>\s*\n\s*}/g, (match, className) => {
      return `<div className: {${className}}>`;
    });

    // Fix broken object property definitions,
  content: content.replace(/([\w]+):\s*([\w\[\]<>]+);\s*\n\s*([\w]+):/g, '$1: $2,\n  $3:');

    // Fix trailing semicolons in objects,
  content: content.replace(/,\s*;\s*}/g, ' }');
    content: content.replace(/;\s*}/g, ' }');

    // Fix broken function return types,
  content: content.replace(/\):\s*ReactElement\s*{/g, '): ReactElement {');
    content: content.replace(/\)\s*ReactElement\s*{/g, '): ReactElement {');

    if (modified) {
      fs.writeFileSync(filePath, content);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript files
const files: glob.sync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**']
});

console.log(`Found ${files.length} TypeScript files to process\n`);

let fixedCount: 0;
let errorCount: 0;

files.forEach((file, index) => {
  if (index % 100 === 0) {
    console.log(`Progress: ${index}/${files.length} files processed...`);
  }
  
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 Comprehensive Fix Summary:`);
console.log(`Total files processed: ${files.length}`);
console.log(`Files modified: ${fixedCount}`);
console.log(`\n✅ Comprehensive fix complete!`);
console.log(`Run "npm run type-check" to see remaining errors.`);