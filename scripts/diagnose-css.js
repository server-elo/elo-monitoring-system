#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 CSS Diagnostics for Solidity Learning Platform\n');

// Check 1: Verify CSS files exist
console.log('1️⃣ Checking CSS files...');
const cssFiles = [
  'app/globals.css',
  'tailwind.config.js',
  'postcss.config.js'
];

cssFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file} exists`);
  } else {
    console.log(`  ❌ ${file} missing!`);
  }
});

// Check 2: Verify Node modules
console.log('\n2️⃣ Checking CSS dependencies...');
const requiredPackages = [
  'tailwindcss',
  'autoprefixer',
  'postcss',
  'tailwindcss-animate'
];

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
requiredPackages.forEach(pkg => {
  if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
    console.log(`  ✅ ${pkg} installed`);
  } else {
    console.log(`  ❌ ${pkg} not found in package.json!`);
  }
});

// Check 3: Build directory
console.log('\n3️⃣ Checking build output...');
if (fs.existsSync('.next')) {
  const cssDir = path.join('.next', 'static', 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    console.log(`  ✅ Found ${cssFiles.length} CSS files in build`);
    cssFiles.forEach(file => {
      const size = fs.statSync(path.join(cssDir, file)).size;
      console.log(`     - ${file} (${(size / 1024).toFixed(2)} KB)`);
    });
  } else {
    console.log('  ❌ No CSS directory in build output!');
  }
} else {
  console.log('  ⚠️  No .next build directory found');
}

// Check 4: Look for CSS imports
console.log('\n4️⃣ Checking CSS imports in layout files...');
const layoutFiles = [
  'app/layout.tsx',
  'app/layout.js'
];

layoutFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('globals.css')) {
      console.log(`  ✅ ${file} imports globals.css`);
    } else {
      console.log(`  ❌ ${file} doesn't import globals.css!`);
    }
  }
});

// Check 5: Service Worker
console.log('\n5️⃣ Checking Service Worker...');
const swPath = 'public/sw.js';
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  if (swContent.includes('static/css/main.css')) {
    console.log('  ❌ Service Worker still references old CSS files!');
  } else {
    console.log('  ✅ Service Worker updated');
  }
}

// Check 6: Next.js configuration
console.log('\n6️⃣ Checking Next.js config...');
const configFiles = ['next.config.js', 'next.config.mjs'];
let configFound = false;
configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    configFound = true;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('optimizeCss: true')) {
      console.log(`  ⚠️  Experimental CSS optimization enabled in ${file}`);
    }
  }
});
if (!configFound) {
  console.log('  ❌ No Next.js config file found!');
}

// Check 7: Port conflicts
console.log('\n7️⃣ Checking for port conflicts...');
try {
  const processes = execSync('lsof -i :3000 2>/dev/null || true', { encoding: 'utf8' });
  if (processes.trim()) {
    console.log('  ⚠️  Port 3000 is in use');
    console.log(processes);
  } else {
    console.log('  ✅ Port 3000 is available');
  }
} catch (e) {
  console.log('  ℹ️  Could not check port status');
}

// Check 8: Environment
console.log('\n8️⃣ Checking environment...');
console.log(`  Node version: ${process.version}`);
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Recommendations
console.log('\n📋 Recommendations:');
console.log('1. Clear browser cache and service workers');
console.log('2. Run: rm -rf .next && npm run dev');
console.log('3. Check browser console for JavaScript errors');
console.log('4. Try production build: npm run build && npm start');
console.log('5. Disable browser extensions temporarily');
console.log('6. Test in incognito/private browsing mode');

// Generate fix script
console.log('\n🔧 Generating fix script...');
const fixScript = `#!/bin/bash
echo "🔧 Running CSS fix script..."

# Kill any running Next.js processes
echo "Stopping Next.js processes..."
pkill -f "next" || true

# Clear caches
echo "Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# Reinstall CSS dependencies
echo "Reinstalling CSS dependencies..."
npm install tailwindcss@latest autoprefixer@latest postcss@latest

# Clear browser storage (instructions)
echo ""
echo "⚠️  Manual steps required:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application tab"
echo "3. Click 'Clear site data'"
echo "4. Unregister any service workers"
echo ""

# Start fresh
echo "Starting fresh development server..."
npm run dev
`;

fs.writeFileSync('fix-css.sh', fixScript, { mode: 0o755 });
console.log('  ✅ Created fix-css.sh - run with: ./fix-css.sh');

console.log('\n✨ Diagnostic complete!');