'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Save, Undo, Redo, Code, Settings, Share2, Download, Search, Copy, Clipboard, ChevronLeft, ChevronRight, Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture';

interface MobileEditorToolbarProps {
  onRun?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFormat?: () => void;
  onShare?: () => void;
  onSettings?: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
  onSearch?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onRefresh?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSaving?: boolean;
  isRunning?: boolean;
  hasChanges?: boolean;
  className?: string;
  expandedByDefault?: boolean;
}

interface ToolbarAction {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  variant?: 'default' | 'success' | 'danger';
}

export function MobileEditorToolbar({
  onRun,
  onSave,
  onUndo,
  onRedo,
  onFormat,
  onShare,
  onSettings,
  onDownload,
  onUpload: _onUpload,
  onSearch,
  onCopy,
  onPaste,
  onZoomIn,
  onZoomOut,
  onRefresh: _onRefresh,
  canUndo = false,
  canRedo = false,
  isSaving = false,
  isRunning = false,
  hasChanges = false,
  className,
  expandedByDefault = false
}: MobileEditorToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault);
  const [activeSection, setActiveSection] = useState<'main' | 'edit' | 'view'>('main');
  
  // Touch gesture support
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (activeSection === 'main') setActiveSection('edit');
      else if (activeSection === 'edit') setActiveSection('view');
    },
    onSwipeRight: () => {
      if (activeSection === 'view') setActiveSection('edit');
      else if (activeSection === 'edit') setActiveSection('main');
    },
    threshold: 50
  });

  // Primary actions always visible
  const primaryActions: ToolbarAction[] = [
    {
      id: 'run',
      icon: isRunning ? RefreshCw : Play,
      label: isRunning ? 'Running...' : 'Run',
      onClick: onRun,
      disabled: isRunning,
      primary: true,
      variant: 'success'
    },
    {
      id: 'save',
      icon: isSaving ? RefreshCw : (hasChanges ? Save : CheckCircle),
      label: isSaving ? 'Saving...' : (hasChanges ? 'Save' : 'Saved'),
      onClick: onSave,
      disabled: isSaving || !hasChanges,
      primary: true
    },
    {
      id: 'format',
      icon: Code,
      label: 'Format',
      onClick: onFormat,
      primary: true
    }
  ];

  // Edit actions
  const editActions: ToolbarAction[] = [
    {
      id: 'undo',
      icon: Undo,
      label: 'Undo',
      onClick: onUndo,
      disabled: !canUndo
    },
    {
      id: 'redo',
      icon: Redo,
      label: 'Redo',
      onClick: onRedo,
      disabled: !canRedo
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy',
      onClick: onCopy
    },
    {
      id: 'paste',
      icon: Clipboard,
      label: 'Paste',
      onClick: onPaste
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: onSearch
    }
  ];

  // View actions
  const viewActions: ToolbarAction[] = [
    {
      id: 'zoomIn',
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: onZoomIn
    },
    {
      id: 'zoomOut',
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: onZoomOut
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: onShare
    },
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      onClick: onDownload
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: onSettings
    }
  ];

  const renderActionButton = (action: ToolbarAction) => {
    const Icon = action.icon;
    const isAnimating = (action.id === 'save' && isSaving) || (action.id === 'run' && isRunning);
    
    return (
      <motion.button
        key={action.id}
        whileTap={{ scale: 0.95 }}
        onClick={action.onClick}
        disabled={action.disabled}
        className={cn(
          "relative flex flex-col items-center justify-center p-3 rounded-xl transition-all",
          "min-w-[60px] min-h-[60px]",
          action.primary && "min-w-[70px]",
          action.disabled && "opacity-50",
          action.variant === 'success' && "bg-green-500/20 text-green-400",
          action.variant === 'danger' && "bg-red-500/20 text-red-400",
          !action.variant && "bg-white/5 hover:bg-white/10 text-white",
          "active:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        )}
        aria-label={action.label}
      >
        <Icon 
          className={cn(
            "w-5 h-5 mb-1",
            isAnimating && "animate-spin"
          )} 
        />
        <span className="text-xs font-medium">{action.label}</span>
        {action.id === 'save' && hasChanges && !isSaving && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full" />
        )}
      </motion.button>
    );
  };

  const getActionsForSection = () => {
    switch (activeSection) {
      case 'edit':
        return editActions;
      case 'view':
        return viewActions;
      default:
        return primaryActions;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Compact Toolbar */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : '60px' }}
        className="bg-gray-900/95 backdrop-blur-md border-t border-gray-800"
      >
        {/* Primary Actions Bar */}
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            {primaryActions.map(renderActionButton)}
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? "Collapse toolbar" : "Expand toolbar"}
          >
            {isExpanded ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Expanded Toolbar */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              ref={swipeRef as any}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="px-2 pb-2"
            >
              {/* Section Indicators */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {['main', 'edit', 'view'].map((section) => (
                  <button
                    key={section}
                    onClick={() => setActiveSection(section as any)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      activeSection === section
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-gray-400"
                    )}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                ))}
              </div>

              {/* Actions Grid */}
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 gap-2"
              >
                {getActionsForSection().map(renderActionButton)}
              </motion.div>

              {/* Swipe Hint */}
              <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
                <ChevronLeft className="w-3 h-3 mr-1" />
                <span>Swipe to switch sections</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Quick Actions (when collapsed) */}
      {!isExpanded && (
        <div className="absolute -top-12 right-2 flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onShare}
            className="p-2 rounded-full bg-gray-800/90 backdrop-blur-sm border border-gray-700"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSettings}
            className="p-2 rounded-full bg-gray-800/90 backdrop-blur-sm border border-gray-700"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
}