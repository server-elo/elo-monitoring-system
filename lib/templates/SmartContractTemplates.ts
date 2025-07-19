/**
 * Smart Contract Template System
 * 
 * Create graduated complexity template system with best practice enforcement
 * using our security scanner and adaptive learning integration.
 */

import { SecurityScanner } from '@/lib/security/SecurityScanner';
import { adaptiveLearningEngine, LearningProfile } from '@/lib/learning/AdaptiveLearningEngine';

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'basic' | 'defi' | 'nft' | 'dao' | 'infrastructure' | 'advanced';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  complexity: number; // 1-10 scale
  estimatedTime: number; // minutes
  prerequisites: string[];
  learningObjectives: string[];
  concepts: string[];
  template: string;
  placeholders: TemplatePlaceholder[];
  bestPractices: BestPractice[];
  securityChecks: SecurityCheck[];
  gasOptimizations: GasOptimization[];
  testCases: TemplateTestCase[];
  documentation: TemplateDocumentation;
  realWorldExamples: string[];
  nextTemplates: string[];
  customizationOptions: CustomizationOption[];
}

export interface TemplatePlaceholder {
  id: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'address' | 'bool' | 'array' | 'custom';
  required: boolean;
  defaultValue?: any;
  validation: ValidationRule[];
  examples: string[];
  hint: string;
}

export interface ValidationRule {
  type: 'length' | 'range' | 'pattern' | 'custom';
  value: any;
  message: string;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: 'security' | 'gas' | 'style' | 'maintainability';
  importance: 'low' | 'medium' | 'high' | 'critical';
  codeExample: string;
  explanation: string;
  resources: string[];
  enforcementLevel: 'suggestion' | 'warning' | 'error';
}

export interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  fix: string;
  autoFixable: boolean;
  category: 'access-control' | 'reentrancy' | 'overflow' | 'visibility' | 'general';
}

export interface GasOptimization {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  optimization: string;
  gasSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tradeoffs: string[];
}

export interface TemplateTestCase {
  id: string;
  name: string;
  description: string;
  testCode: string;
  expectedBehavior: string;
  category: 'functionality' | 'security' | 'gas' | 'edge-case';
}

export interface TemplateDocumentation {
  overview: string;
  usage: string;
  parameters: string;
  examples: string;
  troubleshooting: string;
  references: string[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'modifier' | 'extension';
  code: string;
  dependencies: string[];
  complexity: number;
}

export interface TemplateCustomization {
  templateId: string;
  userId: string;
  placeholderValues: Record<string, any>;
  selectedOptions: string[];
  customCode?: string;
  userNotes?: string;
  timestamp: Date;
}

export interface GeneratedContract {
  id: string;
  templateId: string;
  userId: string;
  code: string;
  customization: TemplateCustomization;
  securityAnalysis: any;
  gasAnalysis: any;
  qualityScore: number;
  suggestions: string[];
  warnings: string[];
  errors: string[];
  deploymentReady: boolean;
  generatedAt: Date;
}

export class SmartContractTemplates {
  private _securityScanner: SecurityScanner;
  private templates: Map<string, ContractTemplate> = new Map();
  private userCustomizations: Map<string, TemplateCustomization[]> = new Map();

  constructor(securityScanner: SecurityScanner) {
    this._securityScanner = securityScanner;
    this.initializeTemplates();
  }

  // Get personalized template recommendations
  async getRecommendedTemplates(userId: string): Promise<ContractTemplate[]> {
    console.log(`🎯 Getting template recommendations for user ${userId}`);
    
    try {
      // Get user's learning profile
      const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
      
      // Calculate user's overall skill level
      const skillLevel = this.calculateOverallSkillLevel(profile);
      
      // Get templates matching user's level and interests
      const allTemplates = Array.from(this.templates.values());
      const recommendations = allTemplates
        .filter(template => this.isTemplateAppropriate(template, profile, skillLevel))
        .sort((a, b) => this.calculateRelevanceScore(b, profile) - this.calculateRelevanceScore(a, profile))
        .slice(0, 8);
      
      console.log(`✅ Found ${recommendations.length} recommended templates`);
      return recommendations;
      
    } catch (error) {
      console.error('Template recommendation failed:', error);
      return this.getDefaultTemplates();
    }
  }

