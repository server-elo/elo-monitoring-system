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

const execAsync = promisify(exec);

export class PRPExecutor {
  private projectRoot: string;
  private prpPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.prpPath = path.join(projectRoot, 'PRPs');
  }

  /**
   * Load a PRP from file
   */
  async loadPRP(prpFile: string): Promise<string> {
    const fullPath = path.join(this.prpPath, prpFile);
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to load PRP from ${fullPath}: ${error}`);
    }
  }

  /**
   * Parse PRP content into structured format
   */
  parsePRP(content: string): Partial<PRP> {
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
    const goalMatch = content.match(/## Goal\s*([\s\S]*?)(?=##|$)/);
    if (goalMatch) sections.goal = goalMatch[1].trim();

    const whyMatch = content.match(/## Why\s*([\s\S]*?)(?=##|$)/);
    if (whyMatch) sections.why = whyMatch[1].trim();

    const whatMatch = content.match(/## What\s*([\s\S]*?)(?=##|$)/);
    if (whatMatch) sections.what = whatMatch[1].trim();

    // Extract validation gates
    const validationMatch = content.match(/## Validation Loop\s*([\s\S]*?)(?=##|$)/);
    if (validationMatch) {
      const validationContent = validationMatch[1];
      const gates = this.parseValidationGates(validationContent);
      sections.validationLoop = gates;
    }

    // Extract success criteria
    const successMatch = content.match(/### Success Criteria\s*([\s\S]*?)(?=##|###|$)/);
    if (successMatch) {
      const criteria = successMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('- [ ]'))
        .map(line => line.replace('- [ ]', '').trim());
      sections.successCriteria = criteria;
    }

    return {
      content: sections as PRP['content']
    };
  }

  /**
   * Parse validation gates from PRP content
   */
  private parseValidationGates(content: string): ValidationGate[] {
    const gates: ValidationGate[] = [];
    const levelRegex = /### Level (\d+):\s*(.+)\s*\n([\s\S]*?)(?=###|$)/g;
    
    let match;
    while ((match = levelRegex.exec(content)) !== null) {
      const level = parseInt(match[1]);
      const name = match[2].trim();
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
    
    for (const gate of gates) {
      // Skip if requested
      if (options.skipGates?.includes(gate.level)) {
        continue;
      }

      console.log(`Executing validation gate: ${gate.name} (Level ${gate.level})`);
      
      for (const command of gate.commands) {
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
            console.error(`Validation failed: ${gate.name}`);
            break;
          }
        } catch (error) {
          results.push({
            gate: `${gate.name} - ${command}`,
            passed: false,
            error: error instanceof Error ? error.message : String(error)
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
    const startTime = new Date();
    const errors: string[] = [];
    const filesChanged: string[] = [];

    try {
      // 1. Load PRP
      console.log(`Loading PRP: ${prpFile}`);
      const prpContent = await this.loadPRP(prpFile);
      const prp = this.parsePRP(prpContent);

      // 2. Understand context (this would be done by Claude)
      console.log('Analyzing PRP context and requirements...');
      
      // 3. Execute implementation (placeholder - Claude would implement here)
      console.log('Executing implementation blueprint...');
      
      // 4. Run validation gates
      console.log('Running validation gates...');
      const validationResults = await this.executeValidationGates(
        prp.content?.validationLoop || [],
        options
      );

      // 5. Check success
      const allPassed = validationResults.every(r => r.passed);
      const status = allPassed ? 'success' : validationResults.some(r => r.passed) ? 'partial' : 'failed';

      // 6. Move to completed if successful
      if (status === 'success') {
        const completedPath = path.join(this.prpPath, 'completed', path.basename(prpFile));
        await fs.mkdir(path.dirname(completedPath), { recursive: true });
        await fs.rename(
          path.join(this.prpPath, prpFile),
          completedPath
        );
        console.log(`PRP moved to completed: ${completedPath}`);
      }

      const endTime = new Date();

      return {
        prpId: prpFile,
        status,
        validationResults,
        filesChanged,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          errors
        }
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      
      return {
        prpId: prpFile,
        status: 'failed',
        validationResults: [],
        filesChanged,
        metadata: {
          startTime,
          endTime: new Date(),
          duration: new Date().getTime() - startTime.getTime(),
          errors
        }
      };
    }
  }

  /**
   * Get all available PRPs
   */
  async getAvailablePRPs(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.prpPath);
      return files.filter(f => f.endsWith('.md') && f !== 'README.md');
    } catch (error) {
      console.error('Failed to list PRPs:', error);
      return [];
    }
  }

  /**
   * Check if a PRP exists
   */
  async prpExists(prpFile: string): Promise<boolean> {
    const fullPath = path.join(this.prpPath, prpFile);
    try {
      await fs.access(fullPath);
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
 * if (result.status === 'success') {
 *   console.log('Feature implemented successfully!');
 * }
 */
export async function executePRP(
  prpFile: string,
  options?: PRPExecutionOptions
): Promise<PRPExecutionResult> {
  const executor = new PRPExecutor();
  return executor.executePRP(prpFile, options);
}

/**
 * Get validation commands from a PRP
 * Useful for running validation separately
 */
export async function getValidationCommands(prpFile: string): Promise<string[]> {
  const executor = new PRPExecutor();
  const content = await executor.loadPRP(prpFile);
  const prp = executor.parsePRP(content);
  
  const commands: string[] = [];
  for (const gate of prp.content?.validationLoop || []) {
    commands.push(...gate.commands);
  }
  
  return commands;
}