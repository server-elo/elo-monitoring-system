# 🤖 AI Integration Setup Guide

## 📋 Overview

This guide covers the complete setup of AI services for the Solidity Learning Platform, including local LLM integration with LM Studio and cloud-based Gemini Pro fallback.

## 🎯 AI Architecture

### **Dual LLM System**
- **Primary**: Local CodeLlama 34B (localhost:1234)
- **Fallback**: Google Gemini Pro (cloud)
- **Smart Routing**: Automatic failover and load balancing
- **Performance Target**: <5s local, <10s cloud (targeting <2s)

## 🔧 Local LLM Setup (LM Studio)

### **System Requirements**
- **RAM**: 32GB+ (recommended 64GB+)
- **CPU**: Multi-core processor (8+ cores recommended)
- **Storage**: 50GB+ free space for models
- **GPU**: Optional (CUDA-compatible for acceleration)

### **1. Install LM Studio**

**Linux:**
```bash
# Download LM Studio AppImage
wget https://releases.lmstudio.ai/linux/x86/0.3.2/LM_Studio-0.3.2.AppImage
chmod +x LM_Studio-0.3.2.AppImage
./LM_Studio-0.3.2.AppImage
```

**macOS:**
```bash
# Download from https://lmstudio.ai/
# Install via DMG file
```

**Windows:**
```bash
# Download installer from https://lmstudio.ai/
# Run the installer executable
```

### **2. Download Recommended Models**

**Primary Choice: CodeLlama 34B Instruct**
- **Model**: `TheBloke/CodeLlama-34B-Instruct-GGUF`
- **File**: `codellama-34b-instruct.Q4_K_M.gguf` (~19GB)
- **Best for**: Solidity code generation, debugging, optimization
- **Context**: 4K tokens (perfect for smart contracts)

**Alternative: Mixtral 8x7B Instruct**
- **Model**: `TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF`
- **File**: `mixtral-8x7b-instruct-v0.1.Q4_K_M.gguf` (~26GB)
- **Best for**: Fast inference, general programming help
- **Context**: 32K tokens (excellent for large codebases)

### **3. Configure LM Studio Server**

**Optimal Settings:**
```
Server Port: 1234
Context Length: 4096 (CodeLlama) / 8192 (Mixtral)
GPU Layers: Auto-detect or 0 for CPU-only
Threads: 70-80% of available CPU cores
Batch Size: 128 (CPU) / 512 (GPU)
Temperature: 0.1 (for code) / 0.7 (for explanations)
```

**CPU-Optimized Configuration:**
- **Threads**: Use 60-70% of available cores
- **Memory Lock**: Enable to keep model in RAM
- **Batch Size**: 128 for optimal CPU inference
- **GPU Layers**: 0 if using older GPU

### **4. Start LM Studio Server**
1. Load your chosen model in LM Studio
2. Go to "Server" tab
3. Configure settings as above
4. Click "Start Server"
5. Verify server is running at `http://localhost:1234`

## ☁️ Cloud AI Setup (Gemini Pro)

### **1. Get Google AI API Key**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create new API key
4. Copy the key for environment variables

### **2. Alternative: OpenAI Setup**
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy for environment variables

## 🔐 Environment Configuration

### **Required Environment Variables**

Create or update `.env.local`:

```bash
# Local LLM Configuration
LOCAL_LLM_URL=http://localhost:1234/v1
LOCAL_LLM_API_KEY=lm-studio-local
LOCAL_LLM_MODEL=codellama-34b-instruct
LOCAL_LLM_TIMEOUT=120000

# Google Gemini Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here

# OpenAI Configuration (Alternative)
OPENAI_API_KEY=your-openai-api-key-here

# AI Service Configuration
AI_PRIMARY_SERVICE=local
AI_FALLBACK_SERVICE=gemini
AI_RESPONSE_TIMEOUT=30000
AI_MAX_RETRIES=3
```

## 🧪 Testing AI Integration

### **1. Test Local LLM**
```bash
# Test LM Studio server health
curl http://localhost:1234/v1/health

# Test model inference
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codellama-34b-instruct",
    "messages": [{"role": "user", "content": "Write a simple Solidity contract"}],
    "temperature": 0.1,
    "max_tokens": 500
  }'
```

### **2. Test Platform Integration**
```bash
# Start your development server
npm run dev

# Visit the AI test endpoint
curl http://localhost:3000/api/test-llm

# Test through the UI
# Go to /code and try the AI assistant
```

### **3. Performance Testing**
```bash
# Run the built-in performance test
curl http://localhost:3000/api/performance

# Check AI response times in browser dev tools
# Target: <5s local LLM, <10s Gemini fallback
```

## ⚡ Performance Optimization

### **Local LLM Optimization**
- **Model Selection**: Use Q4_K_M quantization for best speed/quality balance
- **Context Management**: Keep context under 4K tokens for faster responses
- **Batch Processing**: Process multiple requests together when possible
- **Memory Management**: Ensure sufficient RAM for model + application

### **Response Time Targets**
- **Local LLM**: <5 seconds (targeting <2 seconds)
- **Gemini Fallback**: <10 seconds (targeting <5 seconds)
- **Database Queries**: <100ms
- **Total Response**: <15 seconds maximum

### **Monitoring & Health Checks**
- **Health Endpoint**: `/api/ai/health` - Check AI service status
- **Performance Metrics**: Built-in response time tracking
- **Automatic Failover**: Switches to Gemini if local LLM fails
- **Rate Limiting**: Prevents overload of AI services

## 🚨 Troubleshooting

### **Common Issues**

**Local LLM Not Responding:**
```bash
# Check if LM Studio server is running
curl http://localhost:1234/v1/health

# Restart LM Studio server
# Check firewall settings
# Verify model is loaded
```

**Slow Response Times:**
- Reduce context length
- Use smaller model (CodeLlama 13B instead of 34B)
- Increase CPU threads allocation
- Check available RAM

**Gemini API Errors:**
- Verify API key is correct
- Check API quota limits
- Ensure internet connectivity
- Review API usage in Google Console

## 📊 Model Recommendations by Use Case

### **Code Generation & Analysis**
- **Best**: CodeLlama 34B Instruct
- **Alternative**: CodeLlama 13B Instruct (faster)
- **Fallback**: Gemini Pro

### **Educational Explanations**
- **Best**: Mixtral 8x7B Instruct
- **Alternative**: Llama 3.1 8B Instruct
- **Fallback**: Gemini Pro

### **Security Analysis**
- **Best**: CodeLlama 34B Instruct
- **Alternative**: Mixtral 8x7B Instruct
- **Fallback**: Gemini Pro

---

## 🎯 Next Steps

After completing this setup:
1. **Test all AI endpoints** using the built-in test suite
2. **Monitor performance** and adjust settings as needed
3. **Configure rate limiting** based on your usage patterns
4. **Set up monitoring** for production deployment

*Setup Guide Last Updated: 2025-07-11*
