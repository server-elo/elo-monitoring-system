/**
 * Project-Based Learning Tracks
 * Comprehensive project tracks that simulate real-world scenarios with integrated analysis tools
 */

import { adaptiveLearningEngine } from '@/lib/learning/AdaptiveLearningEngine';
import { SecurityScanner } from '@/lib/security/SecurityScanner';
import { GasOptimizationAnalyzer } from '@/lib/gas/GasOptimizationAnalyzer';

export interface LearningProject {
  id: string;
  title: string;
  description: string;
  category: 'defi' | 'nft' | 'dao' | 'infrastructure' | 'gaming';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // hours
  prerequisites: string[];
  learningObjectives: string[];
  milestones: ProjectMilestone[];
  resources: ProjectResource[];
  realWorldContext: string;
  industryRelevance: number; // 0-100
  collaborationRequired: boolean;
  mentorshipAvailable: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedTime: number; // hours
  dependencies: string[];
  resources: string[];
  evaluation: EvaluationCriteria;
}

export interface EvaluationCriteria {
  functionality: number; // weight 0-100
  security: number;
  gasOptimization: number;
  codeQuality: number;
  documentation: number;
  testing: number;
  passingThreshold: number; // minimum score to pass
}

export interface ProjectProgress {
  projectId: string;
  userId: string;
  currentMilestone: string;
  completedMilestones: string[];
  overallProgress: number; // 0-100
  timeSpent: number; // hours
  qualityScores: Record<string, number>;
  feedback: ProjectFeedback[];
  nextSteps: string[];
  estimatedCompletion: Date;
}

export interface ProjectFeedback {
  milestoneId: string;
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  mentorNotes?: string;
  timestamp: Date;
}

export class ProjectBasedLearning {
  private projects: Map<string, LearningProject> = new Map();
  private userProgress: Map<string, ProjectProgress[]> = new Map();
  private securityScanner: SecurityScanner;
  private gasAnalyzer: GasOptimizationAnalyzer;

  constructor(
    securityScanner: SecurityScanner,
    gasAnalyzer: GasOptimizationAnalyzer
  ) {
    this.securityScanner = securityScanner;
    this.gasAnalyzer = gasAnalyzer;
    this.initializeProjects();
  }

  async getRecommendedProjects(userId: string): Promise<LearningProject[]> {
    const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
    const userLevel = this.calculateUserLevel(profile);
    
    return Array.from(this.projects.values())
      .filter(project => this.isProjectAppropriate(project, profile, userLevel))
      .sort((a, b) => b.industryRelevance - a.industryRelevance)
      .slice(0, 5);
  }

  async startProject(userId: string, projectId: string): Promise<ProjectProgress> {
    const project = this.projects.get(projectId);
    if (!project) throw new Error('Project not found');

    const progress: ProjectProgress = {
      projectId,
      userId,
      currentMilestone: project.milestones[0].id,
      completedMilestones: [],
      overallProgress: 0,
      timeSpent: 0,
      qualityScores: {},
      feedback: [],
      nextSteps: [project.milestones[0].description],
      estimatedCompletion: new Date(Date.now() + project.estimatedDuration * 60 * 60 * 1000)
    };

    const userProgressList = this.userProgress.get(userId) || [];
    userProgressList.push(progress);
    this.userProgress.set(userId, userProgressList);

    return progress;
  }

  async submitMilestone(
    userId: string,
    projectId: string,
    milestoneId: string,
    submission: {
      code: string;
      documentation: string;
      testResults?: any;
    }
  ): Promise<ProjectFeedback> {
    const project = this.projects.get(projectId);
    const milestone = project?.milestones.find(m => m.id === milestoneId);
    
    if (!project || !milestone) {
      throw new Error('Project or milestone not found');
    }

    // Analyze submission
    const [securityAnalysis, gasAnalysis] = await Promise.all([
      this.securityScanner.performAnalysis(),
      this.gasAnalyzer.analyzeGasUsage(userId)
    ]);

    // Calculate scores based on evaluation criteria
    const scores = this.calculateMilestoneScores(
      submission,
      milestone.evaluation,
      securityAnalysis,
      gasAnalysis
    );

    // Generate feedback
    const feedback: ProjectFeedback = {
      milestoneId,
      score: this.calculateOverallScore(scores, milestone.evaluation),
      strengths: this.identifyStrengths(scores, submission),
      improvements: this.identifyImprovements(scores, securityAnalysis, gasAnalysis),
      suggestions: await this.generateSuggestions(userId, submission, scores),
      timestamp: new Date()
    };

    // Update user progress
    await this.updateProgress(userId, projectId, milestoneId, feedback);

    return feedback;
  }

