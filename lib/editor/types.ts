/**
 * Editor Type Definitions
 * 
 * Common types used across editor components
 */

export type ConflictResolutionStrategy = 
  | 'last-write-wins' 
  | 'first-write-wins' 
  | 'manual' 
  | 'merge';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  isActive: boolean;
}

export interface ChangeEvent {
  newContent: string;
  version: number;
  operation: any;
  conflicts?: any[];
}