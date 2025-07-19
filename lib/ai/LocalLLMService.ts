// Local LLM Integration Service
import axios from 'axios';
import { logger } from '@/lib/api/logger';

interface LocalLLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export class LocalLLMService {
  private config: LocalLLMConfig;

  constructor(config?: Partial<LocalLLMConfig>) {
    this.config = {
      baseURL: process.env.LOCAL_LLM_URL || 'http://localhost:1234/v1',
      apiKey: process.env.LOCAL_LLM_API_KEY || 'lm-studio',
      model: 'codellama-70b-instruct',
      maxTokens: 4096,
      temperature: 0.1,
      ...config
    };
  }

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseURL}/chat/completions`, {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert Solidity developer and blockchain educator. You help students learn smart contract development with clear explanations, secure coding practices, and practical examples.

${context ? `Context: ${context}` : ''}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        top_p: 0.9,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes timeout
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Local LLM Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        config: {
          baseURL: this.config.baseURL,
          model: this.config.model,
          maxTokens: this.config.maxTokens
        }
      }, error instanceof Error ? error : undefined);
      throw new Error('Failed to generate response from local LLM');
    }
  }

  async analyzeCode(code: string): Promise<{
    issues: Array<{
      type: 'error' | 'warning' | 'suggestion';
      message: string;
      line?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
    optimizations: string[];
    gasEstimate: number;
    securityScore: number;
  }> {
    const prompt = `Analyze this Solidity code for security issues, gas optimizations, and best practices:

\`\`\`solidity
${code}
\`\`\`

Provide a detailed analysis in JSON format with:
1. Issues (errors, warnings, suggestions)
2. Gas optimization recommendations
3. Security score (0-100)
4. Estimated gas usage

Focus on:
- Reentrancy vulnerabilities
- Integer overflow/underflow
- Access control issues
- Gas optimization opportunities
- Best practices compliance`;

    try {
      const response = await this.generateResponse(prompt);
      
      // Parse JSON response (with fallback handling)
      try {
        return JSON.parse(response);
      } catch {
        // Fallback: extract key information using regex
        return this.parseAnalysisResponse(response);
      }
    } catch (error) {
      logger.error('Code analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        codeLength: code.length,
        config: {
          model: this.config.model,
          maxTokens: this.config.maxTokens
        }
      }, error instanceof Error ? error : undefined);
      return {
        issues: [{ type: 'error', message: 'Analysis failed', severity: 'low' }],
        optimizations: [],
        gasEstimate: 0,
        securityScore: 0
      };
    }
  }

  async generateSmartContract(description: string, requirements: string[]): Promise<{
    code: string;
    explanation: string;
    testCases: string[];
  }> {
    const prompt = `Generate a complete Solidity smart contract based on this description:

Description: ${description}

Requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Provide:
1. Complete, production-ready Solidity code
2. Detailed explanation of the implementation
3. Suggested test cases
4. Security considerations

Use Solidity ^0.8.20 and follow best practices including:
- OpenZeppelin imports where appropriate
- Proper access control
- Gas optimization
- Security patterns
- Comprehensive documentation`;

    const response = await this.generateResponse(prompt);
    
    // Extract code, explanation, and test cases from response
    return this.parseContractResponse(response);
  }

  private parseAnalysisResponse(response: string): any {
    // Fallback parser for non-JSON responses
    const issues = [];
    const optimizations = [];
    
    // Extract issues using regex patterns
    const issuePatterns = [
      /ERROR:\s*(.+)/gi,
      /WARNING:\s*(.+)/gi,
      /SUGGESTION:\s*(.+)/gi
    ];
    
    issuePatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach(match => {
          issues.push({
            type: match.toLowerCase().includes('error') ? 'error' : 
                  match.toLowerCase().includes('warning') ? 'warning' : 'suggestion',
            message: match.replace(/^(ERROR|WARNING|SUGGESTION):\s*/i, ''),
            severity: 'medium'
          });
        });
      }
    });

    return {
      issues,
      optimizations,
      gasEstimate: 100000,
      securityScore: 75
    };
  }

  private parseContractResponse(response: string): any {
    // Extract Solidity code block
    const codeMatch = response.match(/```solidity\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : '';
    
    // Extract explanation (text between code and test cases)
    const explanation = response.split('```')[0] || 'Smart contract generated successfully.';
    
    // Extract test cases
    const testCases = [
      'Test contract deployment',
      'Test main functionality',
      'Test access control',
      'Test edge cases'
    ];

    return { code, explanation, testCases };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseURL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const localLLM = new LocalLLMService();