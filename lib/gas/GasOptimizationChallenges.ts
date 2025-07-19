/**
 * Gas Optimization Learning Challenges
 * 
 * Transform gas optimization analysis into interactive challenges with cost comparison tools
 * and efficiency competitions, building on our gas optimization visualizer.
 */

import { GasOptimizationAnalyzer, GasAnalysisResult } from './GasOptimizationAnalyzer';
import { enhancedTutor } from '@/lib/ai/EnhancedTutorSystem';
import { adaptiveLearningEngine } from '@/lib/learning/AdaptiveLearningEngine';

export interface GasChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'storage' | 'computation' | 'memory' | 'calls' | 'deployment';
  targetGasReduction: number; // percentage
  maxGasLimit: number;
  baselineCode: string;
  baselineGasCost: number;
  testCases: TestCase[];
  hints: ProgressiveHint[];
  timeLimit?: number; // minutes
  rewards: ChallengeReward[];
  prerequisites: string[];
  learningObjectives: string[];
  realWorldContext: string;
}

export interface TestCase {
  id: string;
  name: string;
  inputs: any[];
  expectedOutput: any;
  gasLimit?: number;
  description: string;
}

export interface ProgressiveHint {
  level: number; // 1-5
  content: string;
  type: 'question' | 'hint' | 'example' | 'solution';
  gasCostHint?: number;
  codeSnippet?: string;
}

export interface ChallengeReward {
  type: 'badge' | 'points' | 'unlock' | 'certificate';
  name: string;
  description: string;
  value: number;
  condition: string;
}

export interface ChallengeResult {
  challengeId: string;
  userId: string;
  submittedCode: string;
  gasUsed: number;
  gasReduction: number;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  testsPassed: number;
  totalTests: number;
  passed: boolean;
  feedback: ChallengeFeedback;
  achievements: string[];
  nextRecommendations: string[];
}

export interface ChallengeFeedback {
  overall: string;
  gasOptimization: string;
  codeQuality: string;
  securityNotes: string;
  improvements: string[];
  strengths: string[];
  nextSteps: string[];
}

export interface ChallengeLeaderboard {
  challengeId: string;
  entries: LeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  gasUsed: number;
  score: number;
  timeSpent: number;
  submissionTime: Date;
  rank: number;
}

export interface CompetitionEvent {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  challenges: string[];
  prizes: ChallengeReward[];
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
}

export class GasOptimizationChallenges {
  private gasAnalyzer: GasOptimizationAnalyzer;
  private challengeTemplates: Map<string, GasChallenge> = new Map();

  constructor(gasAnalyzer: GasOptimizationAnalyzer) {
    this.gasAnalyzer = gasAnalyzer;
    this.initializeChallengeTemplates();
  }

  // Generate personalized challenge based on user's learning profile
  async generatePersonalizedChallenge(
    userId: string,
    targetDifficulty: 'beginner' | 'intermediate' | 'advanced',
    focusArea?: string
  ): Promise<GasChallenge> {
    console.log(`🎯 Generating personalized gas challenge for user ${userId}`);
    
    // Get user's learning profile
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    
    // Determine focus area based on weaknesses
    const category = focusArea || this.selectOptimalCategory(profile.weaknessPatterns);
    
    // Generate AI-powered challenge
    const prompt = this.buildChallengePrompt(targetDifficulty, category, profile);
    const aiResponse = await enhancedTutor.getAIResponse(
      prompt,
      { userId },
      'code'
    );
    
    const challenge = await this.parseGeneratedChallenge(
      aiResponse.content,
      targetDifficulty,
      category,
      userId
    );
    
    console.log(`✅ Generated challenge: ${challenge.title}`);
    return challenge;
  }

