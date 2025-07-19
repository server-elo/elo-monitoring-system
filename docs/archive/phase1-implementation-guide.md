# Phase 1 Implementation Guide: AI-Powered Learning Experience

## Overview
Phase 1 builds upon our completed Enhanced Tutor System to create an adaptive, personalized learning experience that leverages our Smart Request Router, real-time security scanning, and gas optimization capabilities.

## Week 1: Adaptive Learning Intelligence

### 1. Adaptive Learning Algorithm Engine

#### Database Schema Extensions
```sql
-- User learning profile tracking
CREATE TABLE user_learning_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    skill_levels JSONB NOT NULL DEFAULT '{}', -- concept -> proficiency (0-100)
    learning_velocity DECIMAL DEFAULT 1.0,
    preferred_difficulty VARCHAR(20) DEFAULT 'adaptive',
    weakness_patterns TEXT[] DEFAULT '{}',
    strength_areas TEXT[] DEFAULT '{}',
    last_analysis_scores JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Learning session tracking
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    concepts_covered TEXT[],
    performance_metrics JSONB,
    difficulty_adjustments JSONB,
    ai_recommendations TEXT[]
);

-- Concept mastery tracking
CREATE TABLE concept_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    concept_name VARCHAR(100) NOT NULL,
    mastery_level INTEGER CHECK (mastery_level >= 0 AND mastery_level <= 100),
    attempts_count INTEGER DEFAULT 0,
    success_rate DECIMAL DEFAULT 0.0,
    last_practiced TIMESTAMP DEFAULT NOW(),
    time_to_mastery INTERVAL,
    UNIQUE(user_id, concept_name)
);
```

#### Core Implementation
```typescript
// lib/learning/AdaptiveLearningEngine.ts
export interface LearningProfile {
  userId: string;
  skillLevels: Record<string, number>;
  learningVelocity: number;
  preferredDifficulty: 'gradual' | 'challenge' | 'adaptive';
  weaknessPatterns: string[];
  strengthAreas: string[];
  lastAnalysisScores: {
    security: number;
    gasOptimization: number;
    codeQuality: number;
  };
}

export interface LearningPath {
  userId: string;
  currentLevel: number;
  nextConcepts: string[];
  recommendedDifficulty: number;
  estimatedTimeToCompletion: number;
  personalizedExercises: Exercise[];
}

export class AdaptiveLearningEngine {
  constructor(
    private enhancedTutor: EnhancedTutorSystem,
    private prisma: PrismaClient
  ) {}

  async analyzeUserPerformance(userId: string): Promise<LearningProfile> {
    // Get recent security and gas analysis results
    const recentAnalyses = await this.prisma.securityAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Analyze patterns in user mistakes
    const weaknessPatterns = this.identifyWeaknessPatterns(recentAnalyses);
    
    // Calculate learning velocity based on improvement over time
    const learningVelocity = this.calculateLearningVelocity(userId);
    
    // Get current skill levels from concept mastery
    const skillLevels = await this.getCurrentSkillLevels(userId);

    return {
      userId,
      skillLevels,
      learningVelocity,
      preferredDifficulty: 'adaptive',
      weaknessPatterns,
      strengthAreas: this.identifyStrengthAreas(recentAnalyses),
      lastAnalysisScores: this.getLatestScores(recentAnalyses)
    };
  }

  async adjustDifficulty(
    currentLevel: number, 
    performance: number
  ): Promise<number> {
    // Dynamic difficulty adjustment algorithm
    const performanceThreshold = 0.7; // 70% success rate target
    const adjustmentFactor = 0.1;

    if (performance > performanceThreshold + 0.1) {
      // User is performing well, increase difficulty
      return Math.min(currentLevel + adjustmentFactor, 1.0);
    } else if (performance < performanceThreshold - 0.1) {
      // User is struggling, decrease difficulty
      return Math.max(currentLevel - adjustmentFactor, 0.1);
    }
    
    return currentLevel; // Maintain current difficulty
  }

  async generatePersonalizedPath(
    profile: LearningProfile
  ): Promise<LearningPath> {
    // Use AI to generate personalized learning path
    const prompt = this.buildLearningPathPrompt(profile);
    const aiResponse = await this.enhancedTutor.getAIResponse(
      prompt,
      { userId: profile.userId },
      'explanation'
    );

    return this.parseLearningPathResponse(aiResponse, profile);
  }

  private identifyWeaknessPatterns(analyses: any[]): string[] {
    const patterns = new Map<string, number>();
    
    analyses.forEach(analysis => {
      analysis.vulnerabilities?.forEach((vuln: any) => {
        const pattern = vuln.type || 'unknown';
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      });
    });

    // Return patterns that appear frequently
    return Array.from(patterns.entries())
      .filter(([_, count]) => count >= 2)
      .map(([pattern, _]) => pattern);
  }

  private async calculateLearningVelocity(userId: string): Promise<number> {
    const sessions = await this.prisma.learningSession.findMany({
      where: { userId },
      orderBy: { sessionStart: 'desc' },
      take: 10
    });

    if (sessions.length < 2) return 1.0;

    // Calculate improvement rate over recent sessions
    const improvements = sessions.slice(1).map((session, index) => {
      const currentScore = this.getSessionScore(session);
      const previousScore = this.getSessionScore(sessions[index]);
      return currentScore - previousScore;
    });

    const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    return Math.max(0.1, Math.min(2.0, 1.0 + averageImprovement));
  }
}
```

