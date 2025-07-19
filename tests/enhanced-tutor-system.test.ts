import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { enhancedTutor } from '../lib/ai/EnhancedTutorSystem';
import { prisma } from '../lib/prisma';

// Mock Prisma
vi.mock( '../lib/prisma', () => ({
  prisma: {
    aILearningContext: {
      findUnique: vi.fn(_),
      create: vi.fn(_),
      upsert: vi.fn(_),
    },
    userProfile: {
      findUnique: vi.fn(_),
      upsert: vi.fn(_),
    },
    userProgress: {
      findMany: vi.fn(_),
    },
    securityAnalysis: {
      create: vi.fn(_),
    },
  },
}));

// Mock LocalLLMService
vi.mock( '../lib/ai/LocalLLMService', () => ({
  LocalLLMService: vi.fn(_).mockImplementation(() => ({
    isHealthy: vi.fn(_).mockResolvedValue(_true),
    generateResponse: vi.fn(_).mockResolvedValue('Mock LLM response'),
    analyzeCode: vi.fn(_).mockResolvedValue({
      issues: [],
      optimizations: [],
      gasEstimate: 21000,
      securityScore: 85,
    }),
  })),
}));

// Mock Gemini service
vi.mock( '../services/geminiService', () => ({
  sendMessageToGeminiChat: vi.fn(_).mockResolvedValue('Mock Gemini response'),
  initializeChatForModule: vi.fn(_).mockResolvedValue(_undefined),
}));

