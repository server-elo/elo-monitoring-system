#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🌌 QUANTUM PRODUCTION BUILD FIX - INITIATING...\n');

// Fix useGasAnalysis.ts
console.log('🔧 Fixing hooks/useGasAnalysis.ts...');
try {
  let gasAnalysis = fs.readFileSync('hooks/useGasAnalysis.ts', 'utf8');
  
  // Fix the useEffect syntax
  gasAnalysis = gasAnalysis.replace(
    /useEffect\(\(\) => \{ optionsRef\.current = options;/g,
    'useEffect(() => {\n    optionsRef.current = options;'
  );
  
  // Fix editor references
  gasAnalysis = gasAnalysis.replace(/\beditor\)/g, 'editorInstance)');
  gasAnalysis = gasAnalysis.replace(/\beditor\b(?!\w)/g, 'editorInstance');
  gasAnalysis = gasAnalysis.replace(/![\s]*editor/g, '!editorInstance');
  
  // Fix arrow function syntax
  gasAnalysis = gasAnalysis.replace(/Promise < boolean >=/g, 'Promise<boolean> =');
  gasAnalysis = gasAnalysis.replace(/Promise < void >/g, 'Promise<void>');
  gasAnalysis = gasAnalysis.replace(/useState < /g, 'useState<');
  gasAnalysis = gasAnalysis.replace(/useRef < /g, 'useRef<');
  
  // Fix return statement issues
  gasAnalysis = gasAnalysis.replace(/return\(\)/g, 'return ()');
  
  fs.writeFileSync('hooks/useGasAnalysis.ts', gasAnalysis);
  console.log('✅ Fixed useGasAnalysis.ts');
} catch (error) {
  console.error('❌ Error fixing useGasAnalysis.ts:', error.message);
}

// Fix useSecurityAnalysis.ts
console.log('\n🔧 Fixing hooks/useSecurityAnalysis.ts...');
try {
  let securityAnalysis = fs.readFileSync('hooks/useSecurityAnalysis.ts', 'utf8');
  
  // Fix the useEffect syntax
  securityAnalysis = securityAnalysis.replace(
    /useEffect\(\(\) => \{ optionsRef\.current = options;/g,
    'useEffect(() => {\n    optionsRef.current = options;'
  );
  
  // Fix generic type spacing
  securityAnalysis = securityAnalysis.replace(/Promise < /g, 'Promise<');
  securityAnalysis = securityAnalysis.replace(/useState < /g, 'useState<');
  securityAnalysis = securityAnalysis.replace(/useRef < /g, 'useRef<');
  securityAnalysis = securityAnalysis.replace(/Partial < /g, 'Partial<');
  
  // Fix metrics syntax
  securityAnalysis = securityAnalysis.replace(
    /const metrics: \{/g,
    'const metrics = {'
  );
  
  // Fix comparison operators
  securityAnalysis = securityAnalysis.replace(/>=== /g, '>= ');
  
  fs.writeFileSync('hooks/useSecurityAnalysis.ts', securityAnalysis);
  console.log('✅ Fixed useSecurityAnalysis.ts');
} catch (error) {
  console.error('❌ Error fixing useSecurityAnalysis.ts:', error.message);
}

// Fix useSwipeGesture.ts
console.log('\n🔧 Fixing hooks/useSwipeGesture.ts...');
try {
  let swipeGesture = fs.readFileSync('hooks/useSwipeGesture.ts', 'utf8');
  
  // Fix semicolon placement
  swipeGesture = swipeGesture.replace(/;\s*}/g, ';\n  }');
  
  // Fix generic type spacing
  swipeGesture = swipeGesture.replace(/RefObject < T >/g, 'RefObject<T>');
  swipeGesture = swipeGesture.replace(/useRef < T >/g, 'useRef<T>');
  swipeGesture = swipeGesture.replace(/useRef </g, 'useRef<');
  
  fs.writeFileSync('hooks/useSwipeGesture.ts', swipeGesture);
  console.log('✅ Fixed useSwipeGesture.ts');
} catch (error) {
  console.error('❌ Error fixing useSwipeGesture.ts:', error.message);
}

// Fix SolidityCompiler.ts
console.log('\n🔧 Fixing lib/compiler/SolidityCompiler.ts...');
try {
  let compiler = fs.readFileSync('lib/compiler/SolidityCompiler.ts', 'utf8');
  
  // Fix Map declaration
  compiler = compiler.replace(
    /private compilerVersions: Map < string, any >= new Map\(\)/g,
    'private compilerVersions: Map<string, any> = new Map()'
  );
  
  // Fix object literal syntax
  compiler = compiler.replace(
    /sources: \{ \[\`\$\{contractName/g,
    'sources: {\n      [`${contractName'
  );
  
  // Fix generic type spacing
  compiler = compiler.replace(/Promise < /g, 'Promise<');
  compiler = compiler.replace(/Promise </g, 'Promise<');
  compiler = compiler.replace(/Map < /g, 'Map<');
  
  fs.writeFileSync('lib/compiler/SolidityCompiler.ts', compiler);
  console.log('✅ Fixed SolidityCompiler.ts');
} catch (error) {
  console.error('❌ Error fixing SolidityCompiler.ts:', error.message);
}

// Fix PerformanceOptimizer.tsx
console.log('\n🔧 Fixing lib/components/PerformanceOptimizer.tsx...');
try {
  let optimizer = fs.readFileSync('lib/components/PerformanceOptimizer.tsx', 'utf8');
  
  // Fix Map declarations
  optimizer = optimizer.replace(
    /private static renderCounts: new Map < string, number >\(\)/g,
    'private static renderCounts = new Map<string, number>()'
  );
  
  optimizer = optimizer.replace(
    /private static renderTimes = new Map < string number\[\]>\(\)/g,
    'private static renderTimes = new Map<string, number[]>()'
  );
  
  // Fix generic type spacing
  optimizer = optimizer.replace(/Map < /g, 'Map<');
  optimizer = optimizer.replace(/Record < /g, 'Record<');
  optimizer = optimizer.replace(/useState < /g, 'useState<');
  optimizer = optimizer.replace(/useRef < /g, 'useRef<');
  optimizer = optimizer.replace(/forwardRef < /g, 'forwardRef<');
  
  // Fix arrow function issues
  optimizer = optimizer.replace(/> =>/g, '> =>');
  optimizer = optimizer.replace(/const, comparison:/g, 'const comparison =');
  
  // Fix comparison operators
  optimizer = optimizer.replace(/!=== /g, '!== ');
  optimizer = optimizer.replace(/====/g, '===');
  
  fs.writeFileSync('lib/components/PerformanceOptimizer.tsx', optimizer);
  console.log('✅ Fixed PerformanceOptimizer.tsx');
} catch (error) {
  console.error('❌ Error fixing PerformanceOptimizer.tsx:', error.message);
}

console.log('\n🎉 QUANTUM PRODUCTION BUILD FIXES COMPLETE!');
console.log('🚀 Ready for production build...');