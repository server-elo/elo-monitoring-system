import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Award, Target, Calendar, Clock, 
  BookOpen, Code, Zap, Users, Star, Trophy,
  BarChart3, PieChart, Activity, CheckCircle
} from 'lucide-react';
import { Card } from '../ui/card';

interface ProgressStats {
  totalXP: number;
  currentLevel: string;
  completedLessons: number;
  totalLessons: number;
  currentStreak: number;
  longestStreak: number;
  timeSpent: number; // in minutes
  achievements: Achievement[];
  weeklyProgress: Array<{ day: string; xp: number; lessons: number }>;
  skillProgress: Array<{ skill: string; level: number; maxLevel: number }>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
  xpReward: number;
}

interface ProgressDashboardProps {
  userId?: string;
  className?: string;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId,
  className = ''
}) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'community' | 'calendar'>('overview');
  const [codeStats, setCodeStats] = useState<{linesWritten: number, contractsDeployed: number, testsWritten: number}>({
    linesWritten: 0,
    contractsDeployed: 0,
    testsWritten: 0
  });
  const [communityData, setCommunityData] = useState<{followers: number, following: number, contributions: number}>({
    followers: 0,
    following: 0,
    contributions: 0
  });
  const [activityFeed, setActivityFeed] = useState<Array<{id: string, type: string, description: string, timestamp: Date}>>([]);
  const [studySchedule, setStudySchedule] = useState<Array<{date: string, sessions: number, planned: boolean}>>([]);

  useEffect(() => {
    loadProgressStats();
    loadCodeStats();
    loadCommunityData();
    loadActivityFeed();
    loadStudySchedule();
  }, [userId, selectedTimeframe]);

  const loadCodeStats = async () => {
    try {
      const response = await fetch('/api/user/code-stats');
      if (response.ok) {
        const data = await response.json();
        setCodeStats(data.stats);
      } else {
        // Fallback to empty stats
        setCodeStats({
          linesWritten: 0,
          contractsDeployed: 0,
          testsWritten: 0
        });
      }
    } catch (error) {
      console.error('Error loading code stats:', error);
      setCodeStats({
        linesWritten: 0,
        contractsDeployed: 0,
        testsWritten: 0
      });
    }
  };

  const loadCommunityData = async () => {
    try {
      const response = await fetch('/api/user/community-stats');
      if (response.ok) {
        const data = await response.json();
        setCommunityData(data.stats);
      } else {
        // Fallback to empty stats
        setCommunityData({
          followers: 0,
          following: 0,
          contributions: 0
        });
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      setCommunityData({
        followers: 0,
        following: 0,
        contributions: 0
      });
    }
  };

  const loadActivityFeed = async () => {
    try {
      const response = await fetch('/api/user/activity-feed');
      if (response.ok) {
        const data = await response.json();
        setActivityFeed(data.activities || []);
      } else {
        setActivityFeed([]);
      }
    } catch (error) {
      console.error('Error loading activity feed:', error);
      setActivityFeed([]);
    }
  };

  const loadStudySchedule = async () => {
    try {
      const response = await fetch('/api/user/study-schedule');
      if (response.ok) {
        const data = await response.json();
        setStudySchedule(data.schedule || []);
      } else {
        setStudySchedule([]);
      }
    } catch (error) {
      console.error('Error loading study schedule:', error);
      setStudySchedule([]);
    }
  };

  const loadProgressStats = async () => {
    setIsLoading(true);
    try {
      // Fetch real progress stats from API

      const response = await fetch('/api/user/progress-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      } else {
        // Fallback to empty stats
        const emptyStats: ProgressStats = {
          totalXP: 0,
          currentLevel: 'Beginner',
          completedLessons: 0,
          totalLessons: 0,
          currentStreak: 0,
          longestStreak: 0,
          timeSpent: 0,
          achievements: [],
          weeklyProgress: [],
          skillProgress: []
        };
        setStats(emptyStats);
      }
    } catch (error) {
      console.error('Failed to load progress stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getXPProgress = () => {
    if (!stats) return { current: 0, next: 1000, percentage: 0 };
    
    const levelThresholds = {
      'Beginner': { min: 0, max: 1000 },
      'Intermediate': { min: 1000, max: 5000 },
      'Advanced': { min: 5000, max: 10000 }
    };
    
    const threshold = levelThresholds[stats.currentLevel as keyof typeof levelThresholds];
    const current = stats.totalXP - threshold.min;
    const next = threshold.max - threshold.min;
    const percentage = Math.min((current / next) * 100, 100);
    
    return { current, next, percentage };
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: 'text-gray-400 bg-gray-400/10',
      rare: 'text-blue-400 bg-blue-400/10',
      epic: 'text-purple-400 bg-purple-400/10',
      legendary: 'text-yellow-400 bg-yellow-400/10'
    };
    return colors[rarity];
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="animate-pulse">
              <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-white/20 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const xpProgress = getXPProgress();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-md rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'analytics', label: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
          { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> },
          { id: 'calendar', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-colors ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
              {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalXP.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Total XP</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.completedLessons}</p>
                  <p className="text-sm text-gray-400">Lessons Done</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
                  <p className="text-sm text-gray-400">Day Streak</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(stats.timeSpent / 60)}h</p>
                  <p className="text-sm text-gray-400">Time Spent</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.achievements.length}</p>
                  <p className="text-sm text-gray-400">Awards</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Code className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{codeStats.linesWritten.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">Lines Coded</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Star className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{Math.round(stats.totalXP / 100)}</p>
                  <p className="text-sm text-gray-400">Star Rating</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.skillProgress.length}</p>
                  <p className="text-sm text-gray-400">Skills</p>
                </div>
              </div>
            </Card>
          </div>

      {/* Level Progress */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Level Progress</h3>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
            {stats.currentLevel}
          </span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">XP Progress</span>
            <span className="text-white">{xpProgress.current} / {xpProgress.next}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {Math.round(100 - xpProgress.percentage)}% to next level
          </p>
        </div>
      </Card>

      {/* Weekly Progress Chart */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Weekly Progress</h3>
          <div className="flex space-x-2">
            {(['week', 'month', 'year'] as const).map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {stats.weeklyProgress.map((day, index) => (
            <div key={day.day} className="text-center">
              <div className="text-xs text-gray-400 mb-2">{day.day}</div>
              <motion.div
                className="bg-blue-500/20 rounded-lg p-2 relative overflow-hidden"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-blue-500/40 rounded-lg"
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.xp / 300) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.5 }}
                />
                <div className="relative z-10">
                  <div className="text-sm font-semibold text-white">{day.xp}</div>
                  <div className="text-xs text-gray-400">XP</div>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </Card>

      {/* Skills Progress */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-6">Skill Progress</h3>
        
        <div className="space-y-4">
          {stats.skillProgress.map((skill, index) => (
            <motion.div
              key={skill.skill}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between">
                <span className="text-white font-medium">{skill.skill}</span>
                <span className="text-gray-400 text-sm">
                  {skill.level}/{skill.maxLevel}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(skill.level / skill.maxLevel) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Recent Achievements */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Achievements</h3>
          <Trophy className="w-5 h-5 text-yellow-400" />
        </div>

        <div className="grid gap-4">
          {stats.achievements.slice(0, 3).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg border border-white/10"
            >
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-white">{achievement.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{achievement.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-yellow-400">
                  +{achievement.xpReward} XP
                </div>
                <div className="text-xs text-gray-400">
                  {achievement.unlockedAt.toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm transition-colors">
            View All Achievements ({stats.achievements.length})
          </button>
        </div>
      </Card>

      {/* Learning Goals */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Learning Goals</h3>
          <Target className="w-5 h-5 text-green-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-white">Complete Solidity Basics</span>
            </div>
            <span className="text-green-400 text-sm">Completed</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <span className="text-white">Build First DApp</span>
            </div>
            <span className="text-blue-400 text-sm">In Progress</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
              <span className="text-gray-400">Learn DeFi Development</span>
            </div>
            <span className="text-gray-400 text-sm">Upcoming</span>
          </div>
        </div>
      </Card>
        </>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Code Analytics */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Code Analytics
              </h3>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-blue-400">{codeStats.linesWritten.toLocaleString()}</div>
                <div className="text-sm text-gray-400 mt-1">Lines of Code</div>
                <div className="text-xs text-green-400 mt-2">↑ 23% this week</div>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-green-400">{codeStats.contractsDeployed}</div>
                <div className="text-sm text-gray-400 mt-1">Contracts Deployed</div>
                <div className="text-xs text-green-400 mt-2">↑ 2 this month</div>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-purple-400">{codeStats.testsWritten}</div>
                <div className="text-sm text-gray-400 mt-1">Tests Written</div>
                <div className="text-xs text-green-400 mt-2">↑ 15% coverage</div>
              </div>
            </div>
          </Card>

          {/* Skill Distribution Chart */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Skill Distribution
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {stats.skillProgress.map((skill, index) => (
                  <div key={skill.skill} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `hsl(${index * 60}, 70%, 50%)` }}
                      />
                      <span className="text-white text-sm">{skill.skill}</span>
                    </div>
                    <span className="text-gray-400 text-sm">{Math.round((skill.level / skill.maxLevel) * 100)}%</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>
                  {stats.skillProgress.map((skill, index) => {
                    const percentage = (skill.level / skill.maxLevel) * 100;
                    const rotation = (index * 72) - 90; // 360/5 skills = 72 degrees each
                    return (
                      <div
                        key={skill.skill}
                        className="absolute inset-0 rounded-full border-8 border-transparent"
                        style={{
                          borderTopColor: `hsl(${index * 60}, 70%, 50%)`,
                          transform: `rotate(${rotation}deg)`,
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + (percentage / 100) * 50}% 0%)`
                        }}
                      />
                    );
                  })}
                  <div className="absolute inset-4 bg-gray-800 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {Math.round(stats.skillProgress.reduce((acc: number, skill) => acc + (skill.level / skill.maxLevel), 0) / stats.skillProgress.length * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">Overall</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </h3>
            </div>

            <div className="space-y-4">
              {activityFeed.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'achievement' ? 'bg-yellow-400' :
                    activity.type === 'lesson' ? 'bg-green-400' :
                    activity.type === 'code' ? 'bg-blue-400' : 'bg-purple-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">{activity.timestamp.toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'community' && (
        <div className="space-y-6">
          {/* Community Stats */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Community Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-blue-400">{communityData.followers}</div>
                <div className="text-sm text-gray-400 mt-1">Followers</div>
                <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">View All</button>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-green-400">{communityData.following}</div>
                <div className="text-sm text-gray-400 mt-1">Following</div>
                <button className="text-xs text-green-400 hover:text-green-300 mt-2">Discover More</button>
              </div>

              <div className="text-center p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-purple-400">{communityData.contributions}</div>
                <div className="text-sm text-gray-400 mt-1">Contributions</div>
                <button className="text-xs text-purple-400 hover:text-purple-300 mt-2">View History</button>
              </div>
            </div>
          </Card>

          {/* Learning Resources */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Recommended Resources
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Advanced Solidity Patterns", type: "Article", rating: 4.8, readers: 1234 },
                { title: "DeFi Security Best Practices", type: "Guide", rating: 4.9, readers: 856 },
                { title: "Gas Optimization Techniques", type: "Tutorial", rating: 4.7, readers: 2341 },
                { title: "Smart Contract Testing", type: "Course", rating: 4.6, readers: 567 }
              ].map((resource, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium text-sm">{resource.title}</h4>
                    <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">{resource.type}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span>{resource.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>{resource.readers}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Study Schedule */}
          <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Study Schedule
              </h3>
              <button className="text-blue-400 hover:text-blue-300 text-sm">Plan Session</button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {studySchedule.map((day, index) => (
                <div key={day.date} className="text-center relative">
                  <div className="text-xs text-gray-400 mb-2">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className={`p-3 rounded-lg border transition-all duration-300 ${
                    day.planned
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10'
                  } ${
                    index === 0 ? 'ring-2 ring-blue-400/50' : '' // Highlight today using index
                  }`}>
                    <div className="text-sm font-semibold text-white">{day.sessions}</div>
                    <div className="text-xs text-gray-400">sessions</div>

                    {/* Day progress indicator using index */}
                    <div className="mt-2 flex justify-center space-x-1">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            i < day.sessions ? 'bg-blue-400' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Week position indicator */}
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    )}
                    {index === 6 && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-400 rounded-full" />
                    )}
                  </div>

                  {/* Day number badge using index */}
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-700 rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProgressDashboard;
