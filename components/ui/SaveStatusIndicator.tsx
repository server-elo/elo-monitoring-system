'use client';

;
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { SaveStatus } from '@/lib/storage/CodePersistence';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  isAutoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  className?: string;
  compact?: boolean;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  hasUnsavedChanges = false,
  isAutoSaveEnabled = true,
  onToggleAutoSave,
  className,
  compact = false
}: SaveStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status.status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-400/30'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-400/30'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-400/30'
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: Clock,
            text: 'Unsaved changes',
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/10',
            borderColor: 'border-yellow-400/30'
          };
        }
        return {
          icon: Save,
          text: 'Up to date',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-400/30'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <motion.div
        className={cn(
          'flex items-center space-x-2 px-3 py-1.5 rounded-lg',
          'backdrop-blur-md border',
          config.bgColor,
          config.borderColor,
          className
        )}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Icon 
          className={cn(
            'w-4 h-4',
            config.color,
            status.status === 'saving' && 'animate-spin'
          )} 
        />
        <span className={cn('text-sm font-medium', config.color)}>
          {config.text}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg',
        'backdrop-blur-md border',
        config.bgColor,
        config.borderColor,
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        <div className={cn(
          'p-2 rounded-full',
          config.bgColor,
          'border',
          config.borderColor
        )}>
          <Icon 
            className={cn(
              'w-5 h-5',
              config.color,
              status.status === 'saving' && 'animate-spin'
            )} 
          />
        </div>
        
        <div>
          <div className={cn('font-medium', config.color)}>
            {config.text}
          </div>
          
          <AnimatePresence mode="wait">
            {status.status === 'error' && status.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-300 mt-1"
              >
                {status.error}
              </motion.div>
            )}
            
            {lastSaved && status.status !== 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-400 mt-1"
              >
                Last saved: {formatLastSaved(lastSaved)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Auto-save toggle */}
        {onToggleAutoSave && (
          <motion.button
            onClick={onToggleAutoSave}
            className={cn(
              'flex items-center space-x-2 px-3 py-1.5 rounded-lg',
              'backdrop-blur-md border transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isAutoSaveEnabled
                ? 'bg-green-500/10 border-green-400/30 text-green-400'
                : 'bg-gray-500/10 border-gray-400/30 text-gray-400'
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAutoSaveEnabled ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              Auto-save {isAutoSaveEnabled ? 'ON' : 'OFF'}
            </span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// Floating save status indicator for minimal UI
export function FloatingSaveStatus({
  status,
  lastSaved: _lastSaved,
  hasUnsavedChanges,
  className
}: Pick<SaveStatusIndicatorProps, 'status' | 'lastSaved' | 'hasUnsavedChanges' | 'className'>) {
  const config = (() => {
    switch (status.status) {
      case 'saving':
        return {
          icon: Loader2,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          color: 'text-green-400',
          bgColor: 'bg-green-500/20'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/20'
        };
      default:
        if (hasUnsavedChanges) {
          return {
            icon: Clock,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-500/20'
          };
        }
        return null; // Don't show when idle and no changes
    }
  })();

  if (!config) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'flex items-center space-x-2 px-4 py-2 rounded-full',
          'backdrop-blur-md border border-white/20',
          config.bgColor,
          'shadow-lg',
          className
        )}
      >
        <Icon 
          className={cn(
            'w-4 h-4',
            config.color,
            status.status === 'saving' && 'animate-spin'
          )} 
        />
        <span className={cn('text-sm font-medium', config.color)}>
          {status.status === 'saving' && 'Saving...'}
          {status.status === 'saved' && 'Saved'}
          {status.status === 'error' && 'Save failed'}
          {status.status === 'idle' && hasUnsavedChanges && 'Unsaved changes'}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

// Progress indicator for save operations
export function SaveProgressIndicator({
  isVisible,
  progress = 0,
  className
}: {
  isVisible: boolean;
  progress?: number;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-50',
            'h-1 bg-gradient-to-r from-blue-500 to-green-500',
            'origin-left',
            className
          )}
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      )}
    </AnimatePresence>
  );
}
