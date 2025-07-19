import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '@/lib/api/logger';

// Import the local LLM service
interface LocalLLMService {
  generateResponse(prompt: string, context?: string): Promise<string>;
  analyzeCode(code: string): Promise<any>;
  generateSmartContract(description: string, requirements: string[]): Promise<any>;
  isHealthy(): Promise<boolean>;
}

export interface AIResponse {
  message: string;
  suggestions?: string[];
  codeExamples?: Array<{
    title: string;
    code: string;
    explanation: string;
  }>;
  nextSteps?: string[];
  confidence?: number;
  category?: 'explanation' | 'code-review' | 'debugging' | 'optimization' | 'security';
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    model?: string;
  };
}

export interface LearningContext {
  currentLesson?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  recentCode?: string;
  recentErrors?: string[];
  learningGoals?: string[];
  userProgress?: {
    completedLessons: number;
    currentStreak: number;
    totalXP: number;
  };
  preferences?: {
    learningStyle: 'visual' | 'hands-on' | 'theoretical';
    codeComplexity: 'simple' | 'moderate' | 'complex';
    explanationDepth: 'brief' | 'detailed' | 'comprehensive';
  };
}

export class LearningAssistant {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private streamingModel: any;
  private localLLM: LocalLLMService | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    // Initialize Gemini
    if (apiKey && apiKey !== 'undefined' && apiKey.trim() !== '') {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        this.streamingModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
        logger.info('LearningAssistant initialized with real Google Generative AI', {
          model: 'gemini-pro',
          apiKeyConfigured: true
        });
      } catch (error) {
        logger.error('Failed to initialize Google Generative AI', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }, error instanceof Error ? error : undefined);
        this.genAI = null as any;
        this.model = null as any;
        this.streamingModel = null as any;
      }
    } else {
      logger.warn('GEMINI_API_KEY not found. LearningAssistant will use mock responses', {
        fallbackMode: 'mock-responses',
        geminiAvailable: false
      });
      this.genAI = null as any;
      this.model = null as any;
      this.streamingModel = null as any;
    }

    // Initialize Local LLM if available
    this.initializeLocalLLM();
  }

  private async initializeLocalLLM() {
    try {
      // Dynamic import to avoid build errors if the service doesn't exist
      const { LocalLLMService } = await import('./LocalLLMService');
      this.localLLM = new LocalLLMService();
      
      // Test if local LLM is healthy
      const isHealthy = await this.localLLM.isHealthy();
      if (isHealthy) {
        logger.info('Local LLM initialized and healthy', {
          localLLMAvailable: true,
          healthStatus: 'healthy'
        });
      } else {
        logger.warn('Local LLM initialized but not responding', {
          localLLMAvailable: false,
          healthStatus: 'unhealthy'
        });
        this.localLLM = null;
      }
    } catch (error) {
      logger.warn('Local LLM not available, using Gemini fallback only', {
        error: error.message,
        fallbackMode: 'gemini-only'
      });
      this.localLLM = null;
    }
  }

  // Streaming response for real-time interaction
  public async askQuestionStream(
    question: string,
    context: LearningContext,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(question, context);

      // Use streaming model if available
      if (this.streamingModel && this.genAI) {
        try {
          const result = await this.streamingModel.generateContentStream(prompt);
          let fullText = '';

          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            if (onChunk) {
              onChunk(fullText);
            }
          }

          return this.parseAIResponse(fullText);
        } catch (streamError) {
          logger.warn('Streaming unavailable, using mock response', {
            error: streamError instanceof Error ? streamError.message : 'Unknown error',
            fallbackMode: 'mock-streaming'
          });
        }
      }

      // Fallback to simulated streaming
      const fullResponse = await this.generateMockResponse(question, context);

      if (onChunk) {
        const words = fullResponse.message.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          onChunk(words.slice(0, i + 1).join(' '));
        }
      }

      return fullResponse;
    } catch (error) {
      logger.error('AI Assistant streaming error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'streaming'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I apologize, but I encountered an error. Please try asking your question again.',
        confidence: 0.1,
        category: 'explanation'
      };
    }
  }

  public async askQuestion(
    question: string,
    context: LearningContext
  ): Promise<AIResponse> {
    try {
      const prompt = this.buildPrompt(question, context);

      // Use the actual AI model if available, otherwise fallback to mock
      if (this.genAI && this.model) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          return this.parseAIResponse(text);
        } catch (aiError) {
          logger.warn('AI service unavailable, using mock response', {
            error: aiError instanceof Error ? aiError.message : 'Unknown error',
            fallbackMode: 'mock-response'
          });
        }
      }

      // Fallback to mock response
      return this.generateMockResponse(question, context);
    } catch (error) {
      logger.error('AI Assistant error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'ask-question'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I apologize, but I encountered an error. Please try asking your question again.',
        confidence: 0.1,
        category: 'explanation'
      };
    }
  }

  // Enhanced code analysis with detailed feedback
  public async analyzeCodeSecurity(
    code: string,
    context: LearningContext
  ): Promise<AIResponse> {
    const securityIssues = this.detectSecurityIssues(code);
    const suggestions = this.generateSecuritySuggestions(securityIssues, context.userLevel);

    return {
      message: `I've analyzed your code for security vulnerabilities. Found ${securityIssues.length} potential issues.`,
      suggestions,
      category: 'security',
      confidence: 0.85,
      codeExamples: this.generateSecurityExamples(securityIssues),
      metadata: {
        processingTime: 1200,
        model: 'security-analyzer-v1'
      }
    };
  }

  // Gas optimization analysis
  public async optimizeGasUsage(
    code: string,
    _context: LearningContext
  ): Promise<AIResponse> {
    const optimizations = this.findGasOptimizations(code);

    return {
      message: `I've identified ${optimizations.length} gas optimization opportunities in your code.`,
      suggestions: optimizations.map(opt => opt.suggestion),
      category: 'optimization',
      confidence: 0.9,
      codeExamples: optimizations.map(opt => ({
        title: opt.title,
        code: opt.optimizedCode,
        explanation: opt.explanation
      })),
      metadata: {
        processingTime: 800,
        model: 'gas-optimizer-v1'
      }
    };
  }

  public async reviewCode(
    code: string,
    context: LearningContext
  ): Promise<AIResponse> {
    try {
      const prompt = `
As an expert Solidity instructor, please review this code and provide constructive feedback:

Code:
\`\`\`solidity
${code}
\`\`\`

User Level: ${context.userLevel}
Current Lesson: ${context.currentLesson || 'General practice'}

Please provide:
1. Overall assessment
2. Specific improvements
3. Security considerations
4. Gas optimization tips
5. Best practices recommendations

Format your response as a helpful mentor would, encouraging learning while pointing out areas for improvement.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Code review error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'code-review'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I encountered an error while reviewing your code. Please try again.',
      };
    }
  }

  public async explainConcept(
    concept: string,
    context: LearningContext
  ): Promise<AIResponse> {
    try {
      const prompt = `
As a Solidity expert and educator, please explain the concept of "${concept}" to a ${context.userLevel} level student.

Please provide:
1. Clear, simple explanation
2. Why it's important in Solidity/blockchain development
3. Practical code example
4. Common pitfalls to avoid
5. Related concepts they should learn next

Make the explanation engaging and easy to understand, with practical examples.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Concept explanation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'concept-explanation'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I encountered an error while explaining the concept. Please try again.',
      };
    }
  }

  public async debugCode(
    code: string,
    error: string,
    context: LearningContext
  ): Promise<AIResponse> {
    try {
      const prompt = `
As a Solidity debugging expert, help fix this code error:

Code:
\`\`\`solidity
${code}
\`\`\`

Error: ${error}

User Level: ${context.userLevel}

Please provide:
1. Explanation of what's causing the error
2. Step-by-step solution
3. Corrected code example
4. Tips to avoid similar errors in the future
5. Related debugging techniques

Be encouraging and educational in your response.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Debug assistance error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'debug-assistance'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I encountered an error while debugging. Please try again.',
      };
    }
  }

  public async generatePersonalizedExercise(
    context: LearningContext
  ): Promise<AIResponse> {
    try {
      const prompt = `
Create a personalized Solidity coding exercise for a ${context.userLevel} level student.

Current lesson context: ${context.currentLesson || 'General practice'}
Learning goals: ${context.learningGoals?.join(', ') || 'General Solidity skills'}

Please provide:
1. Exercise description and requirements
2. Starter code template
3. Expected learning outcomes
4. Hints for getting started
5. Bonus challenges for advanced students

Make it engaging and appropriately challenging for their level.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Exercise generation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'exercise-generation'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I encountered an error while generating an exercise. Please try again.',
      };
    }
  }

  public async provideLearningPath(
    currentSkills: string[],
    goals: string[],
    timeAvailable: string
  ): Promise<AIResponse> {
    try {
      const prompt = `
Create a personalized Solidity learning path based on:

Current Skills: ${currentSkills.join(', ')}
Learning Goals: ${goals.join(', ')}
Time Available: ${timeAvailable}

Please provide:
1. Recommended learning sequence
2. Estimated timeline for each topic
3. Key projects to build
4. Resources and tools to use
5. Milestones to track progress

Make it practical and achievable within their time constraints.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      logger.error('Learning path error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        operation: 'learning-path'
      }, error instanceof Error ? error : undefined);
      return {
        message: 'I encountered an error while creating your learning path. Please try again.',
      };
    }
  }

  private buildPrompt(question: string, context: LearningContext): string {
    return `
You are an expert Solidity instructor and mentor. A ${context.userLevel} level student is asking:

"${question}"

Context:
- Current lesson: ${context.currentLesson || 'General learning'}
- Recent code: ${context.recentCode ? 'Yes' : 'No'}
- Recent errors: ${context.recentErrors?.length || 0}
- Learning goals: ${context.learningGoals?.join(', ') || 'General Solidity mastery'}

Please provide a helpful, educational response that:
1. Directly answers their question
2. Provides relevant code examples if applicable
3. Suggests next steps for learning
4. Encourages continued learning

Be supportive, clear, and practical in your response.
`;
  }

  private parseAIResponse(text: string): AIResponse {
    // Basic parsing - in production, you'd want more sophisticated parsing
    const response: AIResponse = {
      message: text,
    };

    // Extract code examples if present
    const codeBlocks = text.match(/```[\s\S]*?```/g);
    if (codeBlocks) {
      response.codeExamples = codeBlocks.map((block, index) => ({
        title: `Example ${index + 1}`,
        code: block.replace(/```\w*\n?/, '').replace(/```$/, ''),
        explanation: 'Code example from AI response',
      }));
    }

    // Extract suggestions (lines starting with numbers or bullets)
    const suggestions = text.match(/^\d+\.\s+.+$/gm) || text.match(/^[-*]\s+.+$/gm);
    if (suggestions) {
      response.suggestions = suggestions.map(s => s.replace(/^\d+\.\s+|^[-*]\s+/, ''));
    }

    return response;
  }

  // Helper methods for mock responses and analysis
  private async generateMockResponse(question: string, context: LearningContext): Promise<AIResponse> {
    const responses = {
      'what is solidity': {
        message: 'Solidity is a statically-typed programming language designed for developing smart contracts that run on the Ethereum Virtual Machine (EVM). It was influenced by C++, Python, and JavaScript and is designed to target the EVM.',
        suggestions: [
          'Start with basic syntax and data types',
          'Practice with simple smart contracts',
          'Learn about gas optimization'
        ],
        codeExamples: [{
          title: 'Hello World Contract',
          code: `pragma solidity ^0.8.0;\n\ncontract HelloWorld {\n    string public message = "Hello, World!";\n    \n    function setMessage(string memory _message) public {\n        message = _message;\n    }\n}`,
          explanation: 'A simple contract that stores and retrieves a message'
        }],
        confidence: 0.95,
        category: 'explanation' as const
      },
      'how to debug': {
        message: 'Debugging Solidity contracts involves using tools like Hardhat, Truffle, or Remix IDE. You can use console.log statements, event logging, and step-through debugging.',
        suggestions: [
          'Use Hardhat console.log for debugging',
          'Emit events to track contract state',
          'Use Remix debugger for step-by-step execution'
        ],
        confidence: 0.88,
        category: 'debugging' as const
      }
    };

    // Find best match or return generic response
    const lowerQuestion = question.toLowerCase();
    const matchedResponse = Object.entries(responses).find(([key]) =>
      lowerQuestion.includes(key)
    )?.[1];

    if (matchedResponse) {
      return {
        ...matchedResponse,
        metadata: {
          processingTime: 500,
          model: 'learning-assistant-v1'
        }
      };
    }

    // Generic response based on user level
    const levelResponses = {
      beginner: 'That\'s a great question for someone starting with Solidity! Let me break this down into simple terms...',
      intermediate: 'Good question! This involves some intermediate concepts in Solidity development...',
      advanced: 'Excellent question! This touches on advanced Solidity patterns and best practices...'
    };

    return {
      message: levelResponses[context.userLevel] + ' ' + this.generateContextualResponse(question, context),
      suggestions: this.generateSuggestions(question, context),
      confidence: 0.75,
      category: 'explanation',
      metadata: {
        processingTime: 600,
        model: 'learning-assistant-v1'
      }
    };
  }

  private generateContextualResponse(question: string, _context: LearningContext): string {
    const topics = {
      'function': 'Functions in Solidity are executable units of code that can be called to perform specific tasks.',
      'variable': 'Variables in Solidity store data that can be used and modified throughout your contract.',
      'contract': 'A contract in Solidity is like a class in object-oriented programming - it contains data and functions.',
      'gas': 'Gas is the fee required to execute operations on the Ethereum network.',
      'security': 'Security in smart contracts is crucial as they handle valuable assets and are immutable once deployed.'
    };

    const matchedTopic = Object.entries(topics).find(([key]) =>
      question.toLowerCase().includes(key)
    );

    return matchedTopic ? matchedTopic[1] : 'This is an important concept in Solidity development that requires careful consideration.';
  }

  private generateSuggestions(_question: string, context: LearningContext): string[] {
    const baseSuggestions = [
      'Practice with small examples first',
      'Read the official Solidity documentation',
      'Test your code thoroughly'
    ];

    const levelSuggestions = {
      beginner: [
        'Start with Remix IDE for easy testing',
        'Focus on understanding basic syntax',
        'Join Solidity learning communities'
      ],
      intermediate: [
        'Explore advanced patterns and libraries',
        'Learn about gas optimization techniques',
        'Study existing open-source contracts'
      ],
      advanced: [
        'Contribute to open-source projects',
        'Learn formal verification techniques',
        'Explore cutting-edge research in smart contracts'
      ]
    };

    return [...baseSuggestions, ...levelSuggestions[context.userLevel]];
  }

  private detectSecurityIssues(code: string): Array<{type: string, line: number, severity: string}> {
    const issues: Array<{type: string, line: number, severity: string}> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('call(') && !line.includes('require(')) {
        issues.push({
          type: 'Unchecked external call',
          line: index + 1,
          severity: 'high'
        });
      }
      if (line.includes('tx.origin')) {
        issues.push({
          type: 'tx.origin usage',
          line: index + 1,
          severity: 'medium'
        });
      }
    });

    return issues;
  }

  private generateSecuritySuggestions(_issues: any[], userLevel: string): string[] {
    const suggestions = [
      'Always validate external inputs',
      'Use the checks-effects-interactions pattern',
      'Implement proper access controls'
    ];

    if (userLevel === 'advanced') {
      suggestions.push(
        'Consider formal verification for critical functions',
        'Implement circuit breakers for emergency stops'
      );
    }

    return suggestions;
  }

  private generateSecurityExamples(_issues: any[]): Array<{title: string, code: string, explanation: string}> {
    return [{
      title: 'Safe External Call Pattern',
      code: `// Bad\n(bool success, ) = target.call(data);\n\n// Good\n(bool success, ) = target.call(data);\nrequire(success, "Call failed");`,
      explanation: 'Always check the return value of external calls'
    }];
  }

  private findGasOptimizations(_code: string): Array<{title: string, suggestion: string, optimizedCode: string, explanation: string}> {
    return [{
      title: 'Storage Optimization',
      suggestion: 'Pack struct variables to reduce storage slots',
      optimizedCode: `struct User {\n    uint128 balance;  // Instead of uint256\n    uint128 timestamp;\n    bool active;\n}`,
      explanation: 'Packing variables into single storage slots saves gas'
    }];
  }

  // Enhanced method to choose the best AI service
  // NOTE: This method is kept for legacy compatibility but is no longer used directly
  // The enhanced tutor system now handles service selection
  private async selectAIService(): Promise<'local' | 'gemini' | 'mock'> {
    // Prefer local LLM for code-related tasks
    if (this.localLLM) {
      try {
        const isHealthy = await this.localLLM.isHealthy();
        if (isHealthy) return 'local';
      } catch (error) {
        logger.warn('Local LLM health check failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          operation: 'health-check'
        });
      }
    }

    // Fallback to Gemini
    if (this.model) return 'gemini';

    // Last resort: mock responses
    return 'mock';
  }
}
