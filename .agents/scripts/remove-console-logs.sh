#!/bin/bash

# 12-Factor Agent Script: Remove console.logs from API routes
# Following Factor 10: Small, Focused Tasks
# Following Factor 12: Stateless Operations

echo "🔧 Starting console.log cleanup following 12-factor principles..."

# Counter for tracking progress
FIXED_COUNT=0
TOTAL_FILES=46

# Function to fix a single file
fix_file() {
    local file=$1
    echo "Processing: $file"
    
    # Check if file has console statements
    if grep -q "console\." "$file"; then
        # Add logger import if not present
        if ! grep -q "import.*logger.*from.*monitoring/simple-logger" "$file"; then
            # Find the last import line
            last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
            if [ -n "$last_import" ]; then
                sed -i "${last_import}a\\import { logger } from '@/lib/monitoring/simple-logger';" "$file"
            fi
        fi
        
        # Replace console.error with logger.error
        sed -i "s/console\.error(\([^,]*\),\s*\(.*\));/logger.error(\1, { error: \2 });/g" "$file"
        sed -i "s/console\.error(\(.*\));/logger.error('Error occurred', { error: \1 });/g" "$file"
        
        # Replace console.log with logger.info
        sed -i "s/console\.log(\([^,]*\),\s*\(.*\));/logger.info(\1, { data: \2 });/g" "$file"
        sed -i "s/console\.log(\(.*\));/logger.info(\1);/g" "$file"
        
        # Replace console.warn with logger.warn
        sed -i "s/console\.warn(\([^,]*\),\s*\(.*\));/logger.warn(\1, { data: \2 });/g" "$file"
        sed -i "s/console\.warn(\(.*\));/logger.warn(\1);/g" "$file"
        
        ((FIXED_COUNT++))
        echo "✅ Fixed $file ($FIXED_COUNT/$TOTAL_FILES)"
    else
        echo "⏭️  Skipped $file (no console statements)"
    fi
}

# Process all API route files
for file in /home/elo/learning_solidity/learning_sol/app/api/**/*.ts; do
    if [ -f "$file" ]; then
        fix_file "$file"
    fi
done

echo "✨ Console.log cleanup complete!"
echo "📊 Fixed $FIXED_COUNT files"
echo "🎯 Following 12-factor principles: Small, focused, stateless operations"