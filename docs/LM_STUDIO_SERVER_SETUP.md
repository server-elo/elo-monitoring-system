# 🚀 LM Studio Server Setup Guide

## Quick Setup for Your 3 LLMs

You have LM Studio running with 3 models loaded. Now you need to start the server APIs:

### Step 1: Start the First Server (CodeLlama 34B)
1. In LM Studio, go to **"Local Server"** tab (🖥️ icon)
2. Select **CodeLlama 34B** model from dropdown
3. Set port to **1234**
4. Click **"Start Server"**
5. Wait for "Server running" message

### Step 2: Start Additional Servers
Since LM Studio can only run one server at a time in the GUI, you have 2 options:

#### Option A: Multiple LM Studio Instances (Recommended)
1. Open 2 more LM Studio windows:
   ```bash
   # Terminal 1
   /opt/LMStudio/LM_Studio.AppImage --no-sandbox &
   
   # Terminal 2  
   /opt/LMStudio/LM_Studio.AppImage --no-sandbox &
   ```

2. In each new instance:
   - Load your Mixtral 8x7B → Start server on port **1235**
   - Load your Llama 3.1 8B → Start server on port **1236**

#### Option B: Switch Models (Simpler, but one at a time)
- Use one LM Studio instance
- Switch models as needed in the Local Server tab
- All on port 1234

### Step 3: Verify Servers Are Running
Run our test script:
```bash
cd /home/elo/learning_solidity/learning_sol
./test-llm-setup.sh
```

## Expected Server Configuration

| Model | Port | Best For |
|-------|------|----------|
| CodeLlama 34B | 1234 | Solidity code generation |
| Mixtral 8x7B | 1235 | Explanations & tutorials |
| Llama 3.1 8B | 1236 | Quick Q&A |

## Troubleshooting

### If servers won't start:
1. **Memory check**: Each 34B model needs ~20GB RAM
2. **Port conflicts**: Make sure ports 1234-1236 are free
3. **Model loading**: Wait for models to fully load before starting servers

### Check if server is working:
```bash
# Test individual server
curl http://localhost:1234/v1/models

# Test chat completion
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"codellama-34b-instruct","messages":[{"role":"user","content":"Hello"}],"max_tokens":50}'
```

## Alternative: Single Server Setup
If running 3 servers uses too much RAM, start with just one:

1. Use **CodeLlama 34B** on port **1234** 
2. Your platform will automatically fall back to this single model
3. Add more servers later as needed

## Next Steps
Once servers are running:
1. ✅ Run `./test-llm-setup.sh` 
2. ✅ Update `.env.local` with server URLs
3. ✅ Test integration with your Solidity platform

---
*Your servers should use ~60-80GB RAM total when all 3 are running*
