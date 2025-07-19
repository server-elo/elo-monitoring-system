#\!/bin/bash

# Fix remaining TypeScript parsing errors

echo "Fixing remaining TypeScript errors..."

# Fix specific files with known issues
echo "Fixing specific file issues..."

# Fix spacing issues in function calls and method calls
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/handleReaction( /handleReaction(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/handleMessageReaction( /handleMessageReaction(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/socket\.emit( /socket.emit(/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/JSON\.stringify( {/JSON.stringify({/g'

# Fix underscore-prefixed variables and function parameters
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const handleMessageReaction = useCallback( (/const handleMessageReaction = useCallback((/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const handlePinMessage = async ( /const handlePinMessage = async (/g'
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const handleDeleteMessage = async ( /const handleDeleteMessage = async (/g'

# Fix async function parameters with underscores
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/async ( /async (/g'

# Count errors after fixes
echo "Checking remaining errors..."
npm run lint 2>&1 | grep "Error:" | wc -l
