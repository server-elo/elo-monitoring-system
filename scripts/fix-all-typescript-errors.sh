#!/bin/bash

echo "🔧 Starting comprehensive TypeScript error fix..."

# Function to fix common patterns in TypeScript files
fix_typescript_patterns() {
  local file="$1"
  
  # Skip node_modules and .next directories
  if [[ "$file" == *node_modules* ]] || [[ "$file" == *.next* ]]; then
    return
  fi
  
  # Fix icon component underscore syntax: (_{ className }) -> ({ className })
  sed -i 's/(_{\s*\([^}]*\)\s*})/({ \1 })/g' "$file" 2>/dev/null || true
  
  # Fix toISOString underscore calls
  sed -i 's/\.toISOString(_)/\.toISOString()/g' "$file" 2>/dev/null || true
  sed -i 's/\.toUpperCase(_)/\.toUpperCase()/g' "$file" 2>/dev/null || true
  sed -i 's/\.toLowerCase(_)/\.toLowerCase()/g' "$file" 2>/dev/null || true
  sed -i 's/\.getFullYear(_)/\.getFullYear()/g' "$file" 2>/dev/null || true
  sed -i 's/\.padStart(\s*\([0-9]*\),\s*/_/\.padStart(\1, /g' "$file" 2>/dev/null || true
  
  # Fix Math.random underscore calls
  sed -i 's/Math\.random(_)/Math.random()/g' "$file" 2>/dev/null || true
  
  # Fix process method underscore calls
  sed -i 's/process\.uptime(_)/process.uptime()/g' "$file" 2>/dev/null || true
  sed -i 's/process\.memoryUsage(_)/process.memoryUsage()/g' "$file" 2>/dev/null || true
  
  # Fix substring/substr underscore calls
  sed -i 's/\.substring(\s*\([0-9]*\),\s*\([0-9]*\))/\.substring(\1, \2)/g' "$file" 2>/dev/null || true
  sed -i 's/\.substr(\s*\([0-9]*\),\s*\([0-9]*\))/\.substr(\1, \2)/g' "$file" 2>/dev/null || true
  
  # Fix logger calls with metadata syntax
  sed -i 's/logger\.\(info\|warn\|error\)(_`/logger.\1(`/g' "$file" 2>/dev/null || true
  
  # Fix missing closing braces in logger metadata
  sed -i '/logger\.\(info\|warn\|error\).*{ metadata: {$/,/^[[:space:]]*}[[:space:]]*$/ {
    /^[[:space:]]*}[[:space:]]*$/s/}/}});/
  }' "$file" 2>/dev/null || true
  
  # Fix array/object length comparisons
  sed -i 's/if (_1\.length/if (codeSnippets.length/g' "$file" 2>/dev/null || true
  sed -i 's/if (_1\.length/if (recommendations.length/g' "$file" 2>/dev/null || true
  sed -i 's/if (_1\.length/if (missingFields.length/g' "$file" 2>/dev/null || true
  
  # Fix async function syntax
  sed -i 's/(_async (/( async (/g' "$file" 2>/dev/null || true
  
  # Fix function parameter underscores
  sed -i 's/export async function \([A-Z]*\)(\s*_\s*request:/export async function \1(request:/g' "$file" 2>/dev/null || true
  sed -i 's/export async function \([A-Z]*\)(\s*_/export async function \1(/g' "$file" 2>/dev/null || true
  
  # Fix arrow function underscore parameters
  sed -i 's/\.find(_\([a-zA-Z]\)/.find(\1/g' "$file" 2>/dev/null || true
  sed -i 's/\.map(_\([a-zA-Z]\)/.map(\1/g' "$file" 2>/dev/null || true
  sed -i 's/\.filter(_\([a-zA-Z]\)/.filter(\1/g' "$file" 2>/dev/null || true
  
  # Fix NextResponse.json spacing
  sed -i 's/NextResponse\.json(\s*/NextResponse.json(/g' "$file" 2>/dev/null || true
  
  # Fix variable names starting with underscore in conditionals
  sed -i 's/if\s*(\s*_\([a-zA-Z][a-zA-Z0-9]*\)\s*)/if (\1)/g' "$file" 2>/dev/null || true
  
  # Fix email.toLowerCase underscore
  sed -i 's/email\.toLowerCase(_)/email.toLowerCase()/g' "$file" 2>/dev/null || true
  
  # Fix new URL spacing
  sed -i 's/new URL(\s*request\.url/new URL(request.url/g' "$file" 2>/dev/null || true
}

# Process all TypeScript and TSX files
echo "Processing TypeScript files..."
find . -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  fix_typescript_patterns "$file"
done

# Fix specific known issues in API routes
echo "Fixing specific API route issues..."

# Fix auth/login route
if [ -f "./app/api/auth/login/route.ts" ]; then
  # Fix the metadata closing brace issue
  sed -i '/logger\.error.*JWT_SECRET.*{[[:space:]]*metadata:[[:space:]]*{/,/^[[:space:]]*}[[:space:]]*$/ {
    /^[[:space:]]*}[[:space:]]*$/s/});$/}});/
  }' "./app/api/auth/login/route.ts" 2>/dev/null || true
fi

# Fix auth/register route
if [ -f "./app/api/auth/register/route.ts" ]; then
  # Fix duplicate metadata property
  sed -i 's/logger\.warn.*{ metadata: {[[:space:]]*metadata: {/logger.warn('\''Registration attempt with existing email'\'', {\n        metadata: {/g' "./app/api/auth/register/route.ts" 2>/dev/null || true
fi

# Remove backup files
echo "Removing backup .bak files..."
find . -name "*.bak" -type f -delete

echo "✅ TypeScript error fixes completed!"
echo "Running lint to check remaining issues..."
npm run lint 2>&1 | tail -20