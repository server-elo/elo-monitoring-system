'use client';

;
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, Crown, Calendar } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AchievementGrid } from '@/components/achievements/AchievementGrid';
import { AchievementNotificationManager } from '@/components/achievements/AchievementNotification';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { SmartBreadcrumbs } from '@/components/navigation/SmartNavigation';
import { useAchievements, useGamificationStats } from '@/lib/hooks/useAchievements';

export default function AchievementsPage() {
  const { 
    achievements, 
    userAchievements, 
    stats, 
    isLoading, 
    error 
  } = useAchievements();
  
  const { 
    levelProgress, 
    achievementCounts, 
    currentStreak, 
    longestStreak,
    completionPercentage 
  } = useGamificationStats();

  const handleAchievementClick = () => {
    // Future implementation for achievement details modal
  };

  if (isLoading) {
    return (
      <ProtectedRoute permission={{ requireAuth: true }}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Trophy className="w-full h-full text-yellow-400" />
            </motion.div>
            <p className="text-white text-lg">Loading achievements...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute permission={{ requireAuth: true }}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Achievements</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute permission={{ requireAuth: true }}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <SmartBreadcrumbs />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Achievements</h1>
            <p className="text-gray-300 text-lg">Track your progress and unlock rewards</p>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Level Progress */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-yellow-400" />
                  <span className="text-white font-medium">Level</span>
                </div>
                <span className="text-2xl font-bold text-yellow-400">
                  {levelProgress?.currentLevel || 1}
                </span>
              </div>
              
              {levelProgress && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-300">
                      {levelProgress.currentXP}/{levelProgress.nextLevelXP} XP
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress.progressToNext}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Achievement Progress */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-6 h-6 text-blue-400" />
                  <span className="text-white font-medium">Unlocked</span>
                </div>
                <span className="text-2xl font-bold text-blue-400">
                  {achievementCounts.unlocked}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-gray-300">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </GlassCard>

            {/* Current Streak */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-6 h-6 text-orange-400" />
                  <span className="text-white font-medium">Streak</span>
                </div>
                <span className="text-2xl font-bold text-orange-400">
                  {currentStreak}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Longest Streak</div>
                <div className="text-lg font-semibold text-gray-300">
                  {longestStreak} days
                </div>
              </div>
            </GlassCard>

            {/* In Progress */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-6 h-6 text-green-400" />
                  <span className="text-white font-medium">In Progress</span>
                </div>
                <span className="text-2xl font-bold text-green-400">
                  {achievementCounts.inProgress}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">Locked</div>
                <div className="text-lg font-semibold text-gray-300">
                  {achievementCounts.locked}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recent Achievements */}
          {stats?.recentUnlocks && stats.recentUnlocks.length > 0 && (
            <GlassCard className="p-6 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Star className="w-5 h-5 text-yellow-400 mr-2" />
                Recent Achievements
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentUnlocks.slice(0, 6).map((userAchievement) => {
                  const achievement = achievements.find(a => a.id === userAchievement.achievementId);
                  if (!achievement) return null;
                  
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {achievement.title}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {userAchievement.unlockedAt?.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Achievement Grid */}
          <AchievementGrid
            achievements={achievements}
            userAchievements={userAchievements}
            onAchievementClick={handleAchievementClick}
          />
        </div>
      </div>

      {/* Achievement Notification Manager */}
      <AchievementNotificationManager />
    </ProtectedRoute>
  );
}
