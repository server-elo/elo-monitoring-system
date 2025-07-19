'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Check if we're in static export mode
const isStaticExport = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';
import { 
  BookOpen, 
  Code, 
  Trophy, 
  Target, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Users,
  Play
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { useLearning } from '@/lib/context/LearningContext';
import { logger } from '@/lib/api/logger';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  isCompleted: boolean;
}

export function LearningDashboard() {
  // For static export, return a simplified version without hooks
  if (isStaticExport) {
    return <StaticLearningDashboard />;
  }

  return <DynamicLearningDashboard />;
}

// Dynamic component that uses hooks (only loaded in non-static mode)
function DynamicLearningDashboard() {
  const { state, completeChallenge, completeGoal, setTotalGoals } = useLearning();
  const [courses, setCourses] = useState<Course[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/progress');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        setAchievements(data.achievements || []);

        // Initialize goals if not set
        if (state.totalGoals === 0) {
          setTotalGoals(5);
        }
      }
    } catch (error) {
      logger.error('Error fetching dashboard data:', {}, error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteChallenge = () => {
    completeChallenge(1);
    setShowChallengeModal(true);
    setTimeout(() => setShowChallengeModal(false), 3000);
  };

  const handleCompleteGoal = () => {
    if (state.goalsCompleted < state.totalGoals) {
      completeGoal(1);
      setShowGoalModal(true);
      setTimeout(() => setShowGoalModal(false), 3000);
    }
  };

  const handleSetNewGoals = () => {
    const newTotal = state.totalGoals + 5;
    setTotalGoals(newTotal);
  };

  const stats = [
    {
      title: 'Current Level',
      value: state.level,
      icon: Trophy,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Total XP',
      value: state.xp.toLocaleString(),
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Learning Streak',
      value: `${state.streak} days`,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Courses Active',
      value: courses.filter(c => c.progress > 0 && c.progress < 100).length,
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Code Challenges',
      value: state.completedChallenges || 0,
      icon: Code,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Learning Goals',
      value: `${state.goalsCompleted || 0}/${state.totalGoals || 5}`,
      icon: Target,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  const recentAchievements = achievements
    .filter(a => a.isCompleted)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Welcome Back, Developer!
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Continue your journey to Solidity mastery with interactive learning and real-time progress tracking
          </p>

          {/* Quick Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="p-4 text-center bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
              <div className="text-2xl font-bold text-blue-400 mb-1">{state.level}</div>
              <div className="text-sm text-gray-300">Current Level</div>
            </GlassCard>
            <GlassCard className="p-4 text-center bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <div className="text-2xl font-bold text-green-400 mb-1">{state.completedChallenges || 0}</div>
              <div className="text-sm text-gray-300">Completed</div>
            </GlassCard>
            <GlassCard className="p-4 text-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <div className="text-2xl font-bold text-yellow-400 mb-1">{state.xp.toLocaleString()}</div>
              <div className="text-sm text-gray-300">Total XP</div>
            </GlassCard>
            <GlassCard className="p-4 text-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              <div className="text-2xl font-bold text-purple-400 mb-1">{state.streak}</div>
              <div className="text-sm text-gray-300">Day Streak</div>
            </GlassCard>
          </motion.div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={`p-6 hover:scale-105 transition-all duration-300 ${stat.bgColor} border-white/20`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor} border border-white/20`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                {stat.title === 'Code Challenges' && (
                  <Button
                    onClick={handleCompleteChallenge}
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Complete Challenge +1
                  </Button>
                )}

                {stat.title === 'Learning Goals' && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleCompleteGoal}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      disabled={state.goalsCompleted >= state.totalGoals}
                    >
                      {state.goalsCompleted >= state.totalGoals ? 'All Goals Complete!' : 'Complete Goal +1'}
                    </Button>
                    {state.goalsCompleted >= state.totalGoals && (
                      <Button
                        onClick={handleSetNewGoals}
                        size="sm"
                        variant="outline"
                        className="w-full text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        Set New Goals +5
                      </Button>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Main Content */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass bg-white/10 border border-white/20">
            <TabsTrigger value="courses" className="data-[state=active]:bg-white/20">Courses</TabsTrigger>
            <TabsTrigger value="achievements" className="data-[state=active]:bg-white/20">Achievements</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-white/20">Recent Activity</TabsTrigger>
            <TabsTrigger value="community" className="data-[state=active]:bg-white/20">Community</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            {/* Continue Learning Section */}
            <GlassCard className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-white/20">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-bold text-white mb-2">
                  <Play className="w-5 h-5" />
                  Continue Learning
                </h3>
                <p className="text-gray-300">
                  Pick up where you left off
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses
                  .filter(course => course.progress > 0 && course.progress < 100)
                  .slice(0, 3)
                  .map((course) => (
                    <motion.div
                      key={course.id}
                      whileHover={{ scale: 1.02 }}
                    >
                      <GlassCard className="p-4 bg-gradient-to-br from-white/5 to-white/10 border-white/20 hover:border-white/30 transition-all"
                      >
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {course.difficulty}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {Math.round(course.progress)}%
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-2">{course.title}</h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {course.description}
                      </p>
                      <Progress value={course.progress} className="mb-3" />
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                        <span>{course.totalModules} modules</span>
                      </div>
                        <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" size="sm">
                          <Link href={`/learn/course/${course.id}`}>
                            Continue
                          </Link>
                        </Button>
                      </GlassCard>
                    </motion.div>
                  ))}
              </div>
            </GlassCard>

          {/* All Courses */}
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BookOpen className="w-5 h-5" />
                All Courses
              </CardTitle>
              <CardDescription>
                Explore our comprehensive curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        variant={course.progress === 100 ? "default" : course.progress > 0 ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {course.progress === 100 ? 'Completed' : course.progress > 0 ? 'In Progress' : course.difficulty}
                      </Badge>
                      {course.progress > 0 && (
                        <span className="text-sm text-gray-400">
                          {Math.round(course.progress)}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                      {course.description}
                    </p>
                    {course.progress > 0 && (
                      <Progress value={course.progress} className="mb-4" />
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <span>{course.totalLessons} lessons</span>
                      <span>{course.totalModules} modules</span>
                    </div>
                    <Button asChild className="w-full">
                      <Link href={`/learn/course/${course.id}`}>
                        {course.progress === 0 ? 'Start Course' : 'Continue'}
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5" />
                Recent Achievements
              </CardTitle>
              <CardDescription>
                Your latest accomplishments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.05 }}
                    className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <h3 className="font-semibold text-white mb-1">{achievement.title}</h3>
                      <p className="text-xs text-gray-300 mb-2">{achievement.description}</p>
                      <p className="text-xs text-yellow-400">
                        Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Your learning activity over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Activity tracking coming soon!</p>
                <p className="text-sm">We're building detailed analytics for your learning journey.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="community" className="space-y-6">
          <Card className="glass border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                Learning Community
              </CardTitle>
              <CardDescription>
                Connect with fellow developers and share your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Study Groups</h3>
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">Solidity Beginners</h4>
                        <Badge variant="secondary">24 members</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Weekly study sessions for Solidity fundamentals
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Join Group
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">DeFi Developers</h4>
                        <Badge variant="secondary">18 members</Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Advanced DeFi protocol development discussions
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        Join Group
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Alex Chen', xp: 15420, rank: 1 },
                      { name: 'Sarah Kim', xp: 14890, rank: 2 },
                      { name: 'You', xp: state.xp, rank: 3 },
                      { name: 'Mike Johnson', xp: 12340, rank: 4 },
                      { name: 'Emma Davis', xp: 11980, rank: 5 }
                    ].map((user) => (
                      <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            user.rank === 1 ? 'bg-yellow-500 text-black' :
                            user.rank === 2 ? 'bg-gray-400 text-black' :
                            user.rank === 3 ? 'bg-orange-500 text-white' :
                            'bg-white/10 text-white'
                          }`}>
                            {user.rank}
                          </div>
                          <span className={`font-medium ${user.name === 'You' ? 'text-blue-400' : 'text-white'}`}>
                            {user.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">{user.xp.toLocaleString()} XP</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Success Modals */}
      <AnimatePresence>
        {showChallengeModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-8 text-center max-w-md mx-4"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-2">Challenge Complete!</h3>
              <p className="text-cyan-400 mb-4">You've completed another coding challenge!</p>
              <div className="text-lg font-semibold text-white">
                Total Challenges: {state.completedChallenges}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showGoalModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              exit={{ y: 50 }}
              className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg p-8 text-center max-w-md mx-4"
            >
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-white mb-2">Goal Achieved!</h3>
              <p className="text-red-400 mb-4">You're making excellent progress!</p>
              <div className="text-lg font-semibold text-white">
                Goals: {state.goalsCompleted}/{state.totalGoals}
              </div>
              {state.goalsCompleted >= state.totalGoals && (
                <div className="mt-4 text-yellow-400 font-semibold">
                  🎉 All goals complete! Time to set new ones!
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

// Simplified static version for static export
function StaticLearningDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h1
          className="text-4xl font-bold gradient-text mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Learn Solidity
        </motion.h1>
        <motion.p
          className="text-xl text-gray-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Master blockchain development with interactive courses and challenges.
          This is a static demo showcasing the learning platform.
        </motion.p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Courses Completed</p>
                <p className="text-2xl font-bold text-white">3/5</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Challenges Solved</p>
                <p className="text-2xl font-bold text-white">12/20</p>
              </div>
              <Code className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Achievements</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="glass border-white/10 hover:border-blue-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Solidity Basics</h3>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Learn the fundamentals of Solidity programming language.
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-green-400 h-2 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <p className="text-green-400 text-sm">Completed</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 hover:border-blue-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Smart Contracts</h3>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Build and deploy your first smart contracts.
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-blue-400 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <p className="text-blue-400 text-sm">In Progress</p>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 hover:border-blue-500/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">DeFi Development</h3>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Advanced DeFi protocols and yield farming.
            </p>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-gray-400 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Not Started</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
