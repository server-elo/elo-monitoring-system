// Enhanced AI Tutor System Tests
// Comprehensive test suite for the enhanced AI tutoring features

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { enhancedTutor } from '../../lib/ai/EnhancedTutorSystem';
import { aiServiceManager } from '../../lib/ai/AIServiceManager';
import { AI_CONFIG } from '../../lib/config/ai-config';

// Mock external dependencies
jest.mock('../../services/geminiService', () => ({
  sendMessageToGeminiChat: jest.fn().mockResolvedValue('Mocked Gemini response'),
  initializeChatForModule: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    aIInteraction: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    securityAnalysis: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn()
    },
    personalizedChallenge: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    }
  }
}));

// Mock axios for local LLM calls
jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Enhanced AI Tutor System', () => {
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
    lastActiveDate: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful local LLM health check
    mockedAxios.get.mockResolvedValue({ status: 200 });
    
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
    jest.restoreAllMocks();
  });

  describe('User Context Management', () => {
    it('should get user context successfully', async () => {
      const context = await enhancedTutor.getUserContext(mockUserId);
      
      expect(context).toBeDefined();
      expect(context.userId).toBe(mockUserId);
      expect(context.skillLevel).toBe('BEGINNER'); // Default value
      expect(context.totalXP).toBe(150); // Default value
    });

    it('should update user context successfully', async () => {
      const updates = {
        currentLevel: 3,
        totalXP: 300,
        weakAreas: ['Security Patterns']
      };

      await enhancedTutor.updateUserContext(mockUserId, updates);
      
      const updatedContext = await enhancedTutor.getUserContext(mockUserId);
      expect(updatedContext.currentLevel).toBe(3);
      expect(updatedContext.totalXP).toBe(300);
      expect(updatedContext.weakAreas).toContain('Security Patterns');
    });
  });

  describe('AI Response Generation', () => {
    it('should explain concepts using appropriate AI model', async () => {
      const concept = 'smart contracts';
      const response = await enhancedTutor.explainConcept(concept, mockUserId);
      
      expect(response).toBeDefined();
      expect(response.content).toBeTruthy();
      expect(response.model).toBeTruthy();
      expect(response.responseTime).toBeGreaterThan(0);
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should generate personalized challenges', async () => {
      const topic = 'Functions';
      const challenge = await enhancedTutor.generatePersonalizedChallenge(mockUserId, topic);
      
      expect(challenge).toBeDefined();
      expect(challenge.title).toBeTruthy();
      expect(challenge.description).toBeTruthy();
      expect(challenge.difficulty).toBeGreaterThanOrEqual(1);
      expect(challenge.difficulty).toBeLessThanOrEqual(10);
      expect(challenge.starterCode).toBeTruthy();
      expect(Array.isArray(challenge.hints)).toBe(true);
      expect(Array.isArray(challenge.learningObjectives)).toBe(true);
    });

    it('should analyze code security', async () => {
      const testCode = `
        pragma solidity ^0.8.20;
        contract TestContract {
          uint256 public value;
          function setValue(uint256 _value) public {
            value = _value;
          }
        }
      `;
      
      const analysis = await enhancedTutor.analyzeCodeSecurity(testCode, mockUserId);
      
      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.vulnerabilities)).toBe(true);
      expect(Array.isArray(analysis.gasOptimizations)).toBe(true);
      expect(Array.isArray(analysis.bestPractices)).toBe(true);
    });

    it('should generate smart contracts with explanations', async () => {
      const description = 'A simple token contract';
      const requirements = ['ERC20 compatible', 'Mintable', 'Burnable'];
      
      const result = await enhancedTutor.generateSmartContract(
        description, 
        requirements, 
        mockUserId
      );
      
      expect(result).toBeDefined();
      expect(result.code).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(Array.isArray(result.securityConsiderations)).toBe(true);
      expect(Array.isArray(result.gasOptimizations)).toBe(true);
      expect(Array.isArray(result.testSuggestions)).toBe(true);
    });
  });

  describe('Adaptive Learning', () => {
    it('should generate adaptive learning paths', async () => {
      const learningPath = await enhancedTutor.generateAdaptiveLearningPath(mockUserId);
      
      expect(Array.isArray(learningPath)).toBe(true);
      expect(learningPath.length).toBeGreaterThan(0);
      expect(learningPath.length).toBeLessThanOrEqual(AI_CONFIG.CONTEXT.LEARNING_PATH_LENGTH);
    });

    it('should get learning analytics', async () => {
      const analytics = await enhancedTutor.getLearningAnalytics(mockUserId);
      
      expect(analytics).toBeDefined();
      expect(typeof analytics.conceptMastery).toBe('object');
      expect(typeof analytics.timeSpentPerTopic).toBe('object');
      expect(Array.isArray(analytics.errorPatterns)).toBe(true);
      expect(Array.isArray(analytics.successPatterns)).toBe(true);
      expect(Array.isArray(analytics.recommendedNextTopics)).toBe(true);
      expect(typeof analytics.difficultyPreference).toBe('number');
    });
  });

  describe('Multi-modal Features', () => {
    it('should generate multi-modal explanations', async () => {
      const concept = 'inheritance';
      const explanation = await enhancedTutor.generateMultiModalExplanation(concept, mockUserId);
      
      expect(explanation).toBeDefined();
      expect(explanation.textExplanation).toBeTruthy();
      expect(typeof explanation.visualDiagram).toBe('string');
      expect(typeof explanation.interactiveExample).toBe('string');
      expect(typeof explanation.codeExample).toBe('string');
    });

    it('should process voice commands', async () => {
      const audioData = 'mock-audio-data';
      const result = await enhancedTutor.processVoiceCommand(audioData, mockUserId);
      
      expect(result).toBeDefined();
      expect(result.command).toBeTruthy();
      expect(result.response).toBeDefined();
      expect(result.action).toBeTruthy();
    });
  });

  describe('Performance and Health', () => {
    it('should return performance metrics', () => {
      const metrics = enhancedTutor.getPerformanceMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.localLLMHealth).toBe('boolean');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.fallbackRate).toBe('number');
    });
  });
});

