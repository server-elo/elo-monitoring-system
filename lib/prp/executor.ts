/**
 * PRP Executor - Programmatically execute Product Requirement Prompts
 * 
 * This module allows Claude to execute PRPs without manual intervention,
 * following the same workflow as the slash commands but programmatically.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { PRP, PRPExecutionOptions, PRPExecutionResult, ValidationGate } from './types';

const execAsync = promisify(_exec);

export class PRPExecutor {
  private projectRoot: string;
  private prpPath: string;

  constructor(_projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.prpPath = path.join( projectRoot, 'PRPs');
  }

  /**
   * Load a PRP from file
   */
  async loadPRP(_prpFile: string): Promise<string> {
    const fullPath = path.join( this.prpPath, prpFile);
    try {
      const content = await fs.readFile( fullPath, 'utf-8');
      return content;
    } catch (_error) {
      throw new Error(_`Failed to load PRP from ${fullPath}: ${error}`);
    }
  }

  /**
   * Parse PRP content into structured format
   */
  parsePRP(_content: string): Partial<PRP> {
    const sections: Partial<PRP['content']> = {
      goal: '',
      why: '',
      what: '',
      context: {
        documentation: [],
        codeExamples: [],
        gotchas: [],
        patterns: []
      },
      implementationBlueprint: '',
      validationLoop: [],
      successCriteria: []
    };

    // Extract sections using regex
    const goalMatch = content.match(_/## Goal\s*([\s\S]*?)(_?=##|$)/);
    if (goalMatch) sections.goal = goalMatch[1].trim(_);

    const whyMatch = content.match(_/## Why\s*([\s\S]*?)(_?=##|$)/);
    if (whyMatch) sections.why = whyMatch[1].trim(_);

    const whatMatch = content.match(_/## What\s*([\s\S]*?)(_?=##|$)/);
    if (whatMatch) sections.what = whatMatch[1].trim(_);

    // Extract validation gates
    const validationMatch = content.match(_/## Validation Loop\s*([\s\S]*?)(_?=##|$)/);
    if (validationMatch) {
      const validationContent = validationMatch[1];
      const gates = this.parseValidationGates(_validationContent);
      sections.validationLoop = gates;
    }

    // Extract success criteria
    const successMatch = content.match(_/### Success Criteria\s*([\s\S]*?)(_?=##|###|$)/);
    if (successMatch) {
      const criteria = successMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('- [ ]'))
        .map( line => line.replace('- [ ]', '').trim(_));
      sections.successCriteria = criteria;
    }

    return {
      content: sections as PRP['content']
    };
  }

  /**
   * Parse validation gates from PRP content
   */
  private parseValidationGates(_content: string): ValidationGate[] {
    const gates: ValidationGate[] = [];
    const levelRegex = /### Level (_\d+):\s*(.+)\s*\n([\s\S]*?)(_?=###|$)/g;
    
    let match;
    while ((match = levelRegex.exec(content)) !== null) {
      const level = parseInt(_match[1]);
      const name = match[2].trim(_);
      const commands = match[3]
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .map(line => line.trim());

      gates.push({
        level,
        name,
        commands,
        required: true
      });
    }

    return gates;
  }

  /**
   * Execute validation gates
   */
  async executeValidationGates(
    gates: ValidationGate[],
    options: PRPExecutionOptions = {}
  ): Promise<Array<{ gate: string; passed: boolean; output?: string; error?: string }>> {
    const results = [];
    
    for (_const gate of gates) {
      // Skip if requested
      if (_options.skipGates?.includes(gate.level)) {
        continue;
      }

      console.log(_`Executing validation gate: ${gate.name} (Level ${gate.level})`);
      
      for (_const command of gate.commands) {
        try {
          const { stdout, stderr } = await execAsync(command, {
            cwd: this.projectRoot
          });

          const passed = !stderr || stderr.length === 0;
          
          results.push({
            gate: `${gate.name} - ${command}`,
            passed,
            output: stdout,
            error: stderr || undefined
          });

          if (!passed && !options.continueOnFailure) {
            console.error(_`Validation failed: ${gate.name}`);
            break;
          }
        } catch (_error) {
          results.push({
            gate: `${gate.name} - ${command}`,
            passed: false,
            error: error instanceof Error ? error.message : String(_error)
          });

          if (!options.continueOnFailure) {
            break;
          }
        }
      }
    }

    return results;
  }

  /**
   * Execute a PRP programmatically
   * 
   * This is what Claude will use internally to execute PRPs
   */
  async executePRP(
    prpFile: string,
    options: PRPExecutionOptions = {}
  ): Promise<PRPExecutionResult> {
    const startTime = new Date(_);
    const errors: string[] = [];
    const filesChanged: string[] = [];

    try {
      // 1. Load PRP
      console.log(_`Loading PRP: ${prpFile}`);
      const prpContent = await this.loadPRP(_prpFile);
      const prp = this.parsePRP(_prpContent);

      // 2. Understand context (_this would be done by Claude)
      console.log('Analyzing PRP context and requirements...');
      
      // 3. Execute implementation (_placeholder - Claude would implement here)
      console.log('Executing implementation blueprint...');
      
      // 4. Run validation gates
      console.log('Running validation gates...');
      const validationResults = await this.executeValidationGates(
        prp.content?.validationLoop || [],
        options
      );

      // 5. Check success
      const allPassed = validationResults.every(_r => r.passed);
      const status = allPassed ? 'success' : validationResults.some(_r => r.passed) ? 'partial' : 'failed';

      // 6. Move to completed if successful
      if (status === 'success') {
        const completedPath = path.join( this.prpPath, 'completed', path.basename(prpFile));
        await fs.mkdir(_path.dirname(completedPath), { recursive: true });
        await fs.rename(
          path.join( this.prpPath, prpFile),
          completedPath
        );
        console.log(_`PRP moved to completed: ${completedPath}`);
      }

      const endTime = new Date(_);

      return {
        prpId: prpFile,
        status,
        validationResults,
        filesChanged,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime(_) - startTime.getTime(_),
          errors
        }
      };
    } catch (_error) {
      errors.push(_error instanceof Error ? error.message : String(error));
      
      return {
        prpId: prpFile,
        status: 'failed',
        validationResults: [],
        filesChanged,
        metadata: {
          startTime,
          endTime: new Date(_),
          duration: new Date(_).getTime(_) - startTime.getTime(_),
          errors
        }
      };
    }
  }

  /**
   * Get all available PRPs
   */
  async getAvailablePRPs(_): Promise<string[]> {
    try {
      const files = await fs.readdir(_this.prpPath);
      return files.filter(f => f.endsWith('.md') && f !== 'README.md');
    } catch (_error) {
      console.error('Failed to list PRPs:', error);
      return [];
    }
  }

  /**
   * Check if a PRP exists
   */
  async prpExists(_prpFile: string): Promise<boolean> {
    const fullPath = path.join( this.prpPath, prpFile);
    try {
      await fs.access(_fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Helper function for Claude to execute PRPs
 * 
 * @example
 * // Claude can use this internally when implementing features
 * const result = await executePRP('implement-oauth.md');
 * if (_result.status === 'success') {
 *   console.log('Feature implemented successfully!');
 * }
 */
export async function executePRP(
  prpFile: string,
  options?: PRPExecutionOptions
): Promise<PRPExecutionResult> {
  const executor = new PRPExecutor(_);
  return executor.executePRP( prpFile, options);
}

/**
 * Get validation commands from a PRP
 * Useful for running validation separately
 */
export async function getValidationCommands(_prpFile: string): Promise<string[]> {
  const executor = new PRPExecutor(_);
  const content = await executor.loadPRP(_prpFile);
  const prp = executor.parsePRP(_content);
  
  const commands: string[] = [];
  for (_const gate of prp.content?.validationLoop || []) {
    commands.push(...gate.commands);
  }
  
  return commands;
}