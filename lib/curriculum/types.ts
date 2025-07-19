// Curriculum and learning path types

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type ModuleStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LessonType = 'theory' | 'practical' | 'quiz' | 'project' | 'assessment';

export interface Prerequisite {
  type: 'lesson' | 'module' | 'quiz_score' | 'project' | 'achievement';
  id: string;
  name: string;
  requirement?: number; // For quiz scores, minimum percentage required
  description?: string;
}

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  progress: number; // 0-100 percentage
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number; // in minutes
  attempts: number;
  bestScore?: number; // For quizzes/assessments
  xpEarned: number;
  lastAccessedAt?: Date;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in minutes
  xpReward: number;
  prerequisites: Prerequisite[];
  content: {
    videoUrl?: string;
    readingMaterial?: string;
    codeExamples?: string[];
    exercises?: string[];
    quizQuestions?: number;
  };
  tags: string[];
  order: number;
  isOptional: boolean;
  unlockMessage?: string;
}

export interface ModuleProgress {
  moduleId: string;
  status: ModuleStatus;
  progress: number; // 0-100 percentage
  startedAt?: Date;
  completedAt?: Date;
  lessonsCompleted: number;
  totalLessons: number;
  totalXPEarned: number;
  averageScore?: number;
  timeSpent: number; // in minutes
  lastAccessedAt?: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in hours
  totalXPReward: number;
  prerequisites: Prerequisite[];
  lessons: Lesson[];
  order: number;
  category: string;
  tags: string[];
  icon: string;
  color: string;
  isCore: boolean; // Core vs optional modules
  unlockMessage?: string;
  completionCertificate?: {
    name: string;
    description: string;
    badgeUrl?: string;
  };
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // in hours
  modules: string[]; // Module IDs in order
  prerequisites: Prerequisite[];
  tags: string[];
  isRecommended: boolean;
  targetAudience: string[];
  learningObjectives: string[];
  completionRewards: {
    xp: number;
    badges: string[];
    certificates: string[];
  };
}

export interface UserCurriculumProgress {
  userId: string;
  currentPath?: string; // Current learning path ID
  modules: Record<string, ModuleProgress>;
  lessons: Record<string, LessonProgress>;
  overallProgress: number; // 0-100 percentage
  totalXPEarned: number;
  totalTimeSpent: number; // in minutes
  streakDays: number;
  lastActivityDate: Date;
  preferences: {
    difficulty: DifficultyLevel;
    learningStyle: 'visual' | 'practical' | 'mixed';
    dailyGoalMinutes: number;
    reminderEnabled: boolean;
  };
  analytics: {
    averageSessionDuration: number;
    completionRate: number;
    quizAverageScore: number;
    strongTopics: string[];
    weakTopics: string[];
    recommendedReview: string[];
  };
  achievements: string[];
  certificates: string[];
  lastUpdated: Date;
}

export interface CurriculumRecommendation {
  type: 'next_lesson' | 'review' | 'practice' | 'assessment';
  lessonId: string;
  moduleId: string;
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  confidence: number; // 0-1 AI confidence score
}

export interface LearningAnalytics {
  userId: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time';
  metrics: {
    lessonsCompleted: number;
    modulesCompleted: number;
    xpEarned: number;
    timeSpent: number;
    quizAverage: number;
    streakDays: number;
    projectsSubmitted: number;
  };
  progressTrend: Array<{
    date: Date;
    lessonsCompleted: number;
    xpEarned: number;
    timeSpent: number;
  }>;
  topicMastery: Record<string, number>; // topic -> mastery percentage
  recommendations: CurriculumRecommendation[];
  nextMilestones: Array<{
    type: 'module' | 'certificate' | 'achievement';
    name: string;
    progress: number;
    estimatedCompletion: Date;
  }>;
}

export interface CurriculumFilter {
  difficulty?: DifficultyLevel[];
  status?: (LessonStatus | ModuleStatus)[];
  category?: string[];
  tags?: string[];
  type?: LessonType[];
  search?: string;
  sortBy?: 'order' | 'difficulty' | 'duration' | 'progress' | 'title';
  sortOrder?: 'asc' | 'desc';
  showOptional?: boolean;
}

export interface CurriculumManager {
  // Data loading
  loadUserProgress(userId: string): Promise<UserCurriculumProgress>;
  saveUserProgress(progress: UserCurriculumProgress): Promise<void>;
  
  // Progress tracking
  updateLessonProgress(userId: string, lessonId: string, progress: Partial<LessonProgress>): Promise<void>;
  completeLesson(userId: string, lessonId: string, score?: number): Promise<void>;
  startLesson(userId: string, lessonId: string): Promise<void>;
  
  // Module management
  getModule(moduleId: string): Module | null;
  getAllModules(): Module[];
  getModulesForPath(pathId: string): Module[];
  
  // Prerequisite checking
  checkPrerequisites(userId: string, itemId: string): Promise<boolean>;
  getUnmetPrerequisites(userId: string, itemId: string): Promise<Prerequisite[]>;
  unlockContent(userId: string, itemId: string): Promise<void>;
  
  // Recommendations
  getRecommendations(userId: string): Promise<CurriculumRecommendation[]>;
  getNextLesson(userId: string): Promise<Lesson | null>;
  
  // Analytics
  getAnalytics(userId: string, timeframe?: LearningAnalytics['timeframe']): Promise<LearningAnalytics>;
  updateAnalytics(userId: string, activity: any): Promise<void>;
  
  // Learning paths
  getLearningPaths(): LearningPath[];
  setUserPath(userId: string, pathId: string): Promise<void>;
  
  // Filtering and search
  filterContent(filter: CurriculumFilter): Promise<{
    modules: Module[];
    lessons: Lesson[];
  }>;
}

// Utility types
export type ProgressUpdateHandler = (userId: string, itemId: string, progress: number) => void;
export type CompletionHandler = (userId: string, itemId: string, type: 'lesson' | 'module') => void;
export type UnlockHandler = (userId: string, itemId: string, type: 'lesson' | 'module') => void;
