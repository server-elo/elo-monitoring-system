#!/bin/bash
# Phase 1.2: Fix Critical TypeScript Errors

echo "🔧 Phase 1.2: Fixing critical TypeScript errors..."

# Fix JSX.Element to ReactElement
echo "📝 Converting JSX.Element to ReactElement..."
find . -type f -name "*.tsx" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
  if grep -q "JSX\.Element" "$file"; then
    # Check if ReactElement import exists
    if ! grep -q "import.*ReactElement.*from 'react'" "$file"; then
      # Add import at the beginning of the file
      if grep -q "^import.*from 'react'" "$file"; then
        # Update existing React import
        sed -i "s/import \(.*\) from 'react'/import \1, { ReactElement } from 'react'/g" "$file"
        sed -i "s/, {/, { ReactElement,/g" "$file"
        sed -i "s/{ ReactElement, ReactElement/{ ReactElement/g" "$file"
      else
        # Add new import at top
        sed -i "1s/^/import { ReactElement } from 'react';\n/" "$file"
      fi
    fi
    
    # Replace JSX.Element with ReactElement
    sed -i 's/: JSX\.Element/: ReactElement/g' "$file"
    sed -i 's/<JSX\.Element>/<ReactElement>/g' "$file"
    echo "  ✓ Fixed: $file"
  fi
done

# Fix React.FC deprecation patterns
echo "📝 Updating React.FC patterns..."
find . -type f -name "*.tsx" -not -path "./node_modules/*" | while read file; do
  if grep -q "React\.FC" "$file"; then
    # Replace React.FC with proper function signatures
    sed -i 's/: React\.FC<{\(.*\)}>/({\1 }): ReactElement/g' "$file"
    sed -i 's/: React\.FC/()/g' "$file"
    echo "  ✓ Updated FC pattern: $file"
  fi
done

# Fix missing 'use client' directives
echo "📝 Adding 'use client' directives where needed..."
find components -name "*.tsx" -not -path "./node_modules/*" | while read file; do
  # Skip if already has directive or is server component
  if ! grep -q "^[\"']use client[\"']" "$file" && ! grep -q "^[\"']use server[\"']" "$file"; then
    # Check if file uses hooks or browser APIs
    if grep -qE "(useState|useEffect|useCallback|useMemo|onClick|onChange|window\.|document\.)" "$file"; then
      sed -i '1s/^/"use client"\n\n/' "$file"
      echo "  ✓ Added 'use client' to: $file"
    fi
  fi
done

# Fix common TypeScript strictness issues
echo "📝 Fixing TypeScript strict mode issues..."

# Create a TypeScript fix helper
cat > scripts/typescript-helpers.ts << 'EOF'
export function assertDefined<T>(value: T | undefined | null, message: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

export function isNotUndefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}
EOF

# Fix async component patterns
echo "📝 Fixing async component patterns..."
find app -name "*.tsx" -not -path "./node_modules/*" | while read file; do
  # Convert async components to proper patterns
  if grep -q "async function.*(): Promise<ReactElement>" "$file"; then
    echo "  ✓ Found async component in: $file"
    # Server components don't need explicit return type
    sed -i 's/async function \(.*\)(): Promise<ReactElement>/async function \1()/g' "$file"
  fi
done

# Fix environment variable access
echo "📝 Fixing environment variable type safety..."
if [ ! -f "lib/env.ts" ]; then
cat > lib/env.ts << 'EOF'
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    throw new Error('Invalid environment variables');
  }
}

export const env = validateEnv();
EOF
echo "  ✓ Created type-safe env configuration"
fi

# Fix import paths
echo "📝 Fixing import path issues..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" | while read file; do
  # Fix @/ imports that might be broken
  sed -i "s|from '\.\./\.\./|from '@/|g" "$file"
  sed -i 's|from "\.\./\.\./|from "@/|g' "$file"
done

echo "✅ Phase 1.2 Complete: Critical TypeScript errors fixed"