  // Generate contract from template
  async generateContract(
    templateId: string,
    userId: string,
    customization: Omit<TemplateCustomization, 'templateId' | 'userId' | 'timestamp'>
  ): Promise<GeneratedContract> {
    console.log(`🏗️ Generating contract from template ${templateId}`);
    
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }
      
      // Validate customization
      this.validateCustomization(template, customization);
      
      // Generate code from template
      const code = this.processTemplate(template, customization);
      
      // Run security and gas analysis
      const [securityAnalysis, gasAnalysis] = await Promise.all([
        this.analyzeContractSecurity(code, userId),
        this.analyzeContractGas(code, userId)
      ]);
      
      // Calculate quality score
      const qualityScore = this.calculateQualityScore(securityAnalysis, gasAnalysis, template);
      
      // Generate suggestions and warnings
      const { suggestions, warnings, errors } = this.generateFeedback(
        template,
        securityAnalysis,
        gasAnalysis,
        customization
      );
      
      const generatedContract: GeneratedContract = {
        id: `contract-${Date.now()}-${userId}`,
        templateId,
        userId,
        code,
        customization: {
          ...customization,
          templateId,
          userId,
          timestamp: new Date()
        },
        securityAnalysis,
        gasAnalysis,
        qualityScore,
        suggestions,
        warnings,
        errors,
        deploymentReady: errors.length === 0 && qualityScore >= 70,
        generatedAt: new Date()
      };
      
      // Save customization for future reference
      await this.saveCustomization(generatedContract.customization);
      