  private initializeProjects(): void {
    // DeFi Project: Decentralized Exchange
    const dexProject: LearningProject = {
      id: 'defi-dex-basic',
      title: 'Build a Decentralized Exchange',
      description: 'Create a basic DEX with token swapping, liquidity pools, and yield farming',
      category: 'defi',
      difficulty: 'intermediate',
      estimatedDuration: 40,
      prerequisites: ['erc20-tokens', 'smart-contract-security', 'gas-optimization'],
      learningObjectives: [
        'Understand AMM mechanics',
        'Implement liquidity pools',
        'Create token swapping logic',
        'Add yield farming features',
        'Ensure security best practices'
      ],
      milestones: [
        {
          id: 'milestone-1',
          title: 'Basic Token Contract',
          description: 'Create ERC20 tokens for the DEX',
          deliverables: ['ERC20 token contract', 'Unit tests', 'Documentation'],
          acceptanceCriteria: [
            'Implements full ERC20 standard',
            'Includes mint/burn functionality',
            'Has proper access controls',
            'Passes all security checks'
          ],
          estimatedTime: 8,
          dependencies: [],
          resources: ['ERC20 specification', 'OpenZeppelin contracts'],
          evaluation: {
            functionality: 30,
            security: 25,
            gasOptimization: 15,
            codeQuality: 15,
            documentation: 10,
            testing: 5,
            passingThreshold: 70
          }
        },
        {
          id: 'milestone-2',
          title: 'Liquidity Pool Implementation',
          description: 'Implement automated market maker with liquidity pools',
          deliverables: ['AMM contract', 'Liquidity pool logic', 'Price calculation'],
          acceptanceCriteria: [
            'Accurate price calculations',
            'Proper slippage handling',
            'LP token distribution',
            'Fee collection mechanism'
          ],
          estimatedTime: 16,
          dependencies: ['milestone-1'],
          resources: ['Uniswap V2 documentation', 'AMM mathematics'],
          evaluation: {
            functionality: 35,
            security: 20,
            gasOptimization: 20,
            codeQuality: 15,
            documentation: 5,
            testing: 5,
            passingThreshold: 75
          }
        }
      ],
      resources: [
        { type: 'documentation', title: 'DeFi Protocols Guide', url: '/resources/defi-guide' },
        { type: 'video', title: 'AMM Mechanics Explained', url: '/videos/amm-explained' },
        { type: 'code', title: 'Reference Implementation', url: '/examples/dex-reference' }
      ],
      realWorldContext: 'DEXs like Uniswap and SushiSwap are core DeFi infrastructure',
      industryRelevance: 95,
      collaborationRequired: false,
      mentorshipAvailable: true
    };

    this.projects.set(dexProject.id, dexProject);

    // NFT Project: Digital Art Marketplace
    const nftProject: LearningProject = {
      id: 'nft-marketplace',
      title: 'NFT Art Marketplace',
      description: 'Build a complete NFT marketplace with minting, trading, and royalties',
      category: 'nft',
      difficulty: 'intermediate',
      estimatedDuration: 35,
      prerequisites: ['erc721-tokens', 'marketplace-patterns', 'frontend-integration'],
      learningObjectives: [
        'Implement ERC721 and ERC1155',
        'Create marketplace functionality',
        'Add royalty mechanisms',
        'Integrate with IPFS',
        'Build user interface'
      ],
      milestones: [
        {
          id: 'nft-milestone-1',
          title: 'NFT Contract Implementation',
          description: 'Create ERC721 contract with metadata and minting',
          deliverables: ['ERC721 contract', 'Metadata standards', 'Minting interface'],
          acceptanceCriteria: [
            'ERC721 compliance',
            'IPFS metadata integration',
            'Batch minting support',
            'Access control for minting'
          ],
          estimatedTime: 12,
          dependencies: [],
          resources: ['ERC721 standard', 'IPFS documentation'],
          evaluation: {
            functionality: 30,
            security: 25,
            gasOptimization: 20,
            codeQuality: 15,
            documentation: 5,
            testing: 5,
            passingThreshold: 70
          }
        }
      ],
      resources: [],
      realWorldContext: 'NFT marketplaces like OpenSea and Foundation drive the creator economy',
      industryRelevance: 85,
      collaborationRequired: false,
      mentorshipAvailable: true
    };

    this.projects.set(nftProject.id, nftProject);
  }

