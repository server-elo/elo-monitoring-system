#!/bin/bash

# Fix remaining API route syntax errors

echo "Fixing remaining API route syntax errors..."

# Fix common patterns in API routes
find app/api -name "*.ts" -type f | while read file; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Fix logger.error patterns with incorrect syntax
    sed -i 's/logger\.error( /logger.error(/g' "$file"
    sed -i 's/logger\.error([^,]*, { metadata: {}, error as Error);/logger.error(\1, error as Error);/g' "$file"
    
    # Fix fetch patterns
    sed -i 's/await fetch(_`/await fetch(`/g' "$file"
    sed -i 's/\.json(_)/\.json()/g' "$file"
    
    # Fix array patterns
    sed -i 's/\[\.\.\.\w\+(_\([0-9]\+\))]/[...Array(\1)]/g' "$file"
    
    # Fix arrow function parameters
    sed -i 's/\.map( (/\.map((/g' "$file"
    sed -i 's/\.filter( (/\.filter((/g' "$file"
    sed -i 's/\.reduce( (/\.reduce((/g' "$file"
    sed -i 's/\.forEach( (/\.forEach((/g' "$file"
    sed -i 's/\.sort( (/\.sort((/g' "$file"
    
    # Fix toLocaleDateString calls
    sed -i 's/\.toLocaleDateString(_)/\.toLocaleDateString()/g' "$file"
    
    # Fix window.open patterns
    sed -i 's/window\.open( `/window\.open(`/g' "$file"
    
    # Fix new Date patterns
    sed -i 's/new Date(_\([^)]*\))\.getTime(_)/new Date(\1).getTime()/g' "$file"
    
    # Fix more complex logger patterns
    sed -i "s/logger\.error('\([^']*\)'[[:space:]]*,[[:space:]]*{[[:space:]]*metadata:[[:space:]]*{}[[:space:]]*,[[:space:]]*error[[:space:]]*as[[:space:]]*Error);/logger.error('\1', error as Error);/g" "$file"
    
    # Fix setState patterns
    sed -i 's/setState(_\([^)]*\))/setState(\1)/g' "$file"
    
    # Fix boolean and null values
    sed -i 's/_true/true/g' "$file"
    sed -i 's/_false/false/g' "$file"
    sed -i 's/_null/null/g' "$file"
    
    # Fix function parameters with underscores
    sed -i 's/= (_) =>/= () =>/g' "$file"
    sed -i 's/(_req)/(_req)/g' "$file"  # Keep underscore for unused params
    
    # Compare with backup and remove if no changes
    if cmp -s "$file" "$file.bak"; then
        rm "$file.bak"
    else
        echo "  Fixed: $file"
    fi
done

# Count remaining errors
echo ""
echo "Checking remaining errors..."
npm run lint 2>&1 | grep -c "Error:" || echo "0 errors found"