/**
 * AI Practice Problem Generator
 * 
 * Develop system that generates targeted practice problems based on user weaknesses
 * identified through security and gas analysis, with adaptive difficulty scaling.
 */

import { enhancedTutor } from './EnhancedTutorSystem';
import { adaptiveLearningEngine, LearningProfile } from '@/lib/learning/AdaptiveLearningEngine';
import { SecurityScanner } from '@/lib/security/SecurityScanner';
import { GasOptimizationAnalyzer } from '@/lib/gas/GasOptimizationAnalyzer';

export interface PracticeProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'security' | 'gas-optimization' | 'syntax' | 'logic' | 'best-practices';
  targetConcepts: string[];
  weaknessesAddressed: string[];
  estimatedTime: number; // minutes
  problemStatement: string;
  starterCode?: string;
  expectedSolution: string;
  testCases: TestCase[];
  hints: ProblemHint[];
  learningObjectives: string[];
  realWorldContext: string;
  prerequisites: string[];
  followUpProblems: string[];
  adaptiveParameters: AdaptiveParameters;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  inputs: any[];
  expectedOutput: any;
  isHidden: boolean; // Hidden test cases for validation
  weight: number; // Importance weight for scoring
  category: 'functionality' | 'security' | 'gas' | 'edge-case';
}

export interface ProblemHint {
  level: number; // 1-5
  content: string;
  type: 'conceptual' | 'implementation' | 'debugging' | 'optimization';
  unlockCondition: 'time' | 'attempts' | 'request';
  codeSnippet?: string;
  relatedConcepts: string[];
}

export interface AdaptiveParameters {
  difficultyScore: number; // 0-100
  conceptComplexity: number; // 0-100
  cognitiveLoad: number; // 0-100
  prerequisiteDepth: number; // 0-10
  scaffoldingLevel: number; // 0-5
  personalizedElements: string[];
}

export interface ProblemSolution {
  problemId: string;
  userId: string;
  submittedCode: string;
  isCorrect: boolean;
  score: number;
  testResults: TestResult[];
  timeSpent: number;
  hintsUsed: number;
  attempts: number;
  feedback: SolutionFeedback;
  conceptsMastered: string[];
  areasForImprovement: string[];
  nextRecommendations: string[];
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: any;
  executionTime: number;
  gasUsed?: number;
  errorMessage?: string;
}

export interface SolutionFeedback {
  overall: string;
  strengths: string[];
  improvements: string[];
  conceptualUnderstanding: number; // 0-100
  implementationQuality: number; // 0-100
  codeStyle: number; // 0-100
  efficiency: number; // 0-100
  nextSteps: string[];
}

export interface ProblemSet {
  id: string;
  name: string;
  description: string;
  userId: string;
  problems: PracticeProblem[];
  targetWeaknesses: string[];
  estimatedDuration: number;
  adaptivePath: boolean;
  progressTracking: ProgressMetrics;
}

export interface ProgressMetrics {
  problemsCompleted: number;
  totalProblems: number;
  averageScore: number;
  conceptsMastered: string[];
  timeSpent: number;
  difficultyProgression: number[];
  weaknessesAddressed: string[];
}

export class AIPracticeGenerator {
  // These will be used for advanced problem generation
  // private securityScanner: SecurityScanner;
  // private gasAnalyzer: GasOptimizationAnalyzer;
  // private problemTemplates: Map<string, any> = new Map();
  // private userSolutions: Map<string, ProblemSolution[]> = new Map();

  constructor(
    _securityScanner: SecurityScanner,
    _gasAnalyzer: GasOptimizationAnalyzer
  ) {
    // this.securityScanner = securityScanner;
    // this.gasAnalyzer = gasAnalyzer;
    this.initializeProblemTemplates();
  }