  private calculateUserLevel(profile: any): number {
    const skillValues = Object.values(profile.skillLevels);
    return skillValues.reduce((sum: number, level: number) => sum + level, 0) / skillValues.length;
  }

  private isProjectAppropriate(project: LearningProject, profile: any, userLevel: number): boolean {
    // Check prerequisites
    const hasPrerequisites = project.prerequisites.every(prereq =>
      profile.skillLevels[prereq] >= 60
    );

    // Check difficulty match
    const difficultyMatch = this.isDifficultyAppropriate(project.difficulty, userLevel);

    return hasPrerequisites && difficultyMatch;
  }

  private isDifficultyAppropriate(difficulty: string, userLevel: number): boolean {
    switch (difficulty) {
      case 'beginner': return userLevel >= 20 && userLevel <= 60;
      case 'intermediate': return userLevel >= 50 && userLevel <= 85;
      case 'advanced': return userLevel >= 75;
      default: return true;
    }
  }

  private calculateMilestoneScores(
    submission: any,
    criteria: EvaluationCriteria,
    securityAnalysis: any,
    gasAnalysis: any
  ): Record<string, number> {
    return {
      functionality: this.evaluateFunctionality(submission),
      security: securityAnalysis?.overallScore || 0,
      gasOptimization: this.calculateGasScore(gasAnalysis),
      codeQuality: this.evaluateCodeQuality(submission.code),
      documentation: this.evaluateDocumentation(submission.documentation),
      testing: this.evaluateTesting(submission.testResults)
    };
  }

  private calculateOverallScore(scores: Record<string, number>, criteria: EvaluationCriteria): number {
    const weightedScore = 
      (scores.functionality * criteria.functionality +
       scores.security * criteria.security +
       scores.gasOptimization * criteria.gasOptimization +
       scores.codeQuality * criteria.codeQuality +
       scores.documentation * criteria.documentation +
       scores.testing * criteria.testing) / 100;

    return Math.round(weightedScore);
  }

  private evaluateFunctionality(submission: any): number {
    // Simplified functionality evaluation
    return submission.code.length > 100 ? 80 : 60;
  }

  private calculateGasScore(gasAnalysis: any): number {
    if (!gasAnalysis) return 50;
    const optimizationCount = gasAnalysis.optimizations?.length || 0;
    return Math.max(50, 100 - (optimizationCount * 10));
  }

  private evaluateCodeQuality(code: string): number {
    // Simplified code quality metrics
    const hasComments = code.includes('//') || code.includes('/*');
    const hasProperNaming = /[a-z][A-Z]/.test(code); // camelCase check
    const hasStructure = code.includes('contract') && code.includes('function');
    
    let score = 50;
    if (hasComments) score += 15;
    if (hasProperNaming) score += 15;
    if (hasStructure) score += 20;
    
    return Math.min(100, score);
  }

  private evaluateDocumentation(documentation: string): number {
    if (!documentation) return 0;
    if (documentation.length < 100) return 30;
    if (documentation.length < 500) return 70;
    return 90;
  }

  private evaluateTesting(testResults: any): number {
    if (!testResults) return 0;
    const passRate = testResults.passed / testResults.total;
    return Math.round(passRate * 100);
  }
}

interface ProjectResource {
  type: 'documentation' | 'video' | 'code' | 'tutorial';
  title: string;
  url: string;
}

export const projectBasedLearning = new ProjectBasedLearning(
  new SecurityScanner({} as any, ''),
  new GasOptimizationAnalyzer({} as any)
);
