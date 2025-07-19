# 🔧 Local LLM Integration Guide

## Quick Setup Instructions

### 1. Download and Install LM Studio
```bash
# Download LM Studio (Linux) - Latest version
wget https://releases.lmstudio.ai/linux/x86/0.3.2/LM_Studio-0.3.2.AppImage
chmod +x LM_Studio-0.3.2.AppImage
./LM_Studio-0.3.2.AppImage

# Note: Your GTX 710 won't accelerate modern LLMs, so we'll use CPU-only mode
# This is actually better - your 80-thread Xeon setup will be much faster!
```

### 2. Download CPU-Optimized Models
In LM Studio interface:
1. Go to "Models" tab
2. **Primary Recommendation**: Search for `TheBloke/CodeLlama-34B-Instruct-GGUF`
   - **Exact file**: `codellama-34b-instruct.Q4_K_M.gguf` (~19GB)
   - **Full model name**: `TheBloke/CodeLlama-34B-Instruct-GGUF`
   - **Why better for you**: Faster inference on CPU, still excellent for code
3. **Alternative**: Search for `TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF`
   - **Exact file**: `mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf` (~26GB)
   - **Full model name**: `TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF`
   - **Why good**: Very fast inference, excellent general capabilities

### 3. Configure LM Studio Server (CPU-Optimized)
1. Load the model in LM Studio
2. Go to "Server" tab
3. **Critical CPU Settings**:
   - **Threads**: 60-70 (use most of your 80 threads)
   - **Context Length**: 4096 (faster than 8192)
   - **GPU Layers**: 0 (GTX 710 can't help with modern LLMs)
   - **Batch Size**: 128 (optimal for CPU inference)
   - **Memory Lock**: Enable (keeps model in RAM)
4. Start server on port 1234

### 4. Update Environment Variables
Add to your `.env.local`:
```bash
# Local LLM Configuration
LOCAL_LLM_URL=http://localhost:1234/v1
LOCAL_LLM_API_KEY=lm-studio-local
```

### 5. Test the Integration
```bash
# Test if LM Studio server is running
curl http://localhost:1234/v1/health

# Test chat completion
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codellama-34b-instruct",
    "messages": [{"role": "user", "content": "Write a simple Solidity contract"}],
    "max_tokens": 500
  }'
```

## 📊 Performance Expectations on Your CPU-Only Server

### CodeLlama 34B Performance (Recommended):
- **RAM Usage**: ~35-40GB (leaves plenty for your app)
- **Response Time**: 1-3 seconds (much faster than 70B)
- **Throughput**: 20-30 requests/minute
- **Quality**: 95% as good as 70B for code tasks
- **Your GTX 710**: Won't be used (and that's actually better!)

### Optimal CPU-Only Settings for Your Hardware:
```json
{
  "n_threads": 65,
  "context_length": 4096,
  "batch_size": 128,
  "temperature": 0.1,
  "top_p": 0.9,
  "repeat_penalty": 1.1,
  "memory_lock": true,
  "cpu_only": true
}
```

### Why CPU-Only is Better for You:
- **Your Xeon CPUs**: 80 threads of pure processing power
- **GPU Overhead**: GTX 710 would actually slow things down
- **RAM Advantage**: 610GB RAM >> GPU VRAM for large models
- **Reliability**: No GPU driver issues or CUDA complications

## 🚀 CPU Optimization Tips for Your Setup

### Why Your CPU Setup is Actually Superior:
- **GTX 710 Limitation**: Only 2GB VRAM, can't fit modern LLMs
- **CPU Advantage**: 80 threads >> any consumer GPU for large models
- **RAM Benefit**: 610GB system RAM >> GPU VRAM limitations
- **No Bottlenecks**: Direct memory access, no PCIe transfer delays

### Performance Optimization Commands:
```bash
# Set CPU governor to performance mode
sudo cpupower frequency-set -g performance

# Optimize memory settings for large models
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

# Set thread affinity for LM Studio (optional)
taskset -c 0-79 ./LM_Studio-0.3.2.AppImage
```

### Expected Response Times with CPU Optimization:
- **CodeLlama 34B**: 1-3 seconds (excellent for real-time coding help)
- **Mixtral 8x7B**: 0.5-1 seconds (perfect for quick Q&A)
- **Llama 3.1 8B**: 0.2-0.5 seconds (instant responses)

### Memory Layout Strategy:
```
Total RAM: 610GB
├── CodeLlama 34B: 35GB
├── Mixtral 8x7B: 26GB  
├── System Reserve: 49GB
└── Your Application: 500GB (plenty of room!)
```

## 🎯 CPU-Optimized Model Recommendations

### 🥇 **CodeLlama 34B** (~35GB RAM, 1-3 sec response)
```
Full name: TheBloke/CodeLlama-34B-Instruct-GGUF
Exact file: codellama-34b-instruct.Q4_K_M.gguf
Search in LM Studio: "CodeLlama 34B Instruct"
Best for: Solidity code generation and analysis
```

