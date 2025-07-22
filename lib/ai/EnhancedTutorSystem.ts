// Enhanced AI Tutoring System for Solidity Learning Platform
// Integrates local CodeLlama 34B with smart fallback to Gemini
// Provides context-aware, adaptive learning experiences

import { sendMessageToGeminiChat, initializeChatForModule } from '@/services/geminiService';
import { prisma } from '@/lib/prisma';
import { MultiLLMManager } from './MultiLLMManager';
import { LocalLLMService } from './LocalLLMService';
import { SmartRequestRouter, RoutingRequest } from './SmartRequestRouter';
import { QuantumInputSanitizer, AIRateLimiter } from '@/lib/security/InputSanitizer';

interface LocalLLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface UserContext {
  userId: string;
  currentLevel: number;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  learningPath: string[];
  recentTopics: string[];
  weakAreas: string[];
  strongAreas: string[];
  preferredLearningStyle: 'visual' | 'textual' | 'interactive' | 'mixed';
  totalXP: number;
  streak: number;
  lastActiveDate: Date;
  // Enhanced context tracking
  conversationHistory: ConversationEntry[];
  recentCodeSubmissions: CodeSubmission[];
  performanceMetrics: {
    averageScore: number;
    completionRate: number;
    securityAwareness: number; // 0-100
    gasOptimizationSkill: number; // 0-100
    codeQualityScore: number; // 0-100
  };
  adaptiveDifficulty: {
    currentLevel: number; // 1-10
    adjustmentHistory: DifficultyAdjustment[];
    lastAdjustment: Date;
    autoAdjustEnabled: boolean;
  };
}

interface ConversationEntry {
  id: string;
  timestamp: Date;
  userMessage: string;
  aiResponse: string;
  context: string;
  category: 'explanation' | 'code-review' | 'debugging' | 'optimization' | 'security';
  satisfaction?: number; // 1-5 rating
  followUpQuestions?: string[];
  responseTime: number;
  model: string;
}

interface CodeSubmission {
  id: string;
  timestamp: Date;
  code: string;
  language: 'solidity' | 'javascript' | 'typescript';
  context: string; // lesson, challenge, project
  analysis: {
    securityIssues: SecurityIssue[];
    gasOptimizations: GasOptimization[];
    qualityScore: number;
    suggestions: string[];
  };
}

interface SecurityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  line: number;
  description: string;
  suggestion: string;
  codeExample?: string;
}

interface GasOptimization {
  type: string;
  line: number;
  currentCost: number;
  optimizedCost: number;
  description: string;
  suggestion: string;
  codeExample?: string;
}

interface DifficultyAdjustment {
  timestamp: Date;
  previousLevel: number;
  newLevel: number;
  reason: string;
  performanceData: {
    recentScores: number[];
    timeSpent: number;
    strugglingConcepts: string[];
  };
}

interface LearningAnalytics {
  conceptMastery: Record<string, number>; // concept -> mastery level (0-1)
  learningVelocity: number; // concepts mastered per week
  engagementScore: number; // 0-100
  progressTrend: 'improving' | 'stable' | 'declining';
  predictedCompletionDate: Date;
  recommendedFocusAreas: string[];
}

interface TutorResponse {
  message: string;
  code?: string;
  explanation?: string;
  resources?: {
    title: string;
    url: string;
    type: 'article' | 'video' | 'documentation' | 'example';
  }[];
  nextSteps?: string[];
  difficulty?: number;
  estimatedTime?: number; // minutes
  relatedConcepts?: string[];
  practiceProblems?: {
    id: string;
    title: string;
    difficulty: number;
    estimatedTime: number;
  }[];
}

export class EnhancedTutorSystem {
  private multiLLMManager: MultiLLMManager;
  private localLLMService: LocalLLMService;
  private requestRouter: SmartRequestRouter;
  private sanitizer: QuantumInputSanitizer;
  private rateLimiter: AIRateLimiter;
  private localLLMConfig: LocalLLMConfig = {
    baseURL: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
    apiKey: process.env.LOCAL_LLM_API_KEY || '',
    model: 'codellama:34b',
    maxTokens: 4096,
    temperature: 0.7
  };

