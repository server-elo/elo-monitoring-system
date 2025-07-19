import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Code, 
  Shield, 
  Coins, 
  Zap, 
  Lock, 
  CheckCircle, 
  PlayCircle,
  Clock,
  Star,
  Users,
  Trophy,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { logger } from '@/lib/api/logger';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'video' | 'interactive' | 'quiz' | 'project';
  completed: boolean;
  locked: boolean;
  xpReward: number;
  prerequisites?: string[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'fundamentals' | 'patterns' | 'security' | 'defi' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  lessons: Lesson[];
  completed: boolean;
  progress: number; // 0-100
  unlocked: boolean;
  certificate?: {
    available: boolean;
    earned: boolean;
  };
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

interface StructuredCurriculumProps {
  learningPaths: LearningPath[];
  currentPath?: string;
  onSelectPath?: (pathId: string) => void;
  onStartLesson?: (lessonId: string) => void;
  className?: string;
}

const difficultyColors = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500'
};

const typeIcons = {
  video: <PlayCircle className="w-4 h-4" />,
  interactive: <Code className="w-4 h-4" />,
  quiz: <BookOpen className="w-4 h-4" />,
  project: <Trophy className="w-4 h-4" />
};

export const StructuredCurriculum: React.FC<StructuredCurriculumProps> = ({
  learningPaths,
  currentPath,
  onSelectPath,
  onStartLesson,
  className = ''
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(currentPath || learningPaths[0]?.id);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'progress' | 'community' | 'rewards'>('overview');
  const [userProgress, setUserProgress] = useState<{[key: string]: number}>({});
  const [earnedRewards, setEarnedRewards] = useState<{[key: string]: number}>({});
  const [securityBadges, setSecurityBadges] = useState<string[]>([]);
  const [communityStats, setCommunityStats] = useState<{studyGroups: number, discussions: number, mentors: number}>({
    studyGroups: 0,
    discussions: 0,
    mentors: 0
  });

  const currentLearningPath = learningPaths.find(path => path.id === selectedPath);

  // Initialize data and track progress
  useEffect(() => {
    if (currentLearningPath) {
      // Initialize user progress tracking
      const progressData: {[key: string]: number} = {};
      const rewardsData: {[key: string]: number} = {};

      currentLearningPath.modules.forEach(module => {
        progressData[module.id] = module.progress;
        // Calculate earned coins based on completed lessons
        const completedLessons = module.lessons.filter(l => l.completed).length;
        rewardsData[module.id] = completedLessons * 10; // 10 coins per lesson
      });

      setUserProgress(progressData);
      setEarnedRewards(rewardsData);

      // Check for security badges
      const badges: string[] = [];
      currentLearningPath.modules.forEach(module => {
        if (module.category === 'security' && module.completed) {
          badges.push(`security-${module.id}`);
        }
      });
      setSecurityBadges(badges);

      // Load community stats
      setCommunityStats({
        studyGroups: Math.floor(Math.random() * 50) + 10,
        discussions: Math.floor(Math.random() * 200) + 50,
        mentors: Math.floor(Math.random() * 20) + 5
      });
    }
  }, [currentLearningPath, selectedPath]);

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleSelectPath = (pathId: string) => {
    setSelectedPath(pathId);
    onSelectPath?.(pathId);
  };

  const handleQuickAction = (moduleId: string, action: 'bookmark' | 'share' | 'notes') => {
    // Track module-specific actions using moduleId
    logger.info(`Quick action performed`, { moduleId, action });
    // In a real app, this would save to user preferences/analytics
  };

  const earnSecurityBadge = (moduleId: string) => {
    if (!securityBadges.includes(`security-${moduleId}`)) {
      setSecurityBadges(prev => [...prev, `security-${moduleId}`]);
    }
  };

  const addRewardCoins = (moduleId: string, amount: number) => {
    setEarnedRewards(prev => ({
      ...prev,
      [moduleId]: (prev[moduleId] || 0) + amount
    }));
  };

  const LessonCard: React.FC<{ lesson: Lesson; moduleId: string }> = ({ lesson, moduleId }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border transition-all duration-300 ${
        lesson.locked 
          ? 'bg-gray-500/20 border-gray-600 opacity-60' 
          : lesson.completed
          ? 'bg-green-500/20 border-green-500/50'
          : 'bg-white/10 border-white/20 hover:bg-white/20'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            {lesson.locked ? (
              <Lock className="w-4 h-4 text-gray-500" />
            ) : lesson.completed ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              typeIcons[lesson.type]
            )}
            <h4 className={`font-medium ${lesson.locked ? 'text-gray-500' : 'text-white'}`}>
              {lesson.title}
            </h4>
            <Badge 
              variant="secondary" 
              className={`text-xs ${difficultyColors[lesson.difficulty]} text-white`}
            >
              {lesson.difficulty}
            </Badge>
          </div>
          
          <p className={`text-sm mb-3 ${lesson.locked ? 'text-gray-600' : 'text-gray-300'}`}>
            {lesson.description}
          </p>
          
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{lesson.duration} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3" />
              <span>+{lesson.xpReward} XP</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="w-3 h-3 text-yellow-400" />
              <span>+{Math.floor(lesson.xpReward / 2)} coins</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleQuickAction(moduleId, 'bookmark');
              }}
              className="text-xs px-2 py-1 h-6"
            >
              <Zap className="w-3 h-3 mr-1" />
              Quick
            </Button>
            {lesson.type === 'project' && lesson.completed && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  earnSecurityBadge(moduleId);
                }}
                className="text-xs px-2 py-1 h-6 border-green-500/50 text-green-400"
              >
                <Shield className="w-3 h-3 mr-1" />
                Badge
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <Button
            onClick={() => {
              onStartLesson?.(lesson.id);
              if (lesson.completed) {
                addRewardCoins(moduleId, 5); // Bonus for reviewing
              }
            }}
            disabled={lesson.locked}
            size="sm"
            className={lesson.completed ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {lesson.completed ? 'Review' : 'Start'}
          </Button>

          {earnedRewards[moduleId] > 0 && (
            <div className="text-xs text-center text-yellow-400 flex items-center justify-center">
              <Coins className="w-3 h-3 mr-1" />
              {earnedRewards[moduleId]} earned
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ModuleCard: React.FC<{ module: Module }> = ({ module }) => {
    const isExpanded = expandedModules.has(module.id);
    const completedLessons = module.lessons.filter(l => l.completed).length;
    
    return (
      <Card className="overflow-hidden bg-white/10 backdrop-blur-md border border-white/20">
        <div 
          className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => toggleModule(module.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${
                module.completed ? 'bg-green-500/20' : 
                module.unlocked ? 'bg-blue-500/20' : 'bg-gray-500/20'
              }`}>
                {module.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : module.unlocked ? (
                  module.icon
                ) : (
                  <Lock className="w-6 h-6 text-gray-500" />
                )}
              </div>
              
              <div>
                <h3 className={`text-xl font-semibold ${
                  module.unlocked ? 'text-white' : 'text-gray-500'
                }`}>
                  {module.title}
                </h3>
                <p className={`text-sm ${
                  module.unlocked ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {module.description}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                  <span>{module.estimatedHours}h estimated</span>
                  <span>{completedLessons}/{module.lessons.length} lessons</span>
                  <Badge 
                    variant="secondary" 
                    className={`${difficultyColors[module.difficulty]} text-white`}
                  >
                    {module.difficulty}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-white">
                  {Math.round(module.progress)}% Complete
                </div>
                <Progress value={module.progress} className="w-24 h-2 mt-1" />
              </div>
              
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10"
            >
              <div className="p-6 space-y-4">
                {module.lessons.map((lesson) => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    moduleId={module.id}
                  />
                ))}
                
                {module.certificate?.available && (
                  <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-yellow-400">Certificate Available</h4>
                        <p className="text-sm text-yellow-300">
                          Complete all lessons to earn your certificate
                        </p>
                      </div>
                      <Button
                        disabled={!module.completed}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        {module.certificate.earned ? 'View Certificate' : 'Earn Certificate'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    );
  };

  if (!currentLearningPath) {
    return <div>No learning path selected</div>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Path Selection */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Choose Your Learning Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {learningPaths.map((path) => (
            <Card
              key={path.id}
              className={`p-6 cursor-pointer transition-all duration-300 ${
                selectedPath === path.id 
                  ? 'bg-blue-500/20 border-blue-500/50' 
                  : 'bg-white/10 border-white/20 hover:bg-white/20'
              }`}
              onClick={() => handleSelectPath(path.id)}
            >
              <h3 className="text-lg font-semibold text-white mb-2">{path.title}</h3>
              <p className="text-sm text-gray-300 mb-4">{path.description}</p>
              
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span>{path.totalHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Students:</span>
                  <span>{path.studentsEnrolled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{path.rating}</span>
                  </div>
                </div>
              </div>
              
              <Progress value={path.completionRate} className="mt-4" />
              <div className="text-xs text-gray-400 mt-1">
                {Math.round(path.completionRate)}% Complete
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/10 backdrop-blur-md rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'curriculum', label: 'Curriculum' },
          { id: 'progress', label: 'Progress' },
          { id: 'community', label: 'Community', icon: <Users className="w-4 h-4" /> },
          { id: 'rewards', label: 'Rewards', icon: <Coins className="w-4 h-4" /> }
        ].map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className={`flex-1 ${activeTab === tab.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && tab.icon}
              <span>{tab.label}</span>
            </div>
          </Button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">
                {currentLearningPath.title}
              </h3>
              <p className="text-gray-300 mb-6">{currentLearningPath.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {currentLearningPath.modules.length}
                  </div>
                  <div className="text-sm text-gray-400">Modules</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {currentLearningPath.modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {currentLearningPath.totalHours}h
                  </div>
                  <div className="text-sm text-gray-400">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(currentLearningPath.completionRate)}%
                  </div>
                  <div className="text-sm text-gray-400">Complete</div>
                </div>
              </div>
              
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Continue Learning
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>
          </motion.div>
        )}

        {activeTab === 'curriculum' && (
          <motion.div
            key="curriculum"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {currentLearningPath.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </motion.div>
        )}

        {activeTab === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-6">Learning Progress</h3>

              {/* Progress Summary using userProgress */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/50">
                  <div className="text-2xl font-bold text-blue-400">
                    {Object.values(userProgress).filter(p => p > 0).length}
                  </div>
                  <div className="text-sm text-blue-300">Modules Started</div>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg border border-green-500/50">
                  <div className="text-2xl font-bold text-green-400">
                    {Object.values(userProgress).filter(p => p >= 100).length}
                  </div>
                  <div className="text-sm text-green-300">Modules Completed</div>
                </div>
                <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-500/50">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(Object.values(userProgress).reduce((acc, p) => acc + p, 0) / Object.keys(userProgress).length) || 0}%
                  </div>
                  <div className="text-sm text-purple-300">Average Progress</div>
                </div>
              </div>

              <div className="space-y-4">
                {currentLearningPath.modules.map((module) => (
                  <div key={module.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {module.icon}
                      <div>
                        <div className="font-medium text-white">{module.title}</div>
                        <div className="text-sm text-gray-400">
                          {module.lessons.filter(l => l.completed).length}/{module.lessons.length} lessons
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Progress value={userProgress[module.id] || module.progress} className="w-24" />
                      <span className="text-sm text-gray-400 w-12">
                        {Math.round(userProgress[module.id] || module.progress)}%
                      </span>
                      {/* Progress indicator using userProgress */}
                      <div className="flex items-center space-x-1">
                        {userProgress[module.id] > 75 && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        )}
                        {userProgress[module.id] > 50 && userProgress[module.id] <= 75 && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                        )}
                        {userProgress[module.id] <= 50 && userProgress[module.id] > 0 && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'community' && (
          <motion.div
            key="community"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Community Stats
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-white">Study Groups</span>
                    </div>
                    <span className="text-blue-400 font-semibold">{communityStats.studyGroups}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-4 h-4 text-green-400" />
                      <span className="text-white">Active Discussions</span>
                    </div>
                    <span className="text-green-400 font-semibold">{communityStats.discussions}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">Available Mentors</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">{communityStats.mentors}</span>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Join Community
                </Button>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Achievements
                </h3>

                <div className="space-y-3">
                  {securityBadges.length > 0 ? (
                    securityBadges.map((badge, index) => (
                      <div key={badge} className="flex items-center space-x-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <Shield className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-green-400 font-medium">Security Badge #{index + 1}</div>
                          <div className="text-green-300 text-sm">Earned for completing security module</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Complete security modules to earn badges</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'rewards' && (
          <motion.div
            key="rewards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                  Earned Rewards
                </h3>

                <div className="space-y-4">
                  {Object.entries(earnedRewards).map(([moduleId, coins]) => {
                    const moduleData = currentLearningPath.modules.find(m => m.id === moduleId);
                    return coins > 0 ? (
                      <div key={moduleId} className="flex items-center justify-between p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {moduleData?.icon}
                          <span className="text-white">{moduleData?.title}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-yellow-400 font-semibold">
                          <Coins className="w-4 h-4" />
                          <span>{coins}</span>
                        </div>
                      </div>
                    ) : null;
                  })}

                  {Object.values(earnedRewards).every(coins => coins === 0) && (
                    <div className="text-center py-8 text-gray-400">
                      <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Complete lessons to earn coins</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-yellow-400 font-semibold">Total Coins</div>
                      <div className="text-yellow-300 text-sm">Use for premium features</div>
                    </div>
                    <div className="flex items-center space-x-1 text-2xl font-bold text-yellow-400">
                      <Coins className="w-6 h-6" />
                      <span>{Object.values(earnedRewards).reduce((sum, coins) => sum + coins, 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-400" />
                  Power Features
                </h3>

                <div className="space-y-3">
                  <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">Quick Learning</span>
                      </div>
                      <Badge className="bg-purple-600">Premium</Badge>
                    </div>
                    <p className="text-purple-300 text-sm">Skip prerequisites and access advanced content</p>
                    <Button size="sm" className="w-full mt-3 bg-purple-600 hover:bg-purple-700">
                      Unlock for 50 coins
                    </Button>
                  </div>

                  <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium">Mentor Access</span>
                      </div>
                      <Badge className="bg-blue-600">Premium</Badge>
                    </div>
                    <p className="text-blue-300 text-sm">Get 1-on-1 guidance from expert developers</p>
                    <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                      Unlock for 100 coins
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StructuredCurriculum;
