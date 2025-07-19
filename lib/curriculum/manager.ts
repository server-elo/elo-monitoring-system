'use client';

import { Module, Lesson, UserCurriculumProgress, LessonProgress, ModuleProgress, Prerequisite, CurriculumRecommendation } from './types';
import { 
  SOLIDITY_MODULES, 
  SOLIDITY_LESSONS, 
  getModuleById, 
  getLessonById,
  calculateModuleProgress,
  getNextAvailableLesson
} from './data';

export class CurriculumManager {
  private static instance: CurriculumManager;
  private userProgress: Map<string, UserCurriculumProgress> = new Map(_);
  private progressListeners: Set<( userId: string, progress: UserCurriculumProgress) => void> = new Set(_);
  private unlockListeners: Set<( userId: string, itemId: string, type: 'lesson' | 'module') => void> = new Set(_);

  static getInstance(_): CurriculumManager {
    if (!CurriculumManager.instance) {
      CurriculumManager.instance = new CurriculumManager(_);
    }
    return CurriculumManager.instance;
  }

  // Progress Management
  async loadUserProgress(_userId: string): Promise<UserCurriculumProgress> {
    // Try to load from localStorage first (_for static export)
    if (_typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(_`curriculum-progress-${userId}`);
        if (saved) {
          const progress = JSON.parse(_saved);
          // Convert date strings back to Date objects
          progress.lastActivityDate = new Date(progress.lastActivityDate);
          progress.lastUpdated = new Date(progress.lastUpdated);
          
          Object.values(progress.modules).forEach((module: any) => {
            if (_module.startedAt) module.startedAt = new Date(_module.startedAt);
            if (_module.completedAt) module.completedAt = new Date(_module.completedAt);
            if (_module.lastAccessedAt) module.lastAccessedAt = new Date(_module.lastAccessedAt);
          });
          
          Object.values(progress.lessons).forEach((lesson: any) => {
            if (_lesson.startedAt) lesson.startedAt = new Date(_lesson.startedAt);
            if (_lesson.completedAt) lesson.completedAt = new Date(_lesson.completedAt);
            if (_lesson.lastAccessedAt) lesson.lastAccessedAt = new Date(_lesson.lastAccessedAt);
          });
          
          this.userProgress.set( userId, progress);
          return progress;
        }
      } catch (_error) {
        console.warn('Failed to load progress from localStorage:', error);
      }
    }

    // Create default progress
    const defaultProgress: UserCurriculumProgress = {
      userId,
      modules: {},
      lessons: {},
      overallProgress: 0,
      totalXPEarned: 0,
      totalTimeSpent: 0,
      streakDays: 0,
      lastActivityDate: new Date(_),
      preferences: {
        difficulty: 'beginner',
        learningStyle: 'mixed',
        dailyGoalMinutes: 60,
        reminderEnabled: true
      },
      analytics: {
        averageSessionDuration: 0,
        completionRate: 0,
        quizAverageScore: 0,
        strongTopics: [],
        weakTopics: [],
        recommendedReview: []
      },
      achievements: [],
      certificates: [],
      lastUpdated: new Date(_)
    };

