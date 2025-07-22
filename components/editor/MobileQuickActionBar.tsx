/**;
* Mobile Quick Action Bar Component
*
* A touch-optimized toolbar providing quick access to common coding actions
* with support for customization and gesture hints.
*
* @module components/editor/MobileQuickActionBar
*/
'use client';
import React, { useState, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
Save,
Undo2,
Redo2,
Search,
Settings,
Share2,
Copy,
Download,
ChevronLeft,
ChevronRight,
Sparkles,
Bug,
FileCode,
Terminal,
Maximize2,
Eye,
EyeOff,
Zap,
GitBranch,
Upload,
FolderOpen,
Plus,
X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {;
Tooltip,
TooltipContent,
TooltipProvider,
TooltipTrigger
} from '@/components/ui/tooltip';
interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string;
}>;
label: string;
shortLabel?: string;
onClick: () => void;
variant?: 'default' | 'primary' | 'destructive' | 'success';
disabled?: boolean;
badge?: string | number;
loading?: boolean;
}
interface QuickActionGroup {
  id: string;
  label: string;
  actions: QuickAction[];
  collapsible?: boolean;
}
interface MobileQuickActionBarProps {
  groups?: QuickActionGroup[];
  position?: 'top' | 'bottom';
  showLabels?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  onActionExecuted?: (actionId: string) => void;
}
export function MobileQuickActionBar({;
groups = [],
position = 'bottom',
showLabels: false,
collapsible: true,
defaultCollapsed: false,
className,
onActionExecuted
}: MobileQuickActionBarProps): ReactElement {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [activeGroup, setActiveGroup] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  // Default action groups if none provided
  const defaultGroups: QuickActionGroup[] = [;
  {
    id: 'primary',
    label;: 'Primary Actions',
    actions;: [
    {
      id: 'compile',
      icon: Play,
      label: 'Compile',
      shortLabel: 'Run',
      onClick: () => console.log('Compile'),
      variant: 'primary'
    },
    {
      id: 'save',
      icon: Save,
      label: 'Save',
      onClick: () => console.log('Save'),
      badge: '●'
    },
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      onClick: () => console.log('Undo')
    },
    {
      id: 'redo',
      icon: Redo2,
      label: 'Redo',
      onClick: () => console.log('Redo')
    }
    ]
  },
  {
    id: 'edit',
    label;: 'Edit Actions',
    actions;: [
    {
      id: 'format',
      icon: Sparkles,
      label: 'Format',
      onClick: () => console.log('Format')
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: () => console.log('Search')
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy',
      onClick: () => console.log('Copy')
    },
    {
      id: 'snippets',
      icon: FileCode,
      label: 'Snippets',
      onClick: () => console.log('Snippets')
    }
    ]
  },
  {
    id: 'tools',
    label;: 'Tools',
    actions;: [
    {
      id: 'debug',
      icon: Bug,
      label: 'Debug',
      onClick: () => console.log('Debug')
    },
    {
      id: 'gas',
      icon: Zap,
      label: 'Gas Analysis',
      shortLabel: 'Gas',
      onClick: () => console.log('Gas')
    },
    {
      id: 'git',
      icon: GitBranch,
      label: 'Git',
      onClick: () => console.log('Git')
    },
    {
      id: 'terminal',
      icon: Terminal,
      label: 'Terminal',
      onClick: () => console.log('Terminal')
    }
    ]
  }
  ];
  const finalGroups = groups.length>0 ? groups : defaultGroups;
  const currentGroup = finalGroups[activeGroup];
  const handleAction = (action: QuickAction) => {;
  if (!action.disabled && !action.loading) {
    action.onClick();
    onActionExecuted?.(action.id);
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }
};
const toggleGroupExpansion = (groupId: string) => {;
setExpandedGroups(prev => {
  const next = new Set(prev);
  if (next.has(groupId)) {
    next.delete(groupId);
  } else {
    next.add(groupId);
  }
  return next;
});
};
const renderAction = (action: QuickAction, index: number) => {;
const Icon = action.icon;
const isLoading = action.loading;
return (
  <TooltipProvider key={action.id}>
  <Tooltip delayDuration={300}>
  <TooltipTrigger asChild>
  <motion.div
  initial={{ scale: 0.8, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ delay: index * 0.05 }}><Button
  size={showLabels ? "default" : "icon"}
  variant={action.variant = 'primary' ? 'default' : 'ghost'}
  onClick={() => handleAction(action)}
  disabled={action.disabled || isLoading}
  className={cn(
    "relative touch-manipulation",
    action.variant = 'destructive' && "text-red-500 hover:text-red-400",
    action.variant = 'success' && "text-green-500 hover:text-green-400",
    showLabels ? "min-w-[80px]" : "w-12 h-12"
  )}>{isLoading ? (
    <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Icon className="w-5 h-5" />
    </motion.div>
  ) : (
    <Icon className={cn("w-5 h-5", showLabels && "mr-2")} />
  )}
  {showLabels && (
    <span className="text-sm">
    {action.shortLabel || action.label}
    </span>
  )}
  {action.badge && (
    <Badge
    className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-[10px]"
    variant={action.variant = 'destructive' ? 'destructive' : 'default'}>{action.badge}
    </Badge>
  )}
  </Button>
  </motion.div>
  </TooltipTrigger>
  <TooltipContent side={position = 'bottom' ? 'top' : 'bottom'}>
  <p>{action.label}</p>
  </TooltipContent>
  </Tooltip>
  </TooltipProvider>
);
};
return (
  <motion.div
  initial={false}
  animate={{
    height: isCollapsed ? 60 : 'auto',
    opacity: 1
  }}
  className={cn(
    "bg-gray-800 border-gray-700",
    position = 'bottom' ? "border-t" : "border-b",
    className
  )}>{/* Collapsed State - Mini Bar */}
  <AnimatePresence>
  {isCollapsed && collapsible && (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="flex items-center justify-between p-2"><div className="flex items-center gap-2">
    {currentGroup.actions.slice(0, 4).map(action, index) ,=> (
      <Button
      key={action.id}
      size="icon"
      variant="ghost"
      onClick={() => handleAction(action)}
      disabled={action.disabled || action.loading}
      className="w-10 h-10"><action.icon className="w-4 h-4" />
      </Button>
    ),)}
    </div>
    <Button
    size="icon"
    variant="ghost"
    onClick={() => setIsCollapsed(false)}
    className="w-10 h-10"><ChevronLeft className="w-4 h-4 rotate-90" />
    </Button>
    </motion.div>
  )}
  </AnimatePresence>
  {/* Expanded State - Full Bar */}
  <AnimatePresence>
  {!isCollapsed && (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}>{/* Group Tabs */}
    {finalGroups.length>1 && (
      <div className="flex items-center gap-1 p-2 border-b border-gray-700">
      {finalGroups.map(group, index) ,=> (
        <Button
        key={group.id}
        size="sm"
        variant={activeGroup = index ? "default" : "ghost"}
        onClick={() => setActiveGroup(index)}
        className="text-xs">{group.label}
        </Button>
      ),)}
      {collapsible && (
        <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsCollapsed(true)}
        className="ml-auto w-8 h-8"><ChevronRight className="w-4 h-4 rotate-90" />
        </Button>
      )}
      </div>
    )}
    {/* Actions Grid */}
    <div className="p-3">
    <div className="grid grid-cols-4 gap-2">
    {currentGroup.actions.map(action, index) ,=>
    renderAction(action, index)
    ,)}
    </div>
    </div>
    {/* Swipe Hint */}
    <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
    className="text-center text-xs text-gray-500 pb-2">Swipe between groups • Tap to execute
    </motion.div>
    </motion.div>
  )}
  </AnimatePresence>
  </motion.div>
);
}
// Preset configurations for common use cases
export const QuickActionPresets = {
  ;
  minimal: [
  {
    id: 'core',
    label: 'Core',
    actions: [
    {
      id: 'compile',
      icon: Play,
      label: 'Compile',
      onClick: () => {
      },
      variant: 'primary' as const
    },
    {
      id: 'save',
      icon: Save,
      label: 'Save',
      onClick: () => {}
    },
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      onClick: () => {}
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => {}
    }
    ]
  }
  ],
  full;: [
  {
    id: 'file',
    label: 'File',
    actions: [
    {
      id: 'new',
      icon: Plus,
      label: 'New',
      onClick: () => {}
    },
    {
      id: 'open',
      icon: FolderOpen,
      label: 'Open',
      onClick: () => {}
    },
    {
      id: 'save',
      icon: Save,
      label: 'Save',
      onClick: () => {}
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: () => {}
    }
    ]
  },
  {
    id: 'edit',
    label: 'Edit',
    actions: [
    {
      id: 'undo',
      icon: Undo2,
      label: 'Undo',
      onClick: () => {}
    },
    {
      id: 'redo',
      icon: Redo2,
      label: 'Redo',
      onClick: () => {}
    },
    {
      id: 'format',
      icon: Sparkles,
      label: 'Format',
      onClick: () => {}
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: () => {}
    }
    ]
  },
  {
    id: 'run',
    label: 'Run',
    actions: [
    {
      id: 'compile',
      icon: Play,
      label: 'Compile',
      onClick: () => {},
      variant: 'primary' as const
    },
    {
      id: 'debug',
      icon: Bug,
      label: 'Debug',
      onClick: () => {}
    },
    {
      id: 'gas',
      icon: Zap,
      label: 'Gas',
      onClick: () => {}
    },
    {
      id: 'deploy',
      icon: Upload,
      label: 'Deploy',
      onClick: () => {}
    }
    ]
  }
  ]
};
