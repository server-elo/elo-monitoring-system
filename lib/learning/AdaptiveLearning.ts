// Adaptive Learning Engine for Solidity Learning Platform
// Personalizes curriculum based on performance analytics and learning patterns
// Integrates with Enhanced AI Tutoring System for dynamic difficulty adjustment

import { prisma } from '@/lib/prisma';
;

export interface LearningProfile {
  userId: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  learningStyle: 'visual' | 'textual' | 'interactive' | 'mixed';
  currentLevel: number;
  totalXP: number;
  streak: number;
  
  // Performance Analytics
  performanceMetrics: {
    averageScore: number;
    completionRate: number;
    timeSpentLearning: number; // minutes
    conceptMastery: Record<string, number>; // concept -> mastery level (0-1)
    errorPatterns: string[];
    successPatterns: string[];
    securityAwareness: number; // 0-100
    gasOptimizationSkill: number; // 0-100
    codeQualityScore: number; // 0-100
  };
  
  // Adaptive Settings
  adaptiveSettings: {
    difficultyLevel: number; // 1-10
    autoAdjustEnabled: boolean;
    preferredChallengeTypes: string[];
    learningPace: 'slow' | 'normal' | 'fast';
    feedbackPreference: 'minimal' | 'detailed' | 'comprehensive';
  };
  
  // Learning Path
  learningPath: {
    currentModule: string;
    completedModules: string[];
    recommendedNext: string[];
    customPath: boolean;
    estimatedCompletion: Date;
  };
  
  // Personalization
  personalizedContent: {
    weakAreas: string[];
    strongAreas: string[];
    recentTopics: string[];
    bookmarkedConcepts: string[];
    personalNotes: Record<string, string>;
  };
}

export interface LearningRecommendation {
  type: 'concept' | 'challenge' | 'project' | 'review';
  title: string;
  description: string;
  difficulty: number; // 1-10
  estimatedTime: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  personalizedReason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceAnalysis {
  overallProgress: number; // 0-100
  strengthAreas: Array<{ concept: string; mastery: number; confidence: number }>;
  improvementAreas: Array<{ concept: string; mastery: number; suggestions: string[] }>;
  learningVelocity: number; // concepts per week
  retentionRate: number; // 0-100
  engagementScore: number; // 0-100
  predictedOutcomes: {
    nextLevelETA: Date;
    completionProbability: number;
    riskFactors: string[];
  };
}

export class AdaptiveLearningEngine {
  private profileCache: Map<string, LearningProfile> = new Map();
  private analysisCache: Map<string, PerformanceAnalysis> = new Map();
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes

  // Core concept hierarchy for Solidity learning
  private conceptHierarchy = {
    'basics': {
      prerequisites: [],
      concepts: ['variables', 'functions', 'data-types', 'control-structures'],
      difficulty: 1
    },
    'intermediate': {
      prerequisites: ['basics'],
      concepts: ['contracts', 'inheritance', 'modifiers', 'events', 'error-handling'],
      difficulty: 3
    },
    'advanced': {
      prerequisites: ['intermediate'],
      concepts: ['assembly', 'gas-optimization', 'design-patterns', 'upgradeable-contracts'],
      difficulty: 6
    },
    'security': {
      prerequisites: ['intermediate'],
      concepts: ['reentrancy', 'overflow-underflow', 'access-control', 'front-running'],
      difficulty: 7
    },
    'defi': {
      prerequisites: ['advanced', 'security'],
      concepts: ['amm', 'lending', 'staking', 'governance', 'oracles'],
      difficulty: 8
    },
    'expert': {
      prerequisites: ['defi'],
      concepts: ['mev', 'cross-chain', 'zk-proofs', 'formal-verification'],
      difficulty: 10
    }
  };

