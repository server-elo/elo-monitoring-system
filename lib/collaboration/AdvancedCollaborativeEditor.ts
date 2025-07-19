'use client';

import { EventEmitter } from 'events';
import { 
  OperationalTransform, 
  TextOperation, 
  CursorPosition, 
  SelectionRange, 
  OperationResult,
  ConflictResolution 
} from './OperationalTransform';

export interface CollaboratorInfo {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  isActive: boolean;
  lastSeen: number;
}

export interface DocumentState {
  content: string;
  version: number;
  operations: TextOperation[];
  collaborators: Map<string, CollaboratorInfo>;
  conflicts: ConflictResolution[];
}

export interface ChangeEvent {
  operation: TextOperation;
  newContent: string;
  version: number;
  collaborator: CollaboratorInfo;
  conflicts?: ConflictResolution[];
}

export interface CursorEvent {
  collaboratorId: string;
  cursor: CursorPosition;
  selection?: SelectionRange;
}

export interface ConflictEvent {
  conflicts: ConflictResolution[];
  operations: TextOperation[];
  resolution: 'auto' | 'manual';
}

/**
 * Advanced collaborative editor with real-time synchronization,
 * conflict resolution, and cursor tracking
 */
export class AdvancedCollaborativeEditor extends EventEmitter {
  private documentState: DocumentState;
  private pendingOperations: Map<string, TextOperation[]> = new Map();
  private operationQueue: TextOperation[] = [];
  // Processing flag kept for future concurrent operation handling
  // private isProcessing = false;
  private maxHistorySize = 1000;
  private conflictResolutionStrategy: 'auto' | 'manual' = 'auto';

  constructor(
    initialContent: string = '',
    collaboratorId: string,
    collaboratorName: string
  ) {
    super();
    
    this.documentState = {
      content: initialContent,
      version: 0,
      operations: [],
      collaborators: new Map(),
      conflicts: []
    };

    // Add self as collaborator
    this.addCollaborator({
      id: collaboratorId,
      name: collaboratorName,
      color: this.generateCollaboratorColor(collaboratorId),
      isActive: true,
      lastSeen: Date.now()
    });
  }

  /**
   * Apply a local text change and generate operation
   */
  applyLocalChange(
    newContent: string,
    cursor?: CursorPosition,
    selection?: SelectionRange,
    collaboratorId?: string
  ): OperationResult {
    const operation = OperationalTransform.fromTextChange(
      this.documentState.content,
      newContent,
      cursor
    );

    // Add metadata
    operation.meta = {
      ...operation.meta,
      userId: collaboratorId || 'local',
      cursor,
      selection,
      sessionId: this.generateSessionId(),
      operationId: this.generateOperationId(),
      intent: 'edit',
      source: 'user'
    };

    return this.applyOperation(operation, true);
  }

  /**
   * Apply a remote operation from another collaborator
   */
  applyRemoteOperation(operation: TextOperation): OperationResult {
    return this.applyOperation(operation, false);
  }

