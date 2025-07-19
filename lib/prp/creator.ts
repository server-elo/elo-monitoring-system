/**
 * PRP Creator - Programmatically create Product Requirement Prompts
 * 
 * This module allows Claude to create PRPs following the same methodology
 * as the /prp-base-create command but programmatically.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { PRPCreationOptions, PRP, PRPContext } from './types';

export class PRPCreator {
  private projectRoot: string;
  private prpPath: string;
  private templatePath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.prpPath = path.join(projectRoot, 'PRPs');
    this.templatePath = path.join(this.prpPath, 'templates');
  }

  /**
   * Load PRP template
   */
  async loadTemplate(templateName: string = 'prp_base.md'): Promise<string> {
    const fullPath = path.join(this.templatePath, templateName);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load template ${templateName}: ${error}`);
    }
  }

  /**
   * Research codebase for similar patterns
   * This simulates what Claude would do during research phase
   */
  async researchCodebase(feature: string, filesToAnalyze?: string[]): Promise<{
    patterns: string[];
    examples: Array<{ file: string; description: string }>;
  }> {
    // In reality, Claude would use grep, find, and analysis tools
    // This is a placeholder showing the structure
    const patterns: string[] = [];
    const examples: Array<{ file: string; description: string }> = [];

    // Placeholder for codebase research
    console.log(`Researching codebase for patterns related to: ${feature}`);
    
    if (filesToAnalyze) {
      for (const file of filesToAnalyze) {
        console.log(`Analyzing file: ${file}`);
        // Claude would actually read and analyze these files
      }
    }

    return { patterns, examples };
  }

  /**
   * Research external documentation
   * This simulates what Claude would do for external research
   */
  async researchExternal(feature: string, urls?: string[]): Promise<{
    documentation: Array<{ url: string; why: string; section?: string }>;
    bestPractices: string[];
  }> {
    // Placeholder for external research
    console.log(`Researching external resources for: ${feature}`);
    
    const documentation: Array<{ url: string; why: string; section?: string }> = [];
    const bestPractices: string[] = [];

    if (urls) {
      for (const url of urls) {
        console.log(`Researching URL: ${url}`);
        // Claude would fetch and analyze these URLs
      }
    }

    return { documentation, bestPractices };
  }

  /**
   * Generate PRP content based on research
   */
  generatePRPContent(
    feature: string,
    context: PRPContext,
    template: string
  ): string {
    // This is a simplified version - Claude would generate much richer content
    let content = template;

    // Replace placeholders
    content = content.replace(/\{feature\}/g, feature);
    content = content.replace(/\{goal\}/g, `Implement ${feature}`);
    content = content.replace(/\{why\}/g, `To enable ${feature} functionality for users`);
    
    // Add context sections
    if (context.documentation.length > 0) {
      const docSection = context.documentation
        .map(doc => `- ${doc.url ? `url: ${doc.url}` : `file: ${doc.file}`}\n  why: ${doc.why}`)
        .join('\n\n');
      content = content.replace(/\{documentation\}/g, docSection);
    }

    if (context.gotchas.length > 0) {
      const gotchasSection = context.gotchas
        .map(gotcha => `# CRITICAL: ${gotcha}`)
        .join('\n\n');
      content = content.replace(/\{gotchas\}/g, gotchasSection);
    }

    return content;
  }

  /**
   * Create a new PRP programmatically
   * 
   * This is what Claude will use internally to create PRPs
   */
  async createPRP(options: PRPCreationOptions): Promise<string> {
    const { feature, additionalContext, deepResearch = true, filesToAnalyze, urlsToResearch } = options;
    
    console.log(`Creating PRP for feature: ${feature}`);

    // 1. Load template
    const template = await this.loadTemplate();

    // 2. Research phase
    const context: PRPContext = {
      documentation: [],
      codeExamples: [],
      gotchas: [],
      patterns: []
    };

    if (deepResearch) {
      // Codebase research
      const codebaseResearch = await this.researchCodebase(feature, filesToAnalyze);
      context.patterns = codebaseResearch.patterns;
      context.codeExamples = codebaseResearch.examples;

      // External research
      const externalResearch = await this.researchExternal(feature, urlsToResearch);
      context.documentation = externalResearch.documentation;
      
      // Add best practices as gotchas
      context.gotchas.push(...externalResearch.bestPractices);
    }

    // 3. Generate PRP content
    let prpContent = this.generatePRPContent(feature, context, template);

    // 4. Add additional context if provided
    if (additionalContext) {
      prpContent += `\n\n## Additional Context\n\n${additionalContext}`;
    }

    // 5. Save PRP
    const filename = this.generateFilename(feature);
    const fullPath = path.join(this.prpPath, filename);
    
    await fs.mkdir(this.prpPath, { recursive: true });
    await fs.writeFile(fullPath, prpContent, 'utf-8');
    
    console.log(`PRP created: ${filename}`);
    
    return filename;
  }

  /**
   * Generate a filename for the PRP
   */
  private generateFilename(feature: string): string {
    // Convert feature name to kebab-case
    const kebabCase = feature
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${kebabCase}.md`;
  }

  /**
   * Create a PRP from existing command content
   * This allows Claude to use the command templates directly
   */
  async createPRPFromCommand(commandPath: string, args: string): Promise<string> {
    // Load the command template
    const commandContent = await fs.readFile(commandPath, 'utf-8');
    
    // Replace $ARGUMENTS placeholder
    const prpContent = commandContent.replace(/\$ARGUMENTS/g, args);
    
    // Extract feature name from arguments
    const feature = args.split(' ').slice(0, 3).join(' ');
    const filename = this.generateFilename(feature);
    const fullPath = path.join(this.prpPath, filename);
    
    await fs.mkdir(this.prpPath, { recursive: true });
    await fs.writeFile(fullPath, prpContent, 'utf-8');
    
    return filename;
  }

  /**
   * Update an existing PRP with new information
   */
  async updatePRP(prpFile: string, updates: Partial<PRP['content']>): Promise<void> {
    const fullPath = path.join(this.prpPath, prpFile);
    
    try {
      let content = await fs.readFile(fullPath, 'utf-8');
      
      // Update sections as needed
      if (updates.goal) {
        content = content.replace(
          /## Goal\s*([\s\S]*?)(?=##|$)/,
          `## Goal\n\n${updates.goal}\n\n`
        );
      }
      
      if (updates.why) {
        content = content.replace(
          /## Why\s*([\s\S]*?)(?=##|$)/,
          `## Why\n\n${updates.why}\n\n`
        );
      }
      
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log(`Updated PRP: ${prpFile}`);
    } catch (error) {
      throw new Error(`Failed to update PRP ${prpFile}: ${error}`);
    }
  }
}

/**
 * Helper function for Claude to create PRPs
 * 
 * @example
 * // Claude can use this internally when planning features
 * const prpFile = await createPRP({
 *   feature: 'implement push notifications',
 *   deepResearch: true,
 *   filesToAnalyze: ['components/notifications/', 'public/sw.js'],
 *   urlsToResearch: ['https://web.dev/push-notifications/']
 * });
 */
export async function createPRP(options: PRPCreationOptions): Promise<string> {
  const creator = new PRPCreator();
  return creator.createPRP(options);
}

/**
 * Create a quick PRP without deep research
 * Useful for simpler features
 */
export async function createQuickPRP(feature: string): Promise<string> {
  const creator = new PRPCreator();
  return creator.createPRP({
    feature,
    deepResearch: false
  });
}