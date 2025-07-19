#!/usr/bin/env node

/**
 * TypeScript Error Fixing Script
 * Automatically fixes common TypeScript errors in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runTypeCheck() {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return null; // No errors
  } catch (error) {
    return error.stdout.toString();
  }
}

function fixUnusedParameters(filePath) {
  console.log(`🔧 Fixing unused parameters in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unused request parameters in API routes
  const unusedRequestPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\(request: NextRequest\)/g;
  if (content.match(unusedRequestPattern)) {
    content = content.replace(unusedRequestPattern, 'export async function $1(_request: NextRequest)');
    modified = true;
  }

  // Fix unused variables in destructuring
  const unusedVarPattern = /const \{ ([^}]+) \} = data;/g;
  const matches = content.match(unusedVarPattern);
  if (matches) {
    matches.forEach(match => {
      const vars = match.match(/const \{ ([^}]+) \}/)[1].split(',').map(v => v.trim());
      // Check if any variables are used in the following lines
      const afterMatch = content.substring(content.indexOf(match) + match.length);
      const nextFewLines = afterMatch.split('\n').slice(0, 10).join('\n');
      
      const fixedVars = vars.map(varName => {
        const cleanVar = varName.split(':')[0].trim();
        if (!nextFewLines.includes(cleanVar) && !nextFewLines.includes(`${cleanVar}`)) {
          return `_${cleanVar}`;
        }
        return varName;
      });
      
      const fixedMatch = `const { ${fixedVars.join(', ')} } = data;`;
      content = content.replace(match, fixedMatch);
      modified = true;
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed unused parameters in ${filePath}`);
  }
}

function fixApiRoutes() {
  console.log('🔍 Scanning API routes for TypeScript errors...');
  
  const apiDir = path.join(process.cwd(), 'app', 'api');
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item === 'route.ts') {
        fixUnusedParameters(fullPath);
      }
    }
  }
  
  if (fs.existsSync(apiDir)) {
    scanDirectory(apiDir);
  }
}

function fixServiceFiles() {
  console.log('🔍 Scanning service files for TypeScript errors...');
  
  const servicesDir = path.join(process.cwd(), 'services');
  
  if (fs.existsSync(servicesDir)) {
    const files = fs.readdirSync(servicesDir);
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const filePath = path.join(servicesDir, file);
        
        // Fix specific issues in geminiService.ts
        if (file === 'geminiService.ts') {
          console.log('🔧 Fixing geminiService.ts syntax errors...');
          let content = fs.readFileSync(filePath, 'utf8');
          
          // Fix models property syntax
          content = content.replace(/models:\s*{/, 'models = {');
          
          fs.writeFileSync(filePath, content);
          console.log('✅ Fixed geminiService.ts');
        }
      }
    }
  }
}

function fixImportIssues() {
  console.log('🔍 Checking for import issues...');
  
  // Check if constants.ts exists
  const constantsPath = path.join(process.cwd(), 'constants.ts');
  if (!fs.existsSync(constantsPath)) {
    console.log('⚠️  constants.ts not found, creating minimal version...');
    
    const minimalConstants = `export const LEARNING_MODULES: any[] = [];`;
    fs.writeFileSync(constantsPath, minimalConstants);
    console.log('✅ Created minimal constants.ts');
  }
}

async function main() {
  console.log('🚀 TypeScript Error Fixing Script');
  console.log('=================================\n');

  // Initial type check
  console.log('📊 Running initial type check...');
  let errors = runTypeCheck();
  
  if (!errors) {
    console.log('✅ No TypeScript errors found!');
    return;
  }

  console.log('❌ TypeScript errors detected, attempting fixes...\n');

  // Fix common issues
  fixImportIssues();
  fixApiRoutes();
  fixServiceFiles();

  // Run type check again
  console.log('\n📊 Running final type check...');
  errors = runTypeCheck();
  
  if (!errors) {
    console.log('✅ All TypeScript errors fixed!');
    console.log('\n🎉 You can now run: npm run build');
  } else {
    console.log('⚠️  Some TypeScript errors remain:');
    console.log(errors);
    console.log('\n💡 Manual fixes may be required for remaining errors.');
  }
}

main().catch(console.error);
