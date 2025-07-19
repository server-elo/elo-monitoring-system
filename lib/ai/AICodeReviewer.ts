/**
 * AI Code Review System
 * 
 * Build contextual code review system that provides curriculum-aligned feedback
 * using Enhanced Tutor System's AI capabilities.
 */

import { enhancedTutor } from './EnhancedTutorSystem';
import { SecurityScanner, SecurityScanResult } from '@/lib/security/SecurityScanner';
import { GasOptimizationAnalyzer, GasAnalysisResult } from '@/lib/gas/GasOptimizationAnalyzer';
import { adaptiveLearningEngine, LearningProfile } from '@/lib/learning/AdaptiveLearningEngine';

export interface CodeReviewContext {
  userId: string;
  currentLesson: string;
  userSkillLevel: number; // 0-100
  learningObjectives: string[];
  previousReviews: CodeReview[];
  codeHistory: string[];
  sessionContext: {
    timeSpent: number;
    attemptsCount: number;
    hintsUsed: number;
    lastError?: string;
  };
}

export interface EducationalCodeReview {
  id: string;
  userId: string;
  code: string;
  timestamp: Date;
  overallScore: number;
  feedback: ReviewFeedback[];
  learningPoints: LearningPoint[];
  nextSteps: string[];
  improvementSuggestions: ImprovementSuggestion[];
  conceptsReinforced: string[];
  conceptsIntroduced: string[];
  skillProgression: SkillProgression;
  encouragement: EncouragementMessage;
  codeQualityMetrics: CodeQualityMetrics;
}

export interface ReviewFeedback {
  id: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  type: 'positive' | 'improvement' | 'critical' | 'suggestion';
  category: 'security' | 'gas' | 'style' | 'logic' | 'best-practice' | 'learning';
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  explanation: string;
  learningResource?: string;
  codeExample?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relatedConcepts: string[];
  actionable: boolean;
}

export interface LearningPoint {
  id?: string;
  concept: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
  priority?: 'low' | 'medium' | 'high';
  masteryLevel: number; // 0-100
  examples: string[];
  practiceExercises: string[];
  relatedTopics: string[];
  explanation?: string;
  example?: string;
  relatedObjective?: string;
}

export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  beforeCode: string;
  afterCode: string;
  explanation: string;
  learningValue: number; // 0-100
  autoFixAvailable: boolean;
}

export interface SkillProgression {
  currentLevel: number;
  previousLevel: number;
  improvement: number;
  strengthsIdentified: string[];
  weaknessesAddressed: string[];
  newSkillsUnlocked: string[];
  nextMilestone: string;
  progressToNextLevel: number; // 0-100
}

export interface EncouragementMessage {
  tone: 'supportive' | 'challenging' | 'celebratory' | 'motivational';
  message: string;
  achievements: string[];
  personalizedNote: string;
}

export interface CodeQualityMetrics {
  readability: number; // 0-100
  maintainability: number; // 0-100
  efficiency: number; // 0-100
  security: number; // 0-100
  bestPractices: number; // 0-100
  overall: number; // 0-100
  comparison: {
    previousReview?: number;
    classAverage?: number;
    industryStandard?: number;
  };
}

export interface CodeReview {
  id: string;
  timestamp: Date;
  score: number;
  mainIssues: string[];
  improvements: string[];
}

export class AICodeReviewer {
  private securityScanner: SecurityScanner;
  private gasAnalyzer: GasOptimizationAnalyzer;
  private reviewHistory: Map<string, CodeReview[]> = new Map();

  constructor(
    securityScanner: SecurityScanner,
    gasAnalyzer: GasOptimizationAnalyzer
  ) {
    this.securityScanner = securityScanner;
    this.gasAnalyzer = gasAnalyzer;
  }

  // Main code review method
  async reviewCode(
    code: string,
    context: CodeReviewContext
  ): Promise<EducationalCodeReview> {
    console.log(`🔍 Starting AI code review for user ${context.userId}`);
    
    const startTime = Date.now();
    const reviewId = `review-${Date.now()}-${context.userId}`;
    
    try {
      // Get user's learning profile
      const learningProfile = await adaptiveLearningEngine.analyzeUserPerformance(context.userId);
      
      // Perform technical analysis
      const [securityAnalysis, gasAnalysis] = await Promise.all([
        this.performSecurityAnalysis(code),
        this.performGasAnalysis(code, context.userId)
      ]);
      
      // Generate AI-powered educational review
      const aiReview = await this.generateAIReview(code, context, learningProfile, securityAnalysis, gasAnalysis);
      
      // Synthesize comprehensive review
      const review = await this.synthesizeReview(
        reviewId,
        code,
        context,
        learningProfile,
        securityAnalysis,
        gasAnalysis,
        aiReview
      );
      
      // Save review and update user progress
      await this.saveReview(review);
      await this.updateUserProgress(context.userId, review);
      
      const reviewTime = Date.now() - startTime;
      console.log(`✅ Code review completed in ${reviewTime}ms`);
      
      return review;
      
    } catch (error) {
      console.error('Code review failed:', error);
      throw error;
    }
  }