  // Evaluate user's challenge submission
  async evaluateSubmission(
    challenge: GasChallenge,
    submittedCode: string,
    userId: string,
    timeSpent: number,
    hintsUsed: number
  ): Promise<ChallengeResult> {
    console.log(`🔍 Evaluating challenge submission for ${challenge.id}`);
    
    const startTime = Date.now();
    
    try {
      // Analyze gas usage of submitted code
      const gasAnalysis = await this.analyzeSubmittedCode(submittedCode, userId);
      
      // Run test cases
      const testResults = await this.runTestCases(submittedCode, challenge.testCases);
      
      // Calculate gas reduction
      const gasReduction = this.calculateGasReduction(
        challenge.baselineGasCost,
        gasAnalysis.totalGasCost
      );
      
      // Calculate score
      const score = this.calculateChallengeScore(
        challenge,
        gasReduction,
        testResults,
        timeSpent,
        hintsUsed
      );
      
      // Generate feedback
      const feedback = await this.generateDetailedFeedback(
        challenge,
        gasAnalysis,
        gasReduction,
        testResults,
        submittedCode
      );
      
      // Check for achievements
      const achievements = this.checkAchievements(challenge, gasReduction, score, timeSpent);
      
      // Generate next recommendations
      const nextRecommendations = await this.generateNextRecommendations(
        userId,
        challenge,
        gasAnalysis
      );
      
      const result: ChallengeResult = {
        challengeId: challenge.id,
        userId,
        submittedCode,
        gasUsed: gasAnalysis.totalGasCost,
        gasReduction,
        score,
        timeSpent,
        hintsUsed,
        testsPassed: testResults.passed,
        totalTests: testResults.total,
        passed: score >= 70 && testResults.passed >= testResults.total * 0.8,
        feedback,
        achievements,
        nextRecommendations
      };
      
      // Save result and update user progress
      await this.saveChallengeResult(result);
      await this.updateUserProgress(userId, result);
      
      console.log(`✅ Challenge evaluation completed: ${result.passed ? 'PASSED' : 'FAILED'}`);
      return result;
      
    } catch (error) {
      console.error('Challenge evaluation failed:', error);
      throw error;
    }
  }

  // Create efficiency competition
  async createCompetition(
    name: string,
    description: string,
    challengeIds: string[],
    duration: number // hours
  ): Promise<CompetitionEvent> {
    const competition: CompetitionEvent = {
      id: `comp-${Date.now()}`,
      name,
      description,
      startTime: new Date(),
      endTime: new Date(Date.now() + duration * 60 * 60 * 1000),
      challenges: challengeIds,
      prizes: this.generateCompetitionPrizes(),
      participants: 0,
      status: 'active'
    };
    
    await this.saveCompetition(competition);
    return competition;
  }

