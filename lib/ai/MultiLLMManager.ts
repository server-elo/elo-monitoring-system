// Multi-LLM Integration Service for Solidity Learning Platform
import axios from 'axios';
import { logger } from '@/lib/api/logger';

interface LLMService {
  name: string;
  url: string;
  model: string;
  specialization: 'code' | 'chat' | 'fast';
  isHealthy: boolean;
  responseTime: number;
}

interface AIRequest {
  prompt: string;
  context?: string;
  type?: 'code' | 'explanation' | 'quick' | 'analysis';
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  response: string;
  model: string;
  responseTime: number;
  tokensUsed?: number;
  service: string;
}

export class MultiLLMManager {
  private services: Map<string, LLMService> = new Map();
  private defaultTimeout = 30000; // 30 seconds

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // CodeLlama 34B - Best for Solidity code tasks
    this.services.set('codellama', {
      name: 'CodeLlama 34B',
      url: process.env.CODE_LLM_URL || 'http://localhost:1234/v1',
      model: 'codellama-34b-instruct',
      specialization: 'code',
      isHealthy: false,
      responseTime: 0
    });

    // Mixtral 8x7B - Best for explanations and general Q&A
    this.services.set('mixtral', {
      name: 'Mixtral 8x7B',
      url: process.env.CHAT_LLM_URL || 'http://localhost:1235/v1',
      model: 'mixtral-8x7b-instruct',
      specialization: 'chat',
      isHealthy: false,
      responseTime: 0
    });

