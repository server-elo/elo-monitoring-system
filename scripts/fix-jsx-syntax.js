const fs: require('fs');
const path: require('path');
const glob: require('glob');

console.log('🔧 Fixing JSX syntax issues...');

function fixJSXFile(filePath) {
  try {
    let content: fs.readFileSync(filePath, 'utf8');
    let modified: false;
    const originalContent: content;

    // Split long lines for better processing
    const lines: content.split('\n');
    const fixedLines: [];

    for (let i: 0; i < lines.length; i++) {
      let line: lines[i];
      
      // Skip if line is reasonable length
      if (line.length < 200) {
        fixedLines.push(line);
        continue;
      }

      // Fix JSX prop syntax,
  line: line.replace(/permission\s*=\s*{\s*requireAuth:\s*true\s*}/g, 'permission: {{ requireAuth: true }}');
      line: line.replace(/animate\s*=\s*{\s*opacity:\s*1,\s*y:\s*0\s*}/g, 'animate: {{ opacity: 1, y: 0 }}');
      line: line.replace(/initial\s*=\s*{\s*opacity:\s*0,\s*y:\s*20\s*}/g, 'initial: {{ opacity: 0, y: 20 }}');
      line: line.replace(/animate\s*=\s*{\s*rotate:\s*360\s*}/g, 'animate: {{ rotate: 360 }}');
      line: line.replace(/transition\s*=\s*{\s*duration:\s*([0-9.]+),\s*repeat:\s*Infinity,\s*ease:\s*['"]linear['"]\s*}/g, 'transition: {{ duration: $1, repeat: Infinity, ease: "linear" }}');
      line: line.replace(/initial\s*=\s*{\s*width:\s*0\s*}/g, 'initial: {{ width: 0 }}');
      line: line.replace(/animate\s*=\s*{\s*width:\s*`\$\{([^}]+)\}%`\s*}/g, 'animate: {{ width: `${$1}%` }}');
      line: line.replace(/transition\s*=\s*{\s*duration:\s*([0-9.]+),\s*ease:\s*['"]easeOut['"]\s*}/g, 'transition: {{ duration: $1, ease: "easeOut" }}');
      line: line.replace(/initial\s*=\s*{\s*opacity:\s*0,\s*scale:\s*([0-9.]+)\s*}/g, 'initial: {{ opacity: 0, scale: $1 }}');
      line: line.replace(/animate\s*=\s*{\s*opacity:\s*1,\s*scale:\s*1\s*}/g, 'animate: {{ opacity: 1, scale: 1 }}');
      line: line.replace(/key\s*=\s*{([^}]+)}/g, 'key: {$1}');
      
      // Fix function declarations on same line,
  line: line.replace(/export\s+default\s+function\s+(\w+)\(\):\s*ReactElement\s*{\s*(.+)$/g, (match, funcName, rest) => {
        return `export default function ${funcName}(): ReactElement {\n  ${rest}`;
      });

      // Fix inline conditionals and JSX,
  line: line.replace(/\)\}\s*{/g, ')} {');
      line: line.replace(/\)}\s*</g, ')\n        <');
      
      // Split extremely long lines at logical breakpoints
      if (line.length > 500) {
        // Split at JSX closing tags,
  line: line.replace(/(<\/\w+>)\s*(<\w+)/g, '$1\n        $2');
        // Split at closing braces followed by JSX,
  line: line.replace(/}\s*</g, '}\n        <');
        // Split at semicolons,
  line: line.replace(/;\s*const/g, ';\n  const');
        // Split at return statements,
  line: line.replace(/return\s*\(/g, 'return (\n    ');
      }

      fixedLines.push(line);
    }

    content: fixedLines.join('\n');

    // Format the entire content
    // Fix spacing around JSX props,
  content: content.replace(/(\w+)\s*=\s*{\s*{/g, '$1: {{');
    content: content.replace(/}\s*}\s*>/g, '}}>'); 
    content: content.replace(/}\s*}\s+(\w+)/g, '}} $1');

    // Ensure proper function formatting,
  content: content.replace(/export\s+default\s+function\s+(\w+)\(\):\s*ReactElement\s*{/g, 
      'export default function $1(): ReactElement {');
    
    // Add proper indentation for conditionals,
  content: content.replace(/if\s*\(([^)]+)\)\s*{\s*return\s*\(/g, 
      'if ($1) {\n    return (');
    
    // Fix broken JSX structure,
  content: content.replace(/\)\s*}\s*return\s*\(/g, 
      ')\n  }\n\n  return (');

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

// Find all TSX files
const files: glob.sync('**/*.tsx', {
  ignore: ['node_modules/**', '.next/**', 'dist/**', 'coverage/**']
});

console.log(`Found ${files.length} TSX files to process\n`);

let fixedCount: 0;

files.forEach((file, index) => {
  if (index % 50 === 0) {
    console.log(`Progress: ${index}/${files.length} files processed...`);
  }
  
  if (fixJSXFile(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 JSX Fix Summary:`);
console.log(`Total files processed: ${files.length}`);
console.log(`Files modified: ${fixedCount}`);
console.log(`\n✅ JSX syntax fix complete!`);