  async getLearningProfile(userId: string): Promise<LearningProfile> {
    // Check cache first
    const cached = this.profileCache.get(userId);
    if (cached) return cached;

    try {
      // Load from database
      const dbProfile = await prisma.aiLearningContext.findUnique({
        where: { userId },
        include: {
          user: {
            include: {
              profile: true,
              achievements: {
                include: { achievement: true }
              }
            }
          }
        }
      });

      let profile: LearningProfile;

      if (dbProfile) {
        profile = this.transformDbProfile(dbProfile);
      } else {
        // Create new profile
        profile = await this.createNewProfile(userId);
      }

      // Cache the profile
      this.profileCache.set(userId, profile);
      
      return profile;
    } catch (error) {
      console.error('Failed to load learning profile:', error);
      return this.createDefaultProfile(userId);
    }
  }

  private transformDbProfile(dbProfile: any): LearningProfile {
    const metadata = dbProfile.metadata || {};
    
    return {
      userId: dbProfile.userId,
      skillLevel: dbProfile.skillLevel,
      learningStyle: dbProfile.preferredLearningStyle,
      currentLevel: dbProfile.user?.profile?.currentLevel || 1,
      totalXP: dbProfile.totalXP,
      streak: dbProfile.streak,
      
      performanceMetrics: {
        averageScore: metadata.performanceMetrics?.averageScore || 0,
        completionRate: metadata.performanceMetrics?.completionRate || 0,
        timeSpentLearning: metadata.timeSpentLearning || 0,
        conceptMastery: metadata.conceptMastery || {},
        errorPatterns: metadata.errorPatterns || [],
        successPatterns: metadata.successPatterns || [],
        securityAwareness: metadata.performanceMetrics?.securityAwareness || 50,
        gasOptimizationSkill: metadata.performanceMetrics?.gasOptimizationSkill || 50,
        codeQualityScore: metadata.performanceMetrics?.codeQualityScore || 50
      },
      
      adaptiveSettings: {
        difficultyLevel: metadata.adaptiveDifficulty?.currentLevel || 5,
        autoAdjustEnabled: metadata.adaptiveDifficulty?.autoAdjustEnabled !== false,
        preferredChallengeTypes: metadata.preferredChallengeTypes || ['coding', 'quiz'],
        learningPace: metadata.learningPace || 'normal',
        feedbackPreference: metadata.feedbackPreference || 'detailed'
      },
      
      learningPath: {
        currentModule: dbProfile.recentTopics[0] || 'basics',
        completedModules: metadata.completedModules || [],
        recommendedNext: this.calculateRecommendedModules(dbProfile),
        customPath: metadata.customPath || false,
        estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
      },
      
      personalizedContent: {
        weakAreas: dbProfile.weakAreas,
        strongAreas: dbProfile.strongAreas,
        recentTopics: dbProfile.recentTopics,
        bookmarkedConcepts: metadata.bookmarkedConcepts || [],
        personalNotes: metadata.personalNotes || {}
      }
    };
  }

  private async createNewProfile(userId: string): Promise<LearningProfile> {
    const profile: LearningProfile = this.createDefaultProfile(userId);
    
    // Save to database
    await prisma.aiLearningContext.create({
      data: {
        userId,
        skillLevel: profile.skillLevel,
        learningPath: [],
        recentTopics: [],
        weakAreas: [],
        strongAreas: [],
        preferredLearningStyle: profile.learningStyle,
        totalXP: 0,
        streak: 0,
        lastActiveDate: new Date(),
        metadata: {
          performanceMetrics: profile.performanceMetrics,
          adaptiveDifficulty: profile.adaptiveSettings,
          learningPath: profile.learningPath,
          personalizedContent: profile.personalizedContent
        }
      }
    });

    return profile;
  }

