/**
 * Type definitions for PRP (Product Requirement Prompt) system
 */

export interface PRP {
  /** Unique identifier for the PRP */
  id: string;
  
  /** Feature name */
  feature: string;
  
  /** Current status of the PRP */
  status: 'draft' | 'active' | 'executing' | 'completed' | 'failed';
  
  /** PRP content sections */
  content: {
    goal: string;
    why: string;
    what: string;
    context: PRPContext;
    implementationBlueprint: string;
    validationLoop: ValidationGate[];
    successCriteria: string[];
  };
  
  /** Metadata */
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    executedAt?: Date;
    completedAt?: Date;
    confidenceScore?: number;
  };
}

export interface PRPContext {
  /** Documentation references */
  documentation: Array<{
    url?: string;
    file?: string;
    why: string;
    section?: string;
  }>;
  
  /** Code examples from codebase */
  codeExamples: Array<{
    file: string;
    description: string;
    snippet?: string;
  }>;
  
  /** Known gotchas and pitfalls */
  gotchas: string[];
  
  /** Existing patterns to follow */
  patterns: string[];
}

export interface ValidationGate {
  /** Gate level (1: syntax, 2: tests, 3: integration, etc.) */
  level: number;
  
  /** Gate name */
  name: string;
  
  /** Commands to execute */
  commands: string[];
  
  /** Expected outcome */
  expectedOutcome?: string;
  
  /** Whether this gate is required */
  required: boolean;
}

export interface PRPExecutionResult {
  /** PRP that was executed */
  prpId: string;
  
  /** Execution status */
  status: 'success' | 'failed' | 'partial';
  
  /** Validation results */
  validationResults: Array<{
    gate: string;
    passed: boolean;
    output?: string;
    error?: string;
  }>;
  
  /** Files created or modified */
  filesChanged: string[];
  
  /** Execution metadata */
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    errors: string[];
  };
}

export interface PRPCreationOptions {
  /** Feature description */
  feature: string;
  
  /** Additional context to include */
  additionalContext?: string;
  
  /** Whether to perform deep research */
  deepResearch?: boolean;
  
  /** Specific files to analyze */
  filesToAnalyze?: string[];
  
  /** External URLs to research */
  urlsToResearch?: string[];
}

export interface PRPExecutionOptions {
  /** Whether to run in interactive mode */
  interactive?: boolean;
  
  /** Whether to skip certain validation gates */
  skipGates?: number[];
  
  /** Whether to continue on validation failures */
  continueOnFailure?: boolean;
  
  /** Custom validation commands to add */
  additionalValidation?: ValidationGate[];
}