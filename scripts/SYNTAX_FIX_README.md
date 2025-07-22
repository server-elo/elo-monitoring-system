# TypeScript Syntax Fix Scripts

This directory contains automated scripts to fix common TypeScript/JavaScript syntax errors across your entire codebase.

## 🚀 Quick Start

### Option 1: Quick Fix (JavaScript - No Dependencies)
```bash
npm run fix:syntax
```

### Option 2: Comprehensive Fix (TypeScript - More Thorough)
```bash
# First install ts-morph if not already installed
npm install --save-dev ts-morph glob

# Then run the comprehensive fixer
npm run fix:syntax:deep
```

## 📋 What These Scripts Fix

### Common Syntax Errors Fixed:

1. **Trailing Commas After Semicolons**
   ```typescript
   // Before
   interface User {
     name: string;,
     age: number;,
   }
   
   // After
   interface User {
     name: string;
     age: number;
   }
   ```

2. **Missing Commas Between Properties**
   ```typescript
   // Before
   const config = {
     host: 'localhost'
     port: 3000
   }
   
   // After
   const config = {
     host: 'localhost',
     port: 3000
   }
   ```

3. **Property Assignment Issues**
   ```typescript
   // Before
   const obj = {
     key = value
   }
   
   // After
   const obj = {
     key: value
   }
   ```

4. **Import Syntax Errors**
   ```typescript
   // Before
   import React from react
   
   // After
   import React from 'react'
   ```

5. **Extra Commas in Arrays/Objects**
   ```typescript
   // Before
   const arr = [1,, 2,, 3]
   const func = (a,, b,) => {}
   
   // After
   const arr = [1, 2, 3]
   const func = (a, b) => {}
   ```

6. **Async Function Syntax**
   ```typescript
   // Before
   async: function() {}
   async(param) {}
   
   // After
   async function() {}
   async (param) {}
   ```

7. **Generic Type Syntax**
   ```typescript
   // Before
   Array< string >
   Map<string  number>
   
   // After
   Array<string>
   Map<string, number>
   ```

8. **JSX Syntax Issues**
   ```typescript
   // Before
   <Component prop=value />
   <EmptyComponent></EmptyComponent>
   
   // After
   <Component prop="value" />
   <EmptyComponent />
   ```

## 🛠️ Script Details

### quick-syntax-fix.js
- **Language**: JavaScript
- **Dependencies**: None (uses Node.js built-ins)
- **Speed**: Very fast
- **Coverage**: Common syntax patterns
- **Best for**: Quick fixes during development

### fix-all-syntax-errors.ts
- **Language**: TypeScript
- **Dependencies**: ts-morph, glob
- **Speed**: Thorough but slower
- **Coverage**: Comprehensive AST-based fixes
- **Best for**: Pre-commit or build process

## 📊 Features

Both scripts provide:
- Progress indicators
- Detailed fix summaries
- Error reporting
- Safe file operations (backup original content in memory)
- Ignored paths (node_modules, build directories, etc.)

## 🔧 Advanced Usage

### Run on Specific Directories
```bash
# Modify the glob patterns in the scripts
const files = glob.sync('src/**/*.{ts,tsx}', { ... });
```

### Add Custom Fix Patterns
```javascript
// In quick-syntax-fix.js
this.fixPatterns.push({
  pattern: /yourPattern/g,
  replacement: 'yourReplacement',
  description: 'Description of fix'
});
```

### Run with TypeScript Compiler Check
```bash
# Fix syntax first, then check with TypeScript
npm run fix:syntax:deep && npm run type-check
```

## ⚠️ Important Notes

1. **Always commit your changes before running** - While the scripts are safe, it's good practice
2. **Run your test suite after fixing** - Ensure no functional changes were made
3. **The scripts are idempotent** - Running multiple times is safe
4. **Review changes** - Use `git diff` to review modifications

## 🐛 Troubleshooting

### Script Not Found Error
```bash
# Make scripts executable
chmod +x scripts/quick-syntax-fix.js
chmod +x scripts/fix-all-syntax-errors.ts
```

### Missing Dependencies
```bash
# For the TypeScript version
npm install --save-dev ts-morph glob tsx
```

### Permission Errors
```bash
# Run with proper permissions
sudo npm run fix:syntax
```

## 🔄 Integration with CI/CD

Add to your pre-commit hook:
```bash
# .husky/pre-commit
npm run fix:syntax
npm run lint
npm run type-check
```

Add to your CI pipeline:
```yaml
- name: Fix Syntax Errors
  run: npm run fix:syntax:deep
  
- name: Check for Changes
  run: |
    if [[ -n $(git status --porcelain) ]]; then
      echo "Syntax errors found and fixed. Please run 'npm run fix:syntax' locally."
      exit 1
    fi
```

## 📈 Performance Tips

1. **Use quick-syntax-fix.js for rapid iteration**
2. **Use fix-all-syntax-errors.ts before commits**
3. **Configure your IDE to auto-fix on save**
4. **Run on changed files only during development**

## 🤝 Contributing

To add new fix patterns:
1. Identify the syntax error pattern
2. Add test cases
3. Implement the fix
4. Test on sample files
5. Submit a PR

---

These scripts are part of the Solidity Learning Platform's commitment to code quality and developer experience.