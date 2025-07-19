#\!/bin/bash

# Fix API route parsing errors - underscore syntax issues

echo "Fixing API route parsing errors..."

# Get files with parsing errors
FILES=$(npm run lint 2>&1 | grep -B1 "Error: Parsing error" | grep "\.ts" | sed 's/^.\///g')

for file in $FILES; do
    if [ -f "$file" ]; then
        echo "Fixing $file..."
        
        # Fix z.enum with space
        sed -i 's/z\.enum( \[/z.enum([/g' "$file"
        
        # Fix z.number with underscore
        sed -i 's/z\.number(_)/z.number()/g' "$file"
        
        # Fix regex with underscore prefix
        sed -i 's/\.regex(_\//\.regex(/g' "$file"
        
        # Fix function calls with space
        sed -i 's/\.json( {/.json({/g' "$file"
        sed -i 's/\.create( {/.create({/g' "$file"
        sed -i 's/\.update( {/.update({/g' "$file"
        sed -i 's/\.findUnique( {/.findUnique({/g' "$file"
        sed -i 's/\.findMany( {/.findMany({/g' "$file"
        sed -i 's/\.findFirst( {/.findFirst({/g' "$file"
        sed -i 's/\.delete( {/.delete({/g' "$file"
        sed -i 's/\.deleteMany( {/.deleteMany({/g' "$file"
        
        # Fix array map/filter with space
        sed -i 's/\.map( (/\.map((/g' "$file"
        sed -i 's/\.filter( (/\.filter((/g' "$file"
        sed -i 's/\.reduce( (/\.reduce((/g' "$file"
        sed -i 's/\.forEach( (/\.forEach((/g' "$file"
        
        # Fix object methods with space
        sed -i 's/Object\.keys( (/Object.keys((/g' "$file"
        sed -i 's/Object\.values( (/Object.values((/g' "$file"
        sed -i 's/Object\.entries( (/Object.entries((/g' "$file"
        
        # Fix JSON methods with space
        sed -i 's/JSON\.stringify( (/JSON.stringify((/g' "$file"
        sed -i 's/JSON\.parse( (/JSON.parse((/g' "$file"
        
        # Fix Math methods with space
        sed -i 's/Math\.floor( (/Math.floor((/g' "$file"
        sed -i 's/Math\.ceil( (/Math.ceil((/g' "$file"
        sed -i 's/Math\.round( (/Math.round((/g' "$file"
        sed -i 's/Math\.max( (/Math.max((/g' "$file"
        sed -i 's/Math\.min( (/Math.min((/g' "$file"
        sed -i 's/Math\.random( (/Math.random((/g' "$file"
        
        # Fix Date methods with space
        sed -i 's/Date\.now( (/Date.now((/g' "$file"
        sed -i 's/new Date( (/new Date((/g' "$file"
        
        # Fix console methods with space
        sed -i 's/console\.log( (/console.log((/g' "$file"
        sed -i 's/console\.error( (/console.error((/g' "$file"
        sed -i 's/console\.warn( (/console.warn((/g' "$file"
        
        # Fix generic function calls with spaces around parentheses
        sed -i 's/( {/({/g' "$file"
        sed -i 's/( \[/([/g' "$file"
        sed -i 's/( "/("/g' "$file"
        sed -i 's/( '"'"'/("'"'"'/g' "$file"
        sed -i 's/( [0-9]/(/g' "$file"
        sed -i 's/( true/(true/g' "$file"
        sed -i 's/( false/(false/g' "$file"
        sed -i 's/( null/(null/g' "$file"
        sed -i 's/( undefined/(undefined/g' "$file"
        
        # Fix common underscore variable issues
        sed -i 's/_) {/) {/g' "$file"
        sed -i 's/_) =>/() =>/g' "$file"
        sed -i 's/(_)/()/g' "$file"
        sed -i 's/( _/()/g' "$file"
        
        # Fix specific variable names with underscores
        sed -i 's/_error/error/g' "$file"
        sed -i 's/_response/response/g' "$file"
        sed -i 's/_data/data/g' "$file"
        sed -i 's/_result/result/g' "$file"
        sed -i 's/_user/user/g' "$file"
        sed -i 's/_request/request/g' "$file"
        sed -i 's/_session/session/g' "$file"
        sed -i 's/_body/body/g' "$file"
        sed -i 's/_params/params/g' "$file"
        sed -i 's/_query/query/g' "$file"
        
        # Fix Promise and async patterns
        sed -i 's/Promise\.all( (/Promise.all((/g' "$file"
        sed -i 's/Promise\.resolve( (/Promise.resolve((/g' "$file"
        sed -i 's/Promise\.reject( (/Promise.reject((/g' "$file"
        sed -i 's/await (/await(/g' "$file"
        
        # Fix specific patterns that might cause comma errors
        sed -i 's/,}/}/g' "$file"
        sed -i 's/,]/]/g' "$file"
        sed -i 's/,)/)/g' "$file"
        
        echo "Fixed $file"
    fi
done

echo "Done fixing API route parsing errors"
echo "Checking remaining errors..."
npm run lint 2>&1 | grep "Error:" | wc -l
