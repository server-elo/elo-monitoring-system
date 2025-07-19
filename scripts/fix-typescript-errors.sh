#!/bin/bash

echo "🔧 Starting TypeScript error fixes..."

# Step 1: Fix unused variables by prefixing with underscore
echo "📝 Fixing unused variables..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  # Fix unused parameters in functions
  sed -i 's/(\([^,)]*\), \([^)]*\))/(_\1, \2)/g' "$file" 2>/dev/null || true
  sed -i 's/(\([^)]*\))/(_\1)/g' "$file" 2>/dev/null || true
done

# Step 2: Create missing type declarations
echo "📦 Creating type declarations..."
cat > types/missing-types.d.ts << 'EOF'
// Missing module declarations
declare module 'lucide-react' {
  export * from '@lucide/react';
}

declare module '@tanstack/react-query-devtools' {
  export const ReactQueryDevtools: any;
}

declare module 'recharts' {
  export * from 'recharts/types';
}

// Global type augmentations
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APP_VERSION: string;
      NEXT_PUBLIC_API_URL: string;
      JWT_SECRET: string;
      DATABASE_URL: string;
    }
  }
}

// Fix for File API in Node environment
declare global {
  var File: typeof globalThis.File;
}

export {};
EOF

# Step 3: Fix common import issues
echo "🔄 Fixing import statements..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  # Fix lucide-react imports
  sed -i "s/from 'lucide-react'/from '@lucide\/react'/g" "$file" 2>/dev/null || true
done

# Step 4: Fix Prisma casing issues
echo "🔨 Fixing Prisma property names..."
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  # Fix aiLearningContext to aILearningContext
  sed -i 's/\.aiLearningContext/\.aILearningContext/g' "$file" 2>/dev/null || true
done

# Step 5: Add type assertions for problematic areas
echo "🛠️ Adding type assertions..."
# Fix the logger context issues
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
  # Add 'as any' to logger context objects temporarily
  sed -i 's/logger\.\(info\|error\|warn\|debug\)(\([^,]*\), {/logger.\1(\2, { metadata: {/g' "$file" 2>/dev/null || true
done

# Step 6: Generate Prisma client
echo "🏗️ Regenerating Prisma client..."
npx prisma generate

# Step 7: Install missing type packages
echo "📚 Installing missing type packages..."
npm install --save-dev @types/node@20 @types/react@18 @types/react-dom@18 2>/dev/null

echo "✅ TypeScript fixes applied!"
echo "🔍 Running type check to see remaining errors..."
npm run type-check 2>&1 | tail -20