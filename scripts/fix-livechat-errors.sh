#\!/bin/bash

# Fix LiveChatSystem.tsx underscore syntax errors
FILE="components/collaboration/LiveChatSystem.tsx"

# Fix all _null references
sed -i 's/_null/null/g' "$FILE"

# Fix all _false references  
sed -i 's/_false/false/g' "$FILE"

# Fix function calls with underscores
sed -i 's/useAuth(_)/useAuth()/g' "$FILE"
sed -i 's/useToast(_)/useToast()/g' "$FILE"
sed -i 's/useSocket(_)/useSocket()/g' "$FILE"

# Fix timestamp references
sed -i 's/Date\.now(_)/Date.now()/g' "$FILE"

# Fix localStorage references
sed -i 's/_localStorage/localStorage/g' "$FILE"

# Fix template literals
sed -i 's/console\.log(_`/console.log(`/g' "$FILE"

# Fix variable name references
sed -i 's/_response\.ok/response.ok/g' "$FILE"
sed -i 's/_msg\.id/msg.id/g' "$FILE"
sed -i 's/_error)/error)/g' "$FILE"
sed -i 's/_reactionData/reactionData/g' "$FILE"
sed -i 's/_optionData/optionData/g' "$FILE"
sed -i 's/_mentionData/mentionData/g' "$FILE"
sed -i 's/_messageId/messageId/g' "$FILE"
sed -i 's/_transformedMessages/transformedMessages/g' "$FILE"
sed -i 's/_value/value/g' "$FILE"
sed -i 's/_true/true/g' "$FILE"
sed -i 's/_typingTimeoutRef/typingTimeoutRef/g' "$FILE"
sed -i 's/_prev =>/prev =>/g' "$FILE"
sed -i 's/_e:/e:/g' "$FILE"
sed -i 's/_messageFilter/messageFilter/g' "$FILE"
sed -i 's/_searchQuery/searchQuery/g' "$FILE"
sed -i 's/_timestamp/timestamp/g' "$FILE"
sed -i 's/_diff/diff/g' "$FILE"
sed -i 's/_minutes/minutes/g' "$FILE"
sed -i 's/_hours/hours/g' "$FILE"
sed -i 's/_0/0/g' "$FILE"
sed -i 's/_message\./message./g' "$FILE"
sed -i 's/_acc\[/acc[/g' "$FILE"
sed -i 's/_showEmojiPicker/showEmojiPicker/g' "$FILE"

# Fix function calls with spaces
sed -i 's/sendMessage( /sendMessage(/g' "$FILE"
sed -i 's/socket\.emit( /socket.emit(/g' "$FILE"
sed -i 's/JSON\.stringify( {/JSON.stringify({/g' "$FILE"
sed -i 's/handleReaction( /handleReaction(/g' "$FILE"
sed -i 's/handleMessageReaction( /handleMessageReaction(/g' "$FILE"
sed -i 's/handleUserMention(_/handleUserMention(/g' "$FILE"
sed -i 's/handleDeleteMessage(_/handleDeleteMessage(/g' "$FILE"
sed -i 's/handlePinMessage(_/handlePinMessage(/g' "$FILE"
sed -i 's/handleMessageOptions(_/handleMessageOptions(/g' "$FILE"

# Fix arrow functions and event handlers
sed -i 's/onClick={(_)/onClick={() =>/g' "$FILE"
sed -i 's/onChange={(_e)/onChange={(e)/g' "$FILE"
sed -i 's/onClick={() => handleUserMention(message\.userId)/onClick={() => handleUserMention(message.userId)}/g' "$FILE"

# Fix preventDefault and focus calls
sed -i 's/preventDefault(_)/preventDefault()/g' "$FILE"
sed -i 's/focus(_)/focus()/g' "$FILE"
sed -i 's/trim(_)/trim()/g' "$FILE"
sed -i 's/charAt(_/charAt(/g' "$FILE"

# Fix handleEditMessage and handleSendMessage calls
sed -i 's/handleEditMessage(_)/handleEditMessage()/g' "$FILE"
sed -i 's/handleSendMessage(_)/handleSendMessage()/g' "$FILE"

# Fix formatTimestamp calls
sed -i 's/formatTimestamp(_/formatTimestamp(/g' "$FILE"

# Fix edited text
sed -i 's/(_edited)/(edited)/g' "$FILE"

# Fix array methods
sed -i 's/\.reduce( (/.reduce((/g' "$FILE"
sed -i 's/\.map( (\[/.map(([/g' "$FILE"

echo "Fixed LiveChatSystem.tsx underscore syntax errors"
