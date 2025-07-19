#!/bin/bash

# Test script for your 3 LLM services
echo "🧪 Testing your LLM setup..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_llm() {
    local name=$1
    local port=$2
    local model=$3
    local prompt=$4
    
    echo -e "\n${YELLOW}Testing $name (Port $port)...${NC}"
    
    # Test health first
    if curl -s "http://localhost:$port/v1/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${RED}❌ Health check failed${NC}"
        return 1
    fi
    
    # Test chat completion
    response=$(curl -s -X POST "http://localhost:$port/v1/chat/completions" \
        -H "Content-Type: application/json" \
        -d "{
            \"model\": \"$model\",
            \"messages\": [{\"role\": \"user\", \"content\": \"$prompt\"}],
            \"max_tokens\": 100
        }" 2>/dev/null)
    
    if echo "$response" | grep -q "choices"; then
        echo -e "${GREEN}✅ Chat completion working${NC}"
        # Extract and show first few words of response
        content=$(echo "$response" | python3 -c "import sys, json; print(json.load(sys.stdin)['choices'][0]['message']['content'][:100] + '...')" 2>/dev/null || echo "Response received")
        echo -e "${GREEN}Response preview: $content${NC}"
    else
        echo -e "${RED}❌ Chat completion failed${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Test all your LLMs
echo "Testing your 3 LLM setup..."

# Test CodeLlama 34B (Port 1234)
test_llm "CodeLlama 34B" "1234" "codellama-34b-instruct" "Write a simple Solidity function"

# Test Mixtral 8x7B (Port 1235)  
test_llm "Mixtral 8x7B" "1235" "mixtral-8x7b-instruct" "Explain what blockchain is"

# Test Llama 3.1 8B (Port 1236)
test_llm "Llama 3.1 8B" "1236" "llama-3.1-8b-instruct" "What is DeFi?"

echo -e "\n${GREEN}🎉 LLM testing complete!${NC}"

# Performance summary
echo -e "\n${YELLOW}📊 Performance Summary:${NC}"
echo "CodeLlama 34B (1234): Best for Solidity code generation"
echo "Mixtral 8x7B (1235): Best for explanations and tutorials"  
echo "Llama 3.1 8B (1236): Best for quick answers"

echo -e "\n${YELLOW}🔧 Next steps:${NC}"
echo "1. Add environment variables to your .env.local:"
echo "   CODE_LLM_URL=http://localhost:1234/v1"
echo "   CHAT_LLM_URL=http://localhost:1235/v1" 
echo "   FAST_LLM_URL=http://localhost:1236/v1"
echo ""
echo "2. Your platform will automatically route requests:"
echo "   - Solidity code → CodeLlama 34B"
echo "   - General questions → Mixtral 8x7B"
echo "   - Quick answers → Llama 3.1 8B"
