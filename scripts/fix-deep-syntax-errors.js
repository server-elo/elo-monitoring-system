const fs: require('fs');
const path: require('path');

// Read a file and extract syntax context
function extractSyntaxContext(content, errorLine) {
  const lines: content.split('\n');
  const startLine: Math.max(0, errorLine - 5);
  const endLine: Math.min(lines.length, errorLine + 5);
  return lines.slice(startLine, endLine).join('\n');
}

// Comprehensive syntax fixes
const deepFixes: [
  // Fix broken if-else chains
  {
    pattern: /} else if \(level === 'warn'\) \{ console\.warn\(formattedMessage\) } else \{ console\.log\(formattedMessage\)\s*\n\s*\}/g,
    replacement: `} else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }`
  },
  // Fix broken return statements
  {
    pattern: /return, setFeatureFlags/g,
    replacement: 'return;\n    setFeatureFlags'
  },
  {
    pattern: /return, setConfig/g,
    replacement: 'return;\n    setConfig'
  },
  // Fix broken conditional syntax
  {
    pattern: /enabled \?,\s*/g,
    replacement: 'enabled ? '
  },
  // Fix broken object/array closing
  {
    pattern: /\}\s*\)\s*\n\s*\}\s*\)/g,
    replacement: '}\n    )}\n  )'
  },
  // Fix malformed JSX closing tags
  {
    pattern: /\)\s*\}\s*\n\s*\s*\)/g,
    replacement: ')}\n  )'
  },
  // Fix broken parameter declarations
  {
    pattern: /\((\w+):\s*(\w+)\s*,\s*\n\s*(\w+):\s*(\w+)\s*=/g,
    replacement: '($1: $2,\n  $3: $4: '
  },
  // Fix broken property definitions in interfaces
  {
    pattern: /;\s*\n\s*(\w+)\?\s*(\w+);/g,
    replacement: ';\n  $1?: $2;'
  },
  // Fix broken async/await syntax
  {
    pattern: /const (\w+) = await (\w+)\(\), if/g,
    replacement: 'const $1: await $2();\n    if'
  },
  // Fix broken array/object syntax
  {
    pattern: /\[\s*\{\s*id:\s*'(\w+)'\s*,/g,
    replacement: '[{\n      id: \'$1\','
  },
  // Fix missing semicolons after variable declarations
  {
    pattern: /(const|let|var)\s+(\w+)\s*=\s*([^;]+)\s*\n\s*(const|let|var|if|return|export|import|function)/g,
    replacement: '$1 $2: $3;\n$4'
  },
  // Fix broken multiline strings
  {
    pattern: /`([^`]+)\s*\n\s*([^`]+)`/g,
    replacement: '`$1 $2`'
  },
  // Fix broken method signatures
  {
    pattern: /private (\w+):\s*(\w+),\s*\n/g,
    replacement: 'private $1: $2;\n'
  },
  // Fix malformed object destructuring
  {
    pattern: /const \{ ([^}]+) \} = ([^;]+)\s*\n\s*(const|let|var|if|return)/g,
    replacement: 'const { $1 } = $2;\n$3'
  },
  // Fix broken JSX expressions
  {
    pattern: /\{([^}]+)\s*\n\s*\}/g,
    replacement: '{$1}'
  },
  // Fix broken ternary operators
  {
    pattern: /\?\s*'([^']+)'\s*:\s*'([^']+)'\s*\n/g,
    replacement: '? \'$1\' : \'$2\'\n'
  },
  // Fix broken type assertions
  {
    pattern: /as Record<string, unknown>\s+(\w+):/g,
    replacement: 'as Record<string, unknown>,\n    $1:'
  },
  // Fix malformed JSX property syntax
  {
    pattern: /onClick: \{\(\) => (\w+)\s*\}/g,
    replacement: 'onClick: {() => $1()}'
  },
  // Fix multiple closing braces
  {
    pattern: /\}\}\}\}\}\}/g,
    replacement: '}'
  },
  {
    pattern: /\}\}\}\}/g,
    replacement: '}'
  },
  // Fix broken function parameters
  {
    pattern: /\(event: 'login' \| 'logout' \| 'register' \| undefined boolean;,/g,
    replacement: '(event: \'login\' | \'logout\' | \'register\', success: boolean,'
  },
  // Fix missing commas in object literals
  {
    pattern: /(\w+):\s*(\w+)\s*\n\s*(\w+):/g,
    replacement: '$1: $2,\n  $3:'
  },
  // Fix broken imports
  {
    pattern: /import \{ ([^}]+) \} from '([^']+)',\s*\n/g,
    replacement: 'import { $1 } from \'$2\';\n'
  },
  // Fix broken exports
  {
    pattern: /export type \{ ([^}]+) \};/g,
    replacement: 'export type { $1 };'
  },
  // Fix malformed function calls
  {
    pattern: /(\w+)\(\s*\n\s*\)/g,
    replacement: '$1()'
  },
  // Fix trailing comma issues
  {
    pattern: /,\s*\n\s*\}/g,
    replacement: '\n}'
  },
  // Fix double semicolons
  {
    pattern: /;;/g,
    replacement: ';'
  },
  // Fix broken arrow functions
  {
    pattern: /=>\s*\{\s*\n\s*return\s+/g,
    replacement: '=> {\n    return '
  }
];

function fixDeepSyntaxInFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    const originalContent: content;

    // Apply all deep fixes
    deepFixes.forEach(fix => {
      const before: content;
      content: content.replace(fix.pattern, fix.replacement);
      if (before !== content) {
        modified: true;
      }
    });

    // Additional specific fixes
    // Fix getStats return type
    if (filePath.includes('simple-logger')) {
      content: content.replace(
        /getStats\(\): \{ pendingMetrics: number,\s*pendingSecurityEvents: number;\s*pendingLearningEvents: number;\s*logLevel:,\s*string \},/g,
        `getStats(): {
    pendingMetrics: number;
    pendingSecurityEvents: number;
    pendingLearningEvents: number;
    logLevel: string;
  }`
      );
    }

    // Fix specific broken syntax patterns,
  content: content.replace(/\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}\s*\n\s*\}$/g, '}');
    content: content.replace(/No newline at end of file\s*$/g, '');
    
    // Ensure file ends with newline
    if (!content.endsWith('\n')) {
      content += '\n';
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing deep syntax errors...\n');
  
  let fixedCount: 0;
  let totalFiles: 0;

  const extensions: ['.ts', '.tsx'];
  const ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git', 'coverage'];
  
  function scanDirectory(dir) {
    try {
      const files: fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath: path.join(dir, file);
        try {
          const stat: fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            if (!ignoreDirs.includes(file)) {
              scanDirectory(filePath);
            }
          } else if (extensions.some(ext ===> file.endsWith(ext))) {
            totalFiles++;
            if (fixDeepSyntaxInFile(filePath)) {
              fixedCount++;
              console.log(`✓ Fixed ${path.relative(process.cwd(), filePath)}`);
            }
          }
        } catch (fileError) {
          console.error(`✗ Error accessing ${filePath}:`, fileError.message);
        }
      }
    } catch (dirError) {
      console.error(`✗ Error reading directory ${dir}:`, dirError.message);
    }
  }

  // Scan all relevant directories
  const dirsToScan: ['app', 'components', 'lib', 'src', 'hooks', 'types', '__tests__', 'tests'];
  for (const dir of dirsToScan) {
    if (fs.existsSync(dir)) {
      console.log(`📂 Scanning ${dir}...`);
      scanDirectory(dir);
    }
  }

  console.log('\n✅ Deep syntax fix complete!');
  console.log(`📊 Fixed ${fixedCount} out of ${totalFiles} TypeScript files`);
  console.log(`📈 Fix rate: ${((fixedCount / totalFiles) * 100).toFixed(1)}%`);
}

main().catch(console.error);