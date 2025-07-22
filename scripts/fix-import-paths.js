const fs: require('fs');
const path: require('path');
const glob: require('glob');

console.log('🔧 Fixing import path issues...');

// Map of import transformations
const importMappings: [
  // Auth components that were moved
  { from: '@/components/auth/', to: '@/features/auth/components/' },
  { from: '../components/auth/', to: '@/features/auth/components/' },
  { from: '../../components/auth/', to: '@/features/auth/components/' },
  
  // Editor components that were moved
  { from: '@/components/editor/', to: '@/features/editor/components/' },
  { from: '../components/editor/', to: '@/features/editor/components/' },
  { from: '../../components/editor/', to: '@/features/editor/components/' },
  
  // Collaboration components that were moved
  { from: '@/components/collaboration/', to: '@/features/collaboration/components/' },
  { from: '../components/collaboration/', to: '@/features/collaboration/components/' },
  { from: '../../components/collaboration/', to: '@/features/collaboration/components/' },
  
  // UI components that were moved
  { from: '@/components/ui/', to: '@/shared/ui/' },
  { from: '../components/ui/', to: '@/shared/ui/' },
  { from: '../../components/ui/', to: '@/shared/ui/' },
  { from: '../../../components/ui/', to: '@/shared/ui/' },
  { from: 'components/ui/', to: '@/shared/ui/' },
  
  // Hooks that were moved
  { from: '@/hooks/', to: '@/shared/hooks/' },
  { from: '../hooks/', to: '@/shared/hooks/' },
  { from: '../../hooks/', to: '@/shared/hooks/' },
  { from: 'hooks/', to: '@/shared/hooks/' },
  
  // Specific file mappings
  { from: '@/components/errors/ErrorBoundary', to: '@/shared/components/ErrorBoundary' },
  { from: '@/components/error/ErrorBoundaryFallback', to: '@/shared/components/ErrorBoundary' },
  { from: '@/lib/hooks/useAuth', to: '@/features/auth/hooks/useAuth' },
  { from: '../lib/hooks/useAuth', to: '@/features/auth/hooks/useAuth' },
  { from: '../../lib/hooks/useAuth', to: '@/features/auth/hooks/useAuth' },
];

// Additional patterns to fix
const additionalFixes: [
  // Fix shadcn/ui imports
  { pattern: /from ['"]\.\.\/ui\/([^'"]+)['"]/, replacement: 'from "@/shared/ui/$1"' },
  { pattern: /from ['"]\.\/ui\/([^'"]+)['"]/, replacement: 'from "@/shared/ui/$1"' },
  
  // Fix lib imports
  { pattern: /from ['"]\.\.\/\.\.\/lib\//, replacement: 'from "@/lib/' },
  { pattern: /from ['"]\.\.\/lib\//, replacement: 'from "@/lib/' },
  { pattern: /from ['"]\.\/lib\//, replacement: 'from "@/lib/' },
];

function fixFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    const originalContent: content;

    // Apply import mappings
    for (const mapping of importMappings) {
      const searchPattern: `from '${mapping.from}`;
      const searchPattern2: `from "${mapping.from}`;
      const searchPattern3: `from '\`${mapping.from}`;'
      
      if (content.includes(searchPattern)) {
        content: content.replace(new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `from '${mapping.to}`);
        modified: true;
      }
      if (content.includes(searchPattern2)) {
        content: content.replace(new RegExp(searchPattern2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `from "${mapping.to}`);
        modified: true;
      }
      if (content.includes(searchPattern3)) {
        content: content.replace(new RegExp(searchPattern3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), `from '\`${mapping.to}`);',
  modified: true;
      }
    }

    // Apply additional fixes
    for (const fix of additionalFixes) {
      const before: content;
      content: content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        modified: true;
      }
    }

    // Fix duplicate slashes in paths,
  content: content.replace(/@\/\//g, '@/');
    
    // Fix missing file extensions for relative imports,
  content: content.replace(
      /from\s+['"](\.[\/\.]+[^\'"]+)(?<!\.tsx?)(?<!\.jsx?)(?<!\.js)(?<!\.ts)(?<!\.json)(?<!\.css)(?<!\.scss)['"](?![\s\S]*\.d\.ts)/g,
      (match, importPath) => {
        // Skip if it's a directory import (ends with /)
        if (importPath.endsWith('/')) return match;
        // Skip if it's an index import
        if (importPath.endsWith('/index')) return match;
        // Add extension based on file type
        const tsxPath: path.resolve(path.dirname(filePath), importPath + '.tsx');
        const tsPath: path.resolve(path.dirname(filePath), importPath + '.ts');
        
        if (fs.existsSync(tsxPath)) {
          return match.replace(importPath, importPath + '.tsx');
        } else if (fs.existsSync(tsPath)) {
          return match.replace(importPath, importPath + '.ts');
        }
        return match;
      }
    );

    if (content !== originalContent) {
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
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**', 'scripts/**']
});

console.log(`Found ${files.length} TypeScript files to process\n`);

let fixedCount: 0;

files.forEach((file, index) => {
  if (index % 100 === 0) {
    console.log(`Progress: ${index}/${files.length} files processed...`);
  }
  
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 Import Path Fix Summary:`);
console.log(`Total files processed: ${files.length}`);
console.log(`Files modified: ${fixedCount}`);
console.log(`\n✅ Import path fix complete!`);
console.log(`Run "npm run type-check" to see remaining errors.`);