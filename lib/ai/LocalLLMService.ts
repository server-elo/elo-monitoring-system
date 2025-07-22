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

interface CodeAnalysisResult {
  issues: Array<{
    type: 'error' | 'warning' | 'suggestion';
    message: string;
    line?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  optimizations: string[];
  gasEstimate: number;
  securityScore: number;
}

interface SmartContractGenerationResult {
  code: string;
  explanation: string;
  testCases: string[];
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

  async initialize(): Promise<void> {
    try {
      const isHealthy = await this.isHealthy();
      if (!isHealthy) {
        logger.warn('Local LLM service is not healthy');
      }
    } catch (error) {
      logger.error('Failed to initialize Local LLM service', { 
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }, error instanceof Error ? error : undefined);
    }
  }

  async generateResponse(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.config.baseURL}/chat/completions`,
        {
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert Solidity developer and blockchain educator. You help students learn smart contract development with clear explanations, secure coding practices, and practical examples.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature,
          top_p: 0.9,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutes timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      logger.error('Local LLM Error', { 
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          config: {
            baseURL: this.config.baseURL,
            model: this.config.model,
            maxTokens: this.config.maxTokens
          }
        } 
      }, error instanceof Error ? error : undefined);
      throw new Error('Failed to generate response from local LLM');
    }
  }

  async analyzeCode(code: string): Promise<CodeAnalysisResult> {
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
        metadata: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          codeLength: code.length,
          config: {
            model: this.config.model,
            maxTokens: this.config.maxTokens
          }
        } 
      }, error instanceof Error ? error : undefined);
      
      return {
        issues: [{
          type: 'error',
          message: 'Analysis failed',
          severity: 'low'
        }],
        optimizations: [],
        gasEstimate: 0,
        securityScore: 0
      };
    }
  }

  async generateSmartContract(
    description: string, 
    requirements: string[]
  ): Promise<SmartContractGenerationResult> {
    const prompt = `Generate a complete Solidity smart contract based on this description:

Description: ${description}

Requirements:
${requirements.map((req: string) => `- ${req}`).join('\n')}

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

  private parseAnalysisResponse(response: string): CodeAnalysisResult {
    // Fallback parser for non-JSON responses
    const issues: CodeAnalysisResult['issues'] = [];
    const optimizations: string[] = [];
    
    // Extract issues using regex patterns
    const issuePatterns = [
      /ERROR:\s*(.+)/gi,
      /WARNING:\s*(.+)/gi,
      /SUGGESTION:\s*(.+)/gi
    ];
    
    issuePatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        issues.push({
          type: match[0].toLowerCase().includes('error') ? 'error' :
                match[0].toLowerCase().includes('warning') ? 'warning' : 'suggestion',
          message: match[1],
          severity: 'medium'
        });
      }
    });
    
    // Extract optimizations
    const optimizationMatches = response.matchAll(/OPTIMIZATION:\s*(.+)/gi);
    for (const match of optimizationMatches) {
      optimizations.push(match[1]);
    }
    
    // Extract security score if present
    const scoreMatch = response.match(/Security Score:\s*(\d+)/i);
    const securityScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
    
    // Extract gas estimate if present
    const gasMatch = response.match(/Gas Estimate:\s*(\d+)/i);
    const gasEstimate = gasMatch ? parseInt(gasMatch[1]) : 100000;
    
    return {
      issues,
      optimizations,
      gasEstimate,
      securityScore
    };
  }

  private parseContractResponse(response: string): SmartContractGenerationResult {
    // Extract Solidity code block
    const codeMatch = response.match(/```solidity\n([\s\S]*?)\n```/);
    const code = codeMatch ? codeMatch[1] : '';
    
    // Extract explanation (text before code)
    const parts = response.split('```solidity');
    const explanation = parts[0] || 'Smart contract generated successfully.';
    
    // Extract test cases
    const testCaseMatch = response.match(/Test Cases?:?\n([\s\S]*?)(?=\n\n|$)/i);
    let testCases: string[] = [];
    
    if (testCaseMatch) {
      testCases = testCaseMatch[1]
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^[-*]\s*/, ''));
    } else {
      // Default test cases if none found
      testCases = [
        'Test contract deployment',
        'Test main functionality',
        'Test access control',
        'Test edge cases'
      ];
    }
    
    return {
      code,
      explanation,
      testCases
    };
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

  async isAvailable(): Promise<boolean> {
    return this.isHealthy();
  }
}

export const localLLM = new LocalLLMService();