'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Crown, 
  Shield, 
  Flame, 
  Code,
  Users,
  BookOpen,
  Award,
  Gift
} from 'lucide-react';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { achievementVariants } from '@/lib/animations/micro-interactions';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'coding' | 'social' | 'milestone' | 'streak' | 'collaboration';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  icon: string;
  requirements: {
    type: string;
    value: number;
    current?: number;
  };
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
}

interface AchievementNotificationSystemProps {
  className?: string;
}

const achievementDefinitions: Omit<Achievement, 'id' | 'unlocked' | 'unlockedAt' | 'progress'>[] = [
  {
    title: 'First Steps',
    description: 'Complete your first Solidity lesson',
    category: 'learning',
    rarity: 'common',
    xpReward: 100,
    icon: 'BookOpen',
    requirements: { type: 'lessons_completed', value: 1 }
  },
  {
    title: 'Code Warrior',
    description: 'Write 100 lines of Solidity code',
    category: 'coding',
    rarity: 'common',
    xpReward: 200,
    icon: 'Code',
    requirements: { type: 'lines_coded', value: 100 }
  },
  {
    title: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    category: 'streak',
    rarity: 'rare',
    xpReward: 500,
    icon: 'Flame',
    requirements: { type: 'streak_days', value: 7 }
  },
  {
    title: 'Collaboration Champion',
    description: 'Participate in 5 collaborative coding sessions',
    category: 'collaboration',
    rarity: 'rare',
    xpReward: 300,
    icon: 'Users',
    requirements: { type: 'collaboration_sessions', value: 5 }
  },
  {
    title: 'Smart Contract Sage',
    description: 'Deploy 10 smart contracts successfully',
    category: 'coding',
    rarity: 'epic',
    xpReward: 1000,
    icon: 'Zap',
    requirements: { type: 'contracts_deployed', value: 10 }
  },
  {
    title: 'Knowledge Seeker',
    description: 'Complete 50 lessons across all difficulty levels',
    category: 'learning',
    rarity: 'epic',
    xpReward: 750,
    icon: 'Target',
    requirements: { type: 'lessons_completed', value: 50 }
  },
  {
    title: 'Solidity Grandmaster',
    description: 'Reach level 25 and complete all advanced courses',
    category: 'milestone',
    rarity: 'legendary',
    xpReward: 2000,
    icon: 'Crown',
    requirements: { type: 'level_reached', value: 25 }
  },
  {
    title: 'Community Leader',
    description: 'Help 20 other developers in collaboration sessions',
    category: 'social',
    rarity: 'epic',
    xpReward: 800,
    icon: 'Shield',
    requirements: { type: 'users_helped', value: 20 }
  },
  {
    title: 'Perfect Score',
    description: 'Score 100% on 10 different quizzes',
    category: 'learning',
    rarity: 'rare',
    xpReward: 400,
    icon: 'Star',
    requirements: { type: 'perfect_scores', value: 10 }
  },
  {
    title: 'Early Bird',
    description: 'Complete lessons for 30 consecutive days',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 1500,
    icon: 'Trophy',
    requirements: { type: 'streak_days', value: 30 }
  }
];

const iconMap = {
  BookOpen,
  Code,
  Flame,
  Users,
  Zap,
  Target,
  Crown,
  Shield,
  Star,
  Trophy,
  Award,
  Gift
};

const rarityColors = {
  common: 'from-gray-400 to-gray-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-600'
};

const rarityBorders = {
  common: 'border-gray-400',
  rare: 'border-blue-400',
  epic: 'border-purple-400',
  legendary: 'border-yellow-400'
};

// Study reminder system
export function StudyReminderSystem() {
  const { addNotification } = useNotifications();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Check for study reminders
    const checkStudyReminders = () => {
      const lastStudyTime = localStorage.getItem('lastStudyTime');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      const twoHours = 2 * oneHour;

      if (lastStudyTime) {
        const timeSinceLastStudy = now - parseInt(lastStudyTime);

        if (timeSinceLastStudy > twoHours) {
          addNotification({
            type: 'info',
            title: 'Time to Learn!',
            message: 'Ready for your next Solidity lesson? Keep your streak going!',
            duration: 8000,
            action: {
              label: 'Start Learning',
              onClick: () => window.location.href = '/learn'
            }
          });
        }
      }
    };

    // Check every 30 minutes
    const interval = setInterval(checkStudyReminders, 30 * 60 * 1000);

    // Initial check after 5 minutes
    setTimeout(checkStudyReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, addNotification]);

  return null;
}

