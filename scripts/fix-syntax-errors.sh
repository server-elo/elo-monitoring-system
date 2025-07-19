#!/bin/bash

# Script to fix common syntax errors in TypeScript files

echo "Starting syntax error fixes..."

# Fix common patterns:
# 1. _! -> !
# 2. __ -> (space)
# 3. _( -> (
# 4. )_ -> )
# 5. ,_ -> ,

# Find all TypeScript and TSX files
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" | while read -r file; do
    # Check if file contains any of the patterns
    if grep -E "_!|__|_\(|\)_|,_" "$file" > /dev/null 2>&1; then
        echo "Fixing: $file"
        
        # Create backup
        cp "$file" "$file.bak"
        
        # Apply fixes
        sed -i 's/_!/!/g' "$file"
        sed -i 's/__/ /g' "$file"
        sed -i 's/_(/(/g' "$file"
        sed -i 's/)_/)/g' "$file"
        sed -i 's/,_/,/g' "$file"
        sed -i 's/_(/_(/g' "$file"
        
        # Check if file was modified successfully
        if [ $? -eq 0 ]; then
            rm "$file.bak"
        else
            echo "Error fixing $file, restoring backup"
            mv "$file.bak" "$file"
        fi
    fi
done

echo "Syntax error fixes completed!"