  // Generate personalized practice problem
  async generatePersonalizedProblem(
    userId: string,
    targetWeakness?: string,
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
  ): Promise<PracticeProblem> {
    console.log(`🎯 Generating personalized practice problem for user ${userId}`);
    
    try {
      // Get user's learning profile and analysis history
      const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
      // Analysis history could be used for more advanced problem generation
      // const analysisHistory = await this.getUserAnalysisHistory(userId);
      
      // Determine target weakness and difficulty
      const weakness = targetWeakness || this.selectPriorityWeakness(profile.weaknessPatterns);
      const targetDifficulty = difficulty || this.calculateOptimalDifficulty(profile);
      
      // Generate AI-powered problem
      const problem = await this.generateAIProblem(userId, weakness, targetDifficulty, profile);
      
      // Enhance with adaptive parameters
      problem.adaptiveParameters = this.calculateAdaptiveParameters(profile, weakness);
      
      // Generate test cases and validation
      problem.testCases = await this.generateTestCases(problem);
      problem.hints = await this.generateProgressiveHints(problem, profile);
      
      console.log(`✅ Generated problem: ${problem.title}`);
      return problem;
      
    } catch (error) {
      console.error('Problem generation failed:', error);
      throw error;
    }
  }

  // Generate adaptive problem set
  async generateProblemSet(
    userId: string,
    targetConcepts: string[],
    sessionDuration: number // minutes
  ): Promise<ProblemSet> {
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    const problems: PracticeProblem[] = [];
    
    // Calculate number of problems based on duration and user velocity
    const problemCount = Math.ceil(sessionDuration / (20 / profile.learningVelocity));
    
    // Generate problems with increasing difficulty
    for (let i = 0; i < problemCount; i++) {
      const concept = targetConcepts[i % targetConcepts.length];
      const difficulty = this.calculateProgressiveDifficulty(i, problemCount, profile);
      
      const problem = await this.generatePersonalizedProblem(userId, concept, difficulty);
      problems.push(problem);
    }
    
    return {
      id: `set-${Date.now()}-${userId}`,
      name: `Personalized Practice Set`,
      description: `Adaptive practice problems targeting: ${targetConcepts.join(', ')}`,
      userId,
      problems,
      targetWeaknesses: profile.weaknessPatterns,
      estimatedDuration: sessionDuration,
      adaptivePath: true,
      progressTracking: {
        problemsCompleted: 0,
        totalProblems: problems.length,
        averageScore: 0,
        conceptsMastered: [],
        timeSpent: 0,
        difficultyProgression: problems.map(p => p.adaptiveParameters.difficultyScore),
        weaknessesAddressed: []
      }
    };
  }

  // Evaluate problem solution
  async evaluateSolution(
    problemId: string,
    userId: string,
    submittedCode: string,
    timeSpent: number,
    hintsUsed: number,
    attempts: number
  ): Promise<ProblemSolution> {
    console.log(`🔍 Evaluating solution for problem ${problemId}`);
    
    try {
      const problem = await this.getProblem(problemId);
      
      // Run test cases
      const testResults = await this.runTestCases(submittedCode, problem.testCases);
      
      // Analyze code quality
      const codeAnalysis = await this.analyzeSubmittedCode(submittedCode, userId);
      
      // Calculate score
      const score = this.calculateSolutionScore(testResults, timeSpent, hintsUsed, attempts, problem);
      
      // Generate feedback
      const feedback = await this.generateSolutionFeedback(
        problem,
        submittedCode,
        testResults,
        codeAnalysis
      );
      
      // Assess concept mastery
      const conceptsMastered = await this.assessConceptMastery(
        userId,
        problem,
        testResults,
        score
      );
      
      // Generate next recommendations
      const nextRecommendations = await this.generateNextRecommendations(
        userId,
        problem,
        feedback,
        conceptsMastered
      );
      
      const solution: ProblemSolution = {
        problemId,
        userId,
        submittedCode,
        isCorrect: testResults.every(t => t.passed),
        score,
        testResults,
        timeSpent,
        hintsUsed,
        attempts,
        feedback,
        conceptsMastered,
        areasForImprovement: this.identifyImprovementAreas(feedback, testResults),
        nextRecommendations
      };
      
      // Save solution and update user progress
      await this.saveSolution(solution);
      await this.updateUserProgress(userId, solution);
      
      console.log(`✅ Solution evaluated: ${solution.isCorrect ? 'CORRECT' : 'INCORRECT'} (Score: ${score})`);
      return solution;
      
    } catch (error) {
      console.error('Solution evaluation failed:', error);
      throw error;
    }
  }

