#!/bin/bash

echo "Fixing remaining specific errors..."

# Fix NextResponse.json patterns with underscore
find app/api -name "*.ts" -type f | while read file; do
    # Fix NextResponse.json(_{ patterns
    sed -i 's/NextResponse\.json(_\({[^}]*}\)/NextResponse.json(\1/g' "$file"
    
    # Fix logger patterns
    sed -i 's/logger\.error(\([^,]*\), error as Error);/logger.error(\1, error as Error);/g' "$file"
    
    # Fix new Date patterns
    sed -i 's/new Date(_)/new Date()/g' "$file"
    sed -i 's/Date\.now(_)/Date.now()/g' "$file"
    
    # Fix await request.json()
    sed -i 's/await _request\.json()/await request.json()/g' "$file"
    
    # Fix getServerSession calls
    sed -i 's/getServerSession(_)/getServerSession()/g' "$file"
    sed -i 's/getServerSession(_authOptions)/getServerSession(authOptions)/g' "$file"
    
    # Fix boolean values in function calls
    sed -i 's/z\.string(_)/z.string()/g' "$file"
    sed -i 's/z\.boolean(_)/z.boolean()/g' "$file"
    sed -i 's/\.optional(_)/\.optional()/g' "$file"
    
    # Fix switch patterns
    sed -i 's/switch (_\([a-zA-Z]\+\))/switch (\1)/g' "$file"
    
    # Fix for...of patterns
    sed -i 's/for (_const \([a-zA-Z]\+\) of/for (const \1 of/g' "$file"
    
    # Fix Math.random patterns  
    sed -i 's/_Math\.random()/Math.random()/g' "$file"
    
    # Fix filter patterns
    sed -i 's/filter(_\([a-zA-Z]\+\) =>/filter(\1 =>/g' "$file"
    
    # Fix SolidityCompiler.getInstance
    sed -i 's/SolidityCompiler\.getInstance(_)/SolidityCompiler.getInstance()/g' "$file"
    
    # Fix prisma patterns
    sed -i 's/\.safeParse(_\([a-zA-Z]\+\))/\.safeParse(\1)/g' "$file"
    
    # Fix validation patterns
    sed -i 's/_\([a-zA-Z]\+\)\.length/_1.length/g' "$file"
    
    # Fix arrow function underscore parameters
    sed -i 's/\.map(_(/\.map((/g' "$file"
    sed -i 's/\.filter(_(/\.filter((/g' "$file"
    sed -i 's/\.sort(_(/\.sort((/g' "$file"
    
    # Fix underscore followed by variable access
    sed -i 's/_\([a-zA-Z]\+\)\.\([a-zA-Z]\+\)/\1.\2/g' "$file"
    
    # Fix common variable patterns
    sed -i 's/_isLoading/isLoading/g' "$file"
    sed -i 's/_error/error/g' "$file"
    sed -i 's/_request/request/g' "$file"
    sed -i 's/_body/body/g' "$file"
    sed -i 's/_level/level/g' "$file"
    sed -i 's/_type/type/g' "$file"
    sed -i 's/_category/category/g' "$file"
    sed -i 's/_filter/filter/g' "$file"
    sed -i 's/_action/action/g' "$file"
    sed -i 's/_since/since/g' "$file"
    sed -i 's/_trend/trend/g' "$file"
    sed -i 's/_topic/topic/g' "$file"
    sed -i 's/_certificate/certificate/g' "$file"
    sed -i 's/_response/response/g' "$file"
    sed -i 's/_data/data/g' "$file"
    sed -i 's/_stats/stats/g' "$file"
    sed -i 's/_filters/filters/g' "$file"
    sed -i 's/_rateLimitResult/rateLimitResult/g' "$file"
    sed -i 's/_rateLimitConfigs/rateLimitConfigs/g' "$file"
    sed -i 's/_newTotal/newTotal/g' "$file"
    sed -i 's/_selectedCertificate/selectedCertificate/g' "$file"
    sed -i 's/_setSelectedCertificate/setSelectedCertificate/g' "$file"
    sed -i 's/_null/null/g' "$file"
    sed -i 's/_true/true/g' "$file"
    sed -i 's/_false/false/g' "$file"
    sed -i 's/_mockCertificates/mockCertificates/g' "$file"
    sed -i 's/_course/course/g' "$file"
    sed -i 's/_field/field/g' "$file"
    sed -i 's/_missingFields/missingFields/g' "$file"
    sed -i 's/_newCertificate/newCertificate/g' "$file"
    sed -i 's/_r\./r\./g' "$file"
    sed -i 's/_r\s/r /g' "$file"
    sed -i 's/_codeSnippets/codeSnippets/g' "$file"
    sed -i 's/_code\./code\./g' "$file"
    sed -i 's/_authOptions/authOptions/g' "$file"
    sed -i 's/_submissions/submissions/g' "$file"
    sed -i 's/_limitedTopics/limitedTopics/g' "$file"
    sed -i 's/_updatedTopics/updatedTopics/g' "$file"
    sed -i 's/_limitedMilestones/limitedMilestones/g' "$file"
    sed -i 's/_transformedCollaborations/transformedCollaborations/g' "$file"
    sed -i 's/_updatedCollaboration/updatedCollaboration/g' "$file"
    sed -i 's/_reactions/reactions/g' "$file"
    sed -i 's/_collaboration/collaboration/g' "$file"
    sed -i 's/_newTotal/newTotal/g' "$file"
    
    # Fix generateRequestId calls
    sed -i 's/generateRequestId(_)/generateRequestId()/g' "$file"
done

echo "Checking remaining errors..."
npm run lint 2>&1 | grep -c "Error:" || echo "0 errors found"