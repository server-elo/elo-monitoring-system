#!/bin/bash

echo "🔧 Fixing Development Environment Errors..."
echo "=========================================="

# 1. Clean cache and build directories
echo "🧹 Cleaning cache and build directories..."
rm -rf .next .turbo node_modules/.cache

# 2. Fix any TypeScript errors by running the fix script
if [ -f "scripts/fix-typescript-errors.js" ]; then
    echo "🔨 Running TypeScript error fixes..."
    node scripts/fix-typescript-errors.js
fi

# 3. Fix syntax errors
if [ -f "scripts/quick-syntax-fix.js" ]; then
    echo "🔨 Running syntax fixes..."
    node scripts/quick-syntax-fix.js
fi

# 4. Ensure Prisma is properly set up
echo "🗄️  Setting up database..."
npx prisma db push --skip-generate
npx prisma generate

# 5. Validate environment
if [ -f "scripts/validate-environment.js" ]; then
    echo "✅ Validating environment..."
    node scripts/validate-environment.js
fi

echo ""
echo "✅ Fixes applied!"
echo ""
echo "To start the development server, run:"
echo "  ./dev-stable.sh"
echo ""
echo "This will build and run the app in production mode locally,"
echo "avoiding the chunk loading errors from development mode."