### 🥈 **Mixtral 8x7B** (~26GB RAM, <1 sec response) 
```
Full name: TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF
Exact file: mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf
Search in LM Studio: "Mixtral 8x7B Instruct"
Best for: Fast responses, general Q&A
```

### 🥉 **Llama 3.1 8B** (~8GB RAM, <0.5 sec response)
```
Full name: TheBloke/Meta-Llama-3.1-8B-Instruct-GGUF
Exact file: meta-llama-3.1-8b-instruct.Q4_K_M.gguf
Search in LM Studio: "Llama 3.1 8B Instruct"
Best for: Ultra-fast responses, simple tasks
```

### 💡 **Pro Tip**: Run Multiple Models Simultaneously!
With your 610GB RAM, you can run:
- CodeLlama 34B (35GB) for code tasks
- Mixtral 8x7B (26GB) for general chat  
- Total: 61GB, leaving 549GB for your application!

## 🔄 Running Multiple Models Simultaneously

### Method 1: Multiple LM Studio Instances (Recommended)

#### Setup Multiple Servers:
```bash
# Terminal 1: Start CodeLlama 34B on port 1234
./LM_Studio-0.3.2.AppImage
# In LM Studio: Load CodeLlama 34B, Server tab, Port: 1234

# Terminal 2: Start Mixtral 8x7B on port 1235  
./LM_Studio-0.3.2.AppImage
# In LM Studio: Load Mixtral 8x7B, Server tab, Port: 1235

# Terminal 3: Start Llama 3.1 8B on port 1236 (optional)
./LM_Studio-0.3.2.AppImage
# In LM Studio: Load Llama 3.1 8B, Server tab, Port: 1236
```

#### Environment Variables for Multiple Models:
```bash
# Add to your .env.local
# Code-focused LLM (CodeLlama 34B)
CODE_LLM_URL=http://localhost:1234/v1
CODE_LLM_API_KEY=lm-studio-code

# General Q&A LLM (Mixtral 8x7B)  
CHAT_LLM_URL=http://localhost:1235/v1
CHAT_LLM_API_KEY=lm-studio-chat

# Fast response LLM (Llama 3.1 8B)
FAST_LLM_URL=http://localhost:1236/v1
FAST_LLM_API_KEY=lm-studio-fast

# Fallback
GEMINI_API_KEY=your_existing_gemini_key
```

### Method 2: Docker Containers (Advanced)

#### Create docker-compose.yml:
```yaml
version: '3.8'
services:
  codellama:
    image: ollama/ollama
    ports:
      - "1234:11434"
    volumes:
      - ./models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    command: ollama serve
    
  mixtral:
    image: ollama/ollama  
    ports:
      - "1235:11434"
    volumes:
      - ./models:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0
    command: ollama serve
```

#### Start with Docker:
```bash
# Pull and run models
docker-compose up -d
docker exec codellama ollama pull codellama:34b-instruct
docker exec mixtral ollama pull mixtral:8x7b-instruct
```

### Method 3: Load Balancer Approach

#### Smart AI Router Service:
```typescript
// lib/ai/AIRouter.ts
export class AIRouter {
  private services = {
    code: { url: 'http://localhost:1234/v1', model: 'codellama-34b' },
    chat: { url: 'http://localhost:1235/v1', model: 'mixtral-8x7b' },
    fast: { url: 'http://localhost:1236/v1', model: 'llama-3.1-8b' }
  };

  async routeRequest(prompt: string, context?: string): Promise<string> {
    // Determine best model based on request type
    const service = this.selectBestService(prompt, context);
    
    try {
      return await this.callService(service, prompt, context);
    } catch (error) {
      // Auto-fallback to other services
      return await this.fallbackRequest(prompt, context);
    }
  }

  private selectBestService(prompt: string, context?: string): string {
    // Code-related tasks -> CodeLlama
    if (this.isCodeRelated(prompt, context)) return 'code';
    
    // Quick questions -> Fast model  
    if (prompt.length < 100) return 'fast';
    
    // Default to general chat model
    return 'chat';
  }

  private isCodeRelated(prompt: string, context?: string): boolean {
    const codeKeywords = ['solidity', 'contract', 'function', 'debug', 'compile', 'deploy'];
    const text = (prompt + ' ' + (context || '')).toLowerCase();
    return codeKeywords.some(keyword => text.includes(keyword));
  }
}
```

### Resource Allocation Strategy:

#### CPU Thread Distribution:
```bash
# CodeLlama 34B: 40 threads (primary model)
taskset -c 0-39 ./LM_Studio-CodeLlama.AppImage

# Mixtral 8x7B: 25 threads (secondary)  
taskset -c 40-64 ./LM_Studio-Mixtral.AppImage

# Llama 3.1 8B: 15 threads (fast responses)
taskset -c 65-79 ./LM_Studio-Fast.AppImage
```

#### Memory Layout:
```
Total RAM: 610GB
├── CodeLlama 34B: 35GB (Port 1234)
├── Mixtral 8x7B: 26GB (Port 1235)  
├── Llama 3.1 8B: 8GB (Port 1236)
├── System + Cache: 41GB
└── Your Application: 500GB
```