#### API Integration
```typescript
// app/api/learning/adaptive/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, data } = await request.json();
  const user = await getUserFromSession(session);
  
  const adaptiveLearning = new AdaptiveLearningEngine(enhancedTutor, prisma);

  switch (action) {
    case 'analyze_performance':
      const profile = await adaptiveLearning.analyzeUserPerformance(user.id);
      return NextResponse.json({ success: true, profile });

    case 'generate_path':
      const path = await adaptiveLearning.generatePersonalizedPath(data.profile);
      return NextResponse.json({ success: true, path });

    case 'adjust_difficulty':
      const newDifficulty = await adaptiveLearning.adjustDifficulty(
        data.currentLevel, 
        data.performance
      );
      return NextResponse.json({ success: true, difficulty: newDifficulty });

    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
```

### 2. Enhanced Security Scanner Learning Integration

#### Educational Security Scanner Extension
```typescript
// lib/security/EducationalSecurityScanner.ts
export interface SecurityLearningContext {
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  currentConcept: string;
  previousMistakes: SecurityIssue[];
  learningObjectives: string[];
  preferredExplanationStyle: 'concise' | 'detailed' | 'interactive';
}

export interface ProgressiveHint {
  level: number; // 1-5, increasing specificity
  content: string;
  type: 'question' | 'hint' | 'example' | 'solution';
  unlockCondition?: string;
}

export interface ConceptLink {
  concept: string;
  relationship: 'prerequisite' | 'related' | 'advanced';
  description: string;
  learningResource?: string;
}

export class EducationalSecurityScanner extends SecurityScanner {
  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    userId: string,
    private learningEngine: AdaptiveLearningEngine
  ) {
    super(editor, userId);
  }

  async generateEducationalExplanation(
    issue: SecurityIssue,
    context: SecurityLearningContext
  ): Promise<string> {
    const prompt = `
      Explain this security issue for a ${context.userLevel} developer:
      
      Issue: ${issue.title}
      Description: ${issue.message}
      Current Learning Concept: ${context.currentConcept}
      
      Previous similar mistakes: ${context.previousMistakes.map(m => m.title).join(', ')}
      
      Learning objectives: ${context.learningObjectives.join(', ')}
      
      Provide a ${context.preferredExplanationStyle} explanation that:
      1. Connects to their current learning level
      2. References their learning objectives
      3. Builds on concepts they already understand
      4. Provides actionable next steps
    `;

    const response = await this.enhancedTutor.getAIResponse(
      prompt,
      { userId: this.userId },
      'explanation'
    );

    return response.content;
  }

  createProgressiveHints(issue: SecurityIssue): ProgressiveHint[] {
    const hints: ProgressiveHint[] = [];

    // Level 1: Socratic question
    hints.push({
      level: 1,
      content: `What do you think might happen if ${this.getVulnerabilityContext(issue)}?`,
      type: 'question'
    });

    // Level 2: General hint
    hints.push({
      level: 2,
      content: `This issue is related to ${issue.category}. Consider how this affects contract security.`,
      type: 'hint'
    });

    // Level 3: Specific hint
    hints.push({
      level: 3,
      content: `Look at line ${issue.line}. ${this.getSpecificHint(issue)}`,
      type: 'hint'
    });

    // Level 4: Example
    hints.push({
      level: 4,
      content: this.generateSecurityExample(issue),
      type: 'example'
    });

    // Level 5: Solution
    hints.push({
      level: 5,
      content: issue.suggestion,
      type: 'solution'
    });

    return hints;
  }

  suggestRelatedConcepts(issue: SecurityIssue): ConceptLink[] {
    const concepts: ConceptLink[] = [];

    // Map security issues to learning concepts
    const conceptMappings = {
      'reentrancy': [
        { concept: 'checks-effects-interactions', relationship: 'prerequisite' as const },
        { concept: 'mutex-patterns', relationship: 'related' as const },
        { concept: 'pull-payment-pattern', relationship: 'advanced' as const }
      ],
      'access-control': [
        { concept: 'modifiers', relationship: 'prerequisite' as const },
        { concept: 'role-based-access', relationship: 'related' as const },
        { concept: 'multi-sig-patterns', relationship: 'advanced' as const }
      ]
    };

    const issueType = this.categorizeIssue(issue);
    const relatedConcepts = conceptMappings[issueType] || [];

    return relatedConcepts.map(concept => ({
      ...concept,
      description: this.getConceptDescription(concept.concept),
      learningResource: this.getLearningResourceUrl(concept.concept)
    }));
  }

  private getVulnerabilityContext(issue: SecurityIssue): string {
    // Generate contextual questions based on issue type
    const contexts = {
      'reentrancy': 'an external contract calls back into your function before it finishes executing',
      'access-control': 'anyone can call this function without proper authorization',
      'overflow': 'this arithmetic operation exceeds the maximum value for this data type'
    };

    return contexts[issue.type] || 'this security issue is exploited by an attacker';
  }
}
```