  // Get challenge leaderboard
  async getChallengeLeaderboard(challengeId: string, userId?: string): Promise<ChallengeLeaderboard> {
    const results = await this.getChallengeResults(challengeId);
    
    // Sort by score (descending) then by gas used (ascending)
    const sortedResults = results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.gasUsed - b.gasUsed;
    });
    
    const entries: LeaderboardEntry[] = sortedResults.map((result, index) => ({
      userId: result.userId,
      username: `User${result.userId.slice(-4)}`, // Anonymized for demo
      gasUsed: result.gasUsed,
      score: result.score,
      timeSpent: result.timeSpent,
      submissionTime: new Date(), // Would come from database
      rank: index + 1
    }));
    
    const userRank = userId ? entries.findIndex(e => e.userId === userId) + 1 : undefined;
    
    return {
      challengeId,
      entries: entries.slice(0, 100), // Top 100
      userRank: userRank || undefined,
      totalParticipants: entries.length
    };
  }

  // Generate cost comparison visualization
  generateCostComparison(
    baselineGas: number,
    optimizedGas: number,
    gasPrice: number = 20 // gwei
  ): CostComparison {
    const gasSaved = baselineGas - optimizedGas;
    const percentageSaved = (gasSaved / baselineGas) * 100;
    const costSavedWei = gasSaved * gasPrice * 1e9; // Convert gwei to wei
    const costSavedEth = costSavedWei / 1e18;
    
    return {
      baselineGas,
      optimizedGas,
      gasSaved,
      percentageSaved,
      costSavedWei,
      costSavedEth,
      gasPrice,
      visualization: this.createGasVisualization(baselineGas, optimizedGas)
    };
  }

  // Private helper methods
  private selectOptimalCategory(weaknessPatterns: string[]): string {
    const categoryMapping = {
      'storage': ['sstore', 'sload', 'storage-packing'],
      'computation': ['arithmetic', 'loops', 'unchecked'],
      'memory': ['memory-allocation', 'array-operations'],
      'calls': ['external-calls', 'function-visibility'],
      'deployment': ['contract-size', 'constructor-optimization']
    };
    
    // Find category with most weakness patterns
    let maxMatches = 0;
    let selectedCategory = 'storage';
    
    for (const [category, patterns] of Object.entries(categoryMapping)) {
      const matches = patterns.filter(p => 
        weaknessPatterns.some(w => w.includes(p))
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        selectedCategory = category;
      }
    }
    
    return selectedCategory;
  }

  private buildChallengePrompt(
    difficulty: string,
    category: string,
    profile: any
  ): string {
    return `
      Generate a gas optimization challenge with the following requirements:
      
      Difficulty: ${difficulty}
      Category: ${category}
      User's weakness patterns: ${profile.weaknessPatterns.join(', ')}
      User's learning velocity: ${profile.learningVelocity}
      
      Create a challenge that includes:
      1. Inefficient Solidity code (50-150 lines)
      2. Clear optimization target (specific gas reduction percentage)
      3. Real-world context (DeFi, NFT, DAO, etc.)
      4. Test cases to validate functionality
      5. Progressive hints (5 levels)
      6. Learning objectives
      
      Focus on ${category} optimizations and address the user's weakness patterns.
      Make it engaging and educational for a ${difficulty} level developer.
      
      Provide the response in JSON format with all required fields.
    `;
  }

  private async parseGeneratedChallenge(
    aiContent: string,
    difficulty: string,
    category: string,
    userId: string
  ): Promise<GasChallenge> {
    // Parse AI response and create structured challenge
    // This would include proper JSON parsing and validation
    
    const challengeId = `challenge-${Date.now()}-${userId}`;
    
    // For demo purposes, return a structured challenge
    return {
      id: challengeId,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Optimization Challenge`,
      description: `Optimize this ${category} implementation to reduce gas costs`,
      difficulty: difficulty as any,
      category: category as any,
      targetGasReduction: difficulty === 'beginner' ? 20 : difficulty === 'intermediate' ? 35 : 50,
      maxGasLimit: 1000000,
      baselineCode: this.getBaselineCode(category, difficulty),
      baselineGasCost: this.estimateBaselineGas(category, difficulty),
      testCases: this.generateTestCases(category),
      hints: this.generateProgressiveHints(category, difficulty),
      timeLimit: difficulty === 'beginner' ? 30 : difficulty === 'intermediate' ? 45 : 60,
      rewards: this.generateChallengeRewards(difficulty),
      prerequisites: this.getPrerequisites(category, difficulty),
      learningObjectives: this.getLearningObjectives(category),
      realWorldContext: this.getRealWorldContext(category)
    };
  }

  private async analyzeSubmittedCode(_code: string, userId: string): Promise<GasAnalysisResult> {
    // Use our existing gas analyzer
    return await this.gasAnalyzer.analyzeGasUsage(userId);
  }

  private calculateGasReduction(baseline: number, optimized: number): number {
    return ((baseline - optimized) / baseline) * 100;
  }

  private calculateChallengeScore(
    challenge: GasChallenge,
    gasReduction: number,
    testResults: any,
    timeSpent: number,
    hintsUsed: number
  ): number {
    let score = 0;
    
    // Gas optimization score (50% weight)
    const gasScore = Math.min(100, (gasReduction / challenge.targetGasReduction) * 100);
    score += gasScore * 0.5;
    
    // Test passing score (30% weight)
    const testScore = (testResults.passed / testResults.total) * 100;
    score += testScore * 0.3;
    
    // Time bonus (10% weight)
    const timeBonus = Math.max(0, 100 - (timeSpent / (challenge.timeLimit || 60)) * 100);
    score += timeBonus * 0.1;
    
    // Hint penalty (10% weight)
    const hintPenalty = Math.max(0, 100 - (hintsUsed * 10));
    score += hintPenalty * 0.1;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private initializeChallengeTemplates(): void {
    // Initialize predefined challenge templates
    console.log('🔄 Initializing gas optimization challenge templates...');
  }

  private getBaselineCode(category: string, difficulty: string): string {
    // Return category-specific baseline code
    const templates = {
      storage: `
        contract StorageExample {
            uint256 public value1;
            uint256 public value2;
            uint256 public value3;
            
            function updateValues(uint256 _v1, uint256 _v2, uint256 _v3) external {
                value1 = _v1;
                value2 = _v2;
                value3 = _v3;
            }
        }
      `,
      computation: `
        contract ComputationExample {
            function inefficientLoop(uint256[] memory data) external pure returns (uint256) {
                uint256 sum = 0;
                for (uint256 i = 0; i < data.length; i++) {
                    sum = sum + data[i] * 2;
                }
                return sum;
            }
        }
      `
    };
    
    return templates[category] || templates.storage;
  }

  private estimateBaselineGas(category: string, difficulty: string): number {
    const estimates = {
      storage: { beginner: 100000, intermediate: 200000, advanced: 500000 },
      computation: { beginner: 50000, intermediate: 150000, advanced: 300000 }
    };
    
    return estimates[category]?.[difficulty] || 100000;
  }

  // Run test cases for submitted code
  private async runTestCases(code: string, testCases: any[]): Promise<any[]> {
    const results = [];
    
    for (const testCase of testCases) {
      // Simulate test execution
      results.push({
        testId: testCase.id,
        passed: Math.random() > 0.2, // 80% pass rate for simulation
        gasUsed: Math.floor(Math.random() * 50000) + 20000,
        executionTime: Math.random() * 100
      });
    }
    
    return results;
  }

  // Generate detailed feedback for challenge submission
  private async generateDetailedFeedback(
    challenge: GasChallenge,
    gasAnalysis: any,
    gasReduction: number,
    testResults: any[],
    submittedCode: string
  ): Promise<string> {
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    let feedback = `## Challenge: ${challenge.title}\n\n`;
    feedback += `### Test Results: ${passedTests}/${totalTests} passed\n\n`;
    feedback += `### Gas Performance:\n`;
    feedback += `- Original gas cost: ${challenge.baselineGasCost.toLocaleString()}\n`;
    feedback += `- Your gas cost: ${gasAnalysis.totalGasCost.toLocaleString()}\n`;
    feedback += `- Gas saved: ${gasReduction.toFixed(1)}%\n\n`;
    
    if (gasReduction > 0) {
      feedback += `Great job! You've successfully optimized the gas usage.\n`;
    } else {
      feedback += `Your solution uses more gas than the baseline. Review the optimization techniques.\n`;
    }
    
    return feedback;
  }

  // Check for achievements based on performance
  private checkAchievements(
    challenge: GasChallenge,
    gasReduction: number,
    score: number,
    timeSpent: number
  ): string[] {
    const achievements: string[] = [];
    
    if (gasReduction >= 50) {
      achievements.push('gas-master');
    }
    if (gasReduction >= 30) {
      achievements.push('gas-optimizer');
    }
    if (score >= 90) {
      achievements.push('perfect-score');
    }
    if (timeSpent < 300) { // Less than 5 minutes
      achievements.push('speed-demon');
    }
    
    return achievements;
  }

  // Generate next recommendations based on performance
  private async generateNextRecommendations(
    userId: string,
    challenge: GasChallenge,
    gasAnalysis: any
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (gasAnalysis.totalGasCost > challenge.baselineGasCost) {
      recommendations.push('Review storage optimization techniques');
      recommendations.push('Consider using packed structs');
    }
    
    if (challenge.difficulty === 'beginner') {
      recommendations.push('Try intermediate gas optimization challenges');
    } else if (challenge.difficulty === 'intermediate') {
      recommendations.push('Challenge yourself with advanced optimizations');
    }
    
    recommendations.push('Study assembly-level optimizations for maximum efficiency');
    
    return recommendations.slice(0, 3);
  }

  // Save challenge result
  private async saveChallengeResult(result: ChallengeResult): Promise<void> {
    const userResults = this.userChallengeResults.get(result.userId) || [];
    userResults.push(result);
    this.userChallengeResults.set(result.userId, userResults);
    
    console.log(`💾 Saved challenge result for user ${result.userId}`);
  }

  // Update user progress
  private async updateUserProgress(userId: string, result: ChallengeResult): Promise<void> {
    // Update user's gas optimization skills
    await adaptiveLearningEngine.assessConceptMastery(
      userId,
      'gas-optimization',
      result.score
    );
    
    console.log(`📊 Updated progress for user ${userId}`);
  }

  // Generate progressive hints
  private async generateProgressiveHints(
    challenge: GasChallenge,
    hintsRequested: number
  ): Promise<string> {
    const hints = [
      'Think about how storage variables are accessed',
      'Consider the cost difference between storage and memory',
      'Look for redundant operations that can be eliminated',
      'Check if you can batch operations together',
      'Consider using events instead of storage for logs'
    ];
    
    const index = Math.min(hintsRequested, hints.length - 1);
    return hints[index];
  }

  // Generate test cases for challenge
  private async generateTestCases(challenge: GasChallenge): Promise<any[]> {
    const testCases = [];
    
    // Basic functionality test
    testCases.push({
      id: 'basic-1',
      name: 'Basic functionality',
      inputs: [],
      expectedBehavior: 'Function executes correctly'
    });
    
    // Edge case tests
    testCases.push({
      id: 'edge-1',
      name: 'Edge case handling',
      inputs: [0, 2**256 - 1],
      expectedBehavior: 'Handles boundary values'
    });
    
    // Gas efficiency test
    testCases.push({
      id: 'gas-1',
      name: 'Gas efficiency',
      inputs: [],
      expectedBehavior: 'Uses less gas than baseline'
    });
    
    return testCases;
  }

  // Get challenge results for user
  private async getChallengeResults(userId: string): Promise<ChallengeResult[]> {
    return this.userChallengeResults.get(userId) || [];
  }

  // Get learning objectives for challenge
  private getLearningObjectives(challenge: GasChallenge): string[] {
    const objectiveMap = {
      'storage-optimization': [
        'Understand storage vs memory costs',
        'Learn to pack struct variables',
        'Master storage slot optimization'
      ],
      'computation-optimization': [
        'Reduce computational complexity',
        'Optimize loop operations',
        'Use efficient algorithms'
      ],
      'advanced-optimization': [
        'Apply assembly-level optimizations',
        'Understand EVM opcodes',
        'Master gas-efficient patterns'
      ]
    };
    
    return objectiveMap[challenge.category] || ['Optimize gas usage'];
  }

  // Get prerequisites for challenge
  private getPrerequisites(challenge: GasChallenge): string[] {
    if (challenge.difficulty === 'beginner') {
      return ['Basic Solidity syntax', 'Understanding of gas costs'];
    } else if (challenge.difficulty === 'intermediate') {
      return ['Storage layouts', 'Function modifiers', 'Data location'];
    } else {
      return ['Assembly basics', 'EVM internals', 'Advanced patterns'];
    }
  }

  // Get real world context
  private getRealWorldContext(challenge: GasChallenge): string {
    return `In production smart contracts, gas optimization is crucial for:
    - Reducing transaction costs for users
    - Making DApps more accessible
    - Improving overall blockchain efficiency
    - Staying competitive in the market`;
  }

  // Create gas visualization
  private createGasVisualization(comparison: CostComparison): string {
    const maxBarLength = 50;
    const baselineBar = '█'.repeat(maxBarLength);
    const optimizedBarLength = Math.round((comparison.optimizedGas / comparison.baselineGas) * maxBarLength);
    const optimizedBar = '█'.repeat(Math.max(1, optimizedBarLength));
    
    return `
Baseline:   ${baselineBar} ${comparison.baselineGas.toLocaleString()} gas
Optimized:  ${optimizedBar} ${comparison.optimizedGas.toLocaleString()} gas
Saved:      ${comparison.percentageSaved.toFixed(1)}% (${comparison.gasSaved.toLocaleString()} gas)
    `.trim();
  }

  // Generate challenge rewards
  private async generateChallengeRewards(
    challenge: GasChallenge,
    performance: ChallengeResult
  ): Promise<any> {
    const rewards = {
      experiencePoints: Math.round(performance.score * 10),
      badges: performance.achievements,
      unlocks: []
    };
    
    if (performance.score >= 80) {
      rewards.unlocks.push(`${challenge.difficulty}-gas-master`);
    }
    
    return rewards;
  }

  // Generate competition prizes
  private async generateCompetitionPrizes(
    competition: any,
    leaderboard: any[]
  ): Promise<any[]> {
    const prizes = [];
    
    // Top 3 get special prizes
    const topThree = leaderboard.slice(0, 3);
    topThree.forEach((entry, index) => {
      prizes.push({
        userId: entry.userId,
        rank: index + 1,
        prize: index === 0 ? 'gold-trophy' : index === 1 ? 'silver-trophy' : 'bronze-trophy',
        experienceBonus: (3 - index) * 500
      });
    });
    
    return prizes;
  }
}

interface CostComparison {
  baselineGas: number;
  optimizedGas: number;
  gasSaved: number;
  percentageSaved: number;
  costSavedWei: number;
  costSavedEth: number;
  gasPrice: number;
  visualization: string;
}

// Export singleton instance
export const gasOptimizationChallenges = new GasOptimizationChallenges(
  new GasOptimizationAnalyzer({} as any) // Would be properly injected
);