describe( 'Enhanced Tutor System', () => {
  const mockUserId = 'test-user-123';
  const mockUserProfile = {
    id: 'profile-123',
    userId: mockUserId,
    currentLevel: 3,
    skillLevel: 'INTERMEDIATE',
    totalXP: 1500,
    streak: 7,
    lastActiveDate: new Date(_),
  };

  const mockAIContext = {
    id: 'ai-context-123',
    userId: mockUserId,
    currentLevel: 3,
    skillLevel: 'INTERMEDIATE',
    learningPath: JSON.stringify( ['Solidity Basics', 'Smart Contracts', 'DeFi']),
    recentTopics: JSON.stringify( ['Functions', 'Modifiers', 'Events']),
    weakAreas: JSON.stringify( ['Gas Optimization', 'Security']),
    strongAreas: JSON.stringify( ['Syntax', 'Data Types']),
    preferredLearningStyle: 'mixed',
  };

  beforeEach(() => {
    vi.clearAllMocks(_);
  });

  afterEach(() => {
    vi.restoreAllMocks(_);
  });

  describe( 'Database Integration', () => {
    it( 'should fetch user context from database successfully', async () => {
      // Mock database responses
      (_prisma.aILearningContext.findUnique as Mock).mockResolvedValue(_mockAIContext);
      (_prisma.userProfile.findUnique as Mock).mockResolvedValue(_mockUserProfile);
      (_prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      const context = await enhancedTutor.getUserContext(_mockUserId);

      expect(_context).toBeDefined(_);
      expect(_context.userId).toBe(_mockUserId);
      expect(_context.skillLevel).toBe('INTERMEDIATE');
      expect(_context.currentLevel).toBe(3);
      expect(_context.learningPath).toEqual( ['Solidity Basics', 'Smart Contracts', 'DeFi']);
      expect(_context.recentTopics).toEqual( ['Functions', 'Modifiers', 'Events']);
      expect(_context.weakAreas).toEqual( ['Gas Optimization', 'Security']);
      expect(_context.strongAreas).toEqual( ['Syntax', 'Data Types']);
    });

    it( 'should create default context for new users', async () => {
      // Mock no existing context
      (_prisma.aILearningContext.findUnique as Mock).mockResolvedValue(_null);
      (_prisma.userProfile.findUnique as Mock).mockResolvedValue(_null);
      (_prisma.userProgress.findMany as Mock).mockResolvedValue([]);
      (_prisma.aILearningContext.create as Mock).mockResolvedValue(_mockAIContext);

      const context = await enhancedTutor.getUserContext('new-user-456');

      expect(_context).toBeDefined(_);
      expect(_context.userId).toBe('new-user-456');
      expect(_context.skillLevel).toBe('BEGINNER');
      expect(_context.currentLevel).toBe(1);
      expect(_context.learningPath).toContain('Solidity Basics');
      expect(_prisma.aILearningContext.create).toHaveBeenCalled(_);
    });

    it( 'should handle database errors gracefully', async () => {
      // Clear cache to ensure we test the database error path
      (_enhancedTutor as any).userContextCache.clear(_);

      // Mock database error
      (_prisma.aILearningContext.findUnique as Mock).mockRejectedValue(_new Error('Database error'));

      const context = await enhancedTutor.getUserContext('error-test-user');

      expect(_context).toBeDefined(_);
      expect(_context.userId).toBe('error-test-user');
      expect(_context.skillLevel).toBe('BEGINNER'); // Fallback values
    });

    it( 'should update user context in database', async () => {
      // Setup existing context
      (_prisma.aILearningContext.findUnique as Mock).mockResolvedValue(_mockAIContext);
      (_prisma.userProfile.findUnique as Mock).mockResolvedValue(_mockUserProfile);
      (_prisma.userProgress.findMany as Mock).mockResolvedValue([]);
      (_prisma.aILearningContext.upsert as Mock).mockResolvedValue(_mockAIContext);
      (_prisma.userProfile.upsert as Mock).mockResolvedValue(_mockUserProfile);

      const updates = {
        currentLevel: 4,
        totalXP: 2000,
        weakAreas: ['Advanced Security'],
      };

      await enhancedTutor.updateUserContext( mockUserId, updates);

      expect(_prisma.aILearningContext.upsert).toHaveBeenCalled(_);
      expect(_prisma.userProfile.upsert).toHaveBeenCalled(_);
    });
  });

  describe( 'AI Response Parsing', () => {
    it( 'should parse JSON security analysis correctly', async () => {
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
      const parseMethod = (_enhancedTutor as any).parseSecurityAnalysis.bind(_enhancedTutor);
      const result = parseMethod(_mockJsonResponse);

      expect(_result.vulnerabilities).toHaveLength(1);
      expect(_result.vulnerabilities[0].type).toBe('reentrancy');
      expect(_result.vulnerabilities[0].severity).toBe('high');
      expect(_result.gasOptimizations).toHaveLength(1);
      expect(_result.gasOptimizations[0].gasSavings).toBe(500);
      expect(_result.overallScore).toBe(_75);
    });

    it( 'should parse text-based security analysis as fallback', async () => {
      const mockTextResponse = `
        Security Analysis:
        Vulnerability: Reentrancy risk detected in withdraw function
        Gas optimization: Consider using external visibility for better gas efficiency
        Best practice: Add proper access control modifiers
      `;

      const parseMethod = (_enhancedTutor as any).parseSecurityAnalysis.bind(_enhancedTutor);
      const result = parseMethod(_mockTextResponse);

      expect(_result.vulnerabilities.length).toBeGreaterThan(0);
      expect(_result.gasOptimizations.length).toBeGreaterThan(0);
      expect(_result.bestPractices.length).toBeGreaterThan(0);
      expect(_result.overallScore).toBeGreaterThan(0);
    });

    it( 'should parse contract generation response', async () => {
      const mockContractResponse =
        'Here\'s your smart contract:\n\n' +
        '```solidity\n' +
        '// SPDX-License-Identifier: MIT\n' +
        'pragma solidity ^0.8.20;\n\n' +
        'contract TestContract {\n' +
        '    uint256 public value;\n\n' +
        '    function setValue(_uint256 _value) external {\n' +
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

      const parseMethod = (_enhancedTutor as any).parseContractGeneration.bind(_enhancedTutor);
      const result = parseMethod(_mockContractResponse);

      expect(_result.code).toContain('contract TestContract');
      expect(_result.code).toContain('function setValue');
      expect(_result.securityConsiderations.length).toBeGreaterThan(0);
      expect(_result.gasOptimizations.length).toBeGreaterThan(0);
      expect(_result.testSuggestions.length).toBeGreaterThan(0);
    });

    it( 'should parse challenge generation response', async () => {
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

      const parseMethod = (_enhancedTutor as any).parseChallenge.bind(_enhancedTutor);
      const result = parseMethod(_mockChallengeResponse);

      expect(_result.title).toBe('Token Transfer Challenge');
      expect(_result.description).toContain('ERC20-like token');
      expect(_result.difficulty).toBe(_6);
      expect(_result.starterCode).toContain('contract TokenChallenge');
      expect(_result.testCases.length).toBeGreaterThan(0);
      expect(_result.hints.length).toBeGreaterThan(0);
      expect(_result.learningObjectives.length).toBeGreaterThan(0);
    });
  });

  describe( 'Local LLM Integration', () => {
    it( 'should use local LLM for code analysis when healthy', async () => {
      // Setup mocks
      (_prisma.aILearningContext.findUnique as Mock).mockResolvedValue(_mockAIContext);
      (_prisma.userProfile.findUnique as Mock).mockResolvedValue(_mockUserProfile);
      (_prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      const mockCode = `
        pragma solidity ^0.8.20;
        contract Test {
            uint256 public value;
        }
      `;

      const result = await enhancedTutor.analyzeCodeSecurity( mockCode, mockUserId);

      expect(_result).toBeDefined(_);
      expect(_result.vulnerabilities).toBeDefined(_);
      expect(_result.gasOptimizations).toBeDefined(_);
      expect(_result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it( 'should handle local LLM failures gracefully', async () => {
      // Clear cache to ensure fresh context
      (_enhancedTutor as any).userContextCache.clear(_);

      // Mock LLM service to be unhealthy and throw errors
      const mockLocalLLM = (_enhancedTutor as any).localLLMService;
      mockLocalLLM.isHealthy.mockResolvedValue(_false);
      mockLocalLLM.generateResponse.mockRejectedValue(_new Error('Local LLM failed'));

      // Setup database mocks
      (_prisma.aILearningContext.findUnique as Mock).mockResolvedValue(_mockAIContext);
      (_prisma.userProfile.findUnique as Mock).mockResolvedValue(_mockUserProfile);
      (_prisma.userProgress.findMany as Mock).mockResolvedValue([]);

      // Mock Gemini service to also fail to test final fallback
      const { sendMessageToGeminiChat } = await import('../services/geminiService');
      (_sendMessageToGeminiChat as Mock).mockRejectedValue(_new Error('Gemini failed'));

      const result = await enhancedTutor.explainConcept( 'smart contracts', mockUserId);

      expect(_result).toBeDefined(_);
      expect(_result.content).toBeDefined(_);
      expect(_result.model).toBe('Fallback');
      expect(_result.content).toContain('unable to process');
    });
  });
});