### 3. Gas Optimization Learning Challenges

#### Challenge System Implementation
```typescript
// lib/gas/GasOptimizationChallenges.ts
export interface GasChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetGasReduction: number; // percentage
  baselineCode: string;
  testCases: TestCase[];
  hints: ProgressiveHint[];
  timeLimit?: number; // minutes
  category: 'storage' | 'computation' | 'memory' | 'calls';
}

export interface ChallengeResult {
  challengeId: string;
  userId: string;
  submittedCode: string;
  gasReduction: number;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  passed: boolean;
  feedback: string;
}

export class GasOptimizationChallenges {
  constructor(
    private gasAnalyzer: GasOptimizationAnalyzer,
    private enhancedTutor: EnhancedTutorSystem
  ) {}

  async generateChallenge(
    userLevel: number,
    weaknessAreas: string[]
  ): Promise<GasChallenge> {
    // Generate challenge based on user's weakness areas
    const category = this.selectChallengeCategory(weaknessAreas);
    const difficulty = this.mapLevelToDifficulty(userLevel);

    const prompt = `
      Generate a gas optimization challenge for a ${difficulty} level developer.
      Focus on: ${category}
      User's weakness areas: ${weaknessAreas.join(', ')}
      
      Provide:
      1. Inefficient Solidity code (50-100 lines)
      2. Clear optimization target (e.g., "Reduce gas by 30%")
      3. Test cases to validate functionality
      4. Progressive hints (5 levels)
    `;

    const response = await this.enhancedTutor.getAIResponse(
      prompt,
      { userId: 'system' },
      'code'
    );

    return this.parseGeneratedChallenge(response.content, category, difficulty);
  }

  async evaluateSubmission(
    challenge: GasChallenge,
    submittedCode: string,
    userId: string
  ): Promise<ChallengeResult> {
    // Analyze gas usage of submitted code
    const gasAnalysis = await this.gasAnalyzer.analyzeGasUsage(userId);
    
    // Compare with baseline
    const baselineAnalysis = await this.analyzeBaseline(challenge.baselineCode);
    
    const gasReduction = this.calculateGasReduction(
      baselineAnalysis.totalGasCost,
      gasAnalysis.totalGasCost
    );

    // Validate functionality with test cases
    const functionalityPassed = await this.runTestCases(
      submittedCode,
      challenge.testCases
    );

    const score = this.calculateScore(
      gasReduction,
      challenge.targetGasReduction,
      functionalityPassed
    );

    return {
      challengeId: challenge.id,
      userId,
      submittedCode,
      gasReduction,
      score,
      timeSpent: 0, // Track in frontend
      hintsUsed: 0, // Track in frontend
      passed: score >= 70, // 70% threshold
      feedback: await this.generateFeedback(challenge, gasAnalysis, gasReduction)
    };
  }

  private async generateFeedback(
    challenge: GasChallenge,
    analysis: GasAnalysisResult,
    gasReduction: number
  ): Promise<string> {
    const prompt = `
      Provide educational feedback for a gas optimization challenge:
      
      Challenge: ${challenge.title}
      Target reduction: ${challenge.targetGasReduction}%
      Achieved reduction: ${gasReduction}%
      
      Gas analysis results:
      - Total gas cost: ${analysis.totalGasCost}
      - Optimizations found: ${analysis.optimizations.length}
      - Top optimization opportunities: ${analysis.optimizations.slice(0, 3).map(o => o.title).join(', ')}
      
      Provide:
      1. Congratulations or encouragement
      2. Specific feedback on their approach
      3. Suggestions for further improvement
      4. Next learning steps
    `;

    const response = await this.enhancedTutor.getAIResponse(
      prompt,
      { userId: 'system' },
      'explanation'
    );

    return response.content;
  }
}
```

