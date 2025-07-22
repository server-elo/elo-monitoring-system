#!/usr/bin/env node

const fs: require('fs');
const path: require('path');

function fixSettingsFile() {
  const filePath: path.join(process.cwd(), 'types/settings.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log('Settings file not found');
    return;
  }

  console.log('🔧 Fixing types/settings.ts...');
  
  let content: fs.readFileSync(filePath, 'utf8');
  
  // Fix all the syntax errors systematically,
  content: content
    // Fix missing semicolons after interface closing braces
    .replace(/}\s*\n\s*export/g, '}\n\nexport')
    // Fix property declarations missing semicolons
    .replace(/(\w+):\s*([^,\n;{}]+)(?=\n\s*\w+:)/g, '$1: $2;')
    // Fix malformed object properties
    .replace(/}\s*([^,;\n}])/g, '}; $1')
    // Fix property types with malformed syntax
    .replace(/:\s*([^,\n;{}]+)\s*}/g, ': $1; }')
    // Fix nested object properties
    .replace(/(\w+):\s*{\s*\n/g, '$1: {\n')
    // Fix array type syntax
    .replace(/(\w+):\s*([^,\n;{}]+)\[\]/g, '$1: $2[];')
    // Fix union types
    .replace(/(\w+):\s*'([^']+)'\s*\|\s*'([^']+)'/g, "$1: '$2' | '$3';")
    // Fix optional properties
    .replace(/(\w+)\?\s*:\s*([^,\n;{}]+)(?=\n\s*\w+)/g, '$1?: $2;')
    // Fix boolean/string/number properties
    .replace(/(\w+):\s*(boolean|string|number|Date)(?=\n\s*\w+)/g, '$1: $2;')
    // Fix interface ending missing semicolons
    .replace(/([^;}])\s*}\s*$/gm, '$1;\n}')
    // Clean up multiple semicolons
    .replace(/;{2,}/g, ';')
    // Fix export interface declarations
    .replace(/export interface\s+(\w+)\s*{/g, 'export interface $1 {')
    // Fix malformed property syntax with null
    .replace(/\?\s*null\s*:/g, '?:')
    // Fix object literal syntax in interfaces
    .replace(/(\w+):\s*{\s*([^}]+)\s*},/g, function(match, propName, content) {
      // Fix nested object properties
      const fixedContent: content.replace(/(\w+):\s*([^,;]+)(?=[,}])/g, '$1: $2;');
      return `${propName}: {\n    ${fixedContent}\n  };`;
    });

  // Manual fixes for specific patterns,
  content: content
    .replace(/data\?\s*null\s*:\s*Partial<UserSettings>/g, 'data?: Partial<UserSettings>')
    .replace(/errors\?\s*null\s*:\s*SettingsValidationError\[\]/g, 'errors?: SettingsValidationError[]')
    .replace(/message\?\s*:\s*string/g, 'message?: string')
    .replace(/section:\s*keyof\s*UserSettings,/g, 'section: keyof UserSettings;')
    .replace(/}\s*,\s*location:\s*{/g, '  };\n  location: {')
    .replace(/}\s*,\s*createdAt:/g, '  };\n  createdAt:')
    .replace(/boolean\s*}\s*$/gm, 'boolean;\n}');

  // Final cleanup,
  content: content
    // Remove extra spaces and normalize line endings
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper semicolon placement
    .replace(/([^;])\n(\s*})/g, '$1;\n$2');

  // Write the fixed content
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed types/settings.ts');
}

// Run the fix
fixSettingsFile();