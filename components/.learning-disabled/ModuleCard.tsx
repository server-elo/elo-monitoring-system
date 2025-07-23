/**;
* @fileoverview Module card component for displaying course modules
* @module components/learning/ModuleCard
*/
'use client';
import { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Module, ModuleStatus } from '@/types/learning';
import { cn } from '@/lib/utils';
import {
  Clock,
  Book,
  Trophy,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
interface ModuleCardProps {
  /** The module to display */
  module: Module;
  /** Current status of the module */
  status: ModuleStatus;
  /** Completion percentage (0-100) */
  completionPercentage: number;
  /** Whether the module is currently selected */
  isSelected?: boolean;
  /** Callback when module is clicked */
  onClick?: () => void;
  /** Whether to show detailed view */
  detailed?: boolean;
  /** Optional CSS class name */
  className?: string;
}
/**
* Card component for displaying a learning module with progress.
*
* Shows module information, progress, and status in an attractive card format.
*
* @component
* @example
* ```tsx
* <ModuleCard
*   module={solidityBasics}
*   status={ModuleStatus.IN_PROGRESS}
*   completionPercentage={65}
*   onClick={handleModuleSelect}
* />
* ```
*/
export function ModuleCard({
  module,
  status,
  completionPercentage,
  isSelected = false,
  onClick,
  detailed = false,
  className
}: ModuleCardProps): ReactElement {
  const isAccessible = status !== ModuleStatus.LOCKED;
  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case ModuleStatus.COMPLETED:
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case ModuleStatus.IN_PROGRESS:
      return <Sparkles className="w-5 h-5 text-yellow-500" />;
      case ModuleStatus.LOCKED:
      return <Lock className="w-5 h-5 text-gray-400" />;
      default:
      return null;
    }
  };
  // Get difficulty color
  const getDifficultyColor = () => {
    switch (module.difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'expert':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };
  return (
    <motion.div
    whileHover={isAccessible ? { scale: 1.02 } : {}}
    whileTap={isAccessible ? { scale: 0.98 } : {}}
    className={className}><Card
    className={cn(
      'cursor-pointer transition-all duration-200',
      isAccessible ? 'hover:shadow-lg' : 'opacity-60 cursor-not-allowed',
      isSelected && 'ring-2 ring-primary',
      status === ModuleStatus.IN_PROGRESS && 'border-yellow-500/50'
    )}
    onClick={isAccessible ? onClick : undefined}
    style={{
      background: `linear-gradient(135deg, ${module.color}10 0%, transparent 100%)`
    }}><CardHeader>
    <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
    <div
    className="text-4xl p-3 rounded-xl"
    style={{ backgroundColor: `${module.color}20` }}>{module.icon}
    </div>
    <div>
    <CardTitle className="text-xl flex items-center gap-2">
    {module.title}
    {getStatusIcon()}
    </CardTitle>
    <CardDescription className="mt-1">
    {module.description}
    </CardDescription>
    </div>
    </div>
    </div>
    </CardHeader>
    <CardContent className="space-y-4">
    {/* Progress Bar */}
    {status = ModuleStatus.IN_PROGRESS && (
      <div>
      <div className="flex justify-between text-sm mb-2">
      <span className="text-muted-foreground">Progress</span>
      <span className="font-medium">{completionPercentage}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      </div>
    )}
    {/* Module Stats */}
    <div className="grid grid-cols-3 gap-2">
    <div className="flex items-center gap-1.5 text-sm">
    <Clock className="w-4 h-4 text-muted-foreground" />
    <span>{module.estimatedHours}h</span>
    </div>
    <div className="flex items-center gap-1.5 text-sm">
    <Book className="w-4 h-4 text-muted-foreground" />
    <span>{module.lessons.length} lessons</span>
    </div>
    <Badge
    variant="secondary"
    className={cn('justify-center', getDifficultyColor())}>{module.difficulty}
    </Badge>
    </div>
    {/* Tags */}
    {detailed && module.tags.length>0 && (
      <div className="flex flex-wrap gap-1.5">
      {module.tags.map(tag => (
        <Badge key={tag} variant="outline" className="text-xs">
        {tag}
        </Badge>
      ))}
      </div>
    )}
    {/* Certificate Badge */}
    {module.certificate && status === ModuleStatus.COMPLETED && (
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
      <Trophy className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium">Certificate Earned!</span>
      </div>
    )}
    {/* Prerequisites */}
    {detailed && module.prerequisites.length>0 && status === ModuleStatus.LOCKED && (
      <div className="p-3 bg-muted/50 rounded-lg">
      <p className="text-sm text-muted-foreground mb-1">Prerequisites:</p>
      <p className="text-sm">Complete required modules first</p>
      </div>
    )}
    </CardContent>
    <CardFooter>
    <Button
    variant={status = ModuleStatus.IN_PROGRESS ? 'default' : 'secondary'}
    className="w-full"
    disabled={!isAccessible}>{status = ModuleStatus.COMPLETED && 'Review Module'}
    {status = ModuleStatus.IN_PROGRESS && 'Continue Learning'}
    {status = ModuleStatus.AVAILABLE && 'Start Module'}
    {status = ModuleStatus.LOCKED && 'Locked'}
    {isAccessible && <ArrowRight className="w-4 h-4 ml-2" />}
    </Button>
    </CardFooter>
    </Card>
    </motion.div>
  );
}