## Week 2: AI-Powered Code Intelligence

### 1. AI Code Review System

#### Implementation Structure
```typescript
// lib/ai/AICodeReviewer.ts
export interface CodeReviewContext {
  currentLesson: string;
  userSkillLevel: number;
  learningObjectives: string[];
  previousReviews: CodeReview[];
  codeHistory: string[];
}

export interface EducationalCodeReview {
  id: string;
  code: string;
  overallScore: number;
  feedback: ReviewFeedback[];
  learningPoints: LearningPoint[];
  nextSteps: string[];
  improvementSuggestions: ImprovementSuggestion[];
  conceptsReinforced: string[];
  conceptsIntroduced: string[];
}

export interface ReviewFeedback {
  line: number;
  type: 'positive' | 'improvement' | 'critical';
  category: 'security' | 'gas' | 'style' | 'logic' | 'best-practice';
  message: string;
  explanation: string;
  learningResource?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export class AICodeReviewer {
  constructor(
    private enhancedTutor: EnhancedTutorSystem,
    private securityScanner: SecurityScanner,
    private gasAnalyzer: GasOptimizationAnalyzer
  ) {}

  async reviewCode(
    code: string,
    context: CodeReviewContext
  ): Promise<EducationalCodeReview> {
    // Perform technical analysis
    const [securityAnalysis, gasAnalysis] = await Promise.all([
      this.securityScanner.performAnalysis(),
      this.gasAnalyzer.analyzeGasUsage(context.userId)
    ]);

    // Generate educational review using AI
    const reviewPrompt = this.buildReviewPrompt(code, context, securityAnalysis, gasAnalysis);
    const aiReview = await this.enhancedTutor.getAIResponse(
      reviewPrompt,
      { userId: context.userId },
      'explanation'
    );

    // Combine technical analysis with educational feedback
    return this.synthesizeReview(code, context, securityAnalysis, gasAnalysis, aiReview);
  }

  private buildReviewPrompt(
    code: string,
    context: CodeReviewContext,
    securityAnalysis: any,
    gasAnalysis: any
  ): string {
    return `
      Provide an educational code review for a student at skill level ${context.userSkillLevel}/100.
      
      Current lesson: ${context.currentLesson}
      Learning objectives: ${context.learningObjectives.join(', ')}
      
      Code to review:
      \`\`\`solidity
      ${code}
      \`\`\`
      
      Technical analysis results:
      - Security issues: ${securityAnalysis.issues?.length || 0}
      - Gas optimizations: ${gasAnalysis.optimizations?.length || 0}
      - Overall security score: ${securityAnalysis.overallScore || 'N/A'}
      
      Provide:
      1. Encouraging feedback highlighting what they did well
      2. Educational explanations for any issues found
      3. Connections to their current learning objectives
      4. Specific, actionable improvement suggestions
      5. Concepts they've successfully applied
      6. New concepts they're ready to learn
      
      Tailor the complexity of explanations to their skill level.
      Focus on learning and growth, not just criticism.
    `;
  }
}
```

### 2. Intelligent Hint System

#### Progressive Hint Implementation
```typescript
// lib/hints/IntelligentHintSystem.ts
export interface HintContext {
  currentCode: string;
  cursorPosition: { line: number; column: number };
  userLevel: number;
  currentConcept: string;
  timeStuck: number; // seconds
  previousHints: Hint[];
  learningObjectives: string[];
}