  private createDefaultProfile(userId: string): LearningProfile {
    return {
      userId,
      skillLevel: 'BEGINNER',
      learningStyle: 'mixed',
      currentLevel: 1,
      totalXP: 0,
      streak: 0,
      
      performanceMetrics: {
        averageScore: 0,
        completionRate: 0,
        timeSpentLearning: 0,
        conceptMastery: {},
        errorPatterns: [],
        successPatterns: [],
        securityAwareness: 50,
        gasOptimizationSkill: 50,
        codeQualityScore: 50
      },
      
      adaptiveSettings: {
        difficultyLevel: 3,
        autoAdjustEnabled: true,
        preferredChallengeTypes: ['coding', 'quiz'],
        learningPace: 'normal',
        feedbackPreference: 'detailed'
      },
      
      learningPath: {
        currentModule: 'basics',
        completedModules: [],
        recommendedNext: ['basics'],
        customPath: false,
        estimatedCompletion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days for beginners
      },
      
      personalizedContent: {
        weakAreas: [],
        strongAreas: [],
        recentTopics: [],
        bookmarkedConcepts: [],
        personalNotes: {}
      }
    };
  }

  async generatePersonalizedRecommendations(userId: string): Promise<LearningRecommendation[]> {
    const profile = await this.getLearningProfile(userId);
    const analysis = await this.analyzePerformance(userId);
    
    const recommendations: LearningRecommendation[] = [];

    // 1. Address weak areas with high priority
    for (const weakArea of profile.personalizedContent.weakAreas.slice(0, 2)) {
      recommendations.push({
        type: 'concept',
        title: `Master ${weakArea}`,
        description: `Focused practice on ${weakArea} to improve your understanding`,
        difficulty: Math.max(1, profile.adaptiveSettings.difficultyLevel - 1),
        estimatedTime: 30,
        prerequisites: this.getPrerequisites(weakArea),
        learningObjectives: [`Understand ${weakArea} concepts`, `Apply ${weakArea} in practice`],
        personalizedReason: `You've struggled with ${weakArea} in recent sessions`,
        priority: 'high'
      });
    }

    // 2. Build on strong areas
    for (const strongArea of profile.personalizedContent.strongAreas.slice(0, 1)) {
      const nextLevel = this.getNextLevelConcept(strongArea);
      if (nextLevel) {
        recommendations.push({
          type: 'challenge',
          title: `Advanced ${nextLevel}`,
          description: `Challenge yourself with advanced ${nextLevel} concepts`,
          difficulty: profile.adaptiveSettings.difficultyLevel + 1,
          estimatedTime: 45,
          prerequisites: [strongArea],
          learningObjectives: [`Master advanced ${nextLevel}`, `Apply in complex scenarios`],
          personalizedReason: `You excel at ${strongArea}, ready for the next challenge`,
          priority: 'medium'
        });
      }
    }

    // 3. Security-focused recommendations if security awareness is low
    if (profile.performanceMetrics.securityAwareness < 70) {
      recommendations.push({
        type: 'concept',
        title: 'Smart Contract Security Fundamentals',
        description: 'Learn essential security patterns and common vulnerabilities',
        difficulty: Math.min(profile.adaptiveSettings.difficultyLevel + 1, 10),
        estimatedTime: 60,
        prerequisites: ['contracts', 'functions'],
        learningObjectives: ['Identify common vulnerabilities', 'Implement security patterns'],
        personalizedReason: 'Improving security awareness will make you a better developer',
        priority: 'high'
      });
    }

    // 4. Gas optimization if skill is low
    if (profile.performanceMetrics.gasOptimizationSkill < 70) {
      recommendations.push({
        type: 'project',
        title: 'Gas Optimization Challenge',
        description: 'Optimize smart contracts for minimal gas consumption',
        difficulty: profile.adaptiveSettings.difficultyLevel,
        estimatedTime: 90,
        prerequisites: ['contracts', 'functions', 'data-types'],
        learningObjectives: ['Understand gas mechanics', 'Apply optimization techniques'],
        personalizedReason: 'Gas optimization is crucial for production smart contracts',
        priority: 'medium'
      });
    }

    // 5. Review recommendations based on retention
    if (analysis.retentionRate < 80) {
      const reviewTopics = profile.personalizedContent.recentTopics.slice(0, 3);
      for (const topic of reviewTopics) {
        recommendations.push({
          type: 'review',
          title: `Review ${topic}`,
          description: `Reinforce your understanding of ${topic}`,
          difficulty: Math.max(1, profile.adaptiveSettings.difficultyLevel - 2),
          estimatedTime: 20,
          prerequisites: [],
          learningObjectives: [`Reinforce ${topic} knowledge`],
          personalizedReason: 'Regular review improves long-term retention',
          priority: 'low'
        });
      }
    }

    // Sort by priority and difficulty
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 8); // Return top 8 recommendations
  }

