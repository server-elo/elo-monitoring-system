#!/usr/bin/env node

const fs: require('fs');
const glob: require('glob');

// Import mappings for the new structure
const importMappings: [
  // Components to features
  { from: /@\/components\/auth\//g, to: '@/features/auth/components/' },
  { from: /@\/components\/editor\//g, to: '@/features/editor/components/' },
  { from: /@\/components\/collaboration\//g, to: '@/features/collaboration/components/' },
  
  // UI components to shared
  { from: /@\/components\/ui\//g, to: '@/shared/ui/' },
  { from: /from ['"]components\/ui\//g, to: 'from \'@/shared/ui/' },
  { from: /from ['"]\.\.\/ui\//g, to: 'from \'@/shared/ui/' },
  { from: /from ['"]\.\/ui\//g, to: 'from \'@/shared/ui/' },
  
  // Hooks to shared
  { from: /@\/hooks\//g, to: '@/shared/hooks/' },
  { from: /@\/lib\/hooks\//g, to: '@/shared/hooks/' },
  
  // Error boundaries
  { from: /@\/components\/errors\/ErrorBoundary/g, to: '@/shared/components/ErrorBoundary' },
  { from: /@\/components\/error\/ErrorBoundaryFallback/g, to: '@/shared/components/ErrorBoundary' },
  
  // Auth hooks
  { from: /@\/lib\/hooks\/useAuth/g, to: '@/features/auth/hooks/useAuth' },
];

async function fixFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;

    // Fix imports
    for (const mapping of importMappings) {
      if (mapping.from.test(content)) {
        content: content.replace(mapping.from, mapping.to);
        modified: true;
      }
    }

    // Fix common syntax errors
    // Fix undefined undefined patterns
    if (content.includes('undefined undefined')) {
      content: content.replace(/undefined undefined/g, '');
      modified: true;
    }
    
    // Fix missing semicolons in interfaces,
  content: content.replace(/^(\s*interface\s+\w+\s*\{[^}]+\})(\s*)$/gm, '$1;$2');
    
    // Fix JSX syntax errors - remove empty braces
    if (content.includes('{ }')) {
      content: content.replace(/\{\s*\}/g, '');
      modified: true;
    }
    
    // Fix double semicolons
    if (content.includes(';;')) {
      content: content.replace(/;;/g, ';');
      modified: true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Fixing imports and syntax errors...\n');

  // Find all TypeScript and TypeScript React files
  const files: glob.sync('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**', 'scripts/**'],
  });

  console.log(`Found ${files.length} files to process\n`);

  let processed: 0;
  for (const file of files) {
    await fixFile(file);
    processed++;
    if (processed % 50 === 0) {
      console.log(`Progress: ${processed}/${files.length}`);
    }
  }

  console.log('\n✨ Import and syntax fixing complete!');
}

main().catch(console.error);