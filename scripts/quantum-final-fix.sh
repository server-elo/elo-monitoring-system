#!/bin/bash

echo "🌌 QUANTUM FINAL PRODUCTION FIX..."

# Use prettier to format all TypeScript files
echo "🎨 Formatting TypeScript files with Prettier..."
npx prettier --write "hooks/*.ts" "lib/**/*.ts" "lib/**/*.tsx" "components/**/*.tsx" --no-semi false --single-quote true --tab-width 2

# Additional manual fixes
echo "🔧 Applying additional fixes..."

# Fix specific syntax errors
node << 'EOF'
const fs = require('fs');

// Final fixes for compressed code
const filesToFix = [
  'hooks/useGasAnalysis.ts',
  'hooks/useSecurityAnalysis.ts', 
  'hooks/useSwipeGesture.ts',
  'lib/compiler/SolidityCompiler.ts',
  'lib/components/PerformanceOptimizer.tsx'
];

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix useEffect on same line as comments
    content = content.replace(/;\s*\/\/[^\n]*\s*useEffect/g, ';\n\n// $1\nuseEffect');
    
    // Fix other compressed patterns
    content = content.replace(/}\s*\/\/[^\n]*\s*export/g, '}\n\n// $1\nexport');
    content = content.replace(/;\s*\/\/[^\n]*\s*const/g, ';\n\n// $1\nconst');
    
    fs.writeFileSync(file, content);
  }
});

console.log('✅ Final fixes applied');
EOF

echo "🚀 Running production build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ PRODUCTION BUILD SUCCESSFUL!"
  echo "🎉 QUANTUM OPTIMIZATION COMPLETE!"
else
  echo "❌ Build failed - checking errors..."
  npm run build 2>&1 | grep -E "Error:|Failed" | head -20
fi