### Automated Startup Script:

#### Create start-llm-services.sh:
```bash
#!/bin/bash
# Start multiple LLM services

# Function to start LM Studio with specific model
start_llm_service() {
    local model=$1
    local port=$2
    local threads=$3
    
    echo "Starting $model on port $port with $threads threads..."
    
    # Start LM Studio in background
    taskset -c $threads ./LM_Studio-0.3.2.AppImage \
        --server-port $port \
        --model $model \
        --threads $(echo $threads | tr '-' ' ' | awk '{print $2-$1+1}') &
        
    sleep 5
}

# Start services
start_llm_service "codellama-34b-instruct" 1234 "0-39"
start_llm_service "mixtral-8x7b-instruct" 1235 "40-64" 
start_llm_service "llama-3.1-8b-instruct" 1236 "65-79"

echo "All LLM services started!"
echo "CodeLlama: http://localhost:1234"
echo "Mixtral: http://localhost:1235" 
echo "Llama 3.1: http://localhost:1236"
```

#### Make executable and run:
```bash
chmod +x start-llm-services.sh
./start-llm-services.sh
```

### Testing Multiple Services:

```bash
# Test CodeLlama (code tasks)
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"codellama-34b", "messages":[{"role":"user","content":"Write a Solidity ERC20 contract"}]}'

# Test Mixtral (general chat)
curl -X POST http://localhost:1235/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mixtral-8x7b", "messages":[{"role":"user","content":"Explain blockchain basics"}]}'

# Test Llama 3.1 (quick responses)
curl -X POST http://localhost:1236/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.1-8b", "messages":[{"role":"user","content":"What is DeFi?"}]}'
```

## 📋 Complete LLM Model Names Reference

### Code-Specialized Models:
```
1. TheBloke/CodeLlama-34B-Instruct-GGUF
   File: codellama-34b-instruct.Q4_K_M.gguf (19GB)
   Use: Primary code generation and analysis

2. TheBloke/CodeLlama-13B-Instruct-GGUF  
   File: codellama-13b-instruct.Q4_K_M.gguf (7GB)
   Use: Lighter code model for faster responses

3. TheBloke/CodeLlama-7B-Instruct-GGUF
   File: codellama-7b-instruct.Q4_K_M.gguf (4GB)
   Use: Ultra-fast code assistance
```

### General-Purpose Models:
```
1. TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF
   File: mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf (26GB)
   Use: Best balance of speed and capability

2. TheBloke/Meta-Llama-3.1-8B-Instruct-GGUF
   File: meta-llama-3.1-8b-instruct.Q4_K_M.gguf (8GB)
   Use: Latest Meta model, excellent reasoning

3. TheBloke/Llama-2-13B-Chat-GGUF
   File: llama-2-13b-chat.Q4_K_M.gguf (7GB)
   Use: Stable, well-tested general model
```

### High-Performance Models (if you want more power):
```
1. TheBloke/CodeLlama-70B-Instruct-GGUF
   File: codellama-70b-instruct.Q4_K_M.gguf (38GB)
   Use: Maximum code quality, slower responses

2. TheBloke/Meta-Llama-3.1-70B-Instruct-GGUF
   File: meta-llama-3.1-70b-instruct.Q4_K_M.gguf (40GB)
   Use: Best reasoning, slower responses

3. TheBloke/Mixtral-8x22B-Instruct-v0.1-GGUF
   File: mixtral-8x22b-instruct-v0.1.Q4_K_M.gguf (87GB)
   Use: Highest capability, requires more resources
```

### Specialized Models:
```
1. TheBloke/deepseek-coder-33b-instruct-GGUF
   File: deepseek-coder-33b-instruct.Q4_K_M.gguf (18GB)
   Use: Alternative code specialist

2. TheBloke/WizardCoder-15B-V1.0-GGUF
   File: wizardcoder-15b-v1.0.Q4_K_M.gguf (8GB)
   Use: Another coding specialist option

3. TheBloke/openchat-3.5-1210-GGUF
   File: openchat-3.5-1210.Q4_K_M.gguf (7GB)
   Use: Fast, chat-optimized model
```

### How to Search in LM Studio:
1. **Method 1**: Copy the full name (e.g., `TheBloke/CodeLlama-34B-Instruct-GGUF`)
2. **Method 2**: Search by keywords (e.g., "CodeLlama 34B")
3. **Method 3**: Browse by publisher (search "TheBloke" and filter)

### Recommended Combinations for Your Server:

#### **Starter Setup** (61GB total):
- CodeLlama 34B (19GB) + Mixtral 8x7B (26GB) + Llama 3.1 8B (8GB)

#### **Balanced Setup** (45GB total):
- CodeLlama 34B (19GB) + Llama 3.1 8B (8GB) + CodeLlama 13B (7GB)

#### **Performance Setup** (105GB total):
- CodeLlama 70B (38GB) + Mixtral 8x7B (26GB) + Multiple smaller models

#### **Speed Setup** (41GB total):
- CodeLlama 13B (7GB) + Mixtral 8x7B (26GB) + Llama 3.1 8B (8GB)
