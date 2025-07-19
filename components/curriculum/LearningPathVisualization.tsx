'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  Lock, 
  Play,
  ChevronRight,
  MapPin,
  Flag,
  Star,
  Trophy,
  Clock,
  Zap
} from 'lucide-react';
import { Module, LearningPath, UserCurriculumProgress } from '@/lib/curriculum/types';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { cn } from '@/lib/utils';

interface LearningPathVisualizationProps {
  learningPath: LearningPath;
  modules: Module[];
  userProgress: UserCurriculumProgress;
  onModuleClick: (module: Module) => void;
  checkPrerequisites: (moduleId: string) => boolean;
  className?: string;
}

export function LearningPathVisualization({
  learningPath,
  modules,
  userProgress,
  onModuleClick,
  checkPrerequisites,
  className
}: LearningPathVisualizationProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Calculate path progress
  const pathProgress = React.useMemo(() => {
    const totalModules = modules.length;
    const completedModules = modules.filter(module => 
      userProgress.modules[module.id]?.status === 'completed'
    ).length;
    
    const totalXP = modules.reduce((sum, module) => sum + module.totalXPReward, 0);
    const earnedXP = modules.reduce((sum, module) => 
      sum + (userProgress.modules[module.id]?.totalXPEarned || 0), 0
    );

    const totalTime = modules.reduce((sum, module) => sum + module.estimatedDuration, 0);
    const spentTime = modules.reduce((sum, module) => 
      sum + ((userProgress.modules[module.id]?.timeSpent || 0) / 60), 0
    );

    return {
      completion: totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      completedModules,
      totalModules,
      earnedXP,
      totalXP,
      spentTime: Math.round(spentTime),
      totalTime: Math.round(totalTime)
    };
  }, [modules, userProgress]);

  const getModuleStatus = (module: Module) => {
    const progress = userProgress.modules[module.id];
    const isUnlocked = checkPrerequisites(module.id);
    
    if (!isUnlocked) return 'locked';
    if (!progress) return 'available';
    return progress.status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
        return Play;
      case 'locked':
        return Lock;
      default:
        return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'in_progress':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'locked':
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
      default:
        return 'text-white bg-white/10 border-white/20';
    }
  };

  const PathHeader = () => (
    <GlassCard className="p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-blue-400" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{learningPath.title}</h1>
            <p className="text-gray-300 mb-3">{learningPath.description}</p>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-400">Difficulty:</span>
                <span className="text-white capitalize">{learningPath.difficulty}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{learningPath.estimatedDuration}h</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span className="text-gray-400">Modules:</span>
                <span className="text-white">{modules.length}</span>
              </div>
            </div>
          </div>
        </div>

        {learningPath.isRecommended && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-full px-3 py-1">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300 font-medium">Recommended</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-300">Path Progress</span>
          <span className="text-sm text-gray-300 font-mono">
            {pathProgress.completedModules}/{pathProgress.totalModules} modules
          </span>
        </div>
        
        <ProgressBar
          progress={pathProgress.completion}
          color="blue"
          size="lg"
          animated={true}
          glowEffect={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-black/20 rounded-lg">
            <div className="text-lg font-bold text-blue-400">{Math.round(pathProgress.completion)}%</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          
          <div className="text-center p-3 bg-black/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-400">{pathProgress.earnedXP}/{pathProgress.totalXP}</div>
            <div className="text-xs text-gray-400">XP Earned</div>
          </div>
          
          <div className="text-center p-3 bg-black/20 rounded-lg">
            <div className="text-lg font-bold text-purple-400">{pathProgress.spentTime}h/{pathProgress.totalTime}h</div>
            <div className="text-xs text-gray-400">Time Spent</div>
          </div>
        </div>
      </div>
    </GlassCard>
  );

  const ModuleNode = ({ module, index }: { module: Module; index: number }) => {
    const status = getModuleStatus(module);
    const progress = userProgress.modules[module.id];
    const StatusIcon = getStatusIcon(status);
    const isExpanded = expandedModule === module.id;
    const isLast = index === modules.length - 1;

    return (
      <div className="relative">
        {/* Connection Line */}
        {!isLast && (
          <div className="absolute left-6 top-16 w-0.5 h-16 bg-gradient-to-b from-blue-500/50 to-transparent" />
        )}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="relative"
        >
          <GlassCard
            className={cn(
              'p-4 cursor-pointer transition-all duration-300 relative overflow-hidden',
              status === 'locked' ? 'opacity-60' : 'hover:shadow-lg',
              isExpanded && 'ring-2 ring-blue-500/50'
            )}
            onClick={() => {
              if (status !== 'locked') {
                setExpandedModule(isExpanded ? null : module.id);
              }
            }}
          >
            <div className="flex items-start space-x-4">
              {/* Status Icon */}
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                getStatusColor(status),
                status === 'completed' && 'animate-pulse'
              )}>
                <StatusIcon className="w-6 h-6" />
              </div>

              {/* Module Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={cn(
                      'text-lg font-semibold mb-1',
                      status === 'locked' ? 'text-gray-400' : 'text-white'
                    )}>
                      {module.title}
                    </h3>
                    
                    <p className={cn(
                      'text-sm mb-3 line-clamp-2',
                      status === 'locked' ? 'text-gray-500' : 'text-gray-300'
                    )}>
                      {module.description}
                    </p>

                    {/* Module Stats */}
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{module.estimatedDuration}h</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>{module.lessons.length} lessons</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-300">{module.totalXPReward} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="flex flex-col items-end space-y-2">
                    {progress && progress.progress > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">
                          {Math.round(progress.progress)}%
                        </div>
                        <div className="w-16">
                          <ProgressBar
                            progress={progress.progress}
                            color={status === 'completed' ? 'green' : 'blue'}
                            size="sm"
                            showPercentage={false}
                          />
                        </div>
                      </div>
                    )}

                    {status !== 'locked' && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Progress Bar for In Progress */}
                {status === 'in_progress' && progress && (
                  <div className="mt-3">
                    <ProgressBar
                      progress={progress.progress}
                      color="blue"
                      size="sm"
                      animated={true}
                      showPercentage={false}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/10 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Lessons List */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Lessons</h4>
                        <div className="space-y-2">
                          {module.lessons.slice(0, 3).map((lesson) => {
                            const lessonProgress = userProgress.lessons[lesson.id];
                            const lessonStatus = lessonProgress?.status || 'available';
                            
                            return (
                              <div key={lesson.id} className="flex items-center space-x-2 text-sm">
                                <div className={cn(
                                  'w-4 h-4 rounded-full flex items-center justify-center',
                                  lessonStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                                  lessonStatus === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-gray-500/20 text-gray-400'
                                )}>
                                  {lessonStatus === 'completed' ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <Circle className="w-2 h-2 fill-current" />
                                  )}
                                </div>
                                <span className={cn(
                                  'flex-1 truncate',
                                  lessonStatus === 'completed' ? 'text-green-300' : 'text-gray-300'
                                )}>
                                  {lesson.title}
                                </span>
                              </div>
                            );
                          })}
                          
                          {module.lessons.length > 3 && (
                            <div className="text-xs text-gray-400 pl-6">
                              +{module.lessons.length - 3} more lessons
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Module Actions */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Actions</h4>
                        <div className="space-y-2">
                          <EnhancedButton
                            onClick={(e) => {
                              e.stopPropagation();
                              onModuleClick(module);
                            }}
                            className={cn(
                              'w-full text-sm',
                              status === 'completed' 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : status === 'in_progress'
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                            )}
                            disabled={status === 'locked'}
                            touchTarget
                          >
                            {status === 'completed' ? 'Review Module' :
                             status === 'in_progress' ? 'Continue Learning' :
                             'Start Module'}
                          </EnhancedButton>

                          {progress && progress.completedAt && (
                            <div className="text-xs text-green-400 text-center">
                              Completed {progress.completedAt.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Module Order Badge */}
            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-300">{index + 1}</span>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      <PathHeader />

      {/* Learning Path Visualization */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Flag className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Learning Journey</h2>
        </div>

        <div className="space-y-6">
          {modules.map((module, index) => (
            <ModuleNode key={module.id} module={module} index={index} />
          ))}
        </div>

        {/* Completion Celebration */}
        {pathProgress.completion >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <GlassCard className="p-8 bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/30">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
              <p className="text-gray-300 mb-4">You've completed the {learningPath.title} learning path!</p>
              
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">{pathProgress.totalXP}</div>
                  <div className="text-gray-400">Total XP Earned</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{pathProgress.totalTime}h</div>
                  <div className="text-gray-400">Time Invested</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">{pathProgress.totalModules}</div>
                  <div className="text-gray-400">Modules Mastered</div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