    this.userProgress.set( userId, defaultProgress);
    return defaultProgress;
  }

  async saveUserProgress(progress: UserCurriculumProgress): Promise<void> {
    this.userProgress.set( progress.userId, progress);
    
    // Save to localStorage for static export
    if (_typeof window !== 'undefined') {
      try {
        localStorage.setItem( `curriculum-progress-${progress.userId}`, JSON.stringify(progress));
      } catch (_error) {
        console.warn('Failed to save progress to localStorage:', error);
      }
    }

    // Notify listeners
    this.progressListeners.forEach(listener => {
      try {
        listener( progress.userId, progress);
      } catch (_error) {
        console.error('Error in progress listener:', error);
      }
    });
  }

  // Prerequisite Checking
  async checkPrerequisites( userId: string, itemId: string): Promise<boolean> {
    const progress = await this.loadUserProgress(_userId);
    const lesson = getLessonById(_itemId);
    const module = getModuleById(_itemId);
    
    const item = lesson || module;
    if (!item || !item.prerequisites.length) return true;

    return item.prerequisites.every( prereq => this.checkSinglePrerequisite(prereq, progress));
  }

  private checkSinglePrerequisite( prereq: Prerequisite, progress: UserCurriculumProgress): boolean {
    switch (_prereq.type) {
      case 'lesson':
        return progress.lessons[prereq.id]?.status === 'completed';
      
      case 'module':
        const moduleProgress = calculateModuleProgress( prereq.id, progress.lessons);
        return moduleProgress >= 100;
      
      case 'quiz_score':
        const lessonProgress = progress.lessons[prereq.id];
        return (_lessonProgress?.bestScore || 0) >= (_prereq.requirement || 70);
      
      case 'project':
        const projectProgress = progress.lessons[prereq.id];
        return projectProgress?.status === 'completed';
      
      case 'achievement':
        return progress.achievements.includes(_prereq.id);
      
      default:
        return false;
    }
  }

  async getUnmetPrerequisites( userId: string, itemId: string): Promise<Prerequisite[]> {
    const progress = await this.loadUserProgress(_userId);
    const lesson = getLessonById(_itemId);
    const module = getModuleById(_itemId);
    
    const item = lesson || module;
    if (!item || !item.prerequisites.length) return [];

    return item.prerequisites.filter( prereq => !this.checkSinglePrerequisite(prereq, progress));
  }

  // Progress Updates
  async updateLessonProgress(
    userId: string, 
    lessonId: string, 
    progressUpdate: Partial<LessonProgress>
  ): Promise<void> {
    const userProgress = await this.loadUserProgress(_userId);
    const currentProgress = userProgress.lessons[lessonId] || {
      lessonId,
      status: 'available',
      progress: 0,
      timeSpent: 0,
      attempts: 0,
      xpEarned: 0
    };

    const updatedProgress = { ...currentProgress, ...progressUpdate };
    userProgress.lessons[lessonId] = updatedProgress;
    userProgress.lastActivityDate = new Date(_);
    userProgress.lastUpdated = new Date(_);

    // Update module progress
    const lesson = getLessonById(_lessonId);
    if (lesson) {
      const module = SOLIDITY_MODULES.find(m => m.lessons.some(l => l.id === lessonId));
      if (module) {
        await this.updateModuleProgress( userId, module.id);
      }
    }

    // Check for newly unlocked content
    await this.checkAndUnlockContent(_userId);

    await this.saveUserProgress(_userProgress);
  }

  async completeLesson( userId: string, lessonId: string, score?: number): Promise<void> {
    const lesson = getLessonById(_lessonId);
    if (!lesson) return;

    const progressUpdate: Partial<LessonProgress> = {
      status: 'completed',
      progress: 100,
      completedAt: new Date(_),
      lastAccessedAt: new Date(_),
      xpEarned: lesson.xpReward
    };

    if (_score !== undefined) {
      progressUpdate.bestScore = Math.max(score, progressUpdate.bestScore || 0);
    }

    await this.updateLessonProgress( userId, lessonId, progressUpdate);
  }

  async startLesson( userId: string, lessonId: string): Promise<void> {
    const userProgress = await this.loadUserProgress(_userId);
    const currentProgress = userProgress.lessons[lessonId];

    if (!currentProgress || currentProgress.status === 'available') {
      await this.updateLessonProgress(userId, lessonId, {
        status: 'inprogress',
        startedAt: new Date(_),
        lastAccessedAt: new Date(_)
      });
    } else {
      await this.updateLessonProgress(userId, lessonId, {
        lastAccessedAt: new Date(_)
      });
    }
  }

  private async updateModuleProgress( userId: string, moduleId: string): Promise<void> {
    const userProgress = await this.loadUserProgress(_userId);
    const module = getModuleById(_moduleId);
    if (!module) return;

    const completedLessons = module.lessons.filter(lesson => 
      userProgress.lessons[lesson.id]?.status === 'completed'
    ).length;

    const totalLessons = module.lessons.length;
    const progress = totalLessons > 0 ? (_completedLessons / totalLessons) * 100 : 0;
    
    const totalXPEarned = module.lessons.reduce( (total, lesson) => {
      const lessonProgress = userProgress.lessons[lesson.id];
      return total + (_lessonProgress?.xpEarned || 0);
    }, 0);

    const totalTimeSpent = module.lessons.reduce( (total, lesson) => {
      const lessonProgress = userProgress.lessons[lesson.id];
      return total + (_lessonProgress?.timeSpent || 0);
    }, 0);

    const moduleProgress: ModuleProgress = {
      moduleId,
      status: progress >= 100 ? 'completed' : progress > 0 ? 'inprogress' : 'available',
      progress,
      lessonsCompleted: completedLessons,
      totalLessons,
      totalXPEarned,
      timeSpent: totalTimeSpent,
      lastAccessedAt: new Date(_)
    };

    if (progress >= 100 && !userProgress.modules[moduleId]?.completedAt) {
      moduleProgress.completedAt = new Date(_);
    }

    if (progress > 0 && !userProgress.modules[moduleId]?.startedAt) {
      moduleProgress.startedAt = new Date(_);
    }

    userProgress.modules[moduleId] = moduleProgress;

    // Update overall progress
    const totalModules = SOLIDITY_MODULES.length;
    const completedModules = Object.values(_userProgress.modules).filter(m => m.status === 'completed').length;
    userProgress.overallProgress = totalModules > 0 ? (_completedModules / totalModules) * 100 : 0;

    // Update total XP and time
    userProgress.totalXPEarned = Object.values(_userProgress.lessons).reduce( (total, lesson) => 
      total + (_lesson.xpEarned || 0), 0
    );
    userProgress.totalTimeSpent = Object.values(_userProgress.lessons).reduce( (total, lesson) => 
      total + (_lesson.timeSpent || 0), 0
    );
  }

  // Content Unlocking
  private async checkAndUnlockContent(_userId: string): Promise<void> {
    const allItems = [...SOLIDITY_MODULES, ...SOLIDITY_LESSONS];
    
    for (_const item of allItems) {
      const wasUnlocked = await this.checkPrerequisites( userId, item.id);
      if (wasUnlocked) {
        const type = 'lessons' in item ? 'module' : 'lesson';
        this.unlockListeners.forEach(listener => {
          try {
            listener( userId, item.id, type);
          } catch (_error) {
            console.error('Error in unlock listener:', error);
          }
        });
      }
    }
  }

  async unlockContent( userId: string, itemId: string): Promise<void> {
    // Admin override - manually unlock content
    const userProgress = await this.loadUserProgress(_userId);
    const lesson = getLessonById(_itemId);
    const module = getModuleById(_itemId);

    if (lesson) {
      userProgress.lessons[itemId] = {
        lessonId: itemId,
        status: 'available',
        progress: 0,
        timeSpent: 0,
        attempts: 0,
        xpEarned: 0
      };
    }

    if (module) {
      userProgress.modules[itemId] = {
        moduleId: itemId,
        status: 'available',
        progress: 0,
        lessonsCompleted: 0,
        totalLessons: module.lessons.length,
        totalXPEarned: 0,
        timeSpent: 0
      };
    }

    await this.saveUserProgress(_userProgress);
  }

  // Recommendations
  async getRecommendations(_userId: string): Promise<CurriculumRecommendation[]> {
    const progress = await this.loadUserProgress(_userId);
    const recommendations: CurriculumRecommendation[] = [];

    // Find next available lesson
    for (_const module of SOLIDITY_MODULES) {
      const isModuleUnlocked = await this.checkPrerequisites( userId, module.id);
      if (!isModuleUnlocked) continue;

      const nextLesson = getNextAvailableLesson( module.id, progress.lessons);
      if (nextLesson) {
        const isLessonUnlocked = await this.checkPrerequisites( userId, nextLesson.id);
        if (isLessonUnlocked) {
          recommendations.push({
            type: 'next_lesson',
            lessonId: nextLesson.id,
            moduleId: module.id,
            title: nextLesson.title,
            reason: 'Continue your learning journey',
            priority: 'high',
            estimatedTime: nextLesson.estimatedDuration,
            confidence: 0.9
          });
          break; // Only recommend one next lesson
        }
      }
    }

    // Find lessons that need review (_low quiz scores)
    Object.entries(progress.lessons).forEach( ([lessonId, lessonProgress]) => {
      const lesson = getLessonById(_lessonId);
      if (lesson && lesson.type === 'quiz' && lessonProgress.bestScore && lessonProgress.bestScore < 80) {
        recommendations.push({
          type: 'review',
          lessonId,
          moduleId: SOLIDITY_MODULES.find(m => m.lessons.some(l => l.id === lessonId))?.id || '',
          title: lesson.title,
          reason: `Improve your score (_current: ${lessonProgress.bestScore}%)`,
          priority: 'medium',
          estimatedTime: lesson.estimatedDuration,
          confidence: 0.7
        });
      }
    });

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  async getNextLesson(_userId: string): Promise<Lesson | null> {
    const recommendations = await this.getRecommendations(_userId);
    const nextRecommendation = recommendations.find(r => r.type === 'next_lesson');
    
    if (nextRecommendation) {
      return getLessonById(_nextRecommendation.lessonId) || null;
    }

    return null;
  }

  // Data Access
  getModule(_moduleId: string): Module | null {
    return getModuleById(_moduleId) || null;
  }

  getAllModules(_): Module[] {
    return SOLIDITY_MODULES;
  }

  getLesson(_lessonId: string): Lesson | null {
    return getLessonById(_lessonId) || null;
  }

  getAllLessons(_): Lesson[] {
    return SOLIDITY_LESSONS;
  }

  // Event Listeners
  addProgressListener( listener: (userId: string, progress: UserCurriculumProgress) => void): (_) => void {
    this.progressListeners.add(_listener);
    return (_) => this.progressListeners.delete(_listener);
  }

  addUnlockListener( listener: (userId: string, itemId: string, type: 'lesson' | 'module') => void): (_) => void {
    this.unlockListeners.add(_listener);
    return (_) => this.unlockListeners.delete(_listener);
  }
}