    // Llama 3.1 8B - Best for quick responses
    this.services.set('llama', {
      name: 'Llama 3.1 8B',
      url: process.env.FAST_LLM_URL || 'http://localhost:1236/v1',
      model: 'llama-3.1-8b-instruct',
      specialization: 'fast',
      isHealthy: false,
      responseTime: 0
    });
  }

  // Health check all services
  async checkAllServices(): Promise<void> {
    const healthChecks = Array.from(this.services.entries()).map(async ([key, service]) => {
      try {
        const startTime = Date.now();
        const response = await axios.get(`${service.url.replace('/v1', '')}/health`, {
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;
        
        this.services.set(key, {
          ...service,
          isHealthy: response.status === 200,
          responseTime
        });
        
        logger.info('LLM service health check', {
          serviceName: service.name,
          responseTime,
          status: 'healthy'
        });
      } catch (error) {
        this.services.set(key, {
          ...service,
          isHealthy: false,
          responseTime: -1
        });
        logger.warn('LLM service health check failed', {
          serviceName: service.name,
          status: 'unhealthy'
        });
      }
    });

    await Promise.all(healthChecks);
  }

  // Smart routing based on request type
  private selectBestService(request: AIRequest): string {
    const availableServices = Array.from(this.services.entries())
      .filter(([_, service]) => service.isHealthy);

    if (availableServices.length === 0) {
      throw new Error('No LLM services available');
    }

    // Route based on request type
    switch (request.type) {
      case 'code':
      case 'analysis':
        // Prefer CodeLlama for code tasks
        const codeLlama = availableServices.find(([key]) => key === 'codellama');
        if (codeLlama) return codeLlama[0];
        break;
        
      case 'quick':
        // Prefer Llama 3.1 for quick responses
        const llama = availableServices.find(([key]) => key === 'llama');
        if (llama) return llama[0];
        break;
        
      case 'explanation':
      default:
        // Prefer Mixtral for explanations
        const mixtral = availableServices.find(([key]) => key === 'mixtral');
        if (mixtral) return mixtral[0];
        break;
    }

    // Fallback to fastest available service
    const fastestService = availableServices.reduce((fastest, current) => 
      current[1].responseTime < fastest[1].responseTime ? current : fastest
    );

    return fastestService[0];
  }

  // Auto-detect request type based on content
  private detectRequestType(prompt: string, context?: string): AIRequest['type'] {
    const text = (prompt + ' ' + (context || '')).toLowerCase();
    
    // Code-related keywords
    const codeKeywords = [
      'solidity', 'contract', 'function', 'pragma', 'mapping', 'struct',
      'modifier', 'event', 'constructor', 'compile', 'deploy', 'debug',
      'gas', 'wei', 'ether', 'address', 'uint', 'bytes', 'string',
      'require', 'assert', 'revert', 'payable', 'view', 'pure'
    ];
    
    // Quick response indicators
    const quickKeywords = [
      'what is', 'define', 'explain briefly', 'short answer', 'quick question'
    ];

    if (codeKeywords.some(keyword => text.includes(keyword))) {
      return 'code';
    }
    
    if (quickKeywords.some(keyword => text.includes(keyword)) || prompt.length < 50) {
      return 'quick';
    }
    
    return 'explanation';
  }

  // Main method to get AI response
  async getResponse(request: AIRequest): Promise<AIResponse> {
    // Auto-detect type if not specified
    if (!request.type) {
      request.type = this.detectRequestType(request.prompt, request.context);
    }

    // Check service health first
    await this.checkAllServices();

    // Select best service
    const serviceKey = this.selectBestService(request);
    const service = this.services.get(serviceKey)!;

    logger.info('LLM request routing', {
      requestType: request.type,
      serviceName: service.name,
      operation: 'route-request'
    });

    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${service.url}/chat/completions`, {
        model: service.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(service.specialization, request.type)
          },
          {
            role: 'user',
            content: request.context ? 
              `Context: ${request.context}\n\nQuestion: ${request.prompt}` : 
              request.prompt
          }
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.1,
        top_p: 0.9,
        stream: false
      }, {
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      
      return {
        response: response.data.choices[0].message.content,
        model: service.model,
        responseTime,
        tokensUsed: response.data.usage?.total_tokens,
        service: service.name
      };

    } catch (error) {
      logger.error('LLM service request failed', {
        serviceName: service.name,
        error: error.message,
        operation: 'llm-request'
      }, error);
      
      // Try fallback to another service
      return this.tryFallback(request, serviceKey);
    }
  }

  // Fallback to another service if primary fails
  private async tryFallback(request: AIRequest, failedServiceKey: string): Promise<AIResponse> {
    const availableServices = Array.from(this.services.entries())
      .filter(([key, service]) => key !== failedServiceKey && service.isHealthy);

    if (availableServices.length === 0) {
      throw new Error('All LLM services failed');
    }

    // Try the fastest available service
    const fallbackService = availableServices.reduce((fastest, current) => 
      current[1].responseTime < fastest[1].responseTime ? current : fastest
    );

    logger.info('LLM service fallback', {
      fallbackService: fallbackService[1].name,
      operation: 'fallback-request'
    });

    const service = fallbackService[1];
    
    try {
      const startTime = Date.now();
      
      const response = await axios.post(`${service.url}/chat/completions`, {
        model: service.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(service.specialization, request.type)
          },
          {
            role: 'user',
            content: request.context ? 
              `Context: ${request.context}\n\nQuestion: ${request.prompt}` : 
              request.prompt
          }
        ],
        max_tokens: request.maxTokens || 2048,
        temperature: request.temperature || 0.1,
        top_p: 0.9,
        stream: false
      }, {
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseTime = Date.now() - startTime;
      
      return {
        response: response.data.choices[0].message.content,
        model: service.model,
        responseTime,
        tokensUsed: response.data.usage?.total_tokens,
        service: `${service.name} (fallback)`
      };

    } catch (error) {
      throw new Error(`All LLM services failed. Last error: ${error.message}`);
    }
  }

  // Get optimized system prompts for different services and request types
  private getSystemPrompt(specialization: string, _requestType?: string): string {
    const basePrompt = "You are an expert Solidity developer and blockchain educator.";
    
    switch (specialization) {
      case 'code':
        return `${basePrompt} You specialize in writing, analyzing, and debugging Solidity smart contracts. Focus on:
- Writing secure, gas-optimized code
- Identifying vulnerabilities and best practices
- Providing detailed code explanations
- Following latest Solidity standards (^0.8.20)
- Using OpenZeppelin patterns where appropriate`;

      case 'chat':
        return `${basePrompt} You excel at explaining blockchain concepts clearly and comprehensively. Focus on:
- Clear, educational explanations
- Real-world examples and analogies
- Step-by-step breakdowns of complex topics
- Connecting concepts to practical applications
- Encouraging further learning`;

      case 'fast':
        return `${basePrompt} You provide quick, concise, and accurate answers. Focus on:
- Brief but complete responses
- Essential information only
- Clear and direct language
- Immediate practical value
- No unnecessary elaboration`;

      default:
        return basePrompt;
    }
  }

  // Get service status
  getServiceStatus(): Array<{name: string, healthy: boolean, responseTime: number}> {
    return Array.from(this.services.values()).map(service => ({
      name: service.name,
      healthy: service.isHealthy,
      responseTime: service.responseTime
    }));
  }

  // Specialized methods for common use cases
  async analyzeCode(code: string): Promise<AIResponse> {
    return this.getResponse({
      prompt: `Analyze this Solidity code for security issues, gas optimizations, and best practices:\n\n\`\`\`solidity\n${code}\n\`\`\``,
      type: 'code',
      maxTokens: 3000
    });
  }

  async generateSmartContract(description: string, requirements: string[]): Promise<AIResponse> {
    const prompt = `Generate a complete Solidity smart contract based on this description:

Description: ${description}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Provide production-ready code with proper documentation, security considerations, and gas optimization.`;

    return this.getResponse({
      prompt,
      type: 'code',
      maxTokens: 4000
    });
  }

  async explainConcept(concept: string, level: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): Promise<AIResponse> {
    return this.getResponse({
      prompt: `Explain "${concept}" for a ${level} level student. Include examples and practical applications.`,
      type: 'explanation',
      maxTokens: 2000
    });
  }

  async quickAnswer(question: string): Promise<AIResponse> {
    return this.getResponse({
      prompt: question,
      type: 'quick',
      maxTokens: 500
    });
  }
}

// Export singleton instance
export const multiLLM = new MultiLLMManager();
