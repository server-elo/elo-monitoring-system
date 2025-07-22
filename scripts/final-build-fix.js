#!/usr/bin/env node

const fs = require('fs');

console.log('🎯 Final production build fixes...\n');

// Fix useGasAnalysis.ts
console.log('Fixing useGasAnalysis.ts...');
let gas = fs.readFileSync('hooks/useGasAnalysis.ts', 'utf8');
// Fix the broken import
gas = gas.replace('monaco-editorInstance', 'monaco-editor');
// Fix editor references
gas = gas.replace(/!editorInstanceInstance/g, '!editorInstance');
gas = gas.replace(/editorInstance\.editorInstance\./g, 'monaco.editor.');
// Fix Promise spacing
gas = gas.replace(/Promise < boolean >/g, 'Promise<boolean>');
fs.writeFileSync('hooks/useGasAnalysis.ts', gas);

// Fix useSecurityAnalysis.ts
console.log('Fixing useSecurityAnalysis.ts...');
let sec = fs.readFileSync('hooks/useSecurityAnalysis.ts', 'utf8');
// Fix case statement
sec = sec.replace("case ',", "case '");
// Fix the metrics object
sec = sec.replace('const metrics = {', 'const metrics = {');
fs.writeFileSync('hooks/useSecurityAnalysis.ts', sec);

// Fix useSwipeGesture.ts
console.log('Fixing useSwipeGesture.ts...');
let swipe = fs.readFileSync('hooks/useSwipeGesture.ts', 'utf8');
// Fix spacing around closing braces
swipe = swipe.replace(/}\s*$/gm, '}\n');
// Fix generic spacing
swipe = swipe.replace(/useRef<\{ x:/g, 'useRef<{ x:');
fs.writeFileSync('hooks/useSwipeGesture.ts', swipe);

// Fix SolidityCompiler.ts
console.log('Fixing SolidityCompiler.ts...');
let compiler = fs.readFileSync('lib/compiler/SolidityCompiler.ts', 'utf8');
// Fix the sources object
compiler = compiler.replace(
  /sources: \{\s*\[\`\$\{contractName/g,
  'sources: {\n      [`${contractName'
);
// Fix template literal errors
compiler = compiler.replace('Error(_`', 'Error(`');
compiler = compiler.replace(/Error\(_`/g, 'Error(`');
fs.writeFileSync('lib/compiler/SolidityCompiler.ts', compiler);

// Fix PerformanceOptimizer.tsx
console.log('Fixing PerformanceOptimizer.tsx...');
let perf = fs.readFileSync('lib/components/PerformanceOptimizer.tsx', 'utf8');
// Fix generic syntax issues
perf = perf.replace(/Record<string, any >/g, 'Record<string, any>');
perf = perf.replace(/forwardRef<unknown P >/g, 'forwardRef<unknown, P>');
perf = perf.replace(/useState<T >/g, 'useState<T>');
// Fix comparison operators
perf = perf.replace('===', '=');
// Fix arrow function syntax
perf = perf.replace(/=> =>/g, '=>');
// Fix reduce callback
perf = perf.replace('times.reduce(sum, time)', 'times.reduce((sum, time)');
// Fix metadata object
perf = perf.replace('lastRenderTime: renderTime });', 'lastRenderTime: renderTime } });');
fs.writeFileSync('lib/components/PerformanceOptimizer.tsx', perf);

console.log('\n✅ Final fixes complete!');