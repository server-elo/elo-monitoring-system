'use client';

// Operational Transformation for collaborative text editing
export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  length?: number;
  text?: string;
  attributes?: Record<string, any>;
  // Enhanced metadata for advanced features
  id?: string;
  priority?: number;
  source?: 'user' | 'ai' | 'system';
}

export interface CursorPosition {
  line: number;
  column: number;
  offset?: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  direction?: 'forward' | 'backward';
}

export interface TextOperation {
  ops: Operation[];
  baseLength: number;
  targetLength: number;
  meta?: {
    userId: string;
    userName?: string;
    timestamp: number;
    cursor?: CursorPosition;
    selection?: SelectionRange;
    sessionId?: string;
    operationId?: string;
    // Enhanced metadata
    intent?: 'edit' | 'format' | 'refactor' | 'autocomplete';
    confidence?: number;
    source?: 'user' | 'ai' | 'system';
    context?: {
      linesBefore?: string[];
      linesAfter?: string[];
      syntaxContext?: string;
    };
  };
}

export interface ConflictResolution {
  strategy: 'merge' | 'override' | 'manual';
  winner?: string; // userId
  reason?: string;
  timestamp: number;
}

export interface OperationResult {
  operation: TextOperation;
  conflicts?: ConflictResolution[];
  warnings?: string[];
  transformedCursor?: CursorPosition;
  transformedSelection?: SelectionRange;
}

export class OperationalTransform {
  // Enhanced apply method with result metadata
  static apply(text: string, operation: TextOperation): OperationResult {
    const result = this.applyToText(text, operation);
    const transformedCursor = operation.meta?.cursor
      ? this.transformCursor(operation.meta.cursor, operation, text)
      : undefined;
    const transformedSelection = operation.meta?.selection
      ? this.transformSelection(operation.meta.selection, operation, text)
      : undefined;

    return {
      operation: {
        ...operation,
        meta: operation.meta ? {
          ...operation.meta,
          cursor: transformedCursor,
          selection: transformedSelection
        } : {
          userId: '',
          timestamp: Date.now(),
          cursor: transformedCursor,
          selection: transformedSelection
        }
      },
      transformedCursor,
      transformedSelection
    };
  }

