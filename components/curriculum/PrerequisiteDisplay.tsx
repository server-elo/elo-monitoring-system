'use client';

;
import { motion } from 'framer-motion';
import { 
  Lock, 
  CheckCircle, 
  BookOpen, 
  Target, 
  Trophy, 
  Star,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Prerequisite } from '@/lib/curriculum/types';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { ProgressBar } from '@/components/xp/ProgressBar';
import { cn } from '@/lib/utils';

interface PrerequisiteDisplayProps {
  prerequisites: Prerequisite[];
  unmetPrerequisites: Prerequisite[];
  onNavigateToPrerequisite?: (prerequisite: Prerequisite) => void;
  className?: string;
  compact?: boolean;
}

export function PrerequisiteDisplay({
  prerequisites,
  unmetPrerequisites,
  onNavigateToPrerequisite,
  className,
  compact = false
}: PrerequisiteDisplayProps) {
  if (prerequisites.length === 0) {
    return null;
  }

  const getPrerequisiteIcon = (type: Prerequisite['type']) => {
    switch (type) {
      case 'lesson':
        return BookOpen;
      case 'module':
        return BookOpen;
      case 'quiz_score':
        return Target;
      case 'project':
        return Star;
      case 'achievement':
        return Trophy;
      default:
        return BookOpen;
    }
  };

  const getPrerequisiteColor = (type: Prerequisite['type'], isMet: boolean) => {
    if (isMet) {
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    }

    switch (type) {
      case 'lesson':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'module':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'quiz_score':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'project':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'achievement':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatRequirement = (prerequisite: Prerequisite) => {
    switch (prerequisite.type) {
      case 'quiz_score':
        return `Score ${prerequisite.requirement || 70}% or higher`;
      case 'lesson':
        return 'Complete this lesson';
      case 'module':
        return 'Complete this module';
      case 'project':
        return 'Submit this project';
      case 'achievement':
        return 'Unlock this achievement';
      default:
        return 'Complete this requirement';
    }
  };

  if (compact) {
    return (
      <div className={cn('space-y-2', className)}>
        {unmetPrerequisites.length > 0 && (
          <div className="flex items-center space-x-2 text-sm">
            <Lock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 font-medium">
              {unmetPrerequisites.length} prerequisite{unmetPrerequisites.length > 1 ? 's' : ''} required
            </span>
          </div>
        )}
        
        <div className="space-y-1">
          {prerequisites.slice(0, 3).map((prereq) => {
            const isMet = !unmetPrerequisites.some(unmet => unmet.id === prereq.id);
            const Icon = getPrerequisiteIcon(prereq.type);
            
            return (
              <div
                key={prereq.id}
                className="flex items-center space-x-2 text-xs"
              >
                <Icon className={cn(
                  'w-3 h-3',
                  isMet ? 'text-green-400' : 'text-gray-400'
                )} />
                <span className={cn(
                  'flex-1 truncate',
                  isMet ? 'text-green-300 line-through' : 'text-gray-300'
                )}>
                  {prereq.name}
                </span>
                {isMet ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            );
          })}
          
          {prerequisites.length > 3 && (
            <div className="text-xs text-gray-400 pl-5">
              +{prerequisites.length - 3} more requirements
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Prerequisites</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {prerequisites.length - unmetPrerequisites.length}/{prerequisites.length} completed
          </span>
          <div className="w-16">
            <ProgressBar
              progress={((prerequisites.length - unmetPrerequisites.length) / prerequisites.length) * 100}
              color={unmetPrerequisites.length === 0 ? 'green' : 'yellow'}
              size="sm"
              showPercentage={false}
            />
          </div>
        </div>
      </div>

      {/* Prerequisites List */}
      <div className="space-y-3">
        {prerequisites.map((prerequisite, index) => {
          const isMet = !unmetPrerequisites.some(unmet => unmet.id === prerequisite.id);
          const Icon = getPrerequisiteIcon(prerequisite.type);
          const colorClasses = getPrerequisiteColor(prerequisite.type, isMet);

          return (
            <motion.div
              key={prerequisite.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <GlassCard
                className={cn(
                  'p-4 border transition-all duration-300',
                  isMet 
                    ? 'border-green-500/30 bg-green-500/10' 
                    : 'border-yellow-500/30 bg-yellow-500/10',
                  onNavigateToPrerequisite && !isMet && 'cursor-pointer hover:shadow-md'
                )}
                onClick={!isMet && onNavigateToPrerequisite ? () => onNavigateToPrerequisite(prerequisite) : undefined}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center border',
                    colorClasses
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={cn(
                          'font-medium mb-1',
                          isMet ? 'text-green-300' : 'text-white'
                        )}>
                          {prerequisite.name}
                        </h4>
                        
                        <p className={cn(
                          'text-sm mb-2',
                          isMet ? 'text-green-400' : 'text-gray-300'
                        )}>
                          {formatRequirement(prerequisite)}
                        </p>

                        {prerequisite.description && (
                          <p className="text-xs text-gray-400 mb-2">
                            {prerequisite.description}
                          </p>
                        )}

                        {/* Type Badge */}
                        <div className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                          colorClasses
                        )}>
                          {prerequisite.type.replace('_', ' ')}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col items-end space-y-2">
                        {isMet ? (
                          <div className="flex items-center space-x-1 text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Required</span>
                          </div>
                        )}

                        {/* Navigate Button */}
                        {!isMet && onNavigateToPrerequisite && (
                          <EnhancedButton
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToPrerequisite(prerequisite);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 p-1"
                            touchTarget
                          >
                            <ChevronRight className="w-4 h-4" />
                          </EnhancedButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {unmetPrerequisites.length > 0 ? (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-300">Content Locked</span>
          </div>
          <p className="text-sm text-yellow-200">
            Complete {unmetPrerequisites.length} more prerequisite{unmetPrerequisites.length > 1 ? 's' : ''} to unlock this content.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">All Prerequisites Met</span>
          </div>
          <p className="text-sm text-green-200">
            You can now access this content. Great job completing all requirements!
          </p>
        </div>
      )}
    </div>
  );
}
