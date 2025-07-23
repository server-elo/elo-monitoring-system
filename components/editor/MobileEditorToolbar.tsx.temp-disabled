'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Save,
  Undo,
  Redo,
  Code,
  Settings,
  Share2,
  Download,
  Search,
  Copy,
  Clipboard,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSwipeGesture } from '@/lib/hooks/useSwipeGesture'

interface MobileEditorToolbarProps {
  onRun?: () => void
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onFormat?: () => void
  onShare?: () => void
  onSettings?: () => void
  onDownload?: () => void
  onUpload?: () => void
  onSearch?: () => void
  onCopy?: () => void
  onPaste?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onRefresh?: () => void
  canUndo?: boolean
  canRedo?: boolean
  isSaving?: boolean
  isRunning?: boolean
  hasChanges?: boolean
  className?: string
  expandedByDefault?: boolean
}

interface ToolbarAction {
  id: string
  icon: React.ComponentType<any>
  label: string
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
  variant?: 'default' | 'success' | 'danger'
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
  onUpload,
  onSearch,
  onCopy,
  onPaste,
  onZoomIn,
  onZoomOut,
  onRefresh,
  canUndo = false,
  canRedo = false,
  isSaving = false,
  isRunning = false,
  hasChanges = false,
  className,
  expandedByDefault = false,
}: MobileEditorToolbarProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(expandedByDefault)
  const [activeSection, setActiveSection] = useState<'main' | 'edit' | 'view'>(
    'main',
  )

  // Touch gesture support
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (activeSection === 'main') setActiveSection('edit')
      else if (activeSection === 'edit') setActiveSection('view')
    },
    onSwipeRight: () => {
      if (activeSection === 'view') setActiveSection('edit')
      else if (activeSection === 'edit') setActiveSection('main')
    },
    threshold: 50,
  })

  // Primary actions always visible
  const primaryActions: ToolbarAction[] = [
    {
      id: 'run',
      icon: isRunning ? RefreshCw : Play,
      label: isRunning ? 'Running...' : 'Run',
      onClick: onRun,
      disabled: isRunning,
      primary: true,
      variant: 'success',
    },
    {
      id: 'save',
      icon: isSaving ? RefreshCw : hasChanges ? Save : CheckCircle,
      label: isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Saved',
      onClick: onSave,
      disabled: isSaving || !hasChanges,
      primary: true,
    },
    {
      id: 'format',
      icon: Code,
      label: 'Format',
      onClick: onFormat,
      primary: true,
    },
  ]

  // Edit actions
  const editActions: ToolbarAction[] = [
    {
      id: 'undo',
      icon: Undo,
      label: 'Undo',
      onClick: onUndo,
      disabled: !canUndo,
    },
    {
      id: 'redo',
      icon: Redo,
      label: 'Redo',
      onClick: onRedo,
      disabled: !canRedo,
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: onSearch,
    },
    {
      id: 'copy',
      icon: Copy,
      label: 'Copy',
      onClick: onCopy,
    },
    {
      id: 'paste',
      icon: Clipboard,
      label: 'Paste',
      onClick: onPaste,
    },
  ]

  // View actions
  const viewActions: ToolbarAction[] = [
    {
      id: 'zoomIn',
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: onZoomIn,
    },
    {
      id: 'zoomOut',
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: onZoomOut,
    },
    {
      id: 'share',
      icon: Share2,
      label: 'Share',
      onClick: onShare,
    },
    {
      id: 'download',
      icon: Download,
      label: 'Download',
      onClick: onDownload,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: onSettings,
    },
  ]

  const renderActionButton = (action: ToolbarAction) => (
    <button
      key={action.id}
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        'flex items-center space-x-1 px-3 py-2 rounded text-sm font-medium transition-colors',
        'active:scale-95 transform',
        action.primary && 'bg-blue-600 hover:bg-blue-700 text-white',
        !action.primary && 'bg-gray-700 hover:bg-gray-600 text-gray-300',
        action.variant === 'success' && 'bg-green-600 hover:bg-green-700',
        action.variant === 'danger' && 'bg-red-600 hover:bg-red-700',
        action.disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <action.icon className="w-4 h-4" />
      <span className="hidden sm:inline">{action.label}</span>
    </button>
  )

  const getCurrentActions = () => {
    switch (activeSection) {
      case 'edit':
        return editActions
      case 'view':
        return viewActions
      default:
        return primaryActions
    }
  }

  return (
    <div className={cn('bg-gray-800 border-b border-gray-700', className)}>
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between p-2 md:hidden">
        {/* Section navigation */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveSection('main')}
            className={cn(
              'px-2 py-1 rounded text-xs',
              activeSection === 'main'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400',
            )}
          >
            Main
          </button>
          <button
            onClick={() => setActiveSection('edit')}
            className={cn(
              'px-2 py-1 rounded text-xs',
              activeSection === 'edit'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400',
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveSection('view')}
            className={cn(
              'px-2 py-1 rounded text-xs',
              activeSection === 'view'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400',
            )}
          >
            View
          </button>
        </div>

        {/* Expand/Collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-white"
        >
          {isExpanded ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Action buttons */}
      <div className="overflow-x-auto">
        <div
          ref={swipeRef}
          className={cn(
            'flex items-center space-x-2 p-2',
            'md:justify-start',
            !isExpanded && 'md:hidden',
          )}
        >
          {getCurrentActions().map(renderActionButton)}
        </div>
      </div>

      {/* Desktop toolbar - always visible */}
      <div className="hidden md:flex items-center space-x-2 p-2 border-t border-gray-700">
        {[...primaryActions, ...editActions, ...viewActions].map(
          renderActionButton,
        )}
      </div>
    </div>
  )
}
