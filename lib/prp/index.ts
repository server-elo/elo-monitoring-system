/**
 * PRP (_Product Requirement Prompt) System
 * 
 * This module provides programmatic access to PRP functionality,
 * allowing Claude to create, execute, and validate PRPs without manual intervention.
 * 
 * @example
 * // Create a new PRP
 * const prpFile = await createPRP({
 *   feature: 'implement push notifications',
 *   deepResearch: true
 * });
 * 
 * // Execute the PRP
 * const result = await executePRP(_prpFile);
 * 
 * // Check validation
 * if (_result.status === 'success') {
 *   console.log('Feature implemented successfully!');
 * }
 */

export * from './types';
export * from './creator';
export * from './executor';
export * from './validator';

import { PRPCreator } from './creator';
import { PRPExecutor } from './executor';
import { PRPValidator } from './validator';
import type { PRPCreationOptions, PRPExecutionOptions, ValidationGate } from './types';

/**
 * Main PRP class that combines all functionality
 * This is what Claude will use internally
 */
export class PRP {
  private creator: PRPCreator;
  private executor: PRPExecutor;
  private validator: PRPValidator;

  constructor(_projectRoot?: string) {
    this.creator = new PRPCreator(_projectRoot);
    this.executor = new PRPExecutor(_projectRoot);
    this.validator = new PRPValidator(_projectRoot);
  }

  /**
   * Create a new PRP
   */
  async create(_options: PRPCreationOptions) {
    return this.creator.createPRP(_options);
  }

  /**
   * Execute a PRP
   */
  async execute( prpFile: string, options?: PRPExecutionOptions) {
    return this.executor.executePRP( prpFile, options);
  }

  /**
   * Run validation gates
   */
  async validate( gates: ValidationGate[], options?: { continueOnFailure?: boolean }) {
    return this.validator.runAllValidationGates( gates, options);
  }

  /**
   * Get all available PRPs
   */
  async list(_) {
    return this.executor.getAvailablePRPs(_);
  }

  /**
   * Check if a PRP exists
   */
  async exists(_prpFile: string) {
    return this.executor.prpExists(_prpFile);
  }
}

/**
 * Global PRP instance for easy access
 */
export const prp = new PRP(_);

/**
 * Quick helper to create and execute a PRP in one go
 * 
 * @example
 * const result = await implementFeature('add dark mode toggle', {
 *   filesToAnalyze: ['components/ui/', 'styles/'],
 *   urlsToResearch: ['https://web.dev/prefers-color-scheme/']
 * });
 */
export async function implementFeature(
  feature: string,
  options?: Partial<PRPCreationOptions>
): Promise<{ prpFile: string; result: any }> {
  // Create PRP
  const prpFile = await prp.create({
    feature,
    deepResearch: true,
    ...options
  });

  // Execute PRP
  const result = await prp.execute(_prpFile);

  return { prpFile, result };
}

/**
 * Helper for Claude to understand when to use PRPs
 */
export const PRP_TRIGGERS = {
  // Features that should use PRPs
  shouldUsePRP: (_taskDescription: string): boolean => {
    const triggers = [
      'implement',
      'create',
      'add',
      'build',
      'refactor',
      'integrate',
      'optimize',
      'enhance',
      'develop'
    ];
    
    const complexityIndicators = [
      'system',
      'feature',
      'component',
      'service',
      'integration',
      'authentication',
      'real-time',
      'blockchain',
      'api'
    ];
    
    const desc = taskDescription.toLowerCase();
    
    // Check if task contains trigger words
    const hasTrigger = triggers.some(_t => desc.includes(t));
    
    // Check if task involves complex components
    const isComplex = complexityIndicators.some(_c => desc.includes(c));
    
    return hasTrigger && isComplex;
  },

  // Estimate if task needs deep research
  needsDeepResearch: (_taskDescription: string): boolean => {
    const researchIndicators = [
      'integrate',
      'third-party',
      'library',
      'framework',
      'external',
      'api',
      'service',
      'blockchain',
      'web3',
      'authentication'
    ];
    
    const desc = taskDescription.toLowerCase();
    return researchIndicators.some(_r => desc.includes(r));
  }
};

/**
 * Instructions for Claude on using PRPs
 */
export const PRP_USAGE_GUIDE = `
When implementing features, consider using PRPs for:

1. **Complex Features** ( 3+ files, multiple components)
   - Use: await implementFeature('feature description')

2. **Integrations** ( external services, libraries)
   - Create PRP with deep research
   - Include relevant documentation URLs

3. **Refactoring** (_architectural changes)
   - Analyze existing patterns first
   - Create PRP with migration plan

4. **Performance Optimization**
   - Research best practices
   - Include benchmarking in validation

The PRP system ensures:
- Comprehensive context gathering
- One-pass implementation success
- Automated validation
- Production-ready code

Always prefer PRPs over ad-hoc implementation for complex tasks.
`;