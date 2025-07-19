'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AdvancedCollaborativeEditor, CollaboratorInfo, ChangeEvent, CursorEvent, ConflictEvent } from '../collaboration/AdvancedCollaborativeEditor';
import { CursorPosition, SelectionRange } from '../collaboration/OperationalTransform';
import { useNotificationSocket } from './useNotificationSocket';
import { useNotifications } from '@/components/ui/NotificationSystem';

export interface UseAdvancedCollaborativeEditorOptions {
  documentId: string;
  initialContent?: string;
  autoSave?: boolean;
  autoSaveInterval?: number;
  conflictResolution?: 'auto' | 'manual';
  maxCollaborators?: number;
}

export interface CollaborativeEditorState {
  content: string;
  version: number;
  collaborators: CollaboratorInfo[];
  isConnected: boolean;
  hasUnsavedChanges: boolean;
  conflicts: any[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Advanced hook for collaborative editing with real-time synchronization
 */
export function useAdvancedCollaborativeEditor(options: UseAdvancedCollaborativeEditorOptions) {
  const { data: session } = useSession();
  const { 
    sendNotificationToRoom: _sendNotificationToRoom, 
    joinRoom, 
    leaveRoom, 
    sendCollaborationEvent,
    isConnected 
  } = useNotificationSocket();
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
  }, [session?.user, options.documentId, options.autoSave, sendCollaborationEvent, showWarning]);

  const handleCursorChange = useCallback((event: CursorEvent) => {
    // Send cursor position to other collaborators
    sendCollaborationEvent('cursor_moved', {
      userId: event.collaboratorId,
      roomId: options.documentId,
      cursor: event.cursor,
      selection: event.selection
    });
  }, [options.documentId, sendCollaborationEvent]);

  const handleConflict = useCallback((event: ConflictEvent) => {
    setState(prev => ({
      ...prev,
      conflicts: [...prev.conflicts, ...event.conflicts]
    }));

    if (event.resolution === 'manual') {
      showError(
        'Manual Conflict Resolution Required',
        'Please review and resolve the editing conflicts',
        {
          persistent: true,
          action: {
            label: 'View Conflicts',
            onClick: () => {
              // Open conflict resolution UI
              console.log('Opening conflict resolution UI');
            }
          }
        }
      );
    }
  }, [showError]);

  const handleCollaboratorJoined = useCallback((collaborator: CollaboratorInfo) => {
    setState(prev => ({
      ...prev,
      collaborators: [...prev.collaborators.filter(c => c.id !== collaborator.id), collaborator]
    }));

    showInfo(
      'Collaborator Joined',
      `${collaborator.name} joined the editing session`,
      {
        duration: 3000,
        metadata: {
          category: 'collaboration',
          priority: 'low'
        }
      }
    );
  }, [showInfo]);

  const handleCollaboratorLeft = useCallback((collaborator: CollaboratorInfo) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter(c => c.id !== collaborator.id)
    }));

    showInfo(
      'Collaborator Left',
      `${collaborator.name} left the editing session`,
      {
        duration: 3000,
        metadata: {
          category: 'collaboration',
          priority: 'low'
        }
      }
    );
  }, [showInfo]);

  const handleCollaboratorInactive = useCallback((collaborator: CollaboratorInfo) => {
    setState(prev => ({
      ...prev,
      collaborators: prev.collaborators.map(c => 
        c.id === collaborator.id ? { ...c, isActive: false } : c
      )
    }));
  }, []);

  // Auto-save functionality
  const scheduleAutoSave = useCallback((content: string) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveContent(content);
    }, options.autoSaveInterval || 2000);
  }, [options.autoSaveInterval]);

  const saveContent = useCallback(async (content: string) => {
    try {
      // Implement your save logic here
      // await saveDocument(options.documentId, content);
      
      lastSavedContentRef.current = content;
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));

      console.log('Document auto-saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      showError(
        'Auto-save Failed',
        'Failed to save your changes automatically',
        {
          action: {
            label: 'Retry',
            onClick: () => saveContent(content)
          }
        }
      );
    }
  }, [options.documentId, showError]);

  // Public methods
  const applyChange = useCallback((
    newContent: string,
    cursor?: CursorPosition,
    selection?: SelectionRange
  ) => {
    if (!editorRef.current) return;

    try {
      editorRef.current.applyLocalChange(
        newContent,
        cursor,
        selection,
        session?.user?.id
      );
    } catch (error) {
      console.error('Failed to apply change:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to apply changes'
      }));
    }
  }, [session?.user?.id]);

  const updateCursor = useCallback((
    cursor: CursorPosition,
    selection?: SelectionRange
  ) => {
    if (!editorRef.current || !session?.user?.id) return;

    editorRef.current.updateCollaboratorCursor(
      session.user.id,
      cursor,
      selection
    );
  }, [session?.user?.id]);

  const undo = useCallback(() => {
    if (!editorRef.current) return null;

    try {
      return editorRef.current.undo();
    } catch (error) {
      console.error('Undo failed:', error);
      showError('Undo Failed', 'Could not undo the last change');
      return null;
    }
  }, [showError]);

  const manualSave = useCallback(async () => {
    if (!state.hasUnsavedChanges) return;

    try {
      await saveContent(state.content);
      showInfo('Saved', 'Document saved successfully');
    } catch (error) {
      showError('Save Failed', 'Could not save the document');
    }
  }, [state.content, state.hasUnsavedChanges, saveContent, showInfo, showError]);

  const resolveConflicts = useCallback((resolutions: any[]) => {
    // Implement conflict resolution logic
    setState(prev => ({
      ...prev,
      conflicts: prev.conflicts.filter(conflict => 
        !resolutions.some(resolution => resolution.id === conflict.id)
      )
    }));

    showInfo('Conflicts Resolved', 'All conflicts have been resolved');
  }, [showInfo]);

  const getActiveCollaborators = useCallback(() => {
    return editorRef.current?.getActiveCollaborators() || [];
  }, []);

  const getDocumentState = useCallback(() => {
    return editorRef.current?.getDocumentState();
  }, []);

  return {
    // State
    ...state,
    
    // Methods
    applyChange,
    updateCursor,
    undo,
    manualSave,
    resolveConflicts,
    getActiveCollaborators,
    getDocumentState,
    
    // Computed values
    canUndo: state.version > 0,
    activeCollaboratorCount: state.collaborators.filter(c => c.isActive).length,
    isOverCapacity: options.maxCollaborators ? 
      state.collaborators.length > options.maxCollaborators : false
  };
}
