/**
 * Advanced Collaborative Editor Hook
 * 
 * Provides real-time collaborative editing capabilities with
 * conflict resolution, cursor synchronization, and auto-save.
 */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationSocket } from '@/lib/sockets/NotificationSocket';
import { useNotifications } from '@/hooks/useNotifications';
import { AdvancedCollaborativeEditor } from '@/lib/editor/AdvancedCollaborativeEditor';
import type { Collaborator, ConflictResolutionStrategy, ChangeEvent } from '@/lib/editor/types';

interface UseAdvancedCollaborativeEditorOptions {
  documentId: string;
  initialContent?: string;
  conflictResolution?: ConflictResolutionStrategy;
  autoSave?: boolean;
  autoSaveInterval?: number;
}

interface CollaborativeEditorState {
  content: string;
  version: number;
  collaborators: Collaborator[];
  isConnected: boolean;
  hasUnsavedChanges: boolean;
  conflicts: any[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Advanced hook for collaborative editing with real-time synchronization
 */
export function useAdvancedCollaborativeEditor(options: UseAdvancedCollaborativeEditorOptions): {
  state: CollaborativeEditorState;
  editor: AdvancedCollaborativeEditor | null;
  saveContent: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => void;
} {
  const { data: session } = useSession();
  const { sendNotificationToRoom, joinRoom, leaveRoom, sendCollaborationEvent, isConnected } = useNotificationSocket();
  const { showWarning, showError, showInfo } = useNotifications();
  
  // State
  const [state, setState] = useState<CollaborativeEditorState>({
    content: options.initialContent || '',
    version: 0,
    collaborators: [],
    isConnected: false,
    hasUnsavedChanges: false,
    conflicts: [],
    isLoading: true,
    error: null
  });
  
  // Refs
  const editorRef = useRef<AdvancedCollaborativeEditor | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<string>(options.initialContent || '');
  
  // Initialize editor
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const editor = new AdvancedCollaborativeEditor(
      options.initialContent || '',
      session.user.id,
      session.user.name || 'Anonymous'
    );
    
    // Set conflict resolution strategy
    if (options.conflictResolution) {
      editor.setConflictResolutionStrategy(options.conflictResolution);
    }
    
    // Set up event listeners
    editor.on('change', handleChange);
    editor.on('cursor', handleCursorChange);
    editor.on('conflict', handleConflict);
    editor.on('collaborator-joined', handleCollaboratorJoined);
    editor.on('collaborator-left', handleCollaboratorLeft);
    editor.on('collaborator-inactive', handleCollaboratorInactive);
    
    editorRef.current = editor;
    
    // Join collaboration room
    joinRoom(options.documentId);
    
    // Update state
    setState(prev => ({
      ...prev,
      isLoading: false,
      isConnected: isConnected
    }));
    
    return () => {
      editor.destroy();
      leaveRoom(options.documentId);
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [session?.user?.id, options.documentId, options.initialContent]);
  
  // Update connection status
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: isConnected
    }));
  }, [isConnected]);
  
  // Event handlers
  const handleChange = useCallback((event: ChangeEvent) => {
    setState(prev => ({
      ...prev,
      content: event.newContent,
      version: event.version,
      hasUnsavedChanges: event.newContent !== lastSavedContentRef.current,
      conflicts: event.conflicts ? [...prev.conflicts, ...event.conflicts] : prev.conflicts
    }));
    
    // Send operation to other collaborators
    sendCollaborationEvent('code_changed', {
      userId: session?.user?.id,
      userName: session?.user?.name,
      roomId: options.documentId,
      operation: event.operation,
      version: event.version
    });
    
    // Auto-save if enabled
    if (options.autoSave) {
      scheduleAutoSave(event.newContent);
    }
    
    // Show conflict notification if any
    if (event.conflicts && event.conflicts.length > 0) {
      showWarning(
        'Editing Conflict Detected',
        `${event.conflicts.length} conflict(s) were automatically resolved`,
        {
          duration: 5000,
          metadata: {
            category: 'collaboration',
            priority: 'medium'
          }
        }
      );
    }
  }, [session, options.documentId, options.autoSave, sendCollaborationEvent, showWarning]);
  
  const handleCursorChange = useCallback((event: any) => {
    sendCollaborationEvent('cursor_moved', {
      userId: session?.user?.id,
      userName: session?.user?.name,
      roomId: options.documentId,
      position: event.position
    });
  }, [session, options.documentId, sendCollaborationEvent]);
  
  const handleConflict = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      conflicts: [...prev.conflicts, event.conflict]
    }));
    
    showError(
      'Merge Conflict',
      'A merge conflict requires manual resolution',
      {
        duration: 0, // Don't auto-dismiss
        action: {
          label: 'Resolve',
          onClick: () => {
            // Open conflict resolution UI
          }
        }
      }
    );
  }, [showError]);
  
  const handleCollaboratorJoined = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      collaborators: [...prev.collaborators, event.collaborator]
    }));
    
    showInfo(
      'Collaborator Joined',
      `${event.collaborator.name} joined the session`
    );
  }, [showInfo]);
  
  const handleCollaboratorLeft = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== event.collaboratorId)
    }));
    
    showInfo(
      'Collaborator Left',
      `${event.collaboratorName} left the session`
    );
  }, [showInfo]);
  
  const handleCollaboratorInactive = useCallback((event: any) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c =>
        c.id === event.collaboratorId ? { ...c, isActive: false } : c
      )
    }));
  }, []);
  
  // Auto-save functionality
  const scheduleAutoSave = useCallback((content: string) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveContent();
    }, options.autoSaveInterval || 5000);
  }, [options.autoSaveInterval]);
  
  // Save content
  const saveContent = useCallback(async () => {
    if (!editorRef.current || !state.hasUnsavedChanges) return;
    
    try {
      // Save to backend
      const response = await fetch(`/api/documents/${options.documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: state.content,
          version: state.version
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save document');
      }
      
      lastSavedContentRef.current = state.content;
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));
      
      showInfo('Document Saved', 'Your changes have been saved');
    } catch (error) {
      showError('Save Failed', 'Failed to save document. Please try again.');
      console.error('Save error:', error);
    }
  }, [state.content, state.version, state.hasUnsavedChanges, options.documentId, showInfo, showError]);
  
  // Resolve conflict
  const resolveConflict = useCallback((conflictId: string, resolution: 'local' | 'remote') => {
    if (!editorRef.current) return;
    
    const conflict = state.conflicts.find(c => c.id === conflictId);
    if (!conflict) return;
    
    editorRef.current.resolveConflict(conflictId, resolution);
    
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(c => c.id !== conflictId)
    }));
  }, [state.conflicts]);
  
  return {
    state,
    editor: editorRef.current,
    saveContent,
    resolveConflict
  };
}