export function AchievementNotificationSystem({ className }: AchievementNotificationSystemProps) {
  const { isAuthenticated } = useAuth();
  const { showAchievement, showXPGain } = useNotifications();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

  // Initialize achievements
  useEffect(() => {
    if (isAuthenticated) {
      initializeAchievements();
      fetchUserStats();
    }
  }, [isAuthenticated]);

  const initializeAchievements = async () => {
    try {
      // Fetch user achievements from API
      const response = await fetch('/api/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
      } else {
        // Fallback: initialize with default achievements
        const initialAchievements = achievementDefinitions.map((def, index) => ({
          ...def,
          id: `achievement_${index}`,
          unlocked: false,
          progress: 0
        }));
        setAchievements(initialAchievements);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fallback initialization
      const initialAchievements = achievementDefinitions.map((def, index) => ({
        ...def,
        id: `achievement_${index}`,
        unlocked: false,
        progress: 0
      }));
      setAchievements(initialAchievements);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/progress-stats');
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats || {});
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Mock stats for demo
      setUserStats({
        lessons_completed: 5,
        lines_coded: 150,
        streak_days: 3,
        collaboration_sessions: 2,
        contracts_deployed: 1,
        users_helped: 0,
        perfect_scores: 2,
        level_reached: 2
      });
    }
  };

  const checkAchievements = useCallback(() => {
    const newlyUnlocked: Achievement[] = [];

    achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const currentValue = userStats[achievement.requirements.type] || 0;
        const progress = Math.min((currentValue / achievement.requirements.value) * 100, 100);
        
        // Update progress
        achievement.progress = progress;
        achievement.requirements.current = currentValue;

        // Check if achievement is unlocked
        if (currentValue >= achievement.requirements.value) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          newlyUnlocked.push(achievement);
        }
      }
    });

    if (newlyUnlocked.length > 0) {
      setPendingAchievements(newlyUnlocked);
      
      // Show notifications for each unlocked achievement
      newlyUnlocked.forEach(achievement => {
        setTimeout(() => {
          showAchievement(
            achievement.title,
            achievement.description,
            {
              rarity: achievement.rarity,
              xp: achievement.xpReward,
              category: achievement.category
            }
          );
          
          // Show XP gain notification
          setTimeout(() => {
            showXPGain(achievement.xpReward, `Achievement: ${achievement.title}`);
          }, 1000);
        }, 500);
      });

      // Update achievements in database
      updateAchievementsInDatabase(newlyUnlocked);
    }

    setAchievements([...achievements]);
  }, [achievements, userStats, showAchievement, showXPGain]);

  const updateAchievementsInDatabase = async (unlockedAchievements: Achievement[]) => {
    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlock',
          achievements: unlockedAchievements.map(a => ({
            id: a.id,
            unlockedAt: a.unlockedAt
          }))
        })
      });
    } catch (error) {
      console.error('Error updating achievements:', error);
    }
  };

  // Check achievements when user stats change
  useEffect(() => {
    if (Object.keys(userStats).length > 0 && achievements.length > 0) {
      checkAchievements();
    }
  }, [userStats, checkAchievements]);

  // Simulate stat updates for demo purposes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      setUserStats(prev => ({
        ...prev,
        lessons_completed: prev.lessons_completed + Math.random() > 0.8 ? 1 : 0,
        lines_coded: prev.lines_coded + Math.floor(Math.random() * 10),
        streak_days: prev.streak_days + Math.random() > 0.9 ? 1 : 0,
      }));
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Award;
    return <IconComponent className="w-6 h-6" />;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {/* Achievement unlock animations */}
      <AnimatePresence>
        {pendingAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            variants={achievementVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            onAnimationComplete={() => {
              setPendingAchievements(prev => prev.filter(a => a.id !== achievement.id));
            }}
          >
            <div className={cn(
              'p-6 rounded-xl backdrop-blur-md border-2 shadow-2xl',
              'bg-gradient-to-br from-white/10 to-white/5',
              rarityBorders[achievement.rarity]
            )}>
              <div className="text-center">
                <motion.div
                  animate="celebration"
                  variants={achievementVariants}
                  className={cn(
                    'w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center',
                    'bg-gradient-to-br',
                    rarityColors[achievement.rarity]
                  )}
                >
                  {getIcon(achievement.icon)}
                </motion.div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  Achievement Unlocked!
                </h3>
                
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">
                  {achievement.title}
                </h4>
                
                <p className="text-gray-300 mb-4">
                  {achievement.description}
                </p>
                
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span className={cn(
                    'px-3 py-1 rounded-full font-medium',
                    achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-300' :
                    achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-300' :
                    achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  )}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                  
                  <span className="flex items-center space-x-1 text-yellow-400">
                    <Zap className="w-4 h-4" />
                    <span>+{achievement.xpReward} XP</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Floating achievement progress indicators */}
      <div className="fixed bottom-4 left-4 space-y-2 z-40">
        {achievements
          .filter(a => !a.unlocked && (a.progress || 0) > 0)
          .slice(0, 3)
          .map(achievement => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/50 backdrop-blur-md rounded-lg p-3 border border-white/20"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {getIcon(achievement.icon)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {achievement.title}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${achievement.progress || 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {achievement.requirements.current || 0} / {achievement.requirements.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