  async analyzePerformance(userId: string): Promise<PerformanceAnalysis> {
    // Check cache
    const cached = this.analysisCache.get(userId);
    if (cached) return cached;

    const profile = await this.getLearningProfile(userId);
    
    // Calculate performance metrics
    const analysis: PerformanceAnalysis = {
      overallProgress: this.calculateOverallProgress(profile),
      strengthAreas: this.identifyStrengths(profile),
      improvementAreas: this.identifyImprovementAreas(profile),
      learningVelocity: this.calculateLearningVelocity(profile),
      retentionRate: this.calculateRetentionRate(profile),
      engagementScore: this.calculateEngagementScore(profile),
      predictedOutcomes: await this.predictOutcomes(profile)
    };

    // Cache the analysis
    this.analysisCache.set(userId, analysis);
    setTimeout(() => this.analysisCache.delete(userId), this.cacheExpiry);

    return analysis;
  }

  private calculateOverallProgress(profile: LearningProfile): number {
    const totalConcepts = Object.values(this.conceptHierarchy).reduce(
      (sum, module) => sum + module.concepts.length, 0
    );
    const masteredConcepts = Object.values(profile.performanceMetrics.conceptMastery)
      .filter(mastery => mastery > 0.7).length;
    
    return Math.round((masteredConcepts / totalConcepts) * 100);
  }

  private identifyStrengths(profile: LearningProfile): Array<{ concept: string; mastery: number; confidence: number }> {
    return Object.entries(profile.performanceMetrics.conceptMastery)
      .filter(([_, mastery]) => mastery > 0.8)
      .map(([concept, mastery]) => ({
        concept,
        mastery,
        confidence: Math.min(mastery * 1.2, 1.0) // Boost confidence for strong areas
      }))
      .sort((a, b) => b.mastery - a.mastery)
      .slice(0, 5);
  }

