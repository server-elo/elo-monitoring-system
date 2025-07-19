import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

// Types for API responses
interface UserProgress {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  streak: number;
  lessonsCompleted: number;
  projectsCompleted: number;
  challengesWon: number;
  rank: number;
  badges: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  totalHours: number;
  completionRate: number;
  studentsEnrolled: number;
  rating: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedHours: number;
  lessons: Lesson[];
  completed: boolean;
  progress: number;
  unlocked: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  type: string;
  completed: boolean;
  locked: boolean;
  xpReward: number;
}

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  category: string;
  estimatedHours: number;
  xpReward: number;
  steps: ProjectStep[];
  currentStep: number;
  completed: boolean;
  deployed: boolean;
}

interface ProjectStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  code: string;
  completed: boolean;
  estimatedTime: number;
}

interface CommunityStats {
  onlineUsers: number;
  studyGroups: number;
  mentorsAvailable: number;
  activeCollaborations: number;
}

// Custom hook for user progress data
export const useUserProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchProgress = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/progress');
      
      if (!response.ok) {
        throw new Error('Failed to fetch user progress');
      }

      const data = await response.json();
      
      // Transform API response to UserProgress interface
      const transformedProgress: UserProgress = {
        level: data.profile?.currentLevel || 1,
        xp: data.profile?.totalXP || 0,
        xpToNextLevel: ((data.profile?.currentLevel || 1) * 1000),
        totalXp: data.profile?.totalXP || 0,
        streak: data.profile?.streak || 0,
        lessonsCompleted: data.stats?.completedLessons || 0,
        projectsCompleted: data.stats?.completedProjects || 0,
        challengesWon: data.stats?.challengesWon || 0,
        rank: data.stats?.rank || 1,
        badges: data.achievements?.map((a: any) => a.achievement.title) || []
      };

      setProgress(transformedProgress);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error loading progress',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refetch: fetchProgress };
};

// Custom hook for achievements data
export const useAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchAchievements = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/achievements');
      
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      
      // Transform API response to Achievement interface
      const transformedAchievements: Achievement[] = data.achievements.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        category: a.category.toLowerCase(),
        xpReward: a.xpReward,
        unlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
        rarity: a.rarity?.toLowerCase() || 'common'
      }));

      setAchievements(transformedAchievements);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error loading achievements',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, toast]);

  const claimAchievement = useCallback(async (achievementId: string) => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId, action: 'claim' })
      });

      if (!response.ok) {
        throw new Error('Failed to claim achievement');
      }

      const data = await response.json();
      
      // Update local state
      setAchievements(prev => prev.map(a => 
        a.id === achievementId 
          ? { ...a, unlocked: true, unlockedAt: new Date() }
          : a
      ));

      toast({
        title: 'Achievement Claimed!',
        description: `You earned ${data.xpAwarded} XP!`,
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        title: 'Error claiming achievement',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [toast]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return { achievements, loading, error, refetch: fetchAchievements, claimAchievement };
};

// Custom hook for learning paths data
export const useLearningPaths = () => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Log authentication status for debugging
  useEffect(() => {
    console.log('Learning progress fetch - authenticated:', isAuthenticated);
  }, [isAuthenticated]);
  const { toast } = useToast();

  const fetchLearningPaths = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/learning-paths');
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning paths');
      }

      const data = await response.json();
      setLearningPaths(data.learningPaths || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error loading learning paths',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLearningPaths();
  }, [fetchLearningPaths]);

  return { learningPaths, loading, error, refetch: fetchLearningPaths };
};

// Custom hook for projects data
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Log authentication status for projects fetch
  useEffect(() => {
    console.log('Projects fetch - authenticated:', isAuthenticated);
  }, [isAuthenticated]);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data.projects || []);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error loading projects',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
};

// Custom hook for community stats
export const useCommunityStats = () => {
  const [stats, setStats] = useState<CommunityStats>({
    onlineUsers: 0,
    studyGroups: 0,
    mentorsAvailable: 0,
    activeCollaborations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Enhanced error handling with toast notifications
  const showErrorToast = useCallback((error: any, operation: string) => {
    const errorMessage = error?.message || `Failed to ${operation}`;
    toast({
      title: "Operation Failed",
      description: errorMessage,
      variant: "destructive",
    });

    // Log error for analytics
    console.error(`API Error in ${operation}:`, error);
  }, [toast]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch community stats');
      }

      const data = await response.json();
      setStats(data.stats);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      // Enhanced error handling with optional toast for debugging
      console.log('Community stats fetch error:', errorMessage);

      // Use toast for debugging when needed
      if (process.env.NODE_ENV === 'development') {
        showErrorToast(err, 'fetch community stats');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};
