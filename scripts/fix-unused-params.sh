#!/bin/bash

# Fix unused request parameters in API routes
echo "Fixing unused 'request' parameters in API routes..."

# Find all TypeScript files in app/api
find app/api -name "*.ts" -type f | while read -r file; do
    # Check if file contains unused 'request' parameter
    if grep -q "export async function [A-Z]*(.* request:" "$file" && grep -q "request.*is declared but.*never read" <(npm run type-check 2>&1 | grep "$file"); then
        echo "Fixing: $file"
        # Replace 'request:' with '_request:' in function signatures
        sed -i 's/\(export async function [A-Z]*.*\)request:/\1_request:/g' "$file"
    fi
done

# Fix other common unused parameters
echo "Fixing other unused parameters..."

# Find all TypeScript files
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read -r file; do
    # Get unused variables for this file
    npm run type-check 2>&1 | grep "$file" | grep "TS6133:" | grep -oE "'[^']+' is declared" | cut -d"'" -f2 | sort -u | while read -r var; do
        # Skip if it's a type or interface
        if ! grep -q "type $var\\b\\|interface $var\\b\\|enum $var\\b" "$file"; then
            # Check if it's a function parameter
            if grep -qE "\\b$var:" "$file"; then
                echo "  Prefixing unused parameter '$var' with '_' in $file"
                # Be careful to only replace parameter declarations, not usage
                sed -i "s/\\([(,]\\s*\\)$var:/\\1_$var:/g" "$file"
            fi
        fi
    done
done

echo "Done fixing unused parameters!"