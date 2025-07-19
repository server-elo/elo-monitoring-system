#!/bin/bash

echo "🔧 Fixing final TypeScript parsing errors..."

# Fix extra closing braces in error blocks
echo "Fixing extra closing braces..."
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  if [[ "$file" == *node_modules* ]] || [[ "$file" == *.next* ]]; then
    continue
  fi
  
  # Fix pattern: }});  where there should only be one closing
  sed -i 's/}}});$/}});/g' "$file" 2>/dev/null || true
  
  # Fix logger metadata double nesting
  sed -i 's/logger\.\(info\|warn\|error\).*{ metadata: {[[:space:]]*metadata: {/logger.\1('\''Registration attempt with existing email'\'', { metadata: {/g' "$file" 2>/dev/null || true
  
  # Fix underscore in variable names inside function calls
  sed -i 's/\.includes(_\([a-zA-Z][a-zA-Z0-9]*\))/.includes(\1)/g' "$file" 2>/dev/null || true
  sed -i 's/\.slice(_\([0-9-]*\))/.slice(\1)/g' "$file" 2>/dev/null || true
  
  # Fix underscore in conditional checks
  sed -i 's/if\s*(\s*_\([a-zA-Z][a-zA-Z0-9]*\)\s*&&/if (\1 \&\&/g' "$file" 2>/dev/null || true
  sed -i 's/\s_\([a-zA-Z][a-zA-Z0-9]*\)\s*&&/ \1 \&\&/g' "$file" 2>/dev/null || true
  
  # Fix missing commas in async error blocks
  sed -i '/} catch (error) {$/,/^[[:space:]]*}$/ {
    /logger\.error.*);$/s/);$/);/
  }' "$file" 2>/dev/null || true
done

# Specific file fixes
echo "Applying specific file fixes..."

# Fix auth/login route - remove extra closing brace
if [ -f "./app/api/auth/login/route.ts" ]; then
  sed -i '219s/}});/});/' "./app/api/auth/login/route.ts" 2>/dev/null || true
fi

# Fix auth/register route - fix metadata nesting
if [ -f "./app/api/auth/register/route.ts" ]; then
  sed -i 's/logger\.info.*{ metadata: {[[:space:]]*metadata: {/logger.info('\''User registered successfully'\'', { metadata: {/g' "./app/api/auth/register/route.ts" 2>/dev/null || true
fi

# Fix certificates route
if [ -f "./app/api/certificates/route.ts" ]; then
  # Fix _verified check
  sed -i 's/if\s*(\s*_verified\s*!==\s*null)/if (verified !== null)/g' "./app/api/certificates/route.ts" 2>/dev/null || true
  # Fix .getTime() calls
  sed -i 's/\.getTime(_)/\.getTime()/g' "./app/api/certificates/route.ts" 2>/dev/null || true
fi

# Fix components with underscore parameters
echo "Fixing component parameter syntax..."
find ./components -name "*.tsx" | while read file; do
  # Fix footer date
  sed -i 's/new Date(_)/new Date()/g' "$file" 2>/dev/null || true
  # Fix map/filter underscore parameters
  sed -i 's/\.map(\s*_\([a-zA-Z][a-zA-Z0-9]*\)\s*=>/.map(\1 =>/g' "$file" 2>/dev/null || true
done

# Fix any remaining _1 patterns in conditionals
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  if [[ "$file" == *node_modules* ]] || [[ "$file" == *.next* ]]; then
    continue
  fi
  
  # Common variable replacements for _1
  sed -i 's/if\s*(\s*_1\.length/if (missingFields.length/g' "$file" 2>/dev/null || true
  sed -i 's/\s_1\.length/ missingFields.length/g' "$file" 2>/dev/null || true
done

echo "✅ Final parsing error fixes completed!"
echo "Running lint to verify..."
npm run lint 2>&1 | grep -c "Error:" | xargs echo "Remaining errors:"