// Enhanced AI Tutor System Tests
// Comprehensive test suite for the enhanced AI tutoring features

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { enhancedTutor } from '../../lib/ai/EnhancedTutorSystem';
import { aiServiceManager } from '../../lib/ai/AIServiceManager';
import { AI_CONFIG } from '../../lib/config/ai-config';

// Mock external dependencies
jest.mock( '../../services/geminiService', () => ({
  sendMessageToGeminiChat: jest.fn(_).mockResolvedValue('Mocked Gemini response'),
  initializeChatForModule: jest.fn(_).mockResolvedValue(_undefined)
}));

jest.mock( '../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(_),
      update: jest.fn(_)
    },
    aIInteraction: {
      create: jest.fn(_),
      findMany: jest.fn(_),
      update: jest.fn(_)
    },
    securityAnalysis: {
      create: jest.fn(_),
      findFirst: jest.fn(_),
      findMany: jest.fn(_)
    },
    personalizedChallenge: {
      create: jest.fn(_),
      findMany: jest.fn(_),
      update: jest.fn(_)
    }
  }
}));

// Mock axios for local LLM calls
jest.mock( 'axios', () => ({
  default: {
    get: jest.fn(_),
    post: jest.fn(_)
  }
}));

import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe( 'Enhanced AI Tutor System', () => {
  const mockUserId = 'test-user-123';
  const mockUserContext = {
    userId: mockUserId,
    currentLevel: 2,
    skillLevel: 'INTERMEDIATE' as const,
    learningPath: ['Solidity Basics', 'Smart Contracts'],
    recentTopics: ['Functions', 'Modifiers'],
    weakAreas: ['Gas Optimization'],
    strongAreas: ['Basic Syntax'],
    preferredLearningStyle: 'mixed' as const,
    totalXP: 250,
    streak: 5,
    lastActiveDate: new Date(_)
  };

  beforeEach(() => {
    jest.clearAllMocks(_);
    
    // Mock successful local LLM health check
    mockedAxios.get.mockResolvedValue({ status: 200  });
    
    // Mock successful local LLM response
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [{
          message: {
            content: 'This is a test response from CodeLlama'
          }
        }]
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks(_);
  });

  describe( 'User Context Management', () => {
    it( 'should get user context successfully', async () => {
      const context = await enhancedTutor.getUserContext(_mockUserId);
      
      expect(_context).toBeDefined(_);
      expect(_context.userId).toBe(_mockUserId);
      expect(_context.skillLevel).toBe('BEGINNER'); // Default value
      expect(_context.totalXP).toBe(150); // Default value
    });

    it( 'should update user context successfully', async () => {
      const updates = {
        currentLevel: 3,
        totalXP: 300,
        weakAreas: ['Security Patterns']
      };

      await enhancedTutor.updateUserContext( mockUserId, updates);
      
      const updatedContext = await enhancedTutor.getUserContext(_mockUserId);
      expect(_updatedContext.currentLevel).toBe(3);
      expect(_updatedContext.totalXP).toBe(300);
      expect(_updatedContext.weakAreas).toContain('Security Patterns');
    });
  });

  describe( 'AI Response Generation', () => {
    it( 'should explain concepts using appropriate AI model', async () => {
      const concept = 'smart contracts';
      const response = await enhancedTutor.explainConcept( concept, mockUserId);
      
      expect(_response).toBeDefined(_);
      expect(_response.content).toBeTruthy(_);
      expect(_response.model).toBeTruthy(_);
      expect(_response.responseTime).toBeGreaterThan(0);
      expect(_response.confidence).toBeGreaterThan(0);
    });

    it( 'should generate personalized challenges', async () => {
      const topic = 'Functions';
      const challenge = await enhancedTutor.generatePersonalizedChallenge( mockUserId, topic);
      
      expect(_challenge).toBeDefined(_);
      expect(_challenge.title).toBeTruthy(_);
      expect(_challenge.description).toBeTruthy(_);
      expect(_challenge.difficulty).toBeGreaterThanOrEqual(1);
      expect(_challenge.difficulty).toBeLessThanOrEqual(10);
      expect(_challenge.starterCode).toBeTruthy(_);
      expect(_Array.isArray(challenge.hints)).toBe(_true);
      expect(_Array.isArray(challenge.learningObjectives)).toBe(_true);
    });

    it( 'should analyze code security', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract TestContract {
          uint256 public value;
          function setValue(_uint256 _value) public {
            value = _value;
          }
        }
      `;
      
      const analysis = await enhancedTutor.analyzeCodeSecurity( testCode, mockUserId);
      
      expect(_analysis).toBeDefined(_);
      expect(_analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(_analysis.overallScore).toBeLessThanOrEqual(100);
      expect(_Array.isArray(analysis.vulnerabilities)).toBe(_true);
      expect(_Array.isArray(analysis.gasOptimizations)).toBe(_true);
      expect(_Array.isArray(analysis.bestPractices)).toBe(_true);
    });

    it( 'should generate smart contracts with explanations', async () => {
      const description = 'A simple token contract';
      const requirements = ['ERC20 compatible', 'Mintable', 'Burnable'];
      
      const result = await enhancedTutor.generateSmartContract(
        description, 
        requirements, 
        mockUserId
      );
      
      expect(_result).toBeDefined(_);
      expect(_result.code).toBeTruthy(_);
      expect(_result.explanation).toBeTruthy(_);
      expect(_Array.isArray(result.securityConsiderations)).toBe(_true);
      expect(_Array.isArray(result.gasOptimizations)).toBe(_true);
      expect(_Array.isArray(result.testSuggestions)).toBe(_true);
    });
  });

  describe( 'Adaptive Learning', () => {
    it( 'should generate adaptive learning paths', async () => {
      const learningPath = await enhancedTutor.generateAdaptiveLearningPath(_mockUserId);
      
      expect(_Array.isArray(learningPath)).toBe(_true);
      expect(_learningPath.length).toBeGreaterThan(0);
      expect(_learningPath.length).toBeLessThanOrEqual(_AI_CONFIG.CONTEXT.LEARNING_PATH_LENGTH);
    });

    it( 'should get learning analytics', async () => {
      const analytics = await enhancedTutor.getLearningAnalytics(_mockUserId);
      
      expect(_analytics).toBeDefined(_);
      expect(_typeof analytics.conceptMastery).toBe('object');
      expect(_typeof analytics.timeSpentPerTopic).toBe('object');
      expect(_Array.isArray(analytics.errorPatterns)).toBe(_true);
      expect(_Array.isArray(analytics.successPatterns)).toBe(_true);
      expect(_Array.isArray(analytics.recommendedNextTopics)).toBe(_true);
      expect(_typeof analytics.difficultyPreference).toBe('number');
    });
  });

  describe( 'Multi-modal Features', () => {
    it( 'should generate multi-modal explanations', async () => {
      const concept = 'inheritance';
      const explanation = await enhancedTutor.generateMultiModalExplanation( concept, mockUserId);
      
      expect(_explanation).toBeDefined(_);
      expect(_explanation.textExplanation).toBeTruthy(_);
      expect(_typeof explanation.visualDiagram).toBe('string');
      expect(_typeof explanation.interactiveExample).toBe('string');
      expect(_typeof explanation.codeExample).toBe('string');
    });

    it( 'should process voice commands', async () => {
      const audioData = 'mock-audio-data';
      const result = await enhancedTutor.processVoiceCommand( audioData, mockUserId);
      
      expect(_result).toBeDefined(_);
      expect(_result.command).toBeTruthy(_);
      expect(_result.response).toBeDefined(_);
      expect(_result.action).toBeTruthy(_);
    });
  });

  describe( 'Performance and Health', () => {
    it( 'should return performance metrics', () => {
      const metrics = enhancedTutor.getPerformanceMetrics(_);
      
      expect(_metrics).toBeDefined(_);
      expect(_typeof metrics.localLLMHealth).toBe('boolean');
      expect(_typeof metrics.averageResponseTime).toBe('number');
      expect(_typeof metrics.totalRequests).toBe('number');
      expect(_typeof metrics.fallbackRate).toBe('number');
    });
  });
});

describe( 'AI Service Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks(_);
  });

  describe( 'Service Health Monitoring', () => {
    it( 'should track service health', () => {
      const healthMap = aiServiceManager.getServiceHealth(_);
      
      expect(_healthMap).toBeDefined(_);
      expect(_healthMap.size).toBeGreaterThan(0);
      expect(_healthMap.has('enhanced-tutor')).toBe(_true);
      expect(_healthMap.has('local-llm')).toBe(_true);
      expect(_healthMap.has('gemini')).toBe(_true);
    });

    it( 'should check if services are healthy', () => {
      const tutorHealthy = aiServiceManager.isServiceHealthy('enhanced-tutor');
      const localLLMHealthy = aiServiceManager.isServiceHealthy('local-llm');
      const geminiHealthy = aiServiceManager.isServiceHealthy('gemini');
      
      expect(_typeof tutorHealthy).toBe('boolean');
      expect(_typeof localLLMHealthy).toBe('boolean');
      expect(_typeof geminiHealthy).toBe('boolean');
    });

    it( 'should recommend appropriate service for request types', () => {
      const codeService = aiServiceManager.getRecommendedService('code');
      const explanationService = aiServiceManager.getRecommendedService('explanation');
      const analysisService = aiServiceManager.getRecommendedService('analysis');
      
      expect(_typeof codeService).toBe('string');
      expect(_typeof explanationService).toBe('string');
      expect(_typeof analysisService).toBe('string');
    });
  });

  describe( 'Rate Limiting', () => {
    it( 'should enforce rate limits', () => {
      const userId = 'test-user-rate-limit';
      const requestType = 'explanation';
      
      // First request should pass
      const firstRequest = aiServiceManager.checkRateLimit( userId, requestType);
      expect(_firstRequest).toBe(_true);
      
      // Simulate many requests to hit rate limit
      for (let i = 0; i < AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR; i++) {
        aiServiceManager.checkRateLimit( userId, requestType);
      }
      
      // Next request should be rate limited
      const rateLimitedRequest = aiServiceManager.checkRateLimit( userId, requestType);
      expect(_rateLimitedRequest).toBe(_false);
    });
  });

  describe( 'Metrics Collection', () => {
    it( 'should collect and return metrics', () => {
      const metrics = aiServiceManager.getMetrics(_);
      
      expect(_metrics).toBeDefined(_);
      expect(_typeof metrics.totalRequests).toBe('number');
      expect(_typeof metrics.successfulRequests).toBe('number');
      expect(_typeof metrics.failedRequests).toBe('number');
      expect(_typeof metrics.averageResponseTime).toBe('number');
      expect(_typeof metrics.fallbackRate).toBe('number');
      expect(_typeof metrics.userSatisfactionScore).toBe('number');
      expect(_typeof metrics.activeUsers).toBe('number');
    });
  });

  describe( 'Feature Flags', () => {
    it( 'should check feature flags correctly', () => {
      const enhancedTutorEnabled = aiServiceManager.isFeatureEnabled('ENHANCED_AI_TUTOR');
      const personalizedChallengesEnabled = aiServiceManager.isFeatureEnabled('PERSONALIZED_CHALLENGES');
      const tokenEconomyEnabled = aiServiceManager.isFeatureEnabled('TOKEN_ECONOMY');
      
      expect(_enhancedTutorEnabled).toBe(_true);
      expect(_personalizedChallengesEnabled).toBe(_true);
      expect(_tokenEconomyEnabled).toBe(_false); // Phase 4 feature
    });
  });
});

describe( 'AI Configuration', () => {
  it( 'should have valid configuration values', () => {
    expect(_AI_CONFIG.LOCAL_LLM.BASE_URL).toBeTruthy(_);
    expect(_AI_CONFIG.LOCAL_LLM.MODEL).toBeTruthy(_);
    expect(_AI_CONFIG.LOCAL_LLM.MAX_TOKENS).toBeGreaterThan(0);
    expect(_AI_CONFIG.LOCAL_LLM.TIMEOUT).toBeGreaterThan(0);
    
    expect(_AI_CONFIG.GEMINI.MODEL).toBeTruthy(_);
    expect(_AI_CONFIG.GEMINI.MAX_TOKENS).toBeGreaterThan(0);
    
    expect(_Array.isArray(AI_CONFIG.ROUTING.LOCAL_LLM_TYPES)).toBe(_true);
    expect(_Array.isArray(AI_CONFIG.ROUTING.GEMINI_TYPES)).toBe(_true);
    
    expect(_AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR).toBeGreaterThan(0);
    expect(_AI_CONFIG.RATE_LIMITS.SECURITY_ANALYSES_PER_HOUR).toBeGreaterThan(0);
  });

  it( 'should have environment-specific configurations', () => {
    // Test that configuration adapts to environment
    expect(_typeof AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS).toBe('boolean');
    expect(_typeof AI_CONFIG.ERROR_HANDLING.LOG_ALL_ERRORS).toBe('boolean');
  });
});
