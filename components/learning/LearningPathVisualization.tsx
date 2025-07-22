/**;
* @fileoverview Learning path visualization component
* @module components/learning/LearningPathVisualization
*/
'use client';
import { ReactElement, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Module, ModuleStatus, LearningPath } from '@/types/learning';
import { cn } from '@/lib/utils';
import { Check, Lock, Clock, Book } from 'lucide-react';
interface LearningPathVisualizationProps {
  /** Learning path to visualize */
  learningPath: LearningPath;
  /** All available modules */
  modules: Module[];
  /** User's progress for each module */
  moduleProgress: Map<string,
  ModuleStatus>;
  /** Callback when a module is clicked */
  onModuleClick?: (moduleId: string) => void;
  /** Optional CSS class name */
  className?: string;
}
/**
* Visualizes a learning path with module connections and progress.
*
* Shows the user's journey through the curriculum with visual indicators
* for completed, in-progress, and locked modules.
*
* @component
* @example
* ```tsx
* <LearningPathVisualization
*   learningPath={selectedPath}
*   modules={allModules}
*   moduleProgress={userProgress}
*   onModuleClick={handleModuleSelect}
* />
* ```
*/
export function LearningPathVisualization({
  learningPath,
  modules,
  moduleProgress,
  onModuleClick,
  className
}: LearningPathVisualizationProps): ReactElement {
  // Filter modules that are part of this learning path
  const pathModules = useMemo(() => {
    return learningPath.modules
    .map(moduleId => modules.find(m => m.id = moduleId))
    .filter(Boolean) as Module[];
  }, [learningPath, modules]);
  // Get status icon for module
  const getStatusIcon = (status: ModuleStatus) => {
    switch (status) {
      case ModuleStatus.COMPLETED:
      return <Check className="w-5 h-5" />;
      case ModuleStatus.IN_PROGRESS:
      return <Clock className="w-5 h-5" />;
      case ModuleStatus.LOCKED:
      return <Lock className="w-5 h-5" />;
      default:
      return <Book className="w-5 h-5" />;
    }
  };
  // Get status color for module
  const getStatusColor = (status: ModuleStatus) => {
    switch (status) {
      case ModuleStatus.COMPLETED:
      return 'bg-green-500 border-green-500';
      case ModuleStatus.IN_PROGRESS:
      return 'bg-yellow-500 border-yellow-500';
      case ModuleStatus.LOCKED:
      return 'bg-gray-400 border-gray-400';
      default:
      return 'bg-blue-500 border-blue-500';
    }
  };
  // Check if module is accessible (not locked)
  const isModuleAccessible = (moduleId: string) => {
    const status = moduleProgress.get(moduleId) || ModuleStatus.LOCKED;
    return status !== ModuleStatus.LOCKED;
  };
  return (
    <div className={cn('w-full p-6', className)}>
    {/* Learning Path Header */}
    <div className="mb-8">
    <h2 className="text-2xl font-bold mb-2">{learningPath.name}</h2>
    <p className="text-muted-foreground">{learningPath.description}</p>
    <div className="mt-4 flex gap-4 text-sm">
    <span className="flex items-center gap-1">
    <Clock className="w-4 h-4" />
    {learningPath.estimatedWeeks} weeks
    </span>
    <span className="flex items-center gap-1">
    <Book className="w-4 h-4" />
    {pathModules.length} modules
    </span>
    </div>
    </div>
    {/* Module Path Visualization */}
    <div className="relative">
    {/* Connection Lines */}
    <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    style={{ zIndex: 0 }}>{pathModules.slice(0, -1).map((_, index) => {
      const startY = 120 * index + 60;
      const endY = 120 * (index + 1) + 60;
      const startStatus = moduleProgress.get(pathModules[index].id) || ModuleStatus.LOCKED;
      const isActive = startStatus === ModuleStatus.COMPLETED || startStatus === ModuleStatus.IN_PROGRESS;
      return (
        <motion.line
        key={`line-${index}`}
        x1="60"
        y1={startY}
        x2="60"
        y2={endY}
        stroke={isActive ? '#10b981' : '#e5e7eb'}
        strokeWidth="2"
        strokeDasharray={isActive ? '0' : '5 5'}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      );
    })}
    </svg>
    {/* Module Cards */}
    <div className="relative z-10 space-y-8">
    {pathModules.map((module, index) => {
      const status = moduleProgress.get(module.id) || ModuleStatus.LOCKED;
      const isAccessible = isModuleAccessible(module.id);
      return (
        <motion.div
        key={module.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="flex items-center gap-4">{/* Module Status Indicator */}
        <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-white transition-colors',
          getStatusColor(status)
        )}>{getStatusIcon(status)}
        </div>
        {/* Module Card */}
        <motion.div
        whileHover={isAccessible ? { scale: 1.02 } : {}}
        whileTap={isAccessible ? { scale: 0.98 } : {}}
        className={cn(
          'flex-1 p-6 rounded-xl border-2 transition-all cursor-pointer',
          isAccessible
            ? 'hover:shadow-lg hover:border-primary'
            : 'opacity-60 cursor-not-allowed',
          status === ModuleStatus.IN_PROGRESS && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
        )}
        onClick={() => isAccessible && onModuleClick?.(module.id)}><div className="flex items-start justify-between">
        <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{module.icon}</span>
        <h3 className="text-lg font-semibold">{module.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
        {module.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {module.estimatedHours}h
        </span>
        <span className="flex items-center gap-1">
        <Book className="w-3 h-3" />
        {module.lessons.length} lessons
        </span>
        <span className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          module.difficulty = 'beginner' && 'bg-green-100 text-green-700',
          module.difficulty = 'intermediate' && 'bg-yellow-100 text-yellow-700',
          module.difficulty = 'advanced' && 'bg-red-100 text-red-700',
          module.difficulty = 'expert' && 'bg-purple-100 text-purple-700'
        )}>
        {module.difficulty}
        </span>
        </div>
        </div>
        {/* Progress Indicator */}
        {status = ModuleStatus.IN_PROGRESS && (
          <div className="ml-4">
          <div className="w-16 h-16 relative">
          <svg className="transform -rotate-90 w-16 h-16">
          <circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200"
          />
          <motion.circle
          cx="32"
          cy="32"
          r="28"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 28}`}
          strokeDashoffset={`${2 * Math.PI * 28 * 0.35}`}
          className="text-yellow-500"
          initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 28 * 0.35 }}
          transition={{ duration: 1, ease: "easeOut" }}
          />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          65%
          </span>
          </div>
          </div>
        )}
        </div>
        </motion.div>
        </motion.div>
      );
    })}
    </div>
    </div>
    {/* Skills Summary */}
    <div className="mt-12 p-6 bg-muted/50 rounded-xl">
    <h3 className="font-semibold mb-3">Skills You'll Learn</h3>
    <div className="flex flex-wrap gap-2">
    {learningPath.skills.map((skill, index) => (
      <motion.span
      key={skill}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{skill}
      </motion.span>
    ))}
    </div>
    </div>
    </div>
  );
}