      console.log(`✅ Contract generated successfully (Quality: ${qualityScore})`);
      return generatedContract;
      
    } catch (error) {
      console.error('Contract generation failed:', error);
      throw error;
    }
  }

  // Get template by ID with user-specific enhancements
  async getTemplate(templateId: string, userId?: string): Promise<ContractTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;
    
    if (userId) {
      // Enhance template with user-specific information
      const profile = await adaptiveLearningEngine.analyzeUserPerformance(userId);
      return this.enhanceTemplateForUser(template, profile);
    }
    
    return template;
  }

  // Create custom template from user code
  async createCustomTemplate(
    userId: string,
    name: string,
    description: string,
    code: string,
    category: ContractTemplate['category']
  ): Promise<ContractTemplate> {
    console.log(`🎨 Creating custom template: ${name}`);
    
    try {
      // Analyze the provided code
      const [securityAnalysis, gasAnalysis] = await Promise.all([
        this.analyzeContractSecurity(code, userId),
        this.analyzeContractGas(code, userId)
      ]);
      
      // Extract placeholders from code
      const placeholders = this.extractPlaceholders(code);
      
      // Generate best practices based on analysis
      const bestPractices = this.generateBestPracticesFromAnalysis(securityAnalysis, gasAnalysis);
      
      // Determine difficulty and complexity
      const difficulty = this.determineDifficulty(code, securityAnalysis, gasAnalysis);
      const complexity = this.calculateComplexity(code);
      
      // Generate documentation
      const documentation = await this.generateDocumentation(code, name, description);
      
      const customTemplate: ContractTemplate = {
        id: `custom-${Date.now()}-${userId}`,
        name,
        description,
        category,
        difficulty,
        complexity,
        estimatedTime: this.estimateCompletionTime(complexity, difficulty),
        prerequisites: this.identifyPrerequisites(code),
        learningObjectives: await this.generateLearningObjectives(code, category),
        concepts: this.extractConcepts(code),
        template: code,
        placeholders,
        bestPractices,
        securityChecks: this.generateSecurityChecks(securityAnalysis),
        gasOptimizations: this.generateGasOptimizations(gasAnalysis),
        testCases: await this.generateTestCases(code),
        documentation,
        realWorldExamples: [],
        nextTemplates: [],
        customizationOptions: []
      };
      
      // Save custom template
      this.templates.set(customTemplate.id, customTemplate);
      
      console.log(`✅ Custom template created: ${customTemplate.id}`);
      return customTemplate;
      
    } catch (error) {
      console.error('Custom template creation failed:', error);
      throw error;
    }
  }

  // Validate contract against template best practices
  async validateContract(
    templateId: string,
    code: string,
    userId: string
  ): Promise<ValidationResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    const violations: ValidationViolation[] = [];
    const suggestions: string[] = [];
    
    // Check best practices
    for (const practice of template.bestPractices) {
      const violation = this.checkBestPractice(code, practice);
      if (violation) {
        violations.push(violation);
      }
    }
    
    // Check security patterns
    for (const check of template.securityChecks) {
      if (check.pattern.test(code)) {
        violations.push({
          type: 'security',
          severity: check.severity,
          message: check.message,
          fix: check.fix,
          autoFixable: check.autoFixable,
          line: this.findPatternLine(code, check.pattern)
        });
      }
    }
    
    // Run full security analysis
    const securityAnalysis = await this.analyzeContractSecurity(code, userId);
    
    // Generate improvement suggestions
    if (securityAnalysis) {
      suggestions.push(...this.generateImprovementSuggestions(securityAnalysis, template));
    }
    
    return {
      isValid: violations.filter(v => v.severity === 'critical' || v.severity === 'high').length === 0,
      score: this.calculateValidationScore(violations, template),
      violations,
      suggestions,
      template: template.name
    };
  }

  // Get template progression path
  getTemplatePath(currentTemplateId: string): ContractTemplate[] {
    const current = this.templates.get(currentTemplateId);
    if (!current) return [];
    
    const path: ContractTemplate[] = [current];
    
    // Add next templates in progression
    for (const nextId of current.nextTemplates) {
      const next = this.templates.get(nextId);
      if (next) {
        path.push(next);
      }
    }
    
    return path;
  }

  // Private helper methods
  private initializeTemplates(): void {
    console.log('🔄 Initializing smart contract templates...');
    
    // Initialize with predefined templates
    this.loadPredefinedTemplates();
  }

  private loadPredefinedTemplates(): void {
    // Basic ERC20 Token Template
    const erc20Template: ContractTemplate = {
      id: 'erc20-basic',
      name: 'Basic ERC20 Token',
      description: 'A simple ERC20 token implementation with basic functionality',
      category: 'basic',
      difficulty: 'beginner',
      complexity: 3,
      estimatedTime: 30,
      prerequisites: ['solidity-basics', 'functions', 'modifiers'],
      learningObjectives: [
        'Understand ERC20 standard',
        'Implement token transfers',
        'Learn about allowances',
        'Practice access control'
      ],
      concepts: ['tokens', 'standards', 'mappings', 'events'],
      template: this.getERC20Template(),
      placeholders: this.getERC20Placeholders(),
      bestPractices: this.getERC20BestPractices(),
      securityChecks: this.getERC20SecurityChecks(),
      gasOptimizations: this.getERC20GasOptimizations(),
      testCases: [],
      documentation: this.getERC20Documentation(),
      realWorldExamples: ['USDC', 'DAI', 'LINK'],
      nextTemplates: ['erc20-advanced', 'erc20-mintable'],
      customizationOptions: []
    };
    
    this.templates.set(erc20Template.id, erc20Template);
    
    // Add more templates...
    this.addNFTTemplates();
    this.addDeFiTemplates();
    this.addDAOTemplates();
  }

  private getERC20Template(): string {
    return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{TOKEN_NAME}} is ERC20, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address owner
    ) ERC20(name, symbol) Ownable(owner) {
        _mint(owner, initialSupply * 10**decimals());
    }
    
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
    `.trim();
  }

  private calculateOverallSkillLevel(profile: LearningProfile): number {
    const skillValues = Object.values(profile.skillLevels);
    return skillValues.reduce((sum, level) => sum + level, 0) / skillValues.length;
  }

  private isTemplateAppropriate(
    template: ContractTemplate,
    profile: LearningProfile,
    skillLevel: number
  ): boolean {
    // Check if user meets prerequisites
    const hasPrerequisites = template.prerequisites.every(prereq =>
      profile.skillLevels[prereq] >= 60
    );
    
    // Check difficulty appropriateness
    const difficultyMatch = this.isDifficultyAppropriate(template.difficulty, skillLevel);
    
    return hasPrerequisites && difficultyMatch;
  }

  private isDifficultyAppropriate(difficulty: string, skillLevel: number): boolean {
    switch (difficulty) {
      case 'beginner': return skillLevel <= 60;
      case 'intermediate': return skillLevel >= 40 && skillLevel <= 80;
      case 'advanced': return skillLevel >= 70;
      default: return true;
    }
  }

  // Missing method implementations
  private calculateRelevanceScore(template: ContractTemplate, profile: LearningProfile): number {
    let score = 0;
    
    // Score based on skill level match
    const avgSkillLevel = this.calculateOverallSkillLevel(profile);
    if (this.isDifficultyAppropriate(template.difficulty, avgSkillLevel)) {
      score += 50;
    }
    
    // Score based on concept match
    template.concepts.forEach(concept => {
      if (profile.skillLevels[concept] && profile.skillLevels[concept] > 0) {
        score += 10;
      }
    });
    
    return score;
  }

  private getDefaultTemplates(): ContractTemplate[] {
    return Array.from(this.templates.values()).slice(0, 5);
  }

  private validateCustomization(template: ContractTemplate, customization: any): void {
    // Validate that required placeholders are filled
    template.placeholders.forEach(placeholder => {
      if (placeholder.required && !customization.placeholderValues[placeholder.id]) {
        throw new Error(`Required placeholder ${placeholder.name} is missing`);
      }
    });
  }

  private processTemplate(template: ContractTemplate, customization: any): string {
    let code = template.template;
    
    // Replace placeholders
    for (const [key, value] of Object.entries(customization.placeholderValues || {})) {
      const placeholder = `{{${key}}}`;
      code = code.replace(new RegExp(placeholder, 'g'), value as string);
    }
    
    return code;
  }

  private async analyzeContractSecurity(code: string, userId: string): Promise<any> {
    // Mock implementation - would use actual security scanner
    return {
      issues: [],
      overallScore: 85,
      scanTime: 100
    };
  }

  private async analyzeContractGas(code: string, userId: string): Promise<any> {
    // Mock implementation - would use actual gas analyzer
    return {
      optimizations: [],
      potentialSavings: 0,
      score: 80
    };
  }

  private calculateQualityScore(securityAnalysis: any, gasAnalysis: any, template: ContractTemplate): number {
    return Math.round((securityAnalysis.overallScore + gasAnalysis.score) / 2);
  }

  private generateFeedback(template: ContractTemplate, securityAnalysis: any, gasAnalysis: any, customization: any): {
    suggestions: string[];
    warnings: string[];
    errors: string[];
  } {
    const suggestions: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Add template-specific feedback
    if (securityAnalysis.issues.length > 0) {
      warnings.push('Security issues detected. Review the highlighted code.');
    }
    
    if (gasAnalysis.optimizations.length > 0) {
      suggestions.push('Gas optimizations available. Consider implementing suggested changes.');
    }
    
    return { suggestions, warnings, errors };
  }

  private async saveCustomization(customization: any): Promise<void> {
    // Mock implementation - would save to database
  }

  private enhanceTemplateForUser(template: ContractTemplate, profile: LearningProfile): ContractTemplate {
    // Add user-specific enhancements
    return {
      ...template,
      // Add personalized learning objectives based on user profile
      learningObjectives: [
        ...template.learningObjectives,
        ...this.generatePersonalizedObjectives(template, profile)
      ]
    };
  }

  private generatePersonalizedObjectives(template: ContractTemplate, profile: LearningProfile): string[] {
    const objectives: string[] = [];
    
    // Add objectives based on weakness patterns
    profile.weaknessPatterns.forEach(pattern => {
      if (template.concepts.some(concept => concept.includes(pattern))) {
        objectives.push(`Improve understanding of ${pattern}`);
      }
    });
    
    return objectives;
  }

  private extractPlaceholders(code: string): TemplatePlaceholder[] {
    const placeholders: TemplatePlaceholder[] = [];
    const regex = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = regex.exec(code)) !== null) {
      placeholders.push({
        id: match[1],
        name: match[1],
        description: `Placeholder for ${match[1]}`,
        type: 'string',
        required: true,
        validation: [],
        examples: [],
        hint: `Enter value for ${match[1]}`
      });
    }
    
    return placeholders;
  }

  private generateBestPracticesFromAnalysis(securityAnalysis: any, gasAnalysis: any): BestPractice[] {
    const practices: BestPractice[] = [];
    
    // Generate practices based on analysis
    if (securityAnalysis.issues.length > 0) {
      practices.push({
        id: 'security-review',
        title: 'Security Review',
        description: 'Always review code for security vulnerabilities',
        category: 'security',
        importance: 'critical',
        codeExample: '// Use proper access controls',
        explanation: 'Security is paramount in smart contracts',
        resources: [],
        enforcementLevel: 'error'
      });
    }
    
    return practices;
  }

  private determineDifficulty(code: string, securityAnalysis: any, gasAnalysis: any): 'beginner' | 'intermediate' | 'advanced' {
    const codeComplexity = this.calculateComplexity(code);
    if (codeComplexity <= 3) return 'beginner';
    if (codeComplexity <= 7) return 'intermediate';
    return 'advanced';
  }

  private calculateComplexity(code: string): number {
    // Simple complexity calculation based on code features
    let complexity = 1;
    
    // Check for various complexity indicators
    if (code.includes('modifier')) complexity++;
    if (code.includes('mapping')) complexity++;
    if (code.includes('struct')) complexity++;
    if (code.includes('interface')) complexity++;
    if (code.includes('library')) complexity++;
    
    return complexity;
  }

  private estimateCompletionTime(complexity: number, difficulty: string): number {
    const baseTime = 30; // minutes
    const complexityMultiplier = complexity * 15;
    const difficultyMultiplier = difficulty === 'beginner' ? 1 : difficulty === 'intermediate' ? 1.5 : 2;
    
    return Math.round(baseTime + (complexityMultiplier * difficultyMultiplier));
  }

  private identifyPrerequisites(code: string): string[] {
    const prerequisites: string[] = [];
    
    if (code.includes('ERC20')) prerequisites.push('erc20-standard');
    if (code.includes('ERC721')) prerequisites.push('erc721-standard');
    if (code.includes('modifier')) prerequisites.push('modifiers');
    if (code.includes('mapping')) prerequisites.push('mappings');
    if (code.includes('struct')) prerequisites.push('structs');
    
    return prerequisites;
  }

  private async generateLearningObjectives(code: string, category: string): Promise<string[]> {
    const objectives: string[] = [];
    
    // Generate category-specific objectives
    switch (category) {
      case 'basic':
        objectives.push('Understand basic contract structure');
        objectives.push('Learn about state variables');
        break;
      case 'defi':
        objectives.push('Understand DeFi protocols');
        objectives.push('Learn about token economics');
        break;
      case 'nft':
        objectives.push('Understand NFT standards');
        objectives.push('Learn about metadata handling');
        break;
    }
    
    return objectives;
  }

  private extractConcepts(code: string): string[] {
    const concepts: string[] = [];
    
    if (code.includes('mapping')) concepts.push('mappings');
    if (code.includes('struct')) concepts.push('structs');
    if (code.includes('modifier')) concepts.push('modifiers');
    if (code.includes('event')) concepts.push('events');
    if (code.includes('require')) concepts.push('error-handling');
    
    return concepts;
  }

  private async generateDocumentation(code: string, name: string, description: string): Promise<TemplateDocumentation> {
    return {
      overview: `${name}: ${description}`,
      usage: 'Deploy and interact with this contract',
      parameters: 'Configure parameters as needed',
      examples: 'See code examples in the template',
      troubleshooting: 'Check for common issues',
      references: []
    };
  }

  private generateSecurityChecks(securityAnalysis: any): SecurityCheck[] {
    return securityAnalysis.issues.map((issue: any, index: number) => ({
      id: `security-check-${index}`,
      name: issue.title || 'Security Check',
      description: issue.message || 'Security vulnerability detected',
      pattern: /./,
      severity: issue.severity || 'medium',
      message: issue.message || 'Security issue',
      fix: issue.suggestion || 'Review and fix',
      autoFixable: false,
      category: 'general'
    }));
  }

  private generateGasOptimizations(gasAnalysis: any): GasOptimization[] {
    return gasAnalysis.optimizations.map((opt: any, index: number) => ({
      id: `gas-opt-${index}`,
      name: opt.title || 'Gas Optimization',
      description: opt.description || 'Gas optimization opportunity',
      pattern: /./,
      optimization: opt.suggestion || 'Optimize gas usage',
      gasSavings: opt.savings || 0,
      difficulty: 'medium',
      tradeoffs: []
    }));
  }

  private async generateTestCases(code: string): Promise<TemplateTestCase[]> {
    return [
      {
        id: 'test-deployment',
        name: 'Contract Deployment',
        description: 'Test contract deployment',
        testCode: '// Test deployment',
        expectedBehavior: 'Contract should deploy successfully',
        category: 'functionality'
      }
    ];
  }

  private checkBestPractice(code: string, practice: BestPractice): ValidationViolation | null {
    // Simple pattern matching for best practices
    if (practice.category === 'security' && !code.includes('require')) {
      return {
        type: 'best-practice',
        severity: 'medium',
        message: 'Missing error handling',
        fix: 'Add require statements for validation',
        autoFixable: false,
        line: 1
      };
    }
    return null;
  }

  private findPatternLine(code: string, pattern: RegExp): number {
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 1;
  }

  private generateImprovementSuggestions(securityAnalysis: any, template: ContractTemplate): string[] {
    const suggestions: string[] = [];
    
    if (securityAnalysis.issues.length > 0) {
      suggestions.push('Review security analysis results');
    }
    
    suggestions.push('Consider gas optimizations');
    suggestions.push('Add comprehensive tests');
    
    return suggestions;
  }

  private calculateValidationScore(violations: ValidationViolation[], template: ContractTemplate): number {
    let score = 100;
    
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });
    
    return Math.max(0, score);
  }

  // Template-specific methods
  private getERC20Placeholders(): TemplatePlaceholder[] {
    return [
      {
        id: 'TOKEN_NAME',
        name: 'Token Name',
        description: 'The name of the token contract',
        type: 'string',
        required: true,
        validation: [],
        examples: ['MyToken', 'CustomToken'],
        hint: 'Enter a descriptive name for your token'
      }
    ];
  }

  private getERC20BestPractices(): BestPractice[] {
    return [
      {
        id: 'erc20-ownership',
        title: 'Ownership Pattern',
        description: 'Use proper ownership patterns for token management',
        category: 'security',
        importance: 'high',
        codeExample: 'contract Token is ERC20, Ownable',
        explanation: 'Ownership provides access control',
        resources: [],
        enforcementLevel: 'warning'
      }
    ];
  }

  private getERC20SecurityChecks(): SecurityCheck[] {
    return [
      {
        id: 'erc20-overflow',
        name: 'Integer Overflow',
        description: 'Check for integer overflow in token operations',
        pattern: /\+\+|\-\-|\+|\-|\*|\/(?!\*)/,
        severity: 'high',
        message: 'Potential integer overflow',
        fix: 'Use SafeMath or Solidity ^0.8.0',
        autoFixable: false,
        category: 'overflow'
      }
    ];
  }

  private getERC20GasOptimizations(): GasOptimization[] {
    return [
      {
        id: 'erc20-storage',
        name: 'Storage Optimization',
        description: 'Optimize storage layout for gas efficiency',
        pattern: /uint256/,
        optimization: 'Consider using smaller uint types where possible',
        gasSavings: 200,
        difficulty: 'easy',
        tradeoffs: ['Reduced maximum values']
      }
    ];
  }

  private getERC20Documentation(): TemplateDocumentation {
    return {
      overview: 'A basic ERC20 token implementation with standard functionality',
      usage: 'Deploy the contract and interact with standard ERC20 methods',
      parameters: 'Configure name, symbol, initial supply, and owner',
      examples: 'See the template code for usage examples',
      troubleshooting: 'Ensure proper initialization and access control',
      references: ['https://eips.ethereum.org/EIPS/eip-20']
    };
  }

  private addNFTTemplates(): void {
    // Implementation for NFT templates
  }

  private addDeFiTemplates(): void {
    // Implementation for DeFi templates
  }

  private addDAOTemplates(): void {
    // Implementation for DAO templates
  }
}

interface ValidationResult {
  isValid: boolean;
  score: number;
  violations: ValidationViolation[];
  suggestions: string[];
  template: string;
}

interface ValidationViolation {
  type: 'security' | 'gas' | 'style' | 'best-practice';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  fix: string;
  autoFixable: boolean;
  line?: number;
}

// Export factory function
export function createSmartContractTemplates(
  securityScanner: SecurityScanner
): SmartContractTemplates {
  return new SmartContractTemplates(securityScanner);
}
