/**
 * PRP Validator - Run validation gates programmatically
 * 
 * This module allows Claude to run validation commands from PRPs
 * and check if implementations meet the requirements.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ValidationGate } from './types';

const execAsync = promisify(exec);

export interface ValidationResult {
  gate: string;
  command: string;
  passed: boolean;
  output?: string;
  error?: string;
  duration: number;
}

export interface ValidationSummary {
  totalGates: number;
  passed: number;
  failed: number;
  skipped: number;
  results: ValidationResult[];
  overallSuccess: boolean;
}

export class PRPValidator {
  private projectRoot: string;
  private timeout: number;

  constructor(projectRoot: string = process.cwd(), timeout: number = 30000) {
    this.projectRoot = projectRoot;
    this.timeout = timeout;
  }

  /**
   * Run a single validation command
   */
  async runCommand(command: string): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.projectRoot,
        timeout: this.timeout
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        stdout: stdout || '',
        stderr: stderr || '',
        duration
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || 'Command failed',
        duration
      };
    }
  }

  /**
   * Run a validation gate
   */
  async runValidationGate(gate: ValidationGate): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const command of gate.commands) {
      console.log(`Running: ${command}`);
      
      const { success, stdout, stderr, duration } = await this.runCommand(command);
      
      results.push({
        gate: gate.name,
        command,
        passed: success,
        output: stdout,
        error: stderr || undefined,
        duration
      });
      
      // Stop on first failure unless specified otherwise
      if (!success && gate.required) {
        console.error(`Required validation failed: ${gate.name}`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Run all validation gates
   */
  async runAllValidationGates(
    gates: ValidationGate[],
    options: {
      continueOnFailure?: boolean;
      skipGates?: number[];
    } = {}
  ): Promise<ValidationSummary> {
    const allResults: ValidationResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const gate of gates) {
      // Skip if requested
      if (options.skipGates?.includes(gate.level)) {
        skipped++;
        console.log(`Skipping gate: ${gate.name} (Level ${gate.level})`);
        continue;
      }
      
      console.log(`\nRunning validation gate: ${gate.name} (Level ${gate.level})`);
      
      const results = await this.runValidationGate(gate);
      allResults.push(...results);
      
      const gatePassed = results.every(r => r.passed);
      
      if (gatePassed) {
        passed++;
        console.log(`✅ Gate passed: ${gate.name}`);
      } else {
        failed++;
        console.log(`❌ Gate failed: ${gate.name}`);
        
        // Stop if not continuing on failure
        if (!options.continueOnFailure) {
          break;
        }
      }
    }
    
    return {
      totalGates: gates.length,
      passed,
      failed,
      skipped,
      results: allResults,
      overallSuccess: failed === 0
    };
  }

  /**
   * Run specific validation commands
   */
  async runValidationCommands(commands: string[]): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const command of commands) {
      const { success, stdout, stderr, duration } = await this.runCommand(command);
      
      results.push({
        gate: 'Manual',
        command,
        passed: success,
        output: stdout,
        error: stderr || undefined,
        duration
      });
    }
    
    return results;
  }

  /**
   * Common validation patterns
   */
  static commonValidations = {
    typescript: ['npm run type-check'],
    lint: ['npm run lint'],
    test: ['npm test'],
    build: ['npm run build'],
    format: ['npm run format:check']
  };

  /**
   * Run common validations
   */
  async runCommonValidations(types: Array<keyof typeof PRPValidator.commonValidations>): Promise<ValidationSummary> {
    const gates: ValidationGate[] = types.map((type, index) => ({
      level: index + 1,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      commands: PRPValidator.commonValidations[type],
      required: true
    }));
    
    return this.runAllValidationGates(gates);
  }

  /**
   * Format validation results for display
   */
  formatResults(summary: ValidationSummary): string {
    const lines: string[] = [];
    
    lines.push('=== Validation Summary ===');
    lines.push(`Total Gates: ${summary.totalGates}`);
    lines.push(`Passed: ${summary.passed} ✅`);
    lines.push(`Failed: ${summary.failed} ❌`);
    lines.push(`Skipped: ${summary.skipped} ⏭️`);
    lines.push(`Overall: ${summary.overallSuccess ? 'SUCCESS ✅' : 'FAILED ❌'}`);
    lines.push('');
    
    if (summary.results.length > 0) {
      lines.push('=== Detailed Results ===');
      
      for (const result of summary.results) {
        lines.push(`\n${result.passed ? '✅' : '❌'} ${result.gate}: ${result.command}`);
        lines.push(`   Duration: ${result.duration}ms`);
        
        if (!result.passed && result.error) {
          lines.push(`   Error: ${result.error.split('\n')[0]}`);
        }
      }
    }
    
    return lines.join('\n');
  }
}

/**
 * Helper function for Claude to run validations
 * 
 * @example
 * // Claude can use this to validate implementations
 * const summary = await runValidation([
 *   { level: 1, name: 'TypeScript', commands: ['npm run type-check'], required: true },
 *   { level: 2, name: 'Tests', commands: ['npm test'], required: true }
 * ]);
 * 
 * if (summary.overallSuccess) {
 *   console.log('All validations passed!');
 * }
 */
export async function runValidation(
  gates: ValidationGate[],
  options?: { continueOnFailure?: boolean; skipGates?: number[] }
): Promise<ValidationSummary> {
  const validator = new PRPValidator();
  return validator.runAllValidationGates(gates, options);
}

/**
 * Run common project validations
 */
export async function runProjectValidation(): Promise<ValidationSummary> {
  const validator = new PRPValidator();
  return validator.runCommonValidations(['typescript', 'lint', 'test']);
}

/**
 * Check if a specific command passes
 */
export async function checkCommand(command: string): Promise<boolean> {
  const validator = new PRPValidator();
  const result = await validator.runCommand(command);
  return result.success;
}