  /**
   * Apply an operation to the document
   */
  private applyOperation(operation: TextOperation, isLocal: boolean): OperationResult {
    // Transform against pending operations
    let transformedOperation = operation;
    const conflicts: ConflictResolution[] = [];

    // Process pending operations first
    if (this.operationQueue.length > 0) {
      for (const pendingOp of this.operationQueue) {
        const [transformed, _] = OperationalTransform.transformWithConflictDetection(
          transformedOperation,
          pendingOp,
          isLocal ? 'left' : 'right'
        );
        
        transformedOperation = transformed.operation;
        if (transformed.conflicts) {
          conflicts.push(...transformed.conflicts);
        }
      }
    }

    // Apply the operation
    const result = OperationalTransform.apply(this.documentState.content, transformedOperation);
    
    // Update document state
    this.documentState.content = OperationalTransform.apply(this.documentState.content, transformedOperation).operation.meta?.cursor ? 
      OperationalTransform['applyToText'](this.documentState.content, transformedOperation) : 
      this.documentState.content;
    this.documentState.version++;
    this.documentState.operations.push(transformedOperation);
    
    // Limit history size
    if (this.documentState.operations.length > this.maxHistorySize) {
      this.documentState.operations = this.documentState.operations.slice(-this.maxHistorySize);
    }

    // Update collaborator cursor/selection
    if (operation.meta?.userId) {
      this.updateCollaboratorCursor(
        operation.meta.userId,
        result.transformedCursor,
        result.transformedSelection
      );
    }

    // Handle conflicts
    if (conflicts.length > 0) {
      this.documentState.conflicts.push(...conflicts);
      this.handleConflicts(conflicts, [transformedOperation]);
    }

    // Emit change event
    const collaborator = this.documentState.collaborators.get(operation.meta?.userId || 'unknown');
    if (collaborator) {
      this.emit('change', {
        operation: transformedOperation,
        newContent: this.documentState.content,
        version: this.documentState.version,
        collaborator,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      } as ChangeEvent);
    }

    return {
      ...result,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  }

  /**
   * Update collaborator cursor position
   */
  updateCollaboratorCursor(
    collaboratorId: string,
    cursor?: CursorPosition,
    selection?: SelectionRange
  ): void {
    const collaborator = this.documentState.collaborators.get(collaboratorId);
    if (collaborator) {
      collaborator.cursor = cursor;
      collaborator.selection = selection;
      collaborator.lastSeen = Date.now();
      collaborator.isActive = true;

      this.emit('cursor', {
        collaboratorId,
        cursor: cursor!,
        selection
      } as CursorEvent);
    }
  }

  /**
   * Add a new collaborator
   */
  addCollaborator(collaborator: Omit<CollaboratorInfo, 'color'> & { color?: string }): void {
    const fullCollaborator: CollaboratorInfo = {
      ...collaborator,
      color: collaborator.color || this.generateCollaboratorColor(collaborator.id),
      isActive: true,
      lastSeen: Date.now()
    };

    this.documentState.collaborators.set(collaborator.id, fullCollaborator);
    this.emit('collaborator-joined', fullCollaborator);
  }

  /**
   * Remove a collaborator
   */
  removeCollaborator(collaboratorId: string): void {
    const collaborator = this.documentState.collaborators.get(collaboratorId);
    if (collaborator) {
      this.documentState.collaborators.delete(collaboratorId);
      this.emit('collaborator-left', collaborator);
    }
  }

  /**
   * Handle conflicts based on resolution strategy
   */
  private handleConflicts(
    conflicts: ConflictResolution[],
    operations: TextOperation[]
  ): void {
    if (this.conflictResolutionStrategy === 'auto') {
      // Auto-resolve conflicts using the specified strategy
      conflicts.forEach(conflict => {
        console.log(`Auto-resolving conflict: ${conflict.reason}`);
      });
    } else {
      // Emit conflict event for manual resolution
      this.emit('conflict', {
        conflicts,
        operations,
        resolution: 'manual'
      } as ConflictEvent);
    }
  }

  /**
   * Get current document state
   */
  getDocumentState(): DocumentState {
    return {
      ...this.documentState,
      collaborators: new Map(this.documentState.collaborators)
    };
  }

  /**
   * Get document content
   */
  getContent(): string {
    return this.documentState.content;
  }

  /**
   * Get document version
   */
  getVersion(): number {
    return this.documentState.version;
  }

  /**
   * Get active collaborators
   */
  getActiveCollaborators(): CollaboratorInfo[] {
    const now = Date.now();
    const activeThreshold = 30000; // 30 seconds

    return Array.from(this.documentState.collaborators.values())
      .filter(collaborator => 
        collaborator.isActive && 
        (now - collaborator.lastSeen) < activeThreshold
      );
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolutionStrategy(strategy: 'auto' | 'manual'): void {
    this.conflictResolutionStrategy = strategy;
  }

  /**
   * Generate operation from text diff
   */
  generateOperation(
    oldText: string,
    newText: string,
    collaboratorId: string,
    cursor?: CursorPosition,
    selection?: SelectionRange
  ): TextOperation {
    const operation = OperationalTransform.fromTextChange(oldText, newText, cursor);
    
    operation.meta = {
      ...operation.meta,
      userId: collaboratorId,
      cursor,
      selection,
      sessionId: this.generateSessionId(),
      operationId: this.generateOperationId(),
      intent: 'edit',
      source: 'user'
    };

    return operation;
  }

  /**
   * Undo last operation
   */
  undo(): OperationResult | null {
    if (this.documentState.operations.length === 0) {
      return null;
    }

    const lastOperation = this.documentState.operations[this.documentState.operations.length - 1];
    const invertedOperation = OperationalTransform.invert(lastOperation, this.documentState.content);
    
    // Apply inverted operation
    const result = this.applyOperation(invertedOperation, true);
    
    // Remove the undone operation from history
    this.documentState.operations.pop();
    
    return result;
  }

  /**
   * Utility methods
   */
  private generateCollaboratorColor(id: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup inactive collaborators
   */
  cleanupInactiveCollaborators(): void {
    const now = Date.now();
    const inactiveThreshold = 300000; // 5 minutes

    for (const [_id, collaborator] of this.documentState.collaborators) {
      if ((now - collaborator.lastSeen) > inactiveThreshold) {
        collaborator.isActive = false;
        this.emit('collaborator-inactive', collaborator);
      }
    }
  }

  /**
   * Destroy the editor and cleanup resources
   */
  destroy(): void {
    this.removeAllListeners();
    this.documentState.collaborators.clear();
    this.pendingOperations.clear();
    this.operationQueue = [];
  }
}
