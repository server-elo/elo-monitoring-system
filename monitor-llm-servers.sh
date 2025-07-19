#!/bin/bash

# Monitor LLM servers status
echo "🔍 LLM Server Monitor"
echo "===================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check server status
check_server() {
    local name=$1
    local port=$2
    local expected_model=$3
    
    echo -e "\n${BLUE}🖥️  $name (Port $port)${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check if port is listening
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Port $port is active${NC}"
        
        # Check if it's responding to HTTP
        if curl -s -m 3 http://localhost:$port/v1/models > /dev/null 2>&1; then
            echo -e "${GREEN}✅ HTTP API responding${NC}"
            
            # Get model info
            models=$(curl -s -m 3 http://localhost:$port/v1/models 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    models = [m['id'] for m in data.get('data', [])]
    print(', '.join(models) if models else 'No models found')
except:
    print('Could not parse models')
" 2>/dev/null)
            
            if [ ! -z "$models" ] && [ "$models" != "Could not parse models" ]; then
                echo -e "${GREEN}✅ Models: $models${NC}"
                
                # Quick test request
                response=$(curl -s -m 5 -X POST http://localhost:$port/v1/chat/completions \
                    -H "Content-Type: application/json" \
                    -d '{"model":"'"$expected_model"'","messages":[{"role":"user","content":"Hi"}],"max_tokens":10}' 2>/dev/null)
                
                if echo "$response" | grep -q "choices"; then
                    echo -e "${GREEN}✅ Chat completion working${NC}"
                else
                    echo -e "${YELLOW}⚠️  Chat completion issues${NC}"
                fi
            else
                echo -e "${YELLOW}⚠️  No models loaded${NC}"
            fi
        else
            echo -e "${RED}❌ HTTP API not responding${NC}"
        fi
    else
        echo -e "${RED}❌ Port $port not listening${NC}"
    fi
}

# Check all servers
check_server "CodeLlama 34B" "1234" "codellama-34b-instruct"
check_server "Mixtral 8x7B" "1235" "mixtral-8x7b-instruct"
check_server "Llama 3.1 8B" "1236" "llama-3.1-8b-instruct"

# Summary
echo -e "\n${YELLOW}📊 System Summary${NC}"
echo "═══════════════════════════════════════════════════"

# Memory usage
echo -e "${BLUE}Memory Usage:${NC}"
ps aux | grep lm-studio | grep -v grep | awk '{sum+=$6} END {printf "LM Studio processes: %.1f GB\n", sum/1024/1024}'

# Active ports
echo -e "\n${BLUE}Active LLM Ports:${NC}"
for port in 1234 1235 1236; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $port${NC}"
    else
        echo -e "${RED}❌ $port${NC}"
    fi
done

# Quick recommendations
echo -e "\n${YELLOW}💡 Quick Actions:${NC}"
if ! lsof -i :1234 > /dev/null 2>&1; then
    echo "• Start CodeLlama server on port 1234 in LM Studio"
fi
if ! lsof -i :1235 > /dev/null 2>&1; then
    echo "• Start Mixtral server on port 1235 (new LM Studio instance)"
fi
if ! lsof -i :1236 > /dev/null 2>&1; then
    echo "• Start Llama 3.1 server on port 1236 (new LM Studio instance)"
fi

echo -e "\n${GREEN}Run this script anytime: ./monitor-llm-servers.sh${NC}"
