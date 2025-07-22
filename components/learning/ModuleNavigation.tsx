/**;
* @fileoverview Module navigation component for lesson progression
* @module components/learning/ModuleNavigation
*/
'use client';
import { ReactElement, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Module, Lesson, LessonProgress, ModuleProgress } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Book,
  Code,
  FileText,
  Lightbulb,
  PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
interface ModuleNavigationProps {
  /** Current module being viewed */
  module: Module;
  /** Current lesson being viewed */
  currentLesson?: Lesson;
  /** Module progress */
  moduleProgress?: ModuleProgress;
  /** Map of lesson progress */
  lessonProgress: Map<string, LessonProgress>;
  /** Callback when a lesson is selected */
  onLessonSelect: (lesson: Lesson) => void;
  /** Whether navigation is collapsible */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Optional CSS class name */
  className?: string;
}
/**
* Navigation sidebar for module lessons with progress tracking.
*
* Displays all lessons in a module with visual progress indicators
* and allows navigation between lessons.
*
* @component
* @example
* ```tsx
* <ModuleNavigation
*   module={currentModule}
*   currentLesson={selectedLesson}
*   moduleProgress={userModuleProgress}
*   lessonProgress={lessonProgressMap}
*   onLessonSelect={handleLessonSelect}
*   collapsible
* />
* ```
*/
export function ModuleNavigation({
  module,
  currentLesson,
  moduleProgress,
  lessonProgress,
  onLessonSelect,
  collapsible = false,
  defaultCollapsed = false,
  className
}: ModuleNavigationProps): ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // Calculate module completion percentage
  const completionPercentage = useMemo(() => {
    if (!module.lessons.length) return 0;
    const completedLessons = module.lessons.filter(
      lesson => lessonProgress.get(lesson.id)?.completed
    ).length;
    return Math.round((completedLessons / module.lessons.length) * 100);
  }, [module.lessons, lessonProgress]);
  // Get lesson status
  const getLessonStatus = (lesson: Lesson) => {
    const progress = lessonProgress.get(lesson.id);
    if (progress?.completed) return 'completed';
    if (progress?.startedAt) return 'in_progress';
    // Check if prerequisites are met
    if (lesson.prerequisites.length>0) {
      const allPrerequisitesMet = lesson.prerequisites.every(
        prereqId => lessonProgress.get(prereqId)?.completed
      );
      if (!allPrerequisitesMet) return 'locked';
    }
    return 'available';
  };
  // Get lesson icon based on type
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'theory':
        return Book;
      case 'practical':
      case 'exercise':
        return Code;
      case 'project':
        return FileText;
      case 'quiz':
        return Lightbulb;
      default:
        return Book;
    }
  };
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };
  return (
    <div className={cn(
      'flex flex-col h-full border-r bg-background transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-80',
      className
    )}>
    {/* Module Header */}
    <div className="p-4 border-b">
    <div className="flex items-center justify-between">
    <AnimatePresence mode="wait">
    {!isCollapsed && (
      <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="flex-1"><div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">{module.icon}</span>
      <h3 className="font-semibold text-lg truncate">{module.title}</h3>
      </div>
      <Progress value={completionPercentage} className="h-2 mb-2" />
      <p className="text-sm text-muted-foreground">
      {completionPercentage}% Complete
      </p>
      </motion.div>
    )}
    </AnimatePresence>
    {collapsible && (
      <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="ml-auto"><ChevronRight className={cn(
        "w-4 h-4 transition-transform",
        !isCollapsed && "rotate-180"
      )} />
      </Button>
    )}
    </div>
    </div>
    {/* Lessons List */}
    <ScrollArea className="flex-1">
    <div className="p-2">
    {module.lessons.map((lesson, index) => {
      const status = getLessonStatus(lesson);
      const LessonIcon = getLessonIcon(lesson.type);
      const isActive = currentLesson?.id === lesson.id;
      const isAccessible = status !== 'locked';
      const progress = lessonProgress.get(lesson.id);
      return (
        <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}><Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start mb-1 relative',
          !isAccessible && 'opacity-50 cursor-not-allowed',
          isActive && 'bg-secondary'
        )}
        onClick={() => isAccessible && onLessonSelect(lesson)}
        disabled={!isAccessible}>{/* Connection Line */}
        {index>0 && (
          <div className={cn(
            'absolute -top-1 left-6 w-0.5 h-3',
            status = 'completed' ? 'bg-green-500' : 'bg-gray-300'
          )} />
        )}
        <div className="flex items-center gap-3 w-full">
        {/* Status Icon */}
        <div className="flex-shrink-0">
        {getStatusIcon(status)}
        </div>
        {/* Lesson Content */}
        <AnimatePresence mode="wait">
        {!isCollapsed ? (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex-1 text-left"><div className="flex items-center gap-2 mb-1">
          <LessonIcon className="w-3 h-3" />
          <span className="font-medium text-sm truncate">
          {lesson.title}
          </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{lesson.duration} min</span>
          {lesson.exercises.length>0 && (
            <>
            <span>•</span>
            <span>{lesson.exercises.length} exercises</span>
            </>
          )}
          {progress?.score && (
            <>
            <span>•</span>
            <span>{progress.score}%</span>
            </>
          )}
          </div>
          </motion.div>
        ) : (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}><LessonIcon className="w-4 h-4" />
          </motion.div>
        )}
        </AnimatePresence>
        {/* Active Indicator */}
        {isActive && !isCollapsed && (
          <PlayCircle className="w-4 h-4 text-primary ml-auto" />
        )}
        </div>
        </Button>
        </motion.div>
      );
    })}
    </div>
    </ScrollArea>
    {/* Module Stats */}
    {!isCollapsed && (
      <div className="p-4 border-t">
      <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
      <p className="text-muted-foreground">Total Time</p>
      <p className="font-medium">{module.estimatedHours}h</p>
      </div>
      <div>
      <p className="text-muted-foreground">Difficulty</p>
      <Badge variant="outline" className="mt-1">
      {module.difficulty}
      </Badge>
      </div>
      </div>
      {moduleProgress?.completedAt && (
        <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
        <p className="text-xs text-green-600 dark:text-green-400">
        Completed on {new Date(moduleProgress.completedAt).toLocaleDateString()}
        </p>
        </div>
      )}
      </div>
    )}
    </div>
  );
}