  // Generate improvement suggestions
  async generateImprovementSuggestions(
    review: EducationalCodeReview
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Convert feedback to actionable suggestions
    for (const feedback of review.feedback) {
      if (feedback.actionable && feedback.type !== 'positive') {
        const suggestion = await this.createImprovementSuggestion(feedback, review.code);
        suggestions.push(suggestion);
      }
    }
    
    // Sort by learning value and priority
    return suggestions.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.learningValue - a.learningValue;
    });
  }

  // Track learning progress from reviews
  async trackLearningProgress(
    userId: string,
    review: EducationalCodeReview
  ): Promise<void> {
    // Update concept mastery based on review
    for (const concept of review.conceptsReinforced) {
      const performance = this.calculateConceptPerformance(review, concept);
      await adaptiveLearningEngine.assessConceptMastery(userId, concept, performance);
    }
    
    // Record review in history
    const userHistory = this.reviewHistory.get(userId) || [];
    userHistory.push({
      id: review.id,
      timestamp: review.timestamp,
      score: review.overallScore,
      mainIssues: review.feedback.filter(f => f.type === 'critical').map(f => f.title),
      improvements: review.improvementSuggestions.map(s => s.title)
    });
    
    this.reviewHistory.set(userId, userHistory.slice(-10)); // Keep last 10 reviews
  }

  // Private helper methods
  private async performSecurityAnalysis(_code: string): Promise<SecurityScanResult | null> {
    try {
      return await this.securityScanner.performAnalysis();
    } catch (error) {
      console.warn('Security analysis failed:', error);
      return null;
    }
  }

  private async performGasAnalysis(_code: string, userId: string): Promise<GasAnalysisResult | null> {
    try {
      return await this.gasAnalyzer.analyzeGasUsage(userId);
    } catch (error) {
      console.warn('Gas analysis failed:', error);
      return null;
    }
  }

  private async generateAIReview(
    code: string,
    context: CodeReviewContext,
    profile: LearningProfile,
    securityAnalysis: SecurityScanResult | null,
    gasAnalysis: GasAnalysisResult | null
  ): Promise<any> {
    const prompt = this.buildReviewPrompt(code, context, profile, securityAnalysis, gasAnalysis);
    
    return await enhancedTutor.getAIResponse(
      prompt,
      { userId: context.userId },
      'explanation'
    );
  }

  private buildReviewPrompt(
    code: string,
    context: CodeReviewContext,
    profile: LearningProfile,
    securityAnalysis: SecurityScanResult | null,
    gasAnalysis: GasAnalysisResult | null
  ): string {
    return `
      Provide a comprehensive educational code review for a Solidity student.
      
      Student Profile:
      - Skill Level: ${context.userSkillLevel}/100
      - Learning Velocity: ${profile.learningVelocity}
      - Current Lesson: ${context.currentLesson}
      - Learning Objectives: ${context.learningObjectives.join(', ')}
      - Weakness Patterns: ${profile.weaknessPatterns.join(', ')}
      - Strength Areas: ${profile.strengthAreas.join(', ')}
      
      Session Context:
      - Time Spent: ${context.sessionContext.timeSpent} minutes
      - Attempts: ${context.sessionContext.attemptsCount}
      - Hints Used: ${context.sessionContext.hintsUsed}
      
      Code to Review:
      \`\`\`solidity
      ${code}
      \`\`\`
      
      Technical Analysis Results:
      - Security Issues: ${securityAnalysis?.issues?.length || 0}
      - Security Score: ${securityAnalysis?.overallScore || 'N/A'}
      - Gas Optimizations: ${gasAnalysis?.optimizations?.length || 0}
      - Total Gas Cost: ${gasAnalysis?.totalGasCost || 'N/A'}
      
      Previous Reviews: ${context.previousReviews.length} reviews completed
      
      Provide a review that:
      1. Celebrates what they did well (be specific and encouraging)
      2. Identifies learning opportunities aligned with their objectives
      3. Explains issues in terms they can understand at their level
      4. Connects feedback to broader Solidity concepts
      5. Suggests specific, actionable improvements
      6. Recommends next learning steps
      7. Maintains a supportive, growth-oriented tone
      
      Focus on education over criticism. Help them learn and improve.
      Tailor complexity to their skill level: ${context.userSkillLevel}/100.
    `;
  }

  private async synthesizeReview(
    reviewId: string,
    code: string,
    context: CodeReviewContext,
    profile: LearningProfile,
    securityAnalysis: SecurityScanResult | null,
    gasAnalysis: GasAnalysisResult | null,
    aiReview: any
  ): Promise<EducationalCodeReview> {
    // Combine technical analysis with AI insights
    const feedback = this.generateFeedback(securityAnalysis, gasAnalysis, aiReview, context);
    const learningPoints = this.extractLearningPoints(aiReview, context);
    const improvementSuggestions = await this.generateImprovementSuggestions({ feedback } as any);
    
    // Calculate skill progression
    const skillProgression = this.calculateSkillProgression(context.userId, feedback, profile);
    
    // Generate encouragement message
    const encouragement = this.generateEncouragement(feedback, skillProgression, context);
    
    // Calculate code quality metrics
    const codeQualityMetrics = this.calculateCodeQualityMetrics(
      securityAnalysis,
      gasAnalysis,
      feedback
    );
    
    return {
      id: reviewId,
      userId: context.userId,
      code,
      timestamp: new Date(),
      overallScore: this.calculateOverallScore(feedback, codeQualityMetrics),
      feedback,
      learningPoints,
      nextSteps: this.generateNextSteps(learningPoints, context),
      improvementSuggestions,
      conceptsReinforced: this.extractReinforcedConcepts(feedback, context),
      conceptsIntroduced: this.extractIntroducedConcepts(aiReview),
      skillProgression,
      encouragement,
      codeQualityMetrics
    };
  }

  private generateFeedback(
    securityAnalysis: SecurityScanResult | null,
    gasAnalysis: GasAnalysisResult | null,
    _aiReview: any,
    _context: CodeReviewContext
  ): ReviewFeedback[] {
    const feedback: ReviewFeedback[] = [];
    
    // Convert security issues to educational feedback
    if (securityAnalysis?.issues) {
      securityAnalysis.issues.forEach((issue, index) => {
        feedback.push({
          id: `security-${index}`,
          line: issue.line,
          type: issue.severity === 'critical' ? 'critical' : 'improvement',
          category: 'security',
          severity: issue.severity as any,
          title: issue.title,
          message: issue.message,
          explanation: `Security issue: ${issue.message}. ${issue.suggestion}`,
          difficulty: this.mapSeverityToDifficulty(issue.severity),
          relatedConcepts: [issue.category],
          actionable: true
        });
      });
    }
    
    // Convert gas optimizations to educational feedback
    if (gasAnalysis?.optimizations) {
      gasAnalysis.optimizations.forEach((opt, index) => {
        feedback.push({
          id: `gas-${index}`,
          line: opt.line,
          type: 'suggestion',
          category: 'gas',
          severity: opt.impact === 'high' ? 'high' : 'medium',
          title: opt.title,
          message: opt.description,
          explanation: `Gas optimization opportunity: ${opt.explanation}`,
          difficulty: opt.difficulty as any,
          relatedConcepts: [opt.category],
          actionable: opt.autoFixAvailable
        });
      });
    }
    
    return feedback;
  }

  private calculateOverallScore(
    _feedback: ReviewFeedback[],
    metrics: CodeQualityMetrics
  ): number {
    // Weighted average of different aspects
    const securityWeight = 0.3;
    const gasWeight = 0.2;
    const styleWeight = 0.2;
    const logicWeight = 0.3;
    
    return Math.round(
      metrics.security * securityWeight +
      metrics.efficiency * gasWeight +
      metrics.bestPractices * styleWeight +
      metrics.readability * logicWeight
    );
  }

  private mapSeverityToDifficulty(severity: string): 'beginner' | 'intermediate' | 'advanced' {
    switch (severity) {
      case 'low': return 'beginner';
      case 'medium': return 'intermediate';
      case 'high':
      case 'critical': return 'advanced';
      default: return 'intermediate';
    }
  }

  // Save review to storage
  private async saveReview(review: EducationalCodeReview): Promise<void> {
    // In a real implementation, this would save to a database
    console.log(`💾 Saving code review ${review.id}`);
    
    // Update review history in memory for now
    const userHistory = this.reviewHistory.get(review.userId) || [];
    userHistory.push({
      id: review.id,
      timestamp: review.timestamp,
      score: review.overallScore,
      mainIssues: review.feedback.filter(f => f.type === 'critical').map(f => f.title),
      improvements: review.improvementSuggestions.map(s => s.title)
    });
    this.reviewHistory.set(review.userId, userHistory);
  }

  // Update user progress based on review
  private async updateUserProgress(userId: string, review: EducationalCodeReview): Promise<void> {
    // Track concept mastery
    for (const concept of review.conceptsReinforced) {
      const performance = this.calculateConceptPerformance(review, concept);
      await adaptiveLearningEngine.assessConceptMastery(userId, concept, performance);
    }
    
    console.log(`📊 Updated progress for user ${userId}`);
  }

  // Calculate concept performance from review
  private calculateConceptPerformance(review: EducationalCodeReview, concept: string): number {
    // Find feedback items related to this concept
    const relatedFeedback = review.feedback.filter(f => 
      f.relatedConcepts.includes(concept)
    );
    
    if (relatedFeedback.length === 0) return review.overallScore;
    
    // Calculate performance based on feedback severity
    const severityScores = {
      critical: 0,
      high: 25,
      medium: 50,
      low: 75,
      positive: 100
    };
    
    const totalScore = relatedFeedback.reduce((sum, f) => 
      sum + (severityScores[f.severity] || 50), 0
    );
    
    return Math.round(totalScore / relatedFeedback.length);
  }

  // Extract learning points from AI review
  private extractLearningPoints(aiReview: any, context: CodeReviewContext): LearningPoint[] {
    const learningPoints: LearningPoint[] = [];
    
    // Parse AI response for learning points
    if (aiReview.content) {
      // Extract specific learning points from AI response
      const points = this.parseAILearningPoints(aiReview.content);
      
      points.forEach((point, index) => {
        learningPoints.push({
          id: `lp-${index}`,
          concept: point.concept || context.learningObjectives[0],
          explanation: point.explanation,
          example: point.example || '',
          priority: this.determinePriority(point, context),
          relatedObjective: context.learningObjectives.find(obj => 
            point.explanation.toLowerCase().includes(obj.toLowerCase())
          ) || context.learningObjectives[0]
        });
      });
    }
    
    return learningPoints;
  }

  // Parse AI response for learning points
  private parseAILearningPoints(content: string): any[] {
    // Simple parsing logic - in production, use more sophisticated parsing
    const points: any[] = [];
    const lines = content.split('\n');
    
    let currentPoint: any = null;
    for (const line of lines) {
      if (line.includes('Learning Point:') || line.includes('Key Concept:')) {
        if (currentPoint) points.push(currentPoint);
        currentPoint = { explanation: line, concept: '' };
      } else if (currentPoint && line.trim()) {
        currentPoint.explanation += ' ' + line;
      }
    }
    
    if (currentPoint) points.push(currentPoint);
    return points;
  }

  // Determine priority for learning point
  private determinePriority(point: any, context: CodeReviewContext): 'high' | 'medium' | 'low' {
    // Check if point relates to current learning objectives
    const isCurrentObjective = context.learningObjectives.some(obj => 
      point.explanation.toLowerCase().includes(obj.toLowerCase())
    );
    
    if (isCurrentObjective) return 'high';
    if (context.userSkillLevel < 50) return 'medium';
    return 'low';
  }

  // Calculate skill progression
  private calculateSkillProgression(
    userId: string,
    feedback: ReviewFeedback[],
    profile: LearningProfile
  ): SkillProgression {
    const previousReviews = this.reviewHistory.get(userId) || [];
    const recentScores = previousReviews.slice(-5).map(r => r.score);
    
    // Calculate improvement trend
    let improvementRate = 0;
    if (recentScores.length > 1) {
      const avgRecent = recentScores.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const avgPrevious = recentScores.slice(0, -3).reduce((a, b) => a + b, 0) / Math.max(1, recentScores.length - 3);
      improvementRate = Math.round(((avgRecent - avgPrevious) / avgPrevious) * 100);
    }
    
    // Count mastered concepts
    const conceptsMastered = Object.entries(profile.skillLevels)
      .filter(([_, level]) => level >= 80)
      .map(([concept]) => concept);
    
    // Identify areas needing work
    const areasForImprovement = feedback
      .filter(f => f.severity === 'high' || f.severity === 'critical')
      .map(f => f.relatedConcepts)
      .flat()
      .filter((v, i, a) => a.indexOf(v) === i);
    
    return {
      currentLevel: Math.round(Object.values(profile.skillLevels).reduce((a, b) => a + b, 0) / Object.values(profile.skillLevels).length),
      improvementRate,
      conceptsMastered,
      areasForImprovement,
      nextMilestone: this.getNextMilestone(profile)
    };
  }

  // Get next milestone for user
  private getNextMilestone(profile: LearningProfile): string {
    const avgSkill = Object.values(profile.skillLevels).reduce((a, b) => a + b, 0) / 
                     Object.values(profile.skillLevels).length;
    
    if (avgSkill < 30) return 'Complete Basic Syntax module';
    if (avgSkill < 50) return 'Master Function Development';
    if (avgSkill < 70) return 'Understand Smart Contract Security';
    if (avgSkill < 90) return 'Optimize Gas Efficiency';
    return 'Become a Solidity Expert';
  }

  // Generate encouragement message
  private generateEncouragement(
    feedback: ReviewFeedback[],
    progression: SkillProgression,
    context: CodeReviewContext
  ): EncouragementMessage {
    const positiveFeedback = feedback.filter(f => f.type === 'positive');
    const hasImproved = progression.improvementRate > 0;
    
    let message = '';
    let emoji = '🌟';
    
    if (positiveFeedback.length > feedback.length * 0.7) {
      message = 'Excellent work! Your code demonstrates strong understanding.';
      emoji = '🎉';
    } else if (hasImproved) {
      message = `Great progress! You've improved by ${progression.improvementRate}% recently.`;
      emoji = '📈';
    } else if (context.sessionContext.attemptsCount > 3) {
      message = 'Your persistence is admirable! Keep working through the challenges.';
      emoji = '💪';
    } else {
      message = 'Keep learning! Every line of code brings you closer to mastery.';
      emoji = '🚀';
    }
    
    return {
      message,
      emoji,
      motivationalQuote: this.getMotivationalQuote(),
      personalizedTip: this.getPersonalizedTip(feedback, context)
    };
  }

  // Get motivational quote
  private getMotivationalQuote(): string {
    const quotes = [
      'Every expert was once a beginner.',
      'Code is like humor. When you have to explain it, it\'s bad.',
      'The best way to learn is by doing.',
      'Debugging is twice as hard as writing code.',
      'Simplicity is the soul of efficiency.'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  // Get personalized tip based on feedback
  private getPersonalizedTip(feedback: ReviewFeedback[], context: CodeReviewContext): string {
    const criticalIssues = feedback.filter(f => f.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      return `Focus on fixing the ${criticalIssues[0].title.toLowerCase()} issue first.`;
    }
    
    if (context.sessionContext.hintsUsed > 2) {
      return 'Try solving the next problem without hints to test your understanding.';
    }
    
    return 'Consider how this code might behave with edge cases.';
  }

  // Calculate code quality metrics
  private calculateCodeQualityMetrics(
    securityAnalysis: SecurityScanResult | null,
    gasAnalysis: GasAnalysisResult | null,
    feedback: ReviewFeedback[]
  ): CodeQualityMetrics {
    // Security score
    const security = securityAnalysis?.overallScore || 
      (100 - feedback.filter(f => f.relatedConcepts.includes('security')).length * 10);
    
    // Efficiency score
    const efficiency = gasAnalysis ? 
      Math.round(100 - (gasAnalysis.totalGasCost / 1000000) * 10) : 
      80;
    
    // Best practices score
    const bestPractices = Math.round(
      100 - feedback.filter(f => f.type === 'style').length * 5
    );
    
    // Readability score
    const readability = Math.round(
      100 - feedback.filter(f => f.type === 'suggestion' && f.title.includes('readability')).length * 10
    );
    
    return {
      security: Math.max(0, Math.min(100, security)),
      efficiency: Math.max(0, Math.min(100, efficiency)),
      bestPractices: Math.max(0, Math.min(100, bestPractices)),
      readability: Math.max(0, Math.min(100, readability))
    };
  }

  // Generate next steps based on review
  private generateNextSteps(learningPoints: LearningPoint[], context: CodeReviewContext): string[] {
    const nextSteps: string[] = [];
    
    // Add steps based on learning points
    learningPoints
      .filter(lp => lp.priority === 'high')
      .forEach(lp => {
        nextSteps.push(`Review the concept of ${lp.concept}`);
      });
    
    // Add steps based on context
    if (context.sessionContext.timeSpent < 10) {
      nextSteps.push('Spend more time analyzing the problem before coding');
    }
    
    if (context.previousReviews.length < 3) {
      nextSteps.push('Complete more practice problems to reinforce learning');
    }
    
    // Add progression-based steps
    nextSteps.push('Try a slightly more challenging problem next');
    
    return nextSteps.slice(0, 3); // Return top 3 steps
  }

  // Extract reinforced concepts from feedback
  private extractReinforcedConcepts(feedback: ReviewFeedback[], context: CodeReviewContext): string[] {
    const concepts = new Set<string>();
    
    // Add concepts from positive feedback
    feedback
      .filter(f => f.type === 'positive')
      .forEach(f => f.relatedConcepts.forEach(c => concepts.add(c)));
    
    // Add current learning objectives that were demonstrated
    context.learningObjectives.forEach(obj => {
      if (feedback.some(f => f.message.toLowerCase().includes(obj.toLowerCase()))) {
        concepts.add(obj);
      }
    });
    
    return Array.from(concepts);
  }

  // Extract introduced concepts from AI review
  private extractIntroducedConcepts(aiReview: any): string[] {
    const concepts: string[] = [];
    
    if (aiReview.content) {
      // Look for new concepts mentioned in the review
      const conceptKeywords = [
        'you might consider',
        'advanced technique',
        'another approach',
        'in the future',
        'next level'
      ];
      
      conceptKeywords.forEach(keyword => {
        if (aiReview.content.toLowerCase().includes(keyword)) {
          // Extract the concept after the keyword
          const match = aiReview.content.match(new RegExp(`${keyword}[^.]+`, 'i'));
          if (match) {
            concepts.push(match[0].replace(keyword, '').trim());
          }
        }
      });
    }
    
    return concepts.slice(0, 3); // Limit to 3 new concepts
  }

  // Create improvement suggestion from feedback
  private async createImprovementSuggestion(
    feedback: ReviewFeedback,
    code: string
  ): Promise<ImprovementSuggestion> {
    return {
      id: `improvement-${feedback.id}`,
      feedbackId: feedback.id,
      title: feedback.title,
      description: feedback.explanation || feedback.message,
      codeExample: this.generateCodeExample(feedback, code),
      difficulty: feedback.difficulty || 'intermediate',
      estimatedTime: this.estimateImprovementTime(feedback),
      learningValue: this.calculateLearningValue(feedback),
      priority: feedback.severity === 'critical' ? 'high' : 
                feedback.severity === 'high' ? 'medium' : 'low',
      relatedConcepts: feedback.relatedConcepts,
      resources: []
    };
  }

  // Generate code example for improvement
  private generateCodeExample(feedback: ReviewFeedback, code: string): string {
    // Extract relevant code section
    if (feedback.line) {
      const lines = code.split('\n');
      const startLine = Math.max(0, feedback.line - 2);
      const endLine = Math.min(lines.length, (feedback.endLine || feedback.line) + 2);
      
      return lines.slice(startLine, endLine).join('\n');
    }
    
    return '// See feedback for details';
  }

  // Estimate time to implement improvement
  private estimateImprovementTime(feedback: ReviewFeedback): number {
    const baseTime = {
      beginner: 5,
      intermediate: 10,
      advanced: 20
    };
    
    const severityMultiplier = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      critical: 2
    };
    
    const difficulty = feedback.difficulty || 'intermediate';
    const severity = feedback.severity;
    
    return Math.round(
      baseTime[difficulty] * (severityMultiplier[severity] || 1)
    );
  }

  // Calculate learning value of improvement
  private calculateLearningValue(feedback: ReviewFeedback): number {
    let value = 50; // Base value
    
    // Increase value for security and best practices
    if (feedback.relatedConcepts.includes('security')) value += 30;
    if (feedback.relatedConcepts.includes('best-practices')) value += 20;
    
    // Adjust based on severity
    if (feedback.severity === 'critical') value += 25;
    if (feedback.severity === 'high') value += 15;
    
    return Math.min(100, value);
  }
}

// Export factory function
export function createAICodeReviewer(
  securityScanner: SecurityScanner,
  gasAnalyzer: GasOptimizationAnalyzer
): AICodeReviewer {
  return new AICodeReviewer(securityScanner, gasAnalyzer);
}
