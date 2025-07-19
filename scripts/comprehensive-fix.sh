#!/bin/bash

echo "Running comprehensive syntax fixes..."

# Count initial errors
INITIAL_ERRORS=$(npm run lint 2>&1 | grep "Error:" | wc -l)
echo "Initial error count: $INITIAL_ERRORS"

# Fix common patterns in all TypeScript/TSX files
echo "Fixing syntax patterns..."

# Pattern 1: Fix function parameters with underscores
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/function \([a-zA-Z0-9_]*\)(_)/function \1()/g' \
    -e 's/async (_)/async ()/g' \
    -e 's/\.map(_(/\.map((/g' \
    -e 's/\.filter(_(/\.filter((/g' \
    -e 's/\.find(_(/\.find((/g' \
    -e 's/\.forEach(_(/\.forEach((/g' \
    -e 's/\.reduce(_(/\.reduce((/g' \
    -e 's/\.some(_(/\.some((/g' \
    -e 's/export default function \([a-zA-Z0-9_]*\)(_)/export default function \1()/g' \
    {} \;

# Pattern 2: Fix more underscore patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/_!/!/g' \
    -e 's/__/ /g' \
    -e 's/_(/(/g' \
    -e 's/)_/)/g' \
    -e 's/,_/,/g' \
    -e 's/_(//g' \
    -e 's/_\[/[/g' \
    -e 's/\]_/]/g' \
    -e 's/_\./\./g' \
    -e 's/\._/\./g' \
    -e 's/_</</g' \
    -e 's/>_/>/g' \
    -e 's/_"/"/g' \
    -e "s/_'/'/g" \
    {} \;

# Pattern 3: Fix template literal issues
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/console\.log( /console.log(/g' \
    -e 's/console\.error( /console.error(/g' \
    -e 's/console\.warn( /console.warn(/g' \
    -e 's/Date\.now( )/Date.now()/g' \
    -e 's/Math\.random( )/Math.random()/g' \
    -e 's/\.toLowerCase( )/\.toLowerCase()/g' \
    -e 's/\.toUpperCase( )/\.toUpperCase()/g' \
    -e 's/\.toISOString( )/\.toISOString()/g' \
    -e 's/\.toLocaleDateString( )/\.toLocaleDateString()/g' \
    {} \;

# Pattern 4: Fix useState and other hook patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/useState( /useState(/g' \
    -e 's/useEffect( /useEffect(/g' \
    -e 's/useRouter( )/useRouter()/g' \
    -e 's/useSearchParams( )/useSearchParams()/g' \
    -e 's/SessionManager\.getInstance( )/SessionManager.getInstance()/g' \
    {} \;

# Pattern 5: Fix specific API patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/export async function GET(_)/export async function GET(request: NextRequest)/g' \
    -e 's/export async function POST(_)/export async function POST(request: NextRequest)/g' \
    -e 's/export async function PUT(_)/export async function PUT(request: NextRequest)/g' \
    -e 's/export async function DELETE(_)/export async function DELETE(request: NextRequest)/g' \
    -e 's/export async function OPTIONS(_)/export async function OPTIONS()/g' \
    {} \;

# Pattern 6: Fix auth patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/authEndpoint( async/authEndpoint(async/g' \
    -e 's/adminEndpoint( async/adminEndpoint(async/g' \
    -e 's/protectedEndpoint( async/protectedEndpoint(async/g' \
    -e 's/publicEndpoint( async/publicEndpoint(async/g' \
    {} \;

# Pattern 7: Fix Zod schema patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/z\.string( )/z.string()/g' \
    -e 's/z\.number( )/z.number()/g' \
    -e 's/z\.boolean( )/z.boolean()/g' \
    -e 's/z\.array( /z.array(/g' \
    -e 's/z\.object( /z.object(/g' \
    -e 's/\.email( )/\.email()/g' \
    -e 's/\.min( /\.min(/g' \
    -e 's/\.max( /\.max(/g' \
    -e 's/\.int( )/\.int()/g' \
    -e 's/\.default( /\.default(/g' \
    -e 's/\.optional( )/\.optional()/g' \
    {} \;

# Pattern 8: Fix promise patterns
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "./node_modules/*" -not -path "./.next/*" -exec sed -i \
    -e 's/new Promise( /new Promise(/g' \
    -e 's/\.slice( /\.slice(/g' \
    -e 's/uuidv4( )/uuidv4()/g' \
    -e 's/\.replace( /\.replace(/g' \
    {} \;

# Count final errors
FINAL_ERRORS=$(npm run lint 2>&1 | grep "Error:" | wc -l 2>/dev/null || echo "0")
echo "Final error count: $FINAL_ERRORS"
echo "Fixed $((INITIAL_ERRORS - FINAL_ERRORS)) errors"