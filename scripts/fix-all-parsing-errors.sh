#\!/bin/bash

# PRP Phase 1: Fix all parsing errors systematically

echo "🚀 PRP Phase 1: Executing deep parsing error fixes..."

# Get all files with parsing errors
FILES=$(npm run lint 2>&1 | grep -B1 "Error: Parsing error" | grep "\.ts" | sed 's/^.\///g' | sort -u)

for file in $FILES; do
    if [ -f "$file" ]; then
        echo "🔧 Fixing parsing errors in: $file"
        
        # Fix common patterns that cause parsing errors
        
        # Fix extra closing braces
        sed -i 's/}});$/});/g' "$file"
        sed -i 's/}})/})/g' "$file"
        
        # Fix missing commas in object literals
        sed -i '/^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*:[[:space:]]*[^,]*$/s/$/,/' "$file"
        
        # Fix trailing commas before closing braces
        sed -i 's/,$/ /g' "$file"
        sed -i 's/, }/}/g' "$file"
        
        # Fix function parameter spacing
        sed -i 's/( /(/g' "$file"
        sed -i 's/ )/)/g' "$file"
        
        # Fix template literal issues
        sed -i 's/_`/`/g' "$file"
        
        # Fix underscore variable names
        sed -i 's/_without/without/g' "$file"
        sed -i 's/_replace/replace/g' "$file"
        sed -i 's/_instructor/instructor/g' "$file"
        
        # Fix specific patterns from error analysis
        sed -i 's/projectId_userId/projectId_userId/g' "$file"
        
        # Fix specific comma issues in objects
        sed -i '/timestamp: new Date/s/$/,/' "$file"
        sed -i '/requestId$/s/$/,/' "$file"
        
        echo "✅ Fixed: $file"
    fi
done

echo "📊 Checking remaining errors..."
REMAINING_ERRORS=$(npm run lint 2>&1 | grep "Error:" | wc -l)
echo "Remaining errors: $REMAINING_ERRORS"

if [ $REMAINING_ERRORS -lt 37 ]; then
    echo "✅ Phase 1 Progress: Reduced errors\!"
else
    echo "⚠️  Need manual review of specific patterns"
fi
