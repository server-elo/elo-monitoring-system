import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { enhancedTutor } from '../lib/ai/EnhancedTutorSystem';
import { prisma } from '../lib/prisma';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  prisma: {
    aILearningContext: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    userProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    userProgress: {
      findMany: vi.fn(),
    },
    securityAnalysis: {
      create: vi.fn(),
    },
  },
}));

// Mock LocalLLMService
vi.mock('../lib/ai/LocalLLMService', () => ({
  LocalLLMService: vi.fn().mockImplementation(() => ({
    isHealthy: vi.fn().mockResolvedValue(true),
    generateResponse: vi.fn().mockResolvedValue('Mock LLM response'),
    analyzeCode: vi.fn().mockResolvedValue({
      issues: [],
      optimizations: [],
      gasEstimate: 21000,
      securityScore: 85,
    }),
  })),
}));

// Mock Gemini service
vi.mock('../services/geminiService', () => ({
  sendMessageToGeminiChat: vi.fn().mockResolvedValue('Mock Gemini response'),
  initializeChatForModule: vi.fn().mockResolvedValue(undefined),
}));

describe('Enhanced Tutor System', () => {
  const mockUserId = 'test-user-123';
  const mockUserProfile = {
    id: 'profile-123',
    userId: mockUserId,
    currentLevel: 3,
    skillLevel: 'INTERMEDIATE',
    totalXP: 1500,
    streak: 7,
    lastActiveDate: new Date(),
  };

  const mockAIContext = {
    id: 'ai-context-123',
    userId: mockUserId,
    currentLevel: 3,
    skillLevel: 'INTERMEDIATE',
    learningPath: JSON.stringify(['Solidity Basics', 'Smart Contracts', 'DeFi']),
    recentTopics: JSON.stringify(['Functions', 'Modifiers', 'Events']),
    weakAreas: JSON.stringify(['Gas Optimization', 'Security']),
    strongAreas: JSON.stringify(['Syntax', 'Data Types']),
    preferredLearningStyle: 'mixed',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Database Integration', () => {
    it('should fetch user context from database successfully', async () => {
      // Mock database responses
      (prisma.aILearningContext.findUnique as Mock).mockResolvedValue(mockAIContext);
      (prisma.userProfile.findUnique as Mock).mockResolvedValue(mockUserProfile);
      (prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      const context = await enhancedTutor.getUserContext(mockUserId);

      expect(context).toBeDefined();
      expect(context.userId).toBe(mockUserId);
      expect(context.skillLevel).toBe('INTERMEDIATE');
      expect(context.currentLevel).toBe(3);
      expect(context.learningPath).toEqual(['Solidity Basics', 'Smart Contracts', 'DeFi']);
      expect(context.recentTopics).toEqual(['Functions', 'Modifiers', 'Events']);
      expect(context.weakAreas).toEqual(['Gas Optimization', 'Security']);
      expect(context.strongAreas).toEqual(['Syntax', 'Data Types']);
    });

    it('should create default context for new users', async () => {
      // Mock no existing context
      (prisma.aILearningContext.findUnique as Mock).mockResolvedValue(null);
      (prisma.userProfile.findUnique as Mock).mockResolvedValue(null);
      (prisma.userProgress.findMany as Mock).mockResolvedValue([]);
      (prisma.aILearningContext.create as Mock).mockResolvedValue(mockAIContext);

      const context = await enhancedTutor.getUserContext('new-user-456');

      expect(context).toBeDefined();
      expect(context.userId).toBe('new-user-456');
      expect(context.skillLevel).toBe('BEGINNER');
      expect(context.currentLevel).toBe(1);
      expect(context.learningPath).toContain('Solidity Basics');
      expect(prisma.aILearningContext.create).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Clear cache to ensure we test the database error path
      (enhancedTutor as any).userContextCache.clear();

      // Mock database error
      (prisma.aILearningContext.findUnique as Mock).mockRejectedValue(new Error('Database error'));

      const context = await enhancedTutor.getUserContext('error-test-user');

      expect(context).toBeDefined();
      expect(context.userId).toBe('error-test-user');
      expect(context.skillLevel).toBe('BEGINNER'); // Fallback values
    });

    it('should update user context in database', async () => {
      // Setup existing context
      (prisma.aILearningContext.findUnique as Mock).mockResolvedValue(mockAIContext);
      (prisma.userProfile.findUnique as Mock).mockResolvedValue(mockUserProfile);
      (prisma.userProgress.findMany as Mock).mockResolvedValue([]);
      (prisma.aILearningContext.upsert as Mock).mockResolvedValue(mockAIContext);
      (prisma.userProfile.upsert as Mock).mockResolvedValue(mockUserProfile);

      const updates = {
        currentLevel: 4,
        totalXP: 2000,
        weakAreas: ['Advanced Security'],
      };

      await enhancedTutor.updateUserContext(mockUserId, updates);

      expect(prisma.aILearningContext.upsert).toHaveBeenCalled();
      expect(prisma.userProfile.upsert).toHaveBeenCalled();
    });
  });

  describe('AI Response Parsing', () => {
    it('should parse JSON security analysis correctly', async () => {
      const mockJsonResponse = JSON.stringify({
        vulnerabilities: [
          {
            type: 'reentrancy',
            severity: 'high',
            description: 'Potential reentrancy vulnerability',
            line: 15,
            recommendation: 'Use reentrancy guard',
          },
        ],
        gasOptimizations: [
          {
            description: 'Use external visibility',
            impact: 'medium',
            beforeCode: 'function test() public',
            afterCode: 'function test() external',
            gasSavings: 500,
          },
        ],
        bestPractices: [
          {
            category: 'Security',
            recommendation: 'Add input validation',
            importance: 'high',
          },
        ],
        overallScore: 75,
      });

      // Access the private method through reflection for testing
      const parseMethod = (enhancedTutor as any).parseSecurityAnalysis.bind(enhancedTutor);
      const result = parseMethod(mockJsonResponse);

      expect(result.vulnerabilities).toHaveLength(1);
      expect(result.vulnerabilities[0].type).toBe('reentrancy');
      expect(result.vulnerabilities[0].severity).toBe('high');
      expect(result.gasOptimizations).toHaveLength(1);
      expect(result.gasOptimizations[0].gasSavings).toBe(500);
      expect(result.overallScore).toBe(75);
    });

    it('should parse text-based security analysis as fallback', async () => {
      const mockTextResponse = `
        Security Analysis:
        Vulnerability: Reentrancy risk detected in withdraw function
        Gas optimization: Consider using external visibility for better gas efficiency
        Best practice: Add proper access control modifiers
      `;

      const parseMethod = (enhancedTutor as any).parseSecurityAnalysis.bind(enhancedTutor);
      const result = parseMethod(mockTextResponse);

      expect(result.vulnerabilities.length).toBeGreaterThan(0);
      expect(result.gasOptimizations.length).toBeGreaterThan(0);
      expect(result.bestPractices.length).toBeGreaterThan(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it('should parse contract generation response', async () => {
      const mockContractResponse =
        'Here\'s your smart contract:\n\n' +
        '```solidity\n' +
        '// SPDX-License-Identifier: MIT\n' +
        'pragma solidity ^0.8.20;\n\n' +
        'contract TestContract {\n' +
        '    uint256 public value;\n\n' +
        '    function setValue(uint256 _value) external {\n' +
        '        value = _value;\n' +
        '    }\n' +
        '}\n' +
        '```\n\n' +
        'Security considerations:\n' +
        '- Add access control\n' +
        '- Validate inputs\n\n' +
        'Gas optimizations:\n' +
        '- Use external visibility\n' +
        '- Pack structs efficiently\n\n' +
        'Test suggestions:\n' +
        '- Test setValue function\n' +
        '- Test edge cases';

      const parseMethod = (enhancedTutor as any).parseContractGeneration.bind(enhancedTutor);
      const result = parseMethod(mockContractResponse);

      expect(result.code).toContain('contract TestContract');
      expect(result.code).toContain('function setValue');
      expect(result.securityConsiderations.length).toBeGreaterThan(0);
      expect(result.gasOptimizations.length).toBeGreaterThan(0);
      expect(result.testSuggestions.length).toBeGreaterThan(0);
    });

    it('should parse challenge generation response', async () => {
      const mockChallengeResponse =
        'Title: Token Transfer Challenge\n' +
        'Description: Create a simple ERC20-like token with transfer functionality\n' +
        'Difficulty: 6\n\n' +
        '```solidity\n' +
        '// SPDX-License-Identifier: MIT\n' +
        'pragma solidity ^0.8.20;\n\n' +
        'contract TokenChallenge {\n' +
        '    // Your code here\n' +
        '}\n' +
        '```\n\n' +
        'Test cases:\n' +
        '- Test token transfer\n' +
        '- Test balance updates\n' +
        '- Test edge cases\n\n' +
        'Hints:\n' +
        '- Use mapping for balances\n' +
        '- Check for sufficient balance\n' +
        '- Emit events for transfers\n\n' +
        'Learning objectives:\n' +
        '- Understand token mechanics\n' +
        '- Practice state management\n' +
        '- Learn event emission';

      const parseMethod = (enhancedTutor as any).parseChallenge.bind(enhancedTutor);
      const result = parseMethod(mockChallengeResponse);

      expect(result.title).toBe('Token Transfer Challenge');
      expect(result.description).toContain('ERC20-like token');
      expect(result.difficulty).toBe(6);
      expect(result.starterCode).toContain('contract TokenChallenge');
      expect(result.testCases.length).toBeGreaterThan(0);
      expect(result.hints.length).toBeGreaterThan(0);
      expect(result.learningObjectives.length).toBeGreaterThan(0);
    });
  });

  describe('Local LLM Integration', () => {
    it('should use local LLM for code analysis when healthy', async () => {
      // Setup mocks
      (prisma.aILearningContext.findUnique as Mock).mockResolvedValue(mockAIContext);
      (prisma.userProfile.findUnique as Mock).mockResolvedValue(mockUserProfile);
      (prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      const mockCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value;
        }
      `;

      const result = await enhancedTutor.analyzeCodeSecurity(mockCode, mockUserId);

      expect(result).toBeDefined();
      expect(result.vulnerabilities).toBeDefined();
      expect(result.gasOptimizations).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle local LLM failures gracefully', async () => {
      // Clear cache to ensure fresh context
      (enhancedTutor as any).userContextCache.clear();

      // Mock LLM service to be unhealthy and throw errors
      const mockLocalLLM = (enhancedTutor as any).localLLMService;
      mockLocalLLM.isHealthy.mockResolvedValue(false);
      mockLocalLLM.generateResponse.mockRejectedValue(new Error('Local LLM failed'));

      // Setup database mocks
      (prisma.aILearningContext.findUnique as Mock).mockResolvedValue(mockAIContext);
      (prisma.userProfile.findUnique as Mock).mockResolvedValue(mockUserProfile);
      (prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      // Mock Gemini service to also fail to test final fallback
      const { sendMessageToGeminiChat } = await import('../services/geminiService');
      (sendMessageToGeminiChat as Mock).mockRejectedValue(new Error('Gemini failed'));

      const result = await enhancedTutor.explainConcept('smart contracts', mockUserId);

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.model).toBe('Fallback');
      expect(result.content).toContain('unable to process');
    });
  });
});