  // Apply an operation to a text string (internal method)
  private static applyToText(text: string, operation: TextOperation): string {
    let result = '';
    let textIndex = 0;

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          if (op.length) {
            result += text.slice(textIndex, textIndex + op.length);
            textIndex += op.length;
          }
          break;

        case 'insert':
          if (op.text) {
            result += op.text;
          }
          break;

        case 'delete':
          if (op.length) {
            textIndex += op.length;
          }
          break;
      }
    }

    return result;
  }

  // Enhanced transform with conflict detection and resolution
  static transformWithConflictDetection(
    op1: TextOperation,
    op2: TextOperation,
    priority: 'left' | 'right' = 'left'
  ): [OperationResult, OperationResult] {
    const conflicts: ConflictResolution[] = [];
    const warnings: string[] = [];

    // Detect potential conflicts
    const hasConflict = this.detectConflicts(op1, op2);
    if (hasConflict) {
      conflicts.push({
        strategy: 'merge',
        winner: priority === 'left' ? op1.meta?.userId : op2.meta?.userId,
        reason: 'Concurrent edits in overlapping regions',
        timestamp: Date.now()
      });
    }

    // Perform transformation
    const [transformed1, transformed2] = this.transform(op1, op2, priority);

    // Transform cursors and selections
    const result1: OperationResult = {
      operation: transformed1,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      transformedCursor: op1.meta?.cursor
        ? this.transformCursorByOperation(op1.meta.cursor, op2)
        : undefined,
      transformedSelection: op1.meta?.selection
        ? this.transformSelectionByOperation(op1.meta.selection, op2)
        : undefined
    };

    const result2: OperationResult = {
      operation: transformed2,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      transformedCursor: op2.meta?.cursor
        ? this.transformCursorByOperation(op2.meta.cursor, op1)
        : undefined,
      transformedSelection: op2.meta?.selection
        ? this.transformSelectionByOperation(op2.meta.selection, op1)
        : undefined
    };

    return [result1, result2];
  }

  // Original transform method (for backward compatibility)
  static transform(op1: TextOperation, op2: TextOperation, priority: 'left' | 'right' = 'left'): [TextOperation, TextOperation] {
    if (op1.baseLength !== op2.baseLength) {
      throw new Error('Operations must have the same base length');
    }

    const ops1 = [...op1.ops];
    const ops2 = [...op2.ops];
    const newOps1: Operation[] = [];
    const newOps2: Operation[] = [];

    let i1 = 0, i2 = 0;
    let op1Current = ops1[i1];
    let op2Current = ops2[i2];

    while (op1Current || op2Current) {
      // Handle retain operations
      if (op1Current?.type === 'retain' && op2Current?.type === 'retain') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        newOps1.push({ type: 'retain', length: minLength });
        newOps2.push({ type: 'retain', length: minLength });
        
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      }
      // Handle insert vs insert
      else if (op1Current?.type === 'insert' && op2Current?.type === 'insert') {
        if (priority === 'left') {
          newOps1.push({ type: 'insert', text: op1Current.text });
          newOps2.push({ type: 'retain', length: op1Current.text?.length || 0 });
          op1Current = ops1[++i1];
        } else {
          newOps1.push({ type: 'retain', length: op2Current.text?.length || 0 });
          newOps2.push({ type: 'insert', text: op2Current.text });
          op2Current = ops2[++i2];
        }
      }
      // Handle insert vs retain/delete
      else if (op1Current?.type === 'insert') {
        newOps1.push({ type: 'insert', text: op1Current.text });
        newOps2.push({ type: 'retain', length: op1Current.text?.length || 0 });
        op1Current = ops1[++i1];
      }
      else if (op2Current?.type === 'insert') {
        newOps1.push({ type: 'retain', length: op2Current.text?.length || 0 });
        newOps2.push({ type: 'insert', text: op2Current.text });
        op2Current = ops2[++i2];
      }
      // Handle delete vs delete
      else if (op1Current?.type === 'delete' && op2Current?.type === 'delete') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      }
      // Handle delete vs retain
      else if (op1Current?.type === 'delete' && op2Current?.type === 'retain') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        newOps1.push({ type: 'delete', length: minLength });
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      }
      else if (op1Current?.type === 'retain' && op2Current?.type === 'delete') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        newOps2.push({ type: 'delete', length: minLength });
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      }
      else {
        // Move to next operation if current is consumed
        if (!op1Current) op1Current = ops1[++i1];
        if (!op2Current) op2Current = ops2[++i2];
      }
    }

    return [
      {
        ops: this.normalizeOps(newOps1),
        baseLength: op1.baseLength,
        targetLength: this.calculateTargetLength(op1.baseLength, newOps1),
        meta: op1.meta
      },
      {
        ops: this.normalizeOps(newOps2),
        baseLength: op2.baseLength,
        targetLength: this.calculateTargetLength(op2.baseLength, newOps2),
        meta: op2.meta
      }
    ];
  }

  // Compose two sequential operations into one
  static compose(op1: TextOperation, op2: TextOperation): TextOperation {
    if (op1.targetLength !== op2.baseLength) {
      throw new Error('Operations cannot be composed: target length mismatch');
    }

    const ops1 = [...op1.ops];
    const ops2 = [...op2.ops];
    const newOps: Operation[] = [];

    let i1 = 0, i2 = 0;
    let op1Current = ops1[i1];
    let op2Current = ops2[i2];

    while (op1Current || op2Current) {
      if (op1Current?.type === 'delete') {
        newOps.push(op1Current);
        op1Current = ops1[++i1];
      } else if (op2Current?.type === 'insert') {
        newOps.push(op2Current);
        op2Current = ops2[++i2];
      } else if (op1Current?.type === 'retain' && op2Current?.type === 'retain') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        newOps.push({ type: 'retain', length: minLength });
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      } else if (op1Current?.type === 'insert' && op2Current?.type === 'retain') {
        const insertLength = op1Current.text?.length || 0;
        const retainLength = op2Current.length || 0;
        
        if (insertLength <= retainLength) {
          newOps.push({ type: 'insert', text: op1Current.text });
          op1Current = ops1[++i1];
          op2Current = this.consumeOperation(op2Current, insertLength) || ops2[++i2];
        } else {
          const partialText = op1Current.text?.slice(0, retainLength) || '';
          newOps.push({ type: 'insert', text: partialText });
          op1Current = { type: 'insert', text: op1Current.text?.slice(retainLength) };
          op2Current = ops2[++i2];
        }
      } else if (op1Current?.type === 'insert' && op2Current?.type === 'delete') {
        const insertLength = op1Current.text?.length || 0;
        const deleteLength = op2Current.length || 0;
        
        if (insertLength <= deleteLength) {
          op1Current = ops1[++i1];
          op2Current = this.consumeOperation(op2Current, insertLength) || ops2[++i2];
        } else {
          op1Current = { type: 'insert', text: op1Current.text?.slice(deleteLength) };
          op2Current = ops2[++i2];
        }
      } else if (op1Current?.type === 'retain' && op2Current?.type === 'delete') {
        const minLength = Math.min(op1Current.length || 0, op2Current.length || 0);
        newOps.push({ type: 'delete', length: minLength });
        op1Current = this.consumeOperation(op1Current, minLength) || ops1[++i1];
        op2Current = this.consumeOperation(op2Current, minLength) || ops2[++i2];
      } else {
        if (!op1Current) op1Current = ops1[++i1];
        if (!op2Current) op2Current = ops2[++i2];
      }
    }

    return {
      ops: this.normalizeOps(newOps),
      baseLength: op1.baseLength,
      targetLength: this.calculateTargetLength(op1.baseLength, newOps)
    };
  }

  // Helper method to consume part of an operation
  private static consumeOperation(op: Operation, length: number): Operation | undefined {
    if (op.type === 'retain' || op.type === 'delete') {
      const remaining = (op.length || 0) - length;
      return remaining > 0 ? { ...op, length: remaining } : undefined;
    }
    return undefined;
  }

  // Normalize operations by merging consecutive operations of the same type
  private static normalizeOps(ops: Operation[]): Operation[] {
    const normalized: Operation[] = [];
    
    for (const op of ops) {
      const last = normalized[normalized.length - 1];
      
      if (last && last.type === op.type) {
        if (op.type === 'retain' || op.type === 'delete') {
          last.length = (last.length || 0) + (op.length || 0);
        } else if (op.type === 'insert') {
          last.text = (last.text || '') + (op.text || '');
        }
      } else {
        normalized.push({ ...op });
      }
    }
    
    return normalized.filter(op => {
      if (op.type === 'retain' || op.type === 'delete') {
        return (op.length || 0) > 0;
      }
      return (op.text || '').length > 0;
    });
  }

  // Calculate target length after applying operations
  private static calculateTargetLength(baseLength: number, ops: Operation[]): number {
    let length = baseLength;
    
    for (const op of ops) {
      if (op.type === 'insert') {
        length += op.text?.length || 0;
      } else if (op.type === 'delete') {
        length -= op.length || 0;
      }
    }
    
    return length;
  }

  // Create operation from text changes
  static fromTextChange(oldText: string, newText: string, cursor?: { line: number; column: number }): TextOperation {
    const ops: Operation[] = [];
    let i = 0;
    
    // Find common prefix
    while (i < oldText.length && i < newText.length && oldText[i] === newText[i]) {
      i++;
    }
    
    if (i > 0) {
      ops.push({ type: 'retain', length: i });
    }
    
    // Find common suffix
    let j = 0;
    while (
      j < oldText.length - i &&
      j < newText.length - i &&
      oldText[oldText.length - 1 - j] === newText[newText.length - 1 - j]
    ) {
      j++;
    }
    
    // Handle deletion
    const deleteLength = oldText.length - i - j;
    if (deleteLength > 0) {
      ops.push({ type: 'delete', length: deleteLength });
    }
    
    // Handle insertion
    const insertText = newText.slice(i, newText.length - j);
    if (insertText.length > 0) {
      ops.push({ type: 'insert', text: insertText });
    }
    
    // Retain suffix
    if (j > 0) {
      ops.push({ type: 'retain', length: j });
    }
    
    return {
      ops: this.normalizeOps(ops),
      baseLength: oldText.length,
      targetLength: newText.length,
      meta: {
        userId: '',
        timestamp: Date.now(),
        cursor
      }
    };
  }

  // Invert an operation (for undo functionality)
  static invert(operation: TextOperation, text: string): TextOperation {
    const ops: Operation[] = [];
    let textIndex = 0;
    
    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          ops.push({ type: 'retain', length: op.length });
          textIndex += op.length || 0;
          break;
          
        case 'insert':
          ops.push({ type: 'delete', length: op.text?.length || 0 });
          break;
          
        case 'delete':
          const deletedText = text.slice(textIndex, textIndex + (op.length || 0));
          ops.push({ type: 'insert', text: deletedText });
          textIndex += op.length || 0;
          break;
      }
    }
    
    return {
      ops: this.normalizeOps(ops),
      baseLength: operation.targetLength,
      targetLength: operation.baseLength
    };
  }

  // Enhanced cursor transformation methods
  static transformCursor(cursor: CursorPosition, operation: TextOperation, originalText: string): CursorPosition {
    const offset = this.positionToOffset(cursor, originalText);
    const transformedOffset = this.transformOffset(offset, operation);
    return this.offsetToPosition(transformedOffset, this.applyToText(originalText, operation));
  }

  static transformCursorByOperation(cursor: CursorPosition, operation: TextOperation): CursorPosition {
    let offset = cursor.offset || 0;
    let currentOffset = 0;

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          if (op.length) {
            if (currentOffset + op.length > offset) {
              return {
                ...cursor,
                offset: offset
              };
            }
            currentOffset += op.length;
          }
          break;

        case 'insert':
          if (op.text && currentOffset <= offset) {
            offset += op.text.length;
          }
          break;

        case 'delete':
          if (op.length) {
            if (currentOffset < offset && currentOffset + op.length > offset) {
              offset = currentOffset;
            } else if (currentOffset + op.length <= offset) {
              offset -= op.length;
            }
            currentOffset += op.length;
          }
          break;
      }
    }

    return {
      ...cursor,
      offset: Math.max(0, offset)
    };
  }

  static transformSelection(selection: SelectionRange, operation: TextOperation, originalText: string): SelectionRange {
    return {
      start: this.transformCursor(selection.start, operation, originalText),
      end: this.transformCursor(selection.end, operation, originalText),
      direction: selection.direction
    };
  }

  static transformSelectionByOperation(selection: SelectionRange, operation: TextOperation): SelectionRange {
    return {
      start: this.transformCursorByOperation(selection.start, operation),
      end: this.transformCursorByOperation(selection.end, operation),
      direction: selection.direction
    };
  }

  // Utility methods for position/offset conversion
  static positionToOffset(position: CursorPosition, text: string): number {
    const lines = text.split('\n');
    let offset = 0;

    for (let i = 0; i < Math.min(position.line, lines.length); i++) {
      if (i < position.line) {
        offset += lines[i].length + 1; // +1 for newline
      } else {
        offset += Math.min(position.column, lines[i].length);
      }
    }

    return offset;
  }

  static offsetToPosition(offset: number, text: string): CursorPosition {
    const lines = text.split('\n');
    let currentOffset = 0;

    for (let line = 0; line < lines.length; line++) {
      const lineLength = lines[line].length;

      if (currentOffset + lineLength >= offset) {
        return {
          line,
          column: offset - currentOffset,
          offset
        };
      }

      currentOffset += lineLength + 1; // +1 for newline
    }

    return {
      line: Math.max(0, lines.length - 1),
      column: lines[lines.length - 1]?.length || 0,
      offset
    };
  }

  static transformOffset(offset: number, operation: TextOperation): number {
    let transformedOffset = offset;
    let currentOffset = 0;

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          if (op.length) {
            currentOffset += op.length;
          }
          break;

        case 'insert':
          if (op.text && currentOffset <= offset) {
            transformedOffset += op.text.length;
          }
          break;

        case 'delete':
          if (op.length) {
            if (currentOffset < offset && currentOffset + op.length > offset) {
              transformedOffset = currentOffset;
            } else if (currentOffset + op.length <= offset) {
              transformedOffset -= op.length;
            }
            currentOffset += op.length;
          }
          break;
      }
    }

    return Math.max(0, transformedOffset);
  }

  // Conflict detection methods
  static detectConflicts(op1: TextOperation, op2: TextOperation): boolean {
    const range1 = this.getOperationRange(op1);
    const range2 = this.getOperationRange(op2);

    return this.rangesOverlap(range1, range2);
  }

  static getOperationRange(operation: TextOperation): { start: number; end: number } {
    let start = 0;
    let end = 0;
    let currentOffset = 0;

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          if (op.length) {
            currentOffset += op.length;
          }
          break;

        case 'insert':
          if (op.text) {
            if (start === 0) start = currentOffset;
            end = currentOffset + op.text.length;
          }
          break;

        case 'delete':
          if (op.length) {
            if (start === 0) start = currentOffset;
            end = currentOffset + op.length;
            currentOffset += op.length;
          }
          break;
      }
    }

    return { start, end };
  }

  static rangesOverlap(range1: { start: number; end: number }, range2: { start: number; end: number }): boolean {
    return range1.start < range2.end && range2.start < range1.end;
  }
}