  constructor() {
    this.multiLLMManager = new MultiLLMManager();
    this.localLLMService = new LocalLLMService();
    this.requestRouter = new SmartRequestRouter({
      costThreshold: 0.1,
      complexityThreshold: 0.7,
      maxRetries: 3
    });
    this.sanitizer = new QuantumInputSanitizer();
    this.rateLimiter = new AIRateLimiter();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize local LLM service
      await this.localLLMService.initialize();
      
      // Test connection to local CodeLlama
      const isAvailable = await this.localLLMService.isAvailable();
      if (!isAvailable) {
        console.warn('Local CodeLlama not available, using Gemini fallback');
      }

      // Initialize Gemini for fallback
      await initializeChatForModule('general');
    } catch (error) {
      console.error('Failed to initialize Enhanced Tutor System:', error);
      throw error;
    }
  }

  async processUserQuery(
    userId: string,
    query: string,
    context?: Partial<UserContext>
  ): Promise<TutorResponse> {
    try {
      // Rate limiting
      const canProceed = await this.rateLimiter.checkLimit(userId);
      if (!canProceed) {
        return {
          message: 'You\'ve reached your query limit. Please try again later.',
          nextSteps: ['Review previous responses', 'Practice with existing materials']
        };
      }

      // Input sanitization
      const sanitizedQuery = await this.sanitizer.sanitize(query);

      // Get full user context
      const fullContext = await this.getUserContext(userId, context);

      // Prepare routing request
      const routingRequest: RoutingRequest = {
        prompt: sanitizedQuery,
        context: fullContext,
        complexity: this.calculateQueryComplexity(sanitizedQuery, fullContext),
        priority: 'normal',
        userId,
        estimatedTokens: this.estimateTokens(sanitizedQuery)
      };

      // Route to appropriate LLM
      const routingDecision = await this.requestRouter.route(routingRequest);

      let response: TutorResponse;

      if (routingDecision.provider === 'local' && await this.localLLMService.isAvailable()) {
        response = await this.processWithLocalLLM(sanitizedQuery, fullContext);
      } else {
        response = await this.processWithGemini(sanitizedQuery, fullContext);
      }

      // Enhance response with learning analytics
      response = await this.enhanceResponse(response, fullContext);

      // Store conversation entry
      await this.storeConversation(userId, sanitizedQuery, response, routingDecision.provider);

      // Update user progress
      await this.updateUserProgress(userId, sanitizedQuery, response);

      return response;
    } catch (error) {
      console.error('Error processing user query:', error);
      return {
        message: 'I encountered an error processing your query. Please try again.',
        nextSteps: ['Rephrase your question', 'Check the documentation']
      };
    }
  }

  private async processWithLocalLLM(
    query: string,
    context: UserContext
  ): Promise<TutorResponse> {
    const prompt = this.buildPrompt(query, context);
    
    try {
      const response = await this.localLLMService.generateResponse(prompt, {
        maxTokens: this.localLLMConfig.maxTokens,
        temperature: this.localLLMConfig.temperature
      });

      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Local LLM failed, falling back to Gemini:', error);
      return this.processWithGemini(query, context);
    }
  }

  private async processWithGemini(
    query: string,
    context: UserContext
  ): Promise<TutorResponse> {
    const enhancedQuery = this.enhanceQueryWithContext(query, context);
    
    try {
      const response = await sendMessageToGeminiChat(enhancedQuery);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  private buildPrompt(query: string, context: UserContext): string {
    return `You are an expert Solidity tutor helping a ${context.skillLevel} level student.

User Context:
- Current Topics: ${context.recentTopics.join(', ')}
- Weak Areas: ${context.weakAreas.join(', ')}
- Strong Areas: ${context.strongAreas.join(', ')}
- Learning Style: ${context.preferredLearningStyle}
- Performance Metrics:
  - Security Awareness: ${context.performanceMetrics.securityAwareness}%
  - Gas Optimization Skill: ${context.performanceMetrics.gasOptimizationSkill}%
  - Code Quality Score: ${context.performanceMetrics.codeQualityScore}%

Question: ${query}

Please provide a comprehensive response that:
1. Directly answers the question
2. Includes code examples if relevant
3. Explains security considerations
4. Mentions gas optimization tips
5. Suggests next learning steps
6. Adapts to the user's skill level and learning style`;
  }

  private enhanceQueryWithContext(query: string, context: UserContext): string {
    const contextInfo = `[User Level: ${context.skillLevel}, Recent Topics: ${context.recentTopics.join(', ')}]`;
    return `${contextInfo} ${query}`;
  }

  private parseAIResponse(response: string): TutorResponse {
    // Parse structured response from AI
    try {
      // Look for JSON response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]) as TutorResponse;
      }

      // Fallback to simple text response
      return {
        message: response,
        nextSteps: ['Continue learning', 'Practice the concept']
      };
    } catch (error) {
      return {
        message: response,
        nextSteps: ['Continue learning', 'Practice the concept']
      };
    }
  }

  private async enhanceResponse(
    response: TutorResponse,
    context: UserContext
  ): Promise<TutorResponse> {
    // Add personalized recommendations
    response.difficulty = context.adaptiveDifficulty.currentLevel;
    
    // Add related practice problems
    response.practiceProblems = await this.getRelevantProblems(
      context.recentTopics[0] || 'basics',
      context.adaptiveDifficulty.currentLevel
    );

    // Add time estimates based on user's learning velocity
    if (response.practiceProblems) {
      response.estimatedTime = response.practiceProblems.reduce(
        (total, problem) => total + problem.estimatedTime,
        0
      );
    }

    return response;
  }

  private calculateQueryComplexity(query: string, context: UserContext): number {
    let complexity = 0.5; // base complexity

    // Adjust based on query length
    complexity += Math.min(query.length / 1000, 0.3);

    // Adjust based on technical terms
    const technicalTerms = ['contract', 'modifier', 'assembly', 'delegatecall', 'storage', 'memory'];
    const termCount = technicalTerms.filter(term => query.toLowerCase().includes(term)).length;
    complexity += termCount * 0.1;

    // Adjust based on user level
    if (context.skillLevel === 'BEGINNER') complexity -= 0.2;
    if (context.skillLevel === 'EXPERT') complexity += 0.2;

    return Math.max(0, Math.min(1, complexity));
  }

  private estimateTokens(query: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(query.length / 4);
  }

  private async getUserContext(
    userId: string,
    partialContext?: Partial<UserContext>
  ): Promise<UserContext> {
    // Fetch user data from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: true,
        achievements: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Build complete context
    const context: UserContext = {
      userId,
      currentLevel: user.level || 1,
      skillLevel: this.determineSkillLevel(user.level || 1),
      learningPath: [], // Would be fetched from user's enrolled courses
      recentTopics: [], // Would be fetched from recent activity
      weakAreas: [], // Analyzed from quiz/test performance
      strongAreas: [], // Analyzed from achievements
      preferredLearningStyle: 'mixed',
      totalXP: user.xp || 0,
      streak: user.streak || 0,
      lastActiveDate: user.lastLogin || new Date(),
      conversationHistory: [],
      recentCodeSubmissions: [],
      performanceMetrics: {
        averageScore: 75,
        completionRate: 80,
        securityAwareness: 70,
        gasOptimizationSkill: 65,
        codeQualityScore: 80
      },
      adaptiveDifficulty: {
        currentLevel: 5,
        adjustmentHistory: [],
        lastAdjustment: new Date(),
        autoAdjustEnabled: true
      },
      ...partialContext
    };

    return context;
  }

  private determineSkillLevel(level: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    if (level <= 10) return 'BEGINNER';
    if (level <= 25) return 'INTERMEDIATE';
    if (level <= 50) return 'ADVANCED';
    return 'EXPERT';
  }

  private async storeConversation(
    userId: string,
    query: string,
    response: TutorResponse,
    model: string
  ): Promise<void> {
    // Store in database for analytics and history
    try {
      await prisma.aiConversation.create({
        data: {
          userId,
          userMessage: query,
          aiResponse: response.message,
          model,
          responseTime: Date.now(),
          metadata: {
            resources: response.resources,
            nextSteps: response.nextSteps,
            difficulty: response.difficulty
          }
        }
      });
    } catch (error) {
      console.error('Failed to store conversation:', error);
    }
  }

  private async updateUserProgress(
    userId: string,
    query: string,
    response: TutorResponse
  ): Promise<void> {
    // Update user's progress based on interaction
    try {
      // Award XP for learning interactions
      const xpGained = this.calculateXPFromInteraction(query, response);
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpGained },
          lastActivity: new Date()
        }
      });
    } catch (error) {
      console.error('Failed to update user progress:', error);
    }
  }

  private calculateXPFromInteraction(query: string, response: TutorResponse): number {
    let xp = 5; // base XP for any interaction

    // Bonus for complex queries
    if (query.length > 100) xp += 5;

    // Bonus for engaging with suggested resources
    if (response.resources && response.resources.length > 0) xp += 10;

    // Bonus for difficulty level
    if (response.difficulty && response.difficulty > 7) xp += 15;

    return xp;
  }

  private async getRelevantProblems(
    topic: string,
    difficultyLevel: number
  ): Promise<TutorResponse['practiceProblems']> {
    // Fetch practice problems from database
    // This is a placeholder implementation
    return [
      {
        id: '1',
        title: `Practice ${topic} - Basic`,
        difficulty: Math.max(1, difficultyLevel - 1),
        estimatedTime: 15
      },
      {
        id: '2',
        title: `Practice ${topic} - Intermediate`,
        difficulty: difficultyLevel,
        estimatedTime: 25
      },
      {
        id: '3',
        title: `Practice ${topic} - Advanced`,
        difficulty: Math.min(10, difficultyLevel + 1),
        estimatedTime: 35
      }
    ];
  }

  // Advanced features for adaptive learning
  async adjustDifficulty(userId: string, performance: number): Promise<void> {
    const context = await this.getUserContext(userId);
    const currentLevel = context.adaptiveDifficulty.currentLevel;
    let newLevel = currentLevel;

    // Adjust based on performance
    if (performance > 85 && currentLevel < 10) {
      newLevel = Math.min(10, currentLevel + 1);
    } else if (performance < 50 && currentLevel > 1) {
      newLevel = Math.max(1, currentLevel - 1);
    }

    if (newLevel !== currentLevel) {
      // Update user's difficulty level
      await prisma.userSettings.update({
        where: { userId },
        data: {
          difficultyLevel: newLevel,
          lastDifficultyAdjustment: new Date()
        }
      });
    }
  }

  async generatePersonalizedLearningPath(userId: string): Promise<string[]> {
    const context = await this.getUserContext(userId);
    
    // Analyze weak areas and generate path
    const path: string[] = [];
    
    // Start with fundamentals if beginner
    if (context.skillLevel === 'BEGINNER') {
      path.push('Solidity Basics', 'Variables and Types', 'Functions', 'Control Structures');
    }

    // Add weak areas to focus on
    path.push(...context.weakAreas);

    // Add progressive topics based on skill level
    if (context.skillLevel === 'INTERMEDIATE') {
      path.push('Smart Contract Security', 'Gas Optimization', 'Design Patterns');
    }

    if (context.skillLevel === 'ADVANCED' || context.skillLevel === 'EXPERT') {
      path.push('Advanced Patterns', 'Assembly', 'Protocol Development');
    }

    return path;
  }

  async getAnalytics(userId: string): Promise<LearningAnalytics> {
    const context = await this.getUserContext(userId);
    
    // Calculate analytics
    const analytics: LearningAnalytics = {
      conceptMastery: {}, // Would be calculated from quiz scores
      learningVelocity: 2.5, // concepts per week
      engagementScore: 85,
      progressTrend: 'improving',
      predictedCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      recommendedFocusAreas: context.weakAreas
    };

    return analytics;
  }
}

// Export singleton instance
export const enhancedTutor = new EnhancedTutorSystem();