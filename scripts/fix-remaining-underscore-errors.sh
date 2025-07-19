#!/bin/bash

echo "Fixing remaining underscore syntax errors..."

# Fix patterns like _variableName (underscore before variable)
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  if [[ "$file" == *node_modules* ]] || [[ "$file" == *.next* ]]; then
    continue
  fi
  
  # Fix _1, _2, etc patterns (common in array/string length checks)
  sed -i 's/_1\.length/codeSnippets.length/g' "$file" 2>/dev/null || true
  sed -i 's/_1\.length/recommendations.length/g' "$file" 2>/dev/null || true
  sed -i 's/_1\.length/jwtSecret.length/g' "$file" 2>/dev/null || true
  
  # Fix function call patterns with space before parenthesis
  sed -i 's/validationErrorResponse( /validationErrorResponse(/g' "$file" 2>/dev/null || true
  sed -i 's/NextResponse\.json( /NextResponse.json(/g' "$file" 2>/dev/null || true
  
  # Fix underscore before variable names in conditionals
  sed -i 's/if (_\([a-zA-Z][a-zA-Z0-9]*\))/if (\1)/g' "$file" 2>/dev/null || true
  sed -i 's/} else if (_\([a-zA-Z][a-zA-Z0-9]*\))/} else if (\1)/g' "$file" 2>/dev/null || true
  
  # Fix underscore in catch blocks
  sed -i 's/} catch ( error)/} catch (error)/g' "$file" 2>/dev/null || true
  
  # Fix function parameters with underscores
  sed -i 's/function\s*\([a-zA-Z0-9]*\)\s*(_)/function \1()/g' "$file" 2>/dev/null || true
  
  # Fix unused parameter patterns
  sed -i 's/, _\([a-zA-Z][a-zA-Z0-9]*\):/, \1:/g' "$file" 2>/dev/null || true
done

echo "Script completed!"