export interface Hint {
  id: string;
  level: number; // 1-5, increasing specificity
  type: 'question' | 'suggestion' | 'example' | 'explanation';
  content: string;
  codeHighlight?: { startLine: number; endLine: number };
  followUpQuestions?: string[];
  relatedConcepts?: string[];
  unlockCondition?: 'time' | 'request' | 'struggle';
}

export class IntelligentHintSystem {
  constructor(
    private enhancedTutor: EnhancedTutorSystem,
    private securityScanner: SecurityScanner
  ) {}

  async generateHint(context: HintContext): Promise<Hint> {
    // Analyze current code state
    const codeAnalysis = await this.analyzeCodeState(context.currentCode);
    
    // Determine appropriate hint level based on time stuck and previous hints
    const hintLevel = this.calculateHintLevel(context);
    
    // Generate contextual hint using AI
    const hintPrompt = this.buildHintPrompt(context, codeAnalysis, hintLevel);
    const aiResponse = await this.enhancedTutor.getAIResponse(
      hintPrompt,
      { userId: context.userId },
      'explanation'
    );

    return this.parseHintResponse(aiResponse.content, hintLevel, context);
  }

  private calculateHintLevel(context: HintContext): number {
    let level = 1;
    
    // Increase level based on time stuck
    if (context.timeStuck > 120) level++; // 2 minutes
    if (context.timeStuck > 300) level++; // 5 minutes
    if (context.timeStuck > 600) level++; // 10 minutes
    
    // Increase level based on previous hints
    level += context.previousHints.length;
    
    // Cap at level 5
    return Math.min(level, 5);
  }

  private buildHintPrompt(
    context: HintContext,
    codeAnalysis: any,
    hintLevel: number
  ): string {
    const hintTypes = {
      1: 'Ask a Socratic question that guides them to think about the problem',
      2: 'Provide a gentle suggestion about the general approach',
      3: 'Give a more specific hint about what to look for',
      4: 'Show a relevant example or pattern',
      5: 'Provide the solution with explanation'
    };

    return `
      Generate a level ${hintLevel} hint for a student working on: ${context.currentConcept}
      
      Student skill level: ${context.userLevel}/100
      Time stuck: ${context.timeStuck} seconds
      
      Current code:
      \`\`\`solidity
      ${context.currentCode}
      \`\`\`
      
      Code analysis:
      - Issues found: ${codeAnalysis.issues?.length || 0}
      - Cursor at line ${context.cursorPosition.line}
      
      Previous hints given: ${context.previousHints.map(h => h.content).join('; ')}
      
      Hint type for level ${hintLevel}: ${hintTypes[hintLevel]}
      
      Learning objectives: ${context.learningObjectives.join(', ')}
      
      Generate a hint that:
      1. ${hintTypes[hintLevel]}
      2. Builds on their current understanding
      3. Doesn't give away too much too quickly
      4. Encourages continued learning
      5. Relates to their learning objectives
    `;
  }
}
```

## Integration Points

### Frontend Integration
```typescript
// components/learning/AdaptiveLearningInterface.tsx
export const AdaptiveLearningInterface: React.FC = () => {
  const { user } = useAuth();
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<GasChallenge | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);

  // Initialize adaptive learning
  useEffect(() => {
    if (user) {
      initializeAdaptiveLearning();
    }
  }, [user]);

  const initializeAdaptiveLearning = async () => {
    const response = await fetch('/api/learning/adaptive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'analyze_performance' })
    });
    
    const { profile } = await response.json();
    setLearningProfile(profile);
  };

  return (
    <div className="adaptive-learning-interface">
      {/* Learning profile display */}
      {/* Current challenge */}
      {/* Hint system */}
      {/* Progress tracking */}
    </div>
  );
};
```

This implementation guide provides the foundation for Phase 1, leveraging our existing Enhanced Tutor System infrastructure while adding sophisticated adaptive learning capabilities.