describe('AI Service Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Health Monitoring', () => {
    it('should track service health', () => {
      const healthMap = aiServiceManager.getServiceHealth();
      
      expect(healthMap).toBeDefined();
      expect(healthMap.size).toBeGreaterThan(0);
      expect(healthMap.has('enhanced-tutor')).toBe(true);
      expect(healthMap.has('local-llm')).toBe(true);
      expect(healthMap.has('gemini')).toBe(true);
    });

    it('should check if services are healthy', () => {
      const tutorHealthy = aiServiceManager.isServiceHealthy('enhanced-tutor');
      const localLLMHealthy = aiServiceManager.isServiceHealthy('local-llm');
      const geminiHealthy = aiServiceManager.isServiceHealthy('gemini');
      
      expect(typeof tutorHealthy).toBe('boolean');
      expect(typeof localLLMHealthy).toBe('boolean');
      expect(typeof geminiHealthy).toBe('boolean');
    });

    it('should recommend appropriate service for request types', () => {
      const codeService = aiServiceManager.getRecommendedService('code');
      const explanationService = aiServiceManager.getRecommendedService('explanation');
      const analysisService = aiServiceManager.getRecommendedService('analysis');
      
      expect(typeof codeService).toBe('string');
      expect(typeof explanationService).toBe('string');
      expect(typeof analysisService).toBe('string');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const userId = 'test-user-rate-limit';
      const requestType = 'explanation';
      
      // First request should pass
      const firstRequest = aiServiceManager.checkRateLimit(userId, requestType);
      expect(firstRequest).toBe(true);
      
      // Simulate many requests to hit rate limit
      for (let i = 0; i < AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR; i++) {
        aiServiceManager.checkRateLimit(userId, requestType);
      }
      
      // Next request should be rate limited
      const rateLimitedRequest = aiServiceManager.checkRateLimit(userId, requestType);
      expect(rateLimitedRequest).toBe(false);
    });
  });

  describe('Metrics Collection', () => {
    it('should collect and return metrics', () => {
      const metrics = aiServiceManager.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalRequests).toBe('number');
      expect(typeof metrics.successfulRequests).toBe('number');
      expect(typeof metrics.failedRequests).toBe('number');
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.fallbackRate).toBe('number');
      expect(typeof metrics.userSatisfactionScore).toBe('number');
      expect(typeof metrics.activeUsers).toBe('number');
    });
  });

  describe('Feature Flags', () => {
    it('should check feature flags correctly', () => {
      const enhancedTutorEnabled = aiServiceManager.isFeatureEnabled('ENHANCED_AI_TUTOR');
      const personalizedChallengesEnabled = aiServiceManager.isFeatureEnabled('PERSONALIZED_CHALLENGES');
      const tokenEconomyEnabled = aiServiceManager.isFeatureEnabled('TOKEN_ECONOMY');
      
      expect(enhancedTutorEnabled).toBe(true);
      expect(personalizedChallengesEnabled).toBe(true);
      expect(tokenEconomyEnabled).toBe(false); // Phase 4 feature
    });
  });
});

describe('AI Configuration', () => {
  it('should have valid configuration values', () => {
    expect(AI_CONFIG.LOCAL_LLM.BASE_URL).toBeTruthy();
    expect(AI_CONFIG.LOCAL_LLM.MODEL).toBeTruthy();
    expect(AI_CONFIG.LOCAL_LLM.MAX_TOKENS).toBeGreaterThan(0);
    expect(AI_CONFIG.LOCAL_LLM.TIMEOUT).toBeGreaterThan(0);
    
    expect(AI_CONFIG.GEMINI.MODEL).toBeTruthy();
    expect(AI_CONFIG.GEMINI.MAX_TOKENS).toBeGreaterThan(0);
    
    expect(Array.isArray(AI_CONFIG.ROUTING.LOCAL_LLM_TYPES)).toBe(true);
    expect(Array.isArray(AI_CONFIG.ROUTING.GEMINI_TYPES)).toBe(true);
    
    expect(AI_CONFIG.RATE_LIMITS.AI_REQUESTS_PER_HOUR).toBeGreaterThan(0);
    expect(AI_CONFIG.RATE_LIMITS.SECURITY_ANALYSES_PER_HOUR).toBeGreaterThan(0);
  });

  it('should have environment-specific configurations', () => {
    // Test that configuration adapts to environment
    expect(typeof AI_CONFIG.MONITORING.COLLECT_PERFORMANCE_METRICS).toBe('boolean');
    expect(typeof AI_CONFIG.ERROR_HANDLING.LOG_ALL_ERRORS).toBe('boolean');
  });
});