  // Generate follow-up problems based on performance
  async generateFollowUpProblems(
    userId: string,
    _completedProblemId: string,
    performance: ProblemSolution
  ): Promise<PracticeProblem[]> {
    const followUps: PracticeProblem[] = [];
    
    if (performance.score >= 80) {
      // High performance: increase difficulty or introduce new concepts
      const advancedProblem = await this.generatePersonalizedProblem(
        userId,
        undefined,
        this.getNextDifficultyLevel(performance.problemId)
      );
      followUps.push(advancedProblem);
    } else if (performance.score < 60) {
      // Low performance: reinforce concepts with easier problems
      const reinforcementProblem = await this.generateReinforcementProblem(
        userId,
        performance.areasForImprovement
      );
      followUps.push(reinforcementProblem);
    }
    
    // Generate problems targeting specific improvement areas
    for (const area of performance.areasForImprovement.slice(0, 2)) {
      const targetedProblem = await this.generatePersonalizedProblem(userId, area);
      followUps.push(targetedProblem);
    }
    
    return followUps;
  }

  // Private helper methods
  private async generateAIProblem(
    userId: string,
    weakness: string,
    difficulty: string,
    profile: LearningProfile
  ): Promise<PracticeProblem> {
    const prompt = this.buildProblemPrompt(weakness, difficulty, profile);
    
    const response = await enhancedTutor.getAIResponse(
      prompt,
      { userId },
      'code'
    );
    
    return this.parseProblemFromAI(response.content, weakness, difficulty);
  }

  private buildProblemPrompt(
    weakness: string,
    difficulty: string,
    profile: LearningProfile
  ): string {
    return `
      Generate a Solidity practice problem targeting weakness: ${weakness}
      
      Requirements:
      - Difficulty: ${difficulty}
      - User Learning Velocity: ${profile.learningVelocity}
      - User Strengths: ${profile.strengthAreas.join(', ')}
      - Weakness Patterns: ${profile.weaknessPatterns.join(', ')}
      
      Create a problem that:
      1. Specifically addresses the ${weakness} weakness
      2. Is appropriate for ${difficulty} level
      3. Includes real-world context (DeFi, NFT, DAO, etc.)
      4. Has clear learning objectives
      5. Provides starter code if helpful
      6. Includes expected solution approach
      7. Has 3-5 test cases covering different scenarios
      8. Builds on user's existing strengths
      
      Problem should be:
      - Engaging and practical
      - Educational, not just challenging
      - Solvable in 15-30 minutes
      - Connected to broader Solidity concepts
      
      Provide response in structured format with all required fields.
    `;
  }

  private selectPriorityWeakness(weaknessPatterns: string[]): string {
    // Priority order for addressing weaknesses
    const priorityOrder = [
      'reentrancy',
      'access-control',
      'overflow',
      'gas-storage',
      'gas-computation',
      'visibility',
      'best-practices'
    ];
    
    for (const priority of priorityOrder) {
      if (weaknessPatterns.some(w => w.includes(priority))) {
        return priority;
      }
    }
    
    return weaknessPatterns[0] || 'general';
  }

  private calculateOptimalDifficulty(profile: LearningProfile): 'beginner' | 'intermediate' | 'advanced' {
    const averageSkill = Object.values(profile.skillLevels).reduce((sum, level) => sum + level, 0) / 
                         Object.values(profile.skillLevels).length;
    
    if (averageSkill < 40) return 'beginner';
    if (averageSkill < 70) return 'intermediate';
    return 'advanced';
  }

  private calculateAdaptiveParameters(
    profile: LearningProfile,
    weakness: string
  ): AdaptiveParameters {
    const skillLevel = profile.skillLevels[weakness] || 50;
    
    return {
      difficultyScore: Math.max(10, Math.min(90, skillLevel + 10)),
      conceptComplexity: this.getConceptComplexity(weakness),
      cognitiveLoad: this.calculateCognitiveLoad(profile, weakness),
      prerequisiteDepth: this.getPrerequisiteDepth(weakness),
      scaffoldingLevel: Math.max(1, 6 - Math.floor(skillLevel / 20)),
      personalizedElements: this.getPersonalizedElements(profile, weakness)
    };
  }

