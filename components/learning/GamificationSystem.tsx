import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Target,
  Zap,
  Award,
  Crown,
  Shield,
  Flame,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

// Helper function to calculate user rank based on XP
const calculateUserRank = (totalXP: number): number => {
  // Simple ranking system: every 1000 XP = 1 rank level
  // This could be made more sophisticated with actual leaderboard data
  return Math.floor(totalXP / 1000) + 1;
};

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'learning' | 'coding' | 'social' | 'milestone';
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

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

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  level: number;
  xp: number;
  rank: number;
  streak: number;
}

interface GamificationSystemProps {
  className?: string;
}

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

export const GamificationSystem: React.FC<GamificationSystemProps> = ({
  className = ''
}) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'leaderboard'>('overview');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user progress and achievements data
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch user progress
        const progressResponse = await fetch('/api/user/progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();

          // Transform API data to UserProgress interface
          const transformedProgress: UserProgress = {
            level: progressData.profile?.currentLevel || 1,
            xp: progressData.profile?.totalXP || 0,
            xpToNextLevel: ((progressData.profile?.currentLevel || 1) * 1000),
            totalXp: progressData.profile?.totalXP || 0,
            streak: progressData.profile?.streak || 0,
            lessonsCompleted: progressData.stats?.completedLessons || 0,
            projectsCompleted: progressData.stats?.completedProjects || 0,
            challengesWon: progressData.stats?.challengesWon || 0,
            rank: progressData.stats?.rank || calculateUserRank(progressData.profile?.totalXP || 0),
            badges: progressData.achievements?.map((a: any) => a.achievement.title) || []
          };
          setUserProgress(transformedProgress);
        }

        // Fetch achievements
        const achievementsResponse = await fetch('/api/achievements');
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();

          // Transform API data to Achievement interface
          const transformedAchievements: Achievement[] = achievementsData.achievements.map((a: any) => ({
            id: a.id,
            title: a.title,
            description: a.description,
            icon: getAchievementIcon(a.category),
            category: a.category.toLowerCase(),
            xpReward: a.xpReward,
            unlocked: a.isUnlocked,
            unlockedAt: a.unlockedAt ? new Date(a.unlockedAt) : undefined,
            rarity: a.rarity?.toLowerCase() || 'common'
          }));
          setAchievements(transformedAchievements);
        }

        // Fetch leaderboard data
        const leaderboardResponse = await fetch('/api/leaderboard');
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json();

          // Transform API data to LeaderboardEntry interface
          const transformedLeaderboard: LeaderboardEntry[] = leaderboardData.leaderboard.map((entry: any, index: number) => ({
            id: entry.id,
            username: entry.name || 'Anonymous',
            avatar: entry.image || '',
            level: entry.profile?.currentLevel || 1,
            xp: entry.profile?.totalXP || 0,
            rank: index + 1,
            streak: entry.profile?.streak || 0
          }));
          setLeaderboard(transformedLeaderboard);
        } else {
          // Fallback to current user data if leaderboard fails
          if (user) {
            setLeaderboard([
              {
                id: user.id,
                username: user.name || 'You',
                avatar: user.image || '',
                level: userProgress?.level || 1,
                xp: userProgress?.xp || 0,
                rank: 1,
                streak: userProgress?.streak || 0
              }
            ]);
          }
        }

      } catch (error) {
        toast({
          title: 'Error loading progress',
          description: 'Failed to load your progress data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, toast]);

  // Helper function to get achievement icons
  const getAchievementIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'learning': return <Star className="w-6 h-6" />;
      case 'coding': return <Zap className="w-6 h-6" />;
      case 'social': return <Users className="w-6 h-6" />;
      case 'milestone': return <Trophy className="w-6 h-6" />;
      default: return <Award className="w-6 h-6" />;
    }
  };

  // Calculate level progress percentage
  const levelProgress = userProgress ? ((userProgress.xp % 1000) / 1000) * 100 : 0;

  // Filter achievements by category
  const achievementsByCategory = {
    learning: achievements.filter(a => a.category === 'learning'),
    coding: achievements.filter(a => a.category === 'coding'),
    social: achievements.filter(a => a.category === 'social'),
    milestone: achievements.filter(a => a.category === 'milestone')
  };

  // Check for new achievements and level ups
  useEffect(() => {
    if (!userProgress) return;

    const recentAchievements = achievements.filter(
      a => a.unlocked && a.unlockedAt &&
      Date.now() - a.unlockedAt.getTime() < 5000 // Last 5 seconds
    );

    if (recentAchievements.length > 0) {
      setNewAchievements(recentAchievements);
      setTimeout(() => setNewAchievements([]), 5000);
    }

    // Check for level up
    if (userProgress.xp >= userProgress.xpToNextLevel) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  }, [achievements, userProgress]);

  // Show loading state
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/20 rounded w-1/3"></div>
            <div className="h-4 bg-white/20 rounded w-2/3"></div>
            <div className="h-2 bg-white/20 rounded w-full"></div>
          </div>
        </Card>
      </div>
    );
  }

  // Show authentication required
  if (!isAuthenticated) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400">Please sign in to view your progress and achievements.</p>
        </Card>
      </div>
    );
  }

  // Show error state if no user progress
  if (!userProgress) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-white mb-2">No Progress Data</h3>
          <p className="text-gray-400">Start learning to see your progress and achievements!</p>
        </Card>
      </div>
    );
  }

  const handleClaimReward = async (achievementId: string) => {
    try {
      const response = await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId, action: 'claim' })
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setAchievements(prev => prev.map(a =>
          a.id === achievementId
            ? { ...a, unlocked: true, unlockedAt: new Date() }
            : a
        ));

        // Update user progress with new XP
        if (userProgress) {
          setUserProgress(prev => prev ? {
            ...prev,
            xp: prev.xp + data.xpAwarded,
            totalXp: prev.totalXp + data.xpAwarded
          } : null);
        }

        toast({
          title: 'Achievement Claimed!',
          description: `You earned ${data.xpAwarded} XP!`,
        });
      } else {
        throw new Error('Failed to claim achievement');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to claim achievement. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleQuickAction = (actionType: 'boost' | 'shield' | 'star') => {
    // Handle quick gamification actions
    switch (actionType) {
      case 'boost':
        // XP Boost activated
        break;
      case 'shield':
        // Shield protection activated
        break;
      case 'star':
        // Star power activated
        break;
    }
  };

  const handleSecurityChallenge = () => {
    // Handle security-focused challenges
    // Security challenge started
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative p-4 rounded-lg border-2 ${rarityBorders[achievement.rarity]} 
                  ${achievement.unlocked ? 'bg-white/10' : 'bg-gray-500/20'} 
                  backdrop-blur-md transition-all duration-300`}
    >
      <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${rarityColors[achievement.rarity]} 
                      opacity-20 ${achievement.unlocked ? 'animate-pulse' : ''}`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-full ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
            {achievement.icon}
          </div>
          <div className="text-xs font-medium text-yellow-400">
            +{achievement.xpReward} XP
          </div>
        </div>
        
        <h3 className={`font-semibold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
          {achievement.title}
        </h3>
        
        <p className={`text-sm ${achievement.unlocked ? 'text-gray-300' : 'text-gray-600'}`}>
          {achievement.description}
        </p>
        
        {achievement.unlocked && achievement.unlockedAt && (
          <div className="mt-2">
            <div className="text-xs text-green-400 mb-2">
              Unlocked {achievement.unlockedAt.toLocaleDateString()}
            </div>
            <Button
              onClick={() => handleClaimReward(achievement.id)}
              size="sm"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Star className="w-3 h-3 mr-1" />
              Claim Reward
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );

  const LeaderboardEntry: React.FC<{ entry: LeaderboardEntry; index: number }> = ({ entry, index }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-md rounded-lg border border-white/10"
    >
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold
                        ${index < 3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' : 
                          'bg-gray-600 text-gray-300'}`}>
          {index < 3 ? <Crown className="w-4 h-4" /> : entry.rank}
        </div>
        
        <img
          src={entry.avatar}
          alt={entry.username}
          className="w-10 h-10 rounded-full border-2 border-white/20"
        />
        
        <div>
          <div className="font-semibold text-white">{entry.username}</div>
          <div className="text-sm text-gray-400">Level {entry.level}</div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-semibold text-yellow-400">{entry.xp.toLocaleString()} XP</div>
        <div className="text-sm text-gray-400 flex items-center">
          <Flame className="w-3 h-3 mr-1" />
          {entry.streak} day streak
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`w-full ${className}`}>
      {/* New Achievement Notifications */}
      <AnimatePresence>
        {newAchievements.map((achievement) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 p-4 bg-gradient-to-r from-yellow-400 to-orange-500
                       rounded-lg shadow-lg border border-yellow-300"
          >
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-white" />
              <div>
                <div className="font-bold text-white">Achievement Unlocked!</div>
                <div className="text-yellow-100">{achievement.title}</div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Level Up Notification */}
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                       p-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-2xl
                       border-2 border-yellow-400"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Star className="w-full h-full text-yellow-400" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-2">LEVEL UP!</div>
              <div className="text-xl text-yellow-200">Level {userProgress.level}</div>
              <div className="text-sm text-blue-200 mt-2">You're getting stronger!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-md rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'achievements', label: 'Achievements', icon: <Trophy className="w-4 h-4" /> },
          { id: 'leaderboard', label: 'Leaderboard', icon: <Users className="w-4 h-4" /> }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === tab.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Level Progress */}
          <Card className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Level {userProgress.level}</h2>
                <p className="text-gray-300">Blockchain Developer</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">{userProgress.xp.toLocaleString()}</div>
                <div className="text-sm text-gray-400">XP</div>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Progress to Level {userProgress.level + 1}</span>
                <span>{userProgress.xp} / {userProgress.xpToNextLevel}</span>
              </div>
              <Progress value={levelProgress} className="h-3" />
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userProgress.streak}</div>
              <div className="text-sm text-gray-400">Day Streak</div>
            </Card>
            
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userProgress.lessonsCompleted}</div>
              <div className="text-sm text-gray-400">Lessons</div>
            </Card>
            
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{userProgress.projectsCompleted}</div>
              <div className="text-sm text-gray-400">Projects</div>
            </Card>
            
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20 text-center">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">#{userProgress.rank}</div>
              <div className="text-sm text-gray-400">Global Rank</div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-4">
              <Button
                onClick={() => handleQuickAction('boost')}
                className="flex flex-col items-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20
                          hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30"
              >
                <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                <span className="text-sm text-white">XP Boost</span>
              </Button>

              <Button
                onClick={() => handleQuickAction('shield')}
                className="flex flex-col items-center p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20
                          hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-500/30"
              >
                <Shield className="w-8 h-8 text-blue-400 mb-2" />
                <span className="text-sm text-white">Shield</span>
              </Button>

              <Button
                onClick={() => handleQuickAction('star')}
                className="flex flex-col items-center p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20
                          hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30"
              >
                <Star className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-sm text-white">Star Power</span>
              </Button>
            </div>
          </Card>

          {/* Security Challenge */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Security Challenge</h3>
                <p className="text-gray-300">Test your smart contract security knowledge</p>
              </div>
              <Button
                onClick={handleSecurityChallenge}
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              >
                <Shield className="w-4 h-4 mr-2" />
                Start Challenge
              </Button>
            </div>
          </Card>

          {/* Recent Achievements */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements
                .filter(a => a.unlocked)
                .slice(0, 6)
                .map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
            <Card key={category} className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4 capitalize">
                {category} Achievements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Global Leaderboard</h3>
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <LeaderboardEntry key={entry.id} entry={entry} index={index} />
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default GamificationSystem;
