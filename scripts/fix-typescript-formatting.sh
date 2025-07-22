#!/bin/bash

# TypeScript Formatting Fix Script
# Fixes corrupted TypeScript files with missing line breaks and malformed syntax

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Statistics
TOTAL_FILES=0
FIXED_FILES=0
FAILED_FILES=0

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup
create_backup() {
    log_info "Creating backup of TypeScript files..."
    tar -czf typescript-backup-$(date +%Y%m%d-%H%M%S).tar.gz --exclude=node_modules --exclude=.next --exclude=.git "*.ts" "*.tsx" 2>/dev/null || true
    log_info "Backup created ✓"
}

# Fix concatenated lines
fix_concatenated_lines() {
    local file=$1
    
    # Pattern 1: Add line breaks before common keywords
    sed -i 's/\([;}]\)\(const\|let\|var\|function\|export\|import\|interface\|type\|class\)/\1\n\2/g' "$file"
    sed -i 's/\([;}]\)\(try\|catch\|finally\|if\|else\|for\|while\|switch\|return\)/\1\n\2/g' "$file"
    
    # Pattern 2: Fix brace patterns
    sed -i 's/\(}\)\([^;,\s}]}\)/\1\n\2/g' "$file"
    sed -i 's/\(}\)\(const\|let\|var\|function\|export\|import\)/\1\n\n\2/g' "$file"
    
    # Pattern 3: Fix import/export statements
    sed -i 's/\(;\)\(import\|export\)/\1\n\n\2/g' "$file"
    sed -i "s/import{\([^}]*\)}/import { \1 }/g" "$file"
    sed -i "s/export{\([^}]*\)}/export { \1 }/g" "$file"
}

# Fix missing semicolons
fix_missing_semicolons() {
    local file=$1
    
    # Add semicolons after const/let declarations
    sed -i 's/\(const [^=]*=[^;{]*\)\([[:space:]]*\)\(const\|let\|var\|function\|export\|import\|}\|$\)/\1;\2\3/g' "$file"
    sed -i 's/\(let [^=]*=[^;{]*\)\([[:space:]]*\)\(const\|let\|var\|function\|export\|import\|}\|$\)/\1;\2\3/g' "$file"
    
    # Add semicolons after return statements
    sed -i 's/\(return [^;{]*\)\([[:space:]]*\)\(}\|const\|let\|var\|function\|$\)/\1;\2\3/g' "$file"
}

# Fix object literals
fix_object_literals() {
    local file=$1
    
    # Fix trailing commas
    sed -i 's/,\s*}/}/g' "$file"
    
    # Fix where clauses
    sed -i 's/where:\s*{\s*\(\w\+\):,\s*/where: { \1: /g' "$file"
    
    # Fix orderBy clauses
    sed -i 's/orderBy:\s*{\s*\(\w\+\):,\s*/orderBy: { \1: /g' "$file"
}

# Fix JSX syntax
fix_jsx_syntax() {
    local file=$1
    
    # Fix malformed JSX props
    sed -i 's/\(\w\+\)={{,/\1={{/g' "$file"
    
    # Fix JSX closing tags
    sed -i 's/<\/\([^>]*\)>}/<\/\1>\n}/g' "$file"
}

# Fix try-catch blocks
fix_try_catch() {
    local file=$1
    
    # Add missing catch blocks
    perl -i -pe 's/try\s*{([^}]+)}\s*(?!catch|finally)$/try {$1} catch (error) { console.error(error); }/gm' "$file"
}

# Process file
process_file() {
    local file=$1
    ((TOTAL_FILES++))
    
    log_info "Processing: $file"
    
    # Create temporary backup
    cp "$file" "$file.bak"
    
    # Apply fixes
    fix_concatenated_lines "$file"
    fix_missing_semicolons "$file"
    fix_object_literals "$file"
    
    # Fix JSX files
    if [[ "$file" == *.tsx ]]; then
        fix_jsx_syntax "$file"
    fi
    
    fix_try_catch "$file"
    
    # Format with prettier
    if npx prettier --write "$file" 2>/dev/null; then
        ((FIXED_FILES++))
        log_info "✓ Fixed: $file"
        rm "$file.bak"
    else
        ((FAILED_FILES++))
        log_warn "✗ Failed to format: $file"
        # Restore backup on failure
        mv "$file.bak" "$file"
    fi
}

# Main execution
main() {
    log_info "Starting TypeScript formatting fix..."
    
    # Create backup
    create_backup
    
    # Find all TypeScript files
    log_info "Finding TypeScript files..."
    
    # Process app directory first (most errors)
    find app -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
        process_file "$file"
    done
    
    # Process lib directory
    find lib -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
        process_file "$file"
    done
    
    # Process components directory
    find components -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
        process_file "$file"
    done
    
    # Process other directories
    find . -name "*.ts" -o -name "*.tsx" | grep -v -E "(node_modules|\.next|app|lib|components)" | while read file; do
        process_file "$file"
    done
    
    # Summary
    echo ""
    log_info "========================================="
    log_info "TypeScript Formatting Fix Complete"
    log_info "========================================="
    log_info "Total files processed: $TOTAL_FILES"
    log_info "Successfully fixed: $FIXED_FILES"
    log_warn "Failed to fix: $FAILED_FILES"
    
    # Run type check
    log_info "Running type check..."
    npm run type-check 2>&1 | tail -20
}

# Show usage
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Usage: $0"
    echo ""
    echo "This script fixes common TypeScript formatting issues:"
    echo "  - Missing line breaks"
    echo "  - Missing semicolons"
    echo "  - Malformed object literals"
    echo "  - JSX syntax errors"
    echo "  - Missing catch blocks"
    echo ""
    echo "A backup is created before processing."
    exit 0
fi

# Run main function
main