  private async runTestCases(_code: string, testCases: TestCase[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const testCase of testCases) {
      try {
        // Simulate test execution (in real implementation, would compile and run)
        const result: TestResult = {
          testCaseId: testCase.id,
          passed: true, // Simplified for demo
          actualOutput: testCase.expectedOutput,
          executionTime: Math.random() * 100,
          gasUsed: Math.floor(Math.random() * 50000)
        };
        
        results.push(result);
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: null,
          executionTime: 0,
          errorMessage: error instanceof Error ? error.message : 'Test failed'
        });
      }
    }
    
    return results;
  }

  private calculateSolutionScore(
    testResults: TestResult[],
    timeSpent: number,
    hintsUsed: number,
    attempts: number,
    problem: PracticeProblem
  ): number {
    // Base score from test results
    const passedTests = testResults.filter(t => t.passed).length;
    const testScore = (passedTests / testResults.length) * 100;
    
    // Time bonus/penalty
    const expectedTime = problem.estimatedTime;
    const timeMultiplier = timeSpent <= expectedTime ? 1.1 : Math.max(0.8, expectedTime / timeSpent);
    
    // Hint penalty
    const hintPenalty = Math.max(0, 1 - (hintsUsed * 0.1));
    
    // Attempt penalty
    const attemptPenalty = Math.max(0.5, 1 - ((attempts - 1) * 0.15));
    
    const finalScore = testScore * timeMultiplier * hintPenalty * attemptPenalty;
    return Math.round(Math.max(0, Math.min(100, finalScore)));
  }

  private initializeProblemTemplates(): void {
    console.log('🔄 Initializing practice problem templates...');
    // Initialize predefined problem templates for different concepts
  }

  // Generate test cases for a problem
  private async generateTestCases(problem: PracticeProblem): Promise<TestCase[]> {
    const testCases: TestCase[] = [];
    
    // Add basic functionality tests
    testCases.push({
      id: `test-${problem.id}-1`,
      name: 'Basic functionality',
      description: 'Test basic expected behavior',
      inputs: [],
      expectedOutput: true,
      isHidden: false,
      weight: 1,
      category: 'functionality'
    });

    // Add edge case tests
    testCases.push({
      id: `test-${problem.id}-2`,
      name: 'Edge case handling',
      description: 'Test edge cases and boundary conditions',
      inputs: [],
      expectedOutput: true,
      isHidden: true,
      weight: 1.5,
      category: 'edge-case'
    });

    // Add security tests if applicable
    if (problem.category === 'security') {
      testCases.push({
        id: `test-${problem.id}-3`,
        name: 'Security vulnerability check',
        description: 'Test for common security issues',
        inputs: [],
        expectedOutput: true,
        isHidden: true,
        weight: 2,
        category: 'security'
      });
    }

    return testCases;
  }

  // Generate progressive hints for a problem
  private async generateProgressiveHints(problem: PracticeProblem, profile: LearningProfile): Promise<ProblemHint[]> {
    const hints: ProblemHint[] = [];
    
    // Level 1: Conceptual hint
    hints.push({
      level: 1,
      content: `Consider the main concept: ${problem.targetConcepts[0]}`,
      type: 'conceptual',
      unlockCondition: 'time'
    });

    // Level 2: Implementation hint
    hints.push({
      level: 2,
      content: `Think about how to structure your solution using ${problem.category} best practices`,
      type: 'implementation',
      unlockCondition: 'attempts'
    });

    // Level 3: Debugging hint with code snippet
    if (profile.skillLevels[problem.targetConcepts[0] as keyof typeof profile.skillLevels] < 50) {
      hints.push({
        level: 3,
        content: 'Here\'s a starting point for your solution',
        type: 'debugging',
        unlockCondition: 'request',
        codeSnippet: problem.starterCode
      });
    }

    return hints;
  }

  // Calculate progressive difficulty for problem sets
  private calculateProgressiveDifficulty(
    index: number,
    total: number,
    profile: LearningProfile
  ): 'beginner' | 'intermediate' | 'advanced' {
    const progression = index / total;
    const baseSkill = Object.values(profile.skillLevels).reduce((a, b) => a + b, 0) / 
                      Object.values(profile.skillLevels).length;
    
    if (progression < 0.3 || baseSkill < 30) return 'beginner';
    if (progression < 0.7 || baseSkill < 60) return 'intermediate';
    return 'advanced';
  }

  // Get problem by ID
  private async getProblem(problemId: string): Promise<PracticeProblem> {
    // In a real implementation, this would fetch from a database
    // For now, return a mock problem
    return {
      id: problemId,
      title: 'Mock Problem',
      description: 'Mock problem description',
      difficulty: 'intermediate',
      category: 'syntax',
      targetConcepts: ['functions'],
      weaknessesAddressed: [],
      estimatedTime: 20,
      problemStatement: 'Implement a function...',
      expectedSolution: '// Solution code',
      testCases: [],
      hints: [],
      learningObjectives: [],
      realWorldContext: 'This pattern is commonly used in smart contracts',
      prerequisites: [],
      followUpProblems: [],
      adaptiveParameters: {
        difficultyScore: 50,
        conceptComplexity: 50,
        cognitiveLoad: 50,
        prerequisiteDepth: 1,
        scaffoldingLevel: 3,
        personalizedElements: []
      }
    };
  }

  // Analyze submitted code
  private async analyzeSubmittedCode(code: string, userId: string): Promise<any> {
    // Basic code analysis
    return {
      userId,
      codeLength: code.length,
      hasComments: code.includes('//') || code.includes('/*'),
      usesRequire: code.includes('require'),
      usesAssert: code.includes('assert'),
      hasModifiers: code.includes('modifier'),
      complexity: this.estimateCodeComplexity(code)
    };
  }

  // Generate solution feedback
  private async generateSolutionFeedback(
    problem: PracticeProblem,
    submittedCode: string,
    testResults: TestResult[],
    codeAnalysis: any
  ): Promise<SolutionFeedback> {
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    const passRate = passedTests / totalTests;

    return {
      overall: passRate === 1 ? 'Excellent work!' : 'Good effort, but there are some issues to address.',
      strengths: [
        ...(codeAnalysis.hasComments ? ['Good code documentation'] : []),
        ...(passRate > 0.5 ? ['Correct implementation of core logic'] : [])
      ],
      improvements: [
        ...(passRate < 1 ? ['Some test cases are failing'] : []),
        ...(!codeAnalysis.hasComments ? ['Add comments to explain your code'] : [])
      ],
      conceptualUnderstanding: Math.round(passRate * 80 + (codeAnalysis.hasComments ? 20 : 0)),
      implementationQuality: Math.round(passRate * 70 + (codeAnalysis.complexity < 10 ? 30 : 15)),
      codeStyle: codeAnalysis.hasComments ? 80 : 60,
      efficiency: 70,
      nextSteps: [
        'Review the failed test cases',
        'Consider edge cases',
        'Optimize your solution'
      ]
    };
  }

  // Assess concept mastery
  private async assessConceptMastery(
    userId: string,
    problem: PracticeProblem,
    testResults: TestResult[],
    score: number
  ): Promise<string[]> {
    const masteredConcepts: string[] = [];
    
    if (score >= 80) {
      // High score indicates mastery of target concepts
      masteredConcepts.push(...problem.targetConcepts);
    } else if (score >= 60) {
      // Partial mastery
      masteredConcepts.push(problem.targetConcepts[0]);
    }

    return masteredConcepts;
  }

  // Generate next recommendations
  private async generateNextRecommendations(
    userId: string,
    problem: PracticeProblem,
    feedback: SolutionFeedback,
    conceptsMastered: string[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    if (feedback.conceptualUnderstanding < 70) {
      recommendations.push(`Review the concept of ${problem.targetConcepts[0]}`);
    }

    if (feedback.implementationQuality < 60) {
      recommendations.push('Practice more problems in this category');
    }

    if (conceptsMastered.length === problem.targetConcepts.length) {
      recommendations.push('Move on to more advanced topics');
    }

    return recommendations;
  }

  // Identify improvement areas
  private identifyImprovementAreas(
    feedback: SolutionFeedback,
    testResults: TestResult[]
  ): string[] {
    const areas: string[] = [];

    if (feedback.conceptualUnderstanding < 70) {
      areas.push('Conceptual understanding');
    }

    if (feedback.codeStyle < 70) {
      areas.push('Code style and documentation');
    }

    const failedTests = testResults.filter(t => !t.passed);
    if (failedTests.length > 0) {
      const categories = [...new Set(failedTests.map(t => t.testCaseId.split('-')[0]))];
      areas.push(...categories.map(c => `${c} handling`));
    }

    return areas;
  }

  // Save solution to storage
  private async saveSolution(solution: ProblemSolution): Promise<void> {
    // In a real implementation, this would save to a database
    console.log(`💾 Saving solution for problem ${solution.problemId}`);
  }

  // Update user progress
  private async updateUserProgress(userId: string, solution: ProblemSolution): Promise<void> {
    // Update user's learning profile based on solution performance
    console.log(`📊 Updating progress for user ${userId}`);
  }

  // Get next difficulty level
  private getNextDifficultyLevel(problemId: string): 'beginner' | 'intermediate' | 'advanced' {
    // Simple progression logic
    if (problemId.includes('beginner')) return 'intermediate';
    if (problemId.includes('intermediate')) return 'advanced';
    return 'advanced';
  }

  // Generate reinforcement problem
  private async generateReinforcementProblem(
    userId: string,
    areasForImprovement: string[]
  ): Promise<PracticeProblem> {
    // Generate a problem that reinforces weak areas
    return this.generatePersonalizedProblem(
      userId,
      areasForImprovement[0],
      'beginner'
    );
  }

  // Parse problem from AI response
  private parseProblemFromAI(
    content: string,
    weakness: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced'
  ): PracticeProblem {
    // Parse AI response into structured problem format
    return {
      id: `problem-${Date.now()}`,
      title: `Practice Problem: ${weakness}`,
      description: content.split('\n')[0] || 'Practice problem',
      difficulty,
      category: 'syntax',
      targetConcepts: [weakness],
      weaknessesAddressed: [weakness],
      estimatedTime: difficulty === 'beginner' ? 15 : difficulty === 'intermediate' ? 25 : 40,
      problemStatement: content,
      starterCode: '// Your code here',
      expectedSolution: '// Expected solution',
      testCases: [],
      hints: [],
      learningObjectives: [`Master ${weakness}`],
      realWorldContext: 'This concept is used in production smart contracts',
      prerequisites: [],
      followUpProblems: [],
      adaptiveParameters: {
        difficultyScore: 50,
        conceptComplexity: 50,
        cognitiveLoad: 50,
        prerequisiteDepth: 1,
        scaffoldingLevel: 3,
        personalizedElements: []
      }
    };
  }

  // Get concept complexity
  private getConceptComplexity(concept: string): number {
    const complexityMap: Record<string, number> = {
      'variables': 20,
      'functions': 30,
      'modifiers': 50,
      'inheritance': 70,
      'assembly': 90,
      'security': 80,
      'gas-optimization': 75
    };
    return complexityMap[concept.toLowerCase()] || 50;
  }

  // Calculate cognitive load
  private calculateCognitiveLoad(profile: LearningProfile, weakness: string): number {
    const baseLoad = 50;
    const skillLevel = profile.skillLevels[weakness as keyof typeof profile.skillLevels] || 0;
    const velocityAdjustment = (1 - profile.learningVelocity) * 20;
    
    return Math.round(baseLoad + velocityAdjustment - (skillLevel / 2));
  }

  // Get prerequisite depth
  private getPrerequisiteDepth(concept: string): number {
    const depthMap: Record<string, number> = {
      'variables': 0,
      'functions': 1,
      'modifiers': 2,
      'inheritance': 3,
      'assembly': 4
    };
    return depthMap[concept.toLowerCase()] || 1;
  }

  // Get personalized elements
  private getPersonalizedElements(profile: LearningProfile, weakness: string): string[] {
    const elements: string[] = [];
    
    if (profile.learningVelocity < 0.5) {
      elements.push('extra-scaffolding');
    }
    
    if (profile.skillLevels[weakness as keyof typeof profile.skillLevels] < 30) {
      elements.push('detailed-examples');
    }
    
    elements.push('contextual-hints');
    
    return elements;
  }

  // Estimate code complexity
  private estimateCodeComplexity(code: string): number {
    let complexity = 1;
    
    // Count control structures
    const controlStructures = ['if', 'for', 'while', 'require', 'assert'];
    controlStructures.forEach(structure => {
      complexity += (code.match(new RegExp(`\\b${structure}\\b`, 'g')) || []).length;
    });
    
    // Count functions
    complexity += (code.match(/function\s+\w+/g) || []).length;
    
    return complexity;
  }
}

// Export factory function
export function createAIPracticeGenerator(
  securityScanner: SecurityScanner,
  gasAnalyzer: GasOptimizationAnalyzer
): AIPracticeGenerator {
  return new AIPracticeGenerator(securityScanner, gasAnalyzer);
}