  private identifyImprovementAreas(profile: LearningProfile): Array<{ concept: string; mastery: number; suggestions: string[] }> {
    return Object.entries(profile.performanceMetrics.conceptMastery)
      .filter(([_, mastery]) => mastery < 0.6)
      .map(([concept, mastery]) => ({
        concept,
        mastery,
        suggestions: this.generateImprovementSuggestions(concept, mastery)
      }))
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 5);
  }

  private calculateLearningVelocity(profile: LearningProfile): number {
    // Concepts learned per week based on recent activity
    const recentTopics = profile.personalizedContent.recentTopics.length;
    const weeksActive = Math.max(1, profile.streak / 7);
    return Math.round((recentTopics / weeksActive) * 10) / 10;
  }

  private calculateRetentionRate(profile: LearningProfile): number {
    // Based on concept mastery stability over time
    const masteredConcepts = Object.values(profile.performanceMetrics.conceptMastery)
      .filter(mastery => mastery > 0.7).length;
    const totalStudiedConcepts = Object.keys(profile.performanceMetrics.conceptMastery).length;
    
    return totalStudiedConcepts > 0 ? Math.round((masteredConcepts / totalStudiedConcepts) * 100) : 100;
  }

  private calculateEngagementScore(profile: LearningProfile): number {
    let score = 0;
    
    // Streak contribution (0-40 points)
    score += Math.min(profile.streak * 2, 40);
    
    // XP contribution (0-30 points)
    score += Math.min(profile.totalXP / 100, 30);
    
    // Activity diversity (0-30 points)
    const diversityScore = Math.min(profile.personalizedContent.recentTopics.length * 3, 30);
    score += diversityScore;
    
    return Math.min(Math.round(score), 100);
  }

  private async predictOutcomes(profile: LearningProfile): Promise<PerformanceAnalysis['predictedOutcomes']> {
    const currentProgress = this.calculateOverallProgress(profile);
    const velocity = this.calculateLearningVelocity(profile);
    
    // Predict next level ETA
    const progressNeeded = ((profile.currentLevel + 1) * 20) - currentProgress; // Assuming 20% per level
    const weeksToNextLevel = velocity > 0 ? Math.ceil(progressNeeded / (velocity * 5)) : 12;
    const nextLevelETA = new Date(Date.now() + weeksToNextLevel * 7 * 24 * 60 * 60 * 1000);
    
    // Calculate completion probability
    const completionProbability = Math.min(
      (profile.streak / 30) * 0.3 + // Consistency factor
      (profile.performanceMetrics.averageScore / 100) * 0.4 + // Performance factor
      (this.calculateEngagementScore(profile) / 100) * 0.3, // Engagement factor
      1.0
    );
    
    // Identify risk factors
    const riskFactors: string[] = [];
    if (profile.streak < 7) riskFactors.push('Low consistency');
    if (profile.performanceMetrics.averageScore < 70) riskFactors.push('Below average performance');
    if (profile.personalizedContent.weakAreas.length > 3) riskFactors.push('Multiple weak areas');
    if (velocity < 1) riskFactors.push('Slow learning pace');
    
    return {
      nextLevelETA,
      completionProbability: Math.round(completionProbability * 100),
      riskFactors
    };
  }

  private calculateRecommendedModules(dbProfile: any): string[] {
    const completed = dbProfile.metadata?.completedModules || [];
    const current = dbProfile.recentTopics[0] || 'basics';
    
    // Find next logical modules based on hierarchy
    const recommendations: string[] = [];
    
    for (const [moduleId, module] of Object.entries(this.conceptHierarchy)) {
      if (!completed.includes(moduleId) && moduleId !== current) {
        const hasPrerequisites = module.prerequisites.every(prereq => completed.includes(prereq));
        if (hasPrerequisites) {
          recommendations.push(moduleId);
        }
      }
    }
    
    return recommendations.slice(0, 3);
  }

  private getPrerequisites(concept: string): string[] {
    for (const moduleData of Object.values(this.conceptHierarchy)) {
      if (moduleData.concepts.includes(concept)) {
        return moduleData.prerequisites;
      }
    }
    return [];
  }

  private getNextLevelConcept(concept: string): string | null {
    // Find more advanced concepts in the same domain
    const conceptModules = Object.entries(this.conceptHierarchy);
    
    for (let i = 0; i < conceptModules.length - 1; i++) {
      const [, moduleData] = conceptModules[i];
      if (moduleData.concepts.includes(concept)) {
        const nextModule = conceptModules[i + 1];
        return nextModule ? nextModule[1].concepts[0] : null;
      }
    }
    
    return null;
  }

  private generateImprovementSuggestions(concept: string, mastery: number): string[] {
    const suggestions = [
      `Practice ${concept} with interactive exercises`,
      `Review ${concept} fundamentals`,
      `Apply ${concept} in a real project`
    ];
    
    if (mastery < 0.3) {
      suggestions.unshift(`Start with ${concept} basics tutorial`);
    }
    
    return suggestions;
  }

  // Public method to update learning progress
  async updateLearningProgress(
    userId: string, 
    concept: string, 
    score: number, 
    timeSpent: number
  ): Promise<void> {
    const profile = await this.getLearningProfile(userId);
    
    // Update concept mastery
    const currentMastery = profile.performanceMetrics.conceptMastery[concept] || 0;
    const newMastery = (currentMastery * 0.7) + ((score / 100) * 0.3); // Weighted average
    profile.performanceMetrics.conceptMastery[concept] = Math.min(newMastery, 1.0);
    
    // Update performance metrics
    profile.performanceMetrics.timeSpentLearning += timeSpent;
    profile.performanceMetrics.averageScore = 
      (profile.performanceMetrics.averageScore * 0.9) + (score * 0.1);
    
    // Update recent topics
    if (!profile.personalizedContent.recentTopics.includes(concept)) {
      profile.personalizedContent.recentTopics.unshift(concept);
      profile.personalizedContent.recentTopics = profile.personalizedContent.recentTopics.slice(0, 10);
    }
    
    // Save to cache and database
    this.profileCache.set(userId, profile);
    await this.saveLearningProfile(profile);
    
    // Clear analysis cache to force recalculation
    this.analysisCache.delete(userId);
  }

  private async saveLearningProfile(profile: LearningProfile): Promise<void> {
    try {
      await prisma.aiLearningContext.upsert({
        where: { userId: profile.userId },
        update: {
          skillLevel: profile.skillLevel,
          preferredLearningStyle: profile.learningStyle,
          totalXP: profile.totalXP,
          streak: profile.streak,
          recentTopics: profile.personalizedContent.recentTopics,
          weakAreas: profile.personalizedContent.weakAreas,
          strongAreas: profile.personalizedContent.strongAreas,
          metadata: {
            performanceMetrics: profile.performanceMetrics,
            adaptiveDifficulty: profile.adaptiveSettings,
            learningPath: profile.learningPath,
            personalizedContent: profile.personalizedContent
          }
        },
        create: {
          userId: profile.userId,
          skillLevel: profile.skillLevel,
          learningPath: [],
          recentTopics: profile.personalizedContent.recentTopics,
          weakAreas: profile.personalizedContent.weakAreas,
          strongAreas: profile.personalizedContent.strongAreas,
          preferredLearningStyle: profile.learningStyle,
          totalXP: profile.totalXP,
          streak: profile.streak,
          lastActiveDate: new Date(),
          metadata: {
            performanceMetrics: profile.performanceMetrics,
            adaptiveDifficulty: profile.adaptiveSettings,
            learningPath: profile.learningPath,
            personalizedContent: profile.personalizedContent
          }
        }
      });
    } catch (error) {
      console.error('Failed to save learning profile:', error);
    }
  }

  // Method to get learning insights for dashboard
  async getLearningInsights(userId: string): Promise<{
    profile: LearningProfile;
    analysis: PerformanceAnalysis;
    recommendations: LearningRecommendation[];
    nextMilestone: { title: string; progress: number; eta: Date };
  }> {
    const [profile, analysis, recommendations] = await Promise.all([
      this.getLearningProfile(userId),
      this.analyzePerformance(userId),
      this.generatePersonalizedRecommendations(userId)
    ]);

    const nextMilestone = {
      title: `Level ${profile.currentLevel + 1}`,
      progress: analysis.overallProgress % 20 * 5, // Progress within current level
      eta: analysis.predictedOutcomes.nextLevelETA
    };

    return { profile, analysis, recommendations, nextMilestone };
  }

  // Method to adjust difficulty based on performance
  async adjustDifficulty(userId: string, performanceScore: number): Promise<void> {
    const profile = await this.getLearningProfile(userId);

    if (!profile.adaptiveSettings.autoAdjustEnabled) return;

    let newDifficulty = profile.adaptiveSettings.difficultyLevel;

    // Adjust based on performance
    if (performanceScore > 90 && newDifficulty < 10) {
      newDifficulty = Math.min(10, newDifficulty + 1);
    } else if (performanceScore < 60 && newDifficulty > 1) {
      newDifficulty = Math.max(1, newDifficulty - 1);
    }

    if (newDifficulty !== profile.adaptiveSettings.difficultyLevel) {
      profile.adaptiveSettings.difficultyLevel = newDifficulty;
      this.profileCache.set(userId, profile);
      await this.saveLearningProfile(profile);

      console.log(`🎯 Adjusted difficulty for user ${userId}: ${profile.adaptiveSettings.difficultyLevel} → ${newDifficulty}`);
    }
  }
}

// Export singleton instance
export const adaptiveLearning = new AdaptiveLearningEngine();
