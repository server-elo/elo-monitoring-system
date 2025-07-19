'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Trophy, 
  Star,
  BookOpen,
  Zap,
  Calendar,
  BarChart3,
  Activity,
  Award
} from 'lucide-react';
import type { UserCurriculumProgress, LearningAnalytics } from '@/lib/curriculum/types';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface LearningAnalyticsProps {
  userProgress: UserCurriculumProgress;
  analytics?: LearningAnalytics;
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  onTimeframeChange?: (timeframe: 'daily' | 'weekly' | 'monthly' | 'all_time') => void;
  className?: string;
}

export function LearningAnalytics({
  userProgress,
  analytics: _analytics,
  timeframe = 'weekly',
  onTimeframeChange,
  className
}: LearningAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'performance' | 'achievements'>('overview');

  // Calculate basic metrics from user progress
  const basicMetrics = useMemo(() => {
    const totalLessons = Object.keys(userProgress.lessons).length;
    const completedLessons = Object.values(userProgress.lessons).filter(l => l.status === 'completed').length;
    const inProgressLessons = Object.values(userProgress.lessons).filter(l => l.status === 'in_progress').length;
    
    const totalModules = Object.keys(userProgress.modules).length;
    const completedModules = Object.values(userProgress.modules).filter(m => m.status === 'completed').length;
    const inProgressModules = Object.values(userProgress.modules).filter(m => m.status === 'in_progress').length;

    const averageQuizScore = Object.values(userProgress.lessons)
      .filter(l => l.bestScore !== undefined)
      .reduce((sum, l, _, arr) => sum + (l.bestScore || 0) / arr.length, 0);

    const totalTimeHours = Math.round(userProgress.totalTimeSpent / 60);
    const averageSessionTime = userProgress.analytics.averageSessionDuration || 0;

    return {
      totalLessons,
      completedLessons,
      inProgressLessons,
      totalModules,
      completedModules,
      inProgressModules,
      completionRate: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
      averageQuizScore: Math.round(averageQuizScore),
      totalTimeHours,
      averageSessionTime: Math.round(averageSessionTime),
      streakDays: userProgress.streakDays,
      totalXP: userProgress.totalXPEarned
    };
  }, [userProgress]);

  // Mock progress trend data (in real app, this would come from analytics)
  const progressTrend = useMemo(() => {
    const days = timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : timeframe === 'monthly' ? 12 : 30;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date,
        lessonsCompleted: Math.floor(Math.random() * 3),
        xpEarned: Math.floor(Math.random() * 200) + 50,
        timeSpent: Math.floor(Math.random() * 120) + 30
      });
    }
    
    return data;
  }, [timeframe]);

  const StatCard = ({ 
    icon: Icon, 
    title, 
    value, 
    subtitle, 
    color = 'blue',
    trend 
  }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
    trend?: number;
  }) => {
    const colorClasses = {
      blue: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      green: 'text-green-400 bg-green-500/20 border-green-500/30',
      yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      purple: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      red: 'text-red-400 bg-red-500/20 border-red-500/30'
    };

    return (
      <GlassCard className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center border', colorClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-400">{title}</h3>
              <p className="text-2xl font-bold text-white">{value}</p>
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          
          {trend !== undefined && (
            <div className={cn(
              'flex items-center space-x-1 text-xs',
              trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
            )}>
              <TrendingUp className={cn('w-3 h-3', trend < 0 && 'rotate-180')} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </GlassCard>
    );
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BookOpen}
          title="Lessons Completed"
          value={`${basicMetrics.completedLessons}/${basicMetrics.totalLessons}`}
          subtitle={`${Math.round(basicMetrics.completionRate)}% completion rate`}
          color="blue"
          trend={5}
        />
        <StatCard
          icon={Trophy}
          title="Modules Completed"
          value={`${basicMetrics.completedModules}/${basicMetrics.totalModules}`}
          color="green"
          trend={12}
        />
        <StatCard
          icon={Zap}
          title="Total XP"
          value={basicMetrics.totalXP.toLocaleString()}
          color="yellow"
          trend={8}
        />
        <StatCard
          icon={Clock}
          title="Time Spent"
          value={`${basicMetrics.totalTimeHours}h`}
          subtitle={`${basicMetrics.averageSessionTime}min avg session`}
          color="purple"
          trend={-2}
        />
      </div>

      {/* Progress Overview */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Learning Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Overall Completion</span>
              <span className="text-sm text-gray-300 font-mono">{Math.round(userProgress.overallProgress)}%</span>
            </div>
            <ProgressBar
              progress={userProgress.overallProgress}
              color="blue"
              size="md"
              animated={true}
              glowEffect={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Lessons Progress</span>
                <span className="text-sm text-gray-300 font-mono">{Math.round(basicMetrics.completionRate)}%</span>
              </div>
              <ProgressBar
                progress={basicMetrics.completionRate}
                color="green"
                size="sm"
                animated={true}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">Quiz Average</span>
                <span className="text-sm text-gray-300 font-mono">{basicMetrics.averageQuizScore}%</span>
              </div>
              <ProgressBar
                progress={basicMetrics.averageQuizScore}
                color={basicMetrics.averageQuizScore >= 80 ? 'green' : basicMetrics.averageQuizScore >= 60 ? 'yellow' : 'red'}
                size="sm"
                animated={true}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Streak and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Learning Streak</h3>
              <p className="text-sm text-gray-400">Keep up the momentum!</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-2">{basicMetrics.streakDays}</div>
            <div className="text-sm text-gray-400">days in a row</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Achievements</h3>
              <p className="text-sm text-gray-400">Unlock more rewards</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{userProgress.achievements.length}</div>
            <div className="text-sm text-gray-400">achievements unlocked</div>
          </div>
        </GlassCard>
      </div>
    </div>
  );

  const ProgressTab = () => (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Progress Trends</h3>
        <div className="flex items-center space-x-2">
          {(['daily', 'weekly', 'monthly', 'all_time'] as const).map(period => (
            <EnhancedButton
              key={period}
              onClick={() => onTimeframeChange?.(period)}
              variant={timeframe === period ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              touchTarget
            >
              {period.replace('_', ' ')}
            </EnhancedButton>
          ))}
        </div>
      </div>

      {/* Progress Chart Placeholder */}
      <GlassCard className="p-6">
        <h4 className="text-md font-medium text-white mb-4">Learning Activity</h4>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">Progress chart would be displayed here</p>
            <p className="text-xs text-gray-500 mt-1">Integration with charting library needed</p>
          </div>
        </div>
      </GlassCard>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <h4 className="text-md font-medium text-white mb-4">Recent Activity</h4>
        <div className="space-y-3">
          {progressTrend.slice(-5).reverse().map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">{day.date.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-blue-400">{day.lessonsCompleted} lessons</span>
                <span className="text-yellow-400">{day.xpEarned} XP</span>
                <span className="text-purple-400">{day.timeSpent}min</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  const PerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Target}
          title="Quiz Average"
          value={`${basicMetrics.averageQuizScore}%`}
          color={basicMetrics.averageQuizScore >= 80 ? 'green' : 'yellow'}
        />
        <StatCard
          icon={Clock}
          title="Avg Session"
          value={`${basicMetrics.averageSessionTime}min`}
          color="blue"
        />
        <StatCard
          icon={TrendingUp}
          title="Completion Rate"
          value={`${Math.round(basicMetrics.completionRate)}%`}
          color="purple"
        />
      </div>

      {/* Topic Mastery */}
      <GlassCard className="p-6">
        <h4 className="text-md font-medium text-white mb-4">Topic Mastery</h4>
        <div className="space-y-4">
          {[
            { topic: 'Solidity Basics', mastery: 85, color: 'green' },
            { topic: 'Smart Contracts', mastery: 72, color: 'yellow' },
            { topic: 'DeFi Concepts', mastery: 45, color: 'red' },
            { topic: 'Security Patterns', mastery: 60, color: 'yellow' }
          ].map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">{item.topic}</span>
                <span className="text-sm text-gray-400 font-mono">{item.mastery}%</span>
              </div>
              <ProgressBar
                progress={item.mastery}
                color={item.color as any}
                size="sm"
                animated={true}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recommendations */}
      <GlassCard className="p-6">
        <h4 className="text-md font-medium text-white mb-4">Recommendations</h4>
        <div className="space-y-3">
          {userProgress.analytics.recommendedReview.slice(0, 3).map((topic, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-300">Review {topic}</span>
              </div>
              <EnhancedButton
                variant="ghost"
                size="sm"
                className="text-yellow-400 hover:text-yellow-300"
                touchTarget
              >
                Start Review
              </EnhancedButton>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  const AchievementsTab = () => (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h4 className="text-md font-medium text-white mb-4">Achievement Progress</h4>
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Achievement tracking integration needed</p>
          <p className="text-xs text-gray-500 mt-1">Connect with existing achievement system</p>
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-black/20 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'progress', label: 'Progress', icon: TrendingUp },
          { id: 'performance', label: 'Performance', icon: Target },
          { id: 'achievements', label: 'Achievements', icon: Trophy }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <EnhancedButton
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              className={cn(
                'flex-1 justify-center',
                activeTab === tab.id ? 'bg-white/10' : 'hover:bg-white/5'
              )}
              touchTarget
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </EnhancedButton>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'progress' && <ProgressTab />}
        {activeTab === 'performance' && <PerformanceTab />}
        {activeTab === 'achievements' && <AchievementsTab />}
      </motion.div>
    </div>
  );
}
