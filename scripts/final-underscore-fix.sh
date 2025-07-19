#\!/bin/bash

# Final comprehensive underscore syntax fix

echo "Running final comprehensive underscore syntax fix..."

# Fix all files, excluding node_modules
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | while read file; do
    if [ -f "$file" ]; then
        # Fix underscore numeric patterns
        sed -i 's/_1000/1000/g' "$file"
        sed -i 's/_2000/2000/g' "$file"
        sed -i 's/_500/500/g' "$file"
        sed -i 's/_200/200/g' "$file"
        sed -i 's/_100/100/g' "$file"
        sed -i 's/_10/10/g' "$file"
        sed -i 's/_5/5/g' "$file"
        sed -i 's/_3/3/g' "$file"
        sed -i 's/_1/1/g' "$file"
        sed -i 's/_0/0/g' "$file"
        
        # Fix underscore negation patterns
        sed -i 's/_\!/\!/g' "$file"
        
        # Fix underscore variable patterns in specific contexts
        sed -i 's/_SkillLevel/SkillLevel/g' "$file"
        sed -i 's/_CourseStatus/CourseStatus/g' "$file"
        sed -i 's/_UserRole/UserRole/g' "$file"
        
        # Fix COUNT(*) patterns
        sed -i 's/COUNT(_\*)/COUNT(*)/g' "$file"
        sed -i 's/COUNT( _\*)/COUNT(*)/g' "$file"
        
        # Fix Math calculation patterns with underscores
        sed -i 's/_totalTime/totalTime/g' "$file"
        sed -i 's/_daysDiff/daysDiff/g' "$file"
        sed -i 's/_now/now/g' "$file"
        sed -i 's/_date/date/g' "$file"
        
        # Fix time number patterns
        sed -i 's/setHours(, 0, 0, 0)/setHours(0, 0, 0, 0)/g' "$file"
        sed -i 's/setHours(3, 59, 59, 999)/setHours(23, 59, 59, 999)/g' "$file"
        
        # Fix progress patterns
        sed -i 's/_progress/progress/g' "$file"
        
        # Fix bcrypt compare calls
        sed -i 's/bcrypt\.compare( /bcrypt.compare(/g' "$file"
        
        # Fix record request patterns
        sed -i 's/recordRequest( /recordRequest(/g' "$file"
        
        # Fix successResponse patterns
        sed -i 's/successResponse( /successResponse(/g' "$file"
        
        # Fix specific patterns from database health check
        sed -i 's/information_schema/information_schema/g' "$file"
        
        # Fix specific endpoint patterns
        sed -i 's/export async function GET( /export async function GET(/g' "$file"
        
        # Fix projectId_userId patterns (Prisma composite keys)
        sed -i 's/projectId_userId/projectId_userId/g' "$file"
        
        # Fix specific calculation patterns
        sed -i 's/( this\.errorCount \/ Math\.max(this\.requestCount, 1)) \* 100/(this.errorCount \/ Math.max(this.requestCount, 1)) * 100/g' "$file"
        
        # Fix time division patterns
        sed -i 's/\/ (_1000 \* 60)/ \/ (1000 * 60)/g' "$file"
        sed -i 's/\/ (_1000 \* 60 \* 60)/ \/ (1000 * 60 * 60)/g' "$file"
    fi
done

echo "Checking remaining errors..."
npm run lint 2>&1 | grep "Error:" | wc -l
