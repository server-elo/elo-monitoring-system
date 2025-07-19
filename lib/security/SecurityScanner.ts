/**
 * Enhanced Real-time Security Scanner for Solidity Code
 *
 * AI-powered vulnerability detection in Monaco Editor with:
 * - Real-time analysis with debouncing
 * - Visual indicators and overlays
 * - Performance optimization
 * - Auto-fix suggestions
 * - Comprehensive security patterns
 */

import * as monaco from 'monaco-editor';
import { enhancedTutor } from '../ai/EnhancedTutorSystem';
import { SecurityIssue, SecurityScanResult } from '../../types/security';

export { SecurityIssue, SecurityScanResult };

export interface SecurityScanResultWithTimestamp extends SecurityScanResult {
  timestamp: Date;
}

export interface SecurityLearningContext {
  userId: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  currentConcept: string;
  previousMistakes: SecurityIssue[];
  learningObjectives: string[];
  preferredExplanationStyle: 'concise' | 'detailed' | 'interactive';
}

export interface ProgressiveHint {
  level: number; // 1-5, increasing specificity
  content: string;
  type: 'question' | 'hint' | 'example' | 'solution';
  unlockCondition?: string;
}

export interface ConceptLink {
  concept: string;
  relationship: 'prerequisite' | 'related' | 'advanced';
  description: string;
  learningResource?: string;
}

export class SecurityScanner {
  private editor: monaco.editor.IStandaloneCodeEditor;
  private model: monaco.editor.ITextModel;
  private decorations: string[] = [];
  private markers: monaco.editor.IMarkerData[] = [];
  private scanTimeout: NodeJS.Timeout | null = null;
  private lastScanTime: number = 0;
  private scanDelay: number = 2000; // 2 second delay after typing stops
  private userId: string;
  private isScanning: boolean = false;
  private lastAnalysisResult: SecurityScanResult | null = null;
  private analysisCache = new Map<string, SecurityScanResult>(_);
  private listeners: Array<(_result: SecurityScanResult) => void> = [];

  // Configuration options
  private config = {
    enableRealtime: true,
    enableAIAnalysis: true,
    enablePatternMatching: true,
    maxCodeLength: 10000,
    analysisTimeout: 30000,
    enableAutoFix: true,
    severityThreshold: 'low' as 'low' | 'medium' | 'high' | 'critical',
    enableVisualIndicators: true,
    enableHoverTooltips: true
  };

  // Enhanced security patterns for real-time detection
  private securityPatterns = [
    {
      pattern: /\.call\s*\(/g,
      type: 'vulnerability',
      severity: 'high' as const,
      title: 'Reentrancy Risk',
      message: 'Low-level call detected - potential reentrancy vulnerability',
      suggestion: 'Use ReentrancyGuard or checks-effects-interactions pattern',
      category: 'security' as const,
      confidence: 0.8,
      autoFixAvailable: false
    },
    {
      pattern: /tx\.origin/g,
      type: 'vulnerability',
      severity: 'high' as const,
      title: 'tx.origin Usage',
      message: 'tx.origin should not be used for authorization',
      suggestion: 'Use msg.sender instead of tx.origin for authorization',
      category: 'security' as const,
      confidence: 0.9,
      autoFixAvailable: true
    },
    {
      pattern: /block\.timestamp/g,
      type: 'vulnerability',
      severity: 'medium' as const,
      title: 'Timestamp Dependence',
      message: 'Block timestamp can be manipulated by miners',
      suggestion: 'Avoid using block.timestamp for critical logic',
      category: 'security' as const,
      confidence: 0.7,
      autoFixAvailable: false
    },
    {
      pattern: /function\s+\w+\s*\([^)]*\)\s*public/g,
      type: 'gas-optimization',
      severity: 'low' as const,
      title: 'Function Visibility',
      message: 'Consider using external instead of public for gas optimization',
      suggestion: 'Change public to external if function is only called externally',
      category: 'gas' as const,
      confidence: 0.6,
      autoFixAvailable: true,
      gasImpact: 200
    },
    {
      pattern: /uint256\s+public\s+\w+/g,
      type: 'gas-optimization',
      severity: 'low' as const,
      title: 'Storage Optimization',
      message: 'Consider using smaller uint types if possible',
      suggestion: 'Use uint128, uint64, or uint32 if the value range allows',
      category: 'gas' as const,
      confidence: 0.5,
      autoFixAvailable: false,
      gasImpact: 100
    },
    {
      pattern: /require\s*\(_\s*[^,]+\s*\)/g,
      type: 'best-practice',
      severity: 'low' as const,
      title: 'Error Message Missing',
      message: 'require(_) statements should include error messages',
      suggestion: 'Add descriptive error message: require( condition, "Error message")',
      category: 'best-practice' as const,
      confidence: 0.8,
      autoFixAvailable: true
    },
    {
      pattern: /pragma\s+solidity\s+\^0\.[0-7]\./g,
      type: 'vulnerability',
      severity: 'medium' as const,
      title: 'Outdated Solidity Version',
      message: 'Using outdated Solidity version with known vulnerabilities',
      suggestion: 'Update to Solidity ^0.8.0 or later for built-in overflow protection',
      category: 'security' as const,
      confidence: 0.9,
      autoFixAvailable: true
    },
    {
      pattern: /selfdestruct\s*\(/g,
      type: 'vulnerability',
      severity: 'critical' as const,
      title: 'Selfdestruct Usage',
      message: 'selfdestruct can be dangerous and is being deprecated',
      suggestion: 'Consider alternative patterns for contract upgrades',
      category: 'security' as const,
      confidence: 0.9,
      autoFixAvailable: false
    },
    {
      pattern: /delegatecall\s*\(/g,
      type: 'vulnerability',
      severity: 'high' as const,
      title: 'Delegatecall Risk',
      message: 'delegatecall can be dangerous if not properly secured',
      suggestion: 'Ensure delegatecall target is trusted and validate inputs',
      category: 'security' as const,
      confidence: 0.8,
      autoFixAvailable: false
    }
  ];


  // Setup event listeners for real-time scanning
  private setupEventListeners(_): void {
    this.model.onDidChangeContent(() => {
      if (_this.config.enableRealtime) {
        this.scheduleAnalysis(_);
      }
    });

    // Listen for cursor position changes to update hover tooltips
    this.editor.onDidChangeCursorPosition((e) => {
      this.updateHoverTooltips(_e.position);
    });
  }

  // Setup hover provider for security tooltips
  private setupHoverProvider(_): void {
    if (!this.config.enableHoverTooltips) return;

    monaco.languages.registerHoverProvider('solidity', {
      provideHover: ( model, position) => {
        const issue = this.getIssueAtPosition(_position);
        if (!issue) return null;

        return {
          range: new monaco.Range(
            issue.line,
            issue.column,
            issue.endLine,
            issue.endColumn
          ),
          contents: [
            { value: `**${issue.title}**` },
            { value: issue.message },
            { value: `*Severity: ${issue.severity.toUpperCase()}*` },
            { value: `*Suggestion: ${issue.suggestion}*` }
          ]
        };
      }
    });
  }

  // Setup code action provider for auto-fixes
  private setupCodeActionProvider(_): void {
    if (!this.config.enableAutoFix) return;

    monaco.languages.registerCodeActionProvider('solidity', {
      provideCodeActions: ( model, range, context) => {
        const actions: monaco.languages.CodeAction[] = [];

        for (_const marker of context.markers) {
          const issue = this.findIssueById(_marker.code as string);
          if (_issue?.autoFixAvailable) {
            actions.push({
              title: `Fix: ${issue.title}`,
              kind: 'quickfix',
              edit: {
                edits: [{
                  resource: model.uri,
                  edit: {
                    range: new monaco.Range(
                      issue.line,
                      issue.column,
                      issue.endLine,
                      issue.endColumn
                    ),
                    text: this.generateAutoFix(_issue)
                  }
                }]
              }
            });
          }
        }

        return { actions, dispose: (_) => {} };
      }
    });
  }

  constructor(
    editor: monaco.editor.IStandaloneCodeEditor,
    userId: string,
    config?: Partial<typeof this.config>
  ) {
    this.editor = editor;
    this.model = editor.getModel(_)!;
    this.userId = userId;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.setupEventListeners(_);
    this.setupMarkerService(_);
    this.setupHoverProvider(_);
    this.setupCodeActionProvider(_);
  }

  private setupEventListeners(_): void {
    // Listen for content changes
    this.model.onDidChangeContent(() => {
      this.scheduleSecurityScan(_);
    });

    // Listen for cursor position changes to show contextual help
    this.editor.onDidChangeCursorPosition((e) => {
      this.showContextualSecurity(_e.position);
    });
  }

  private setupMarkerService(_): void {
    // Register custom marker service for security issues
    monaco.editor.setModelMarkers( this.model, 'security-scanner', []);
  }

  private scheduleSecurityScan(_): void {
    // Clear existing timeout
    if (_this.scanTimeout) {
      clearTimeout(_this.scanTimeout);
    }

    // Schedule new scan
    this.scanTimeout = setTimeout(() => {
      this.performSecurityScan(_);
    }, this.scanDelay);
  }

  private async performSecurityScan(_): Promise<SecurityScanResult> {
    if (_this.isScanning) return { issues: [], overallScore: 100, scanTime: 0, suggestions: [] };
    
    this.isScanning = true;
    const startTime = Date.now(_);
    const code = this.model.getValue(_);
    
    try {
      // Quick pattern-based scan for immediate feedback
      const patternIssues = this.scanPatterns(_code);
      
      // AI-powered deep scan for complex issues (_adaptive throttling)
      let aiIssues: SecurityIssue[] = [];
      const now = Date.now(_);
      const timeSinceLastScan = now - this.lastScanTime;

      // Adaptive throttling based on local LLM availability
      const isLocalLLMAvailable = await this.checkLocalLLMHealth(_);
      const minScanInterval = isLocalLLMAvailable ? 2000 : 5000; // 2s for local, 5s for fallback

      if (_timeSinceLastScan > minScanInterval && code.length > 50) {
        console.log(_`🔄 Starting AI security scan (${isLocalLLMAvailable ? 'local' : 'fallback'} mode)`);
        aiIssues = await this.performAIScan(_code);
        this.lastScanTime = now;
      } else if (_timeSinceLastScan <= minScanInterval) {
        console.log(_`⏳ AI scan throttled (${Math.ceil((minScanInterval - timeSinceLastScan) / 1000)}s remaining)`);
      }

      const allIssues = [...patternIssues, ...aiIssues];
      const scanTime = Date.now(_) - startTime;
      
      // Calculate overall security score
      const overallScore = this.calculateSecurityScore(_allIssues);
      
      // Update editor with findings
      this.updateEditorMarkers(_allIssues);
      this.updateEditorDecorations(_allIssues);
      
      const result: SecurityScanResult = {
        issues: allIssues,
        overallScore,
        scanTime,
        suggestions: this.generateSuggestions(_allIssues)
      };

      // Emit scan complete event
      this.onScanComplete(_result);
      
      return result;
      
    } catch (_error) {
      console.error('Security scan failed:', error);
      return { issues: [], overallScore: 100, scanTime: Date.now(_) - startTime, suggestions: [] };
    } finally {
      this.isScanning = false;
    }
  }

  private scanPatterns(_code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');
    
    // Scan security patterns
    this.securityPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.pattern.exec(code)) !== null) {
        const position = this.getLineColumnFromIndex( code, match.index);
        const endPosition = this.getLineColumnFromIndex( code, match.index + match[0].length);
        
        issues.push({
          id: `pattern_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
          type: pattern.type,
          severity: pattern.severity,
          title: pattern.title,
          message: pattern.message,
          description: pattern.message,
          line: position.line,
          column: position.column,
          endLine: endPosition.line,
          endColumn: endPosition.column,
          suggestion: pattern.suggestion,
          category: pattern.category
        });
      }
      // Reset regex lastIndex to avoid issues with global flag
      pattern.pattern.lastIndex = 0;
    });

    return issues;
  }

  private async performAIScan(_code: string): Promise<SecurityIssue[]> {
    try {
      // Check if local LLM is available for faster analysis
      const isLocalLLMAvailable = await this.checkLocalLLMHealth(_);

      if (isLocalLLMAvailable) {
        console.log('🚀 Using local LLM for real-time security analysis');
      } else {
        console.log('⚡ Using fallback analysis (local LLM unavailable)');
      }

      const startTime = Date.now(_);
      const analysis = await enhancedTutor.analyzeCodeSecurity( code, this.userId);
      const analysisTime = Date.now(_) - startTime;

      // Log performance metrics
      console.log(_`🔍 Security analysis completed in ${analysisTime}ms using ${isLocalLLMAvailable ? 'local LLM' : 'fallback'}`);

      return analysis.vulnerabilities.map(vuln => ({
        id: `ai_${Date.now(_)}_${Math.random().toString(36).substr(2, 9)}`,
        type: vuln.type,
        severity: this.mapSeverity(_vuln.severity),
        message: vuln.description,
        line: vuln.line || 1,
        column: 1,
        endLine: vuln.line || 1,
        endColumn: 100,
        suggestion: vuln.recommendation,
        codeExample: vuln.codeExample,
        category: 'security',
        analysisTime,
        source: isLocalLLMAvailable ? 'local-llm' : 'fallback'
      }));

    } catch (_error) {
      console.error('AI security scan failed:', error);
      return [];
    }
  }

  private async checkLocalLLMHealth(_): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(1000) // Quick health check
      });
      return response.ok;
    } catch (_error) {
      return false;
    }
  }

  private mapSeverity(_severity: string): 'info' | 'warning' | 'error' {
    switch (_severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  }

  private getLineColumnFromIndex( text: string, index: number): { line: number; column: number } {
    const lines = text.substring( 0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private calculateSecurityScore(_issues: SecurityIssue[]): number {
    let score = 100;
    
    issues.forEach(issue => {
      switch (_issue.severity) {
        case 'error':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  private updateEditorMarkers(_issues: SecurityIssue[]): void {
    const markers: monaco.editor.IMarkerData[] = issues.map(issue => ({
      severity: this.getMonacoSeverity(_issue.severity),
      startLineNumber: issue.line,
      startColumn: issue.column,
      endLineNumber: issue.endLine,
      endColumn: issue.endColumn,
      message: `${issue.message}\n💡 ${issue.suggestion}`,
      source: 'Security Scanner'
    }));

    monaco.editor.setModelMarkers( this.model, 'security-scanner', markers);
    this.markers = markers;
  }

  private updateEditorDecorations(_issues: SecurityIssue[]): void {
    const decorations: monaco.editor.IModelDeltaDecoration[] = issues
      .filter(issue => issue.severity === 'error')
      .map(issue => ({
        range: new monaco.Range( issue.line, issue.column, issue.endLine, issue.endColumn),
        options: {
          className: 'security-error-decoration',
          hoverMessage: { value: `🚨 **${issue.message}**\n\n💡 ${issue.suggestion}` },
          minimap: {
            color: '#ff4444',
            position: monaco.editor.MinimapPosition.Inline
          }
        }
      }));

    this.decorations = this.editor.deltaDecorations( this.decorations, decorations);
  }

  private getMonacoSeverity(_severity: SecurityIssue['severity']): monaco.MarkerSeverity {
    switch (_severity) {
      case 'error':
        return monaco.MarkerSeverity.Error;
      case 'warning':
        return monaco.MarkerSeverity.Warning;
      case 'info':
      default:
        return monaco.MarkerSeverity.Info;
    }
  }

  private generateSuggestions(_issues: SecurityIssue[]): string[] {
    const suggestions = new Set<string>(_);
    
    issues.forEach(issue => {
      suggestions.add(_issue.suggestion);
    });

    return Array.from(_suggestions);
  }

  private showContextualSecurity(_position: monaco.Position): void {
    const line = this.model.getLineContent(_position.lineNumber);
    
    // Show contextual security tips based on current line
    this.securityPatterns.forEach(pattern => {
      if (_pattern.pattern.test(line)) {
        // Could show hover widget or status bar message
        console.log(_`Security tip: ${pattern.suggestion}`);
      }
      pattern.pattern.lastIndex = 0; // Reset regex
    });
  }

  private onScanComplete(_result: SecurityScanResult): void {
    // Emit custom event for components to listen to
    const event = new CustomEvent( 'securityScanComplete', { detail: result });
    document.dispatchEvent(_event);
  }

  // Public methods
  public async scanNow(_): Promise<SecurityScanResult> {
    return this.performSecurityScan(_);
  }

  // Alias for compatibility with AICodeReviewer
  public async performAnalysis(_): Promise<SecurityScanResult> {
    return this.performSecurityScan(_);
  }

  public getLastScanResult(_): SecurityScanResult | null {
    return {
      issues: this.markers.map(marker => ({
        id: `marker_${marker.startLineNumber}_${marker.startColumn}`,
        type: 'marker',
        severity: this.getIssueSeverity(_marker.severity),
        message: marker.message || '',
        line: marker.startLineNumber,
        column: marker.startColumn,
        endLine: marker.endLineNumber,
        endColumn: marker.endColumn,
        suggestion: '',
        category: 'security'
      })),
      overallScore: this.calculateSecurityScore([]),
      scanTime: 0,
      suggestions: []
    };
  }

  private getIssueSeverity(_severity: monaco.MarkerSeverity): SecurityIssue['severity'] {
    switch (_severity) {
      case monaco.MarkerSeverity.Error:
        return 'error';
      case monaco.MarkerSeverity.Warning:
        return 'warning';
      case monaco.MarkerSeverity.Info:
      default:
        return 'info';
    }
  }

  // Enhanced analysis with AI integration
  private async runAIAnalysis(_code: string): Promise<SecurityIssue[]> {
    if (!this.config.enableAIAnalysis || code.length > this.config.maxCodeLength) {
      return [];
    }

    try {
      const analysis = await enhancedTutor.analyzeCodeSecurity( code, this.userId);
      return this.convertAIAnalysisToIssues(_analysis);
    } catch (_error) {
      console.error('AI analysis failed:', error);
      return [];
    }
  }

  // Convert AI analysis to security issues
  private convertAIAnalysisToIssues(_analysis: any): SecurityIssue[] {
    const issues: SecurityIssue[] = [];

    // Process vulnerabilities
    if (_analysis.vulnerabilities) {
      analysis.vulnerabilities.forEach( (vuln: any, index: number) => {
        issues.push({
          id: `ai-vuln-${index}`,
          type: 'vulnerability',
          severity: vuln.severity || 'medium',
          title: vuln.type || 'Security Vulnerability',
          message: vuln.description || 'Security issue detected by AI',
          line: vuln.line || 1,
          column: 1,
          endLine: vuln.line || 1,
          endColumn: 100,
          suggestion: vuln.recommendation || 'Review and fix security issue',
          category: 'security',
          confidence: 0.9,
          autoFixAvailable: false
        });
      });
    }

    // Process gas optimizations
    if (_analysis.gasOptimizations) {
      analysis.gasOptimizations.forEach( (opt: any, index: number) => {
        issues.push({
          id: `ai-gas-${index}`,
          type: 'gas-optimization',
          severity: 'low',
          title: 'Gas Optimization',
          message: opt.description || 'Gas optimization opportunity',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 100,
          suggestion: opt.afterCode || 'Optimize for gas efficiency',
          category: 'gas',
          gasImpact: opt.gasSavings || 0,
          confidence: 0.8,
          autoFixAvailable: !!opt.afterCode
        });
      });
    }

    return issues;
  }

  // Pattern-based analysis
  private runPatternAnalysis(_code: string): SecurityIssue[] {
    const issues: SecurityIssue[] = [];
    const lines = code.split('\n');

    this.securityPatterns.forEach( (pattern, patternIndex) => {
      lines.forEach( (line, lineIndex) => {
        const matches = line.match(_pattern.pattern);
        if (matches) {
          matches.forEach( (match, matchIndex) => {
            const column = line.indexOf(_match) + 1;
            issues.push({
              id: `pattern-${patternIndex}-${lineIndex}-${matchIndex}`,
              type: pattern.type,
              severity: pattern.severity,
              title: pattern.title,
              message: pattern.message,
              line: lineIndex + 1,
              column,
              endLine: lineIndex + 1,
              endColumn: column + match.length,
              suggestion: pattern.suggestion,
              category: pattern.category,
              gasImpact: pattern.gasImpact,
              confidence: pattern.confidence,
              autoFixAvailable: pattern.autoFixAvailable
            });
          });
        }
      });
    });

    return issues;
  }

  // Merge and deduplicate issues
  private mergeIssues( patternIssues: SecurityIssue[], aiIssues: SecurityIssue[]): SecurityIssue[] {
    const allIssues = [...patternIssues, ...aiIssues];
    const uniqueIssues = new Map<string, SecurityIssue>(_);

    allIssues.forEach(issue => {
      const key = `${issue.line}-${issue.type}-${issue.severity}`;
      if (!uniqueIssues.has(key) || (_uniqueIssues.get(key)?.confidence || 0) < (_issue.confidence || 0)) {
        uniqueIssues.set( key, issue);
      }
    });

    return Array.from(_uniqueIssues.values());
  }

  // Filter issues by severity threshold
  private filterIssuesBySeverity(_issues: SecurityIssue[]): SecurityIssue[] {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const thresholdIndex = severityOrder.indexOf(_this.config.severityThreshold);

    return issues.filter(issue => {
      const issueIndex = severityOrder.indexOf(_issue.severity);
      return issueIndex >= thresholdIndex;
    });
  }

  // Calculate overall security score
  private calculateOverallScore(_issues: SecurityIssue[]): number {
    if (_issues.length === 0) return 100;

    let score = 100;
    issues.forEach(issue => {
      switch (_issue.severity) {
        case 'critical': score -= 25; break;
        case 'high': score -= 15; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    return Math.max(0, score);
  }

  // Generate suggestions based on issues
  private generateSuggestions(_issues: SecurityIssue[]): string[] {
    const suggestions = new Set<string>(_);

    issues.forEach(issue => {
      if (_issue.suggestion) {
        suggestions.add(_issue.suggestion);
      }
    });

    return Array.from(_suggestions);
  }

  // Missing methods implementation
  private async getAnalysisHistory(_userId: string): Promise<any[]> {
    // Implementation would fetch from database
    return [];
  }

  private async calculateSkillLevels( userId: string, sessions: any[]): Promise<Record<string, number>> {
    // Implementation would calculate skill levels
    return {};
  }

  private identifyStrengthAreas(_analysisHistory: any[]): string[] {
    // Implementation would identify strength areas
    return [];
  }

  private calculateSessionParameters(_sessions: any[]): { attentionSpan: number; optimalSessionLength: number } {
    return { attentionSpan: 30, optimalSessionLength: 45 };
  }

  private getLatestScores(_analysisHistory: any[]): { security: number; gasOptimization: number; codeQuality: number } {
    return { security: 0, gasOptimization: 0, codeQuality: 0 };
  }

  private async saveLearningProfile(_profile: any): Promise<void> {
    // Implementation would save to database
  }

  private async getAdaptationHistory(_userId: string): Promise<any[]> {
    return [];
  }

  private async saveLearningPath(_path: any): Promise<void> {
    // Implementation would save to database
  }

  private async selectNextConcepts(_profile: any): Promise<any[]> {
    return [];
  }

  private createMilestones( conceptNodes: any[], profile: any): any[] {
    return [];
  }

  private calculateCurrentLevel( skillLevels: Record<string, number>): number {
    const levels = Object.values(_skillLevels);
    return levels.length > 0 ? levels.reduce( (sum, level) => sum + level, 0) / levels.length : 0;
  }

  private calculateRecommendedDifficulty(_profile: any): number {
    return 0.5;
  }

  private estimateCompletionTime( conceptNodes: any[], profile: any): number {
    return 60; // minutes
  }

  private parseExerciseFromAI( content: string, concept: any): any {
    return {
      id: `exercise-${Date.now(_)}`,
      type: 'coding',
      concept: concept.name,
      difficulty: concept.difficulty,
      estimatedTime: concept.estimatedTime,
      content: content,
      hints: []
    };
  }

  private async evaluateAdaptationTriggers(_userId: string): Promise<void> {
    // Implementation would check if adaptation is needed
  }

  private calculateMasteryScore(_performance: any): number {
    return 0.5;
  }

  private async getLearningProfile(_userId: string): Promise<any> {
    return { preferredDifficulty: 'adaptive', learningVelocity: 1.0 };
  }

  private getTargetAccuracy(_difficulty: string): number {
    switch (_difficulty) {
      case 'gradual': return 0.8;
      case 'challenge': return 0.6;
      case 'adaptive': return 0.7;
      default: return 0.7;
    }
  }

  private async recordAdaptation( userId: string, oldDifficulty: number, newDifficulty: number, performance: any): Promise<void> {
    // Implementation would record adaptation
  }

  // Missing helper methods
  private getIssueAtPosition(_position: monaco.Position): SecurityIssue | null {
    return this.markers.find(marker => 
      marker.startLineNumber === position.lineNumber &&
      marker.startColumn <= position.column &&
      marker.endColumn >= position.column
    ) ? {
      id: '',
      type: 'vulnerability',
      severity: 'low',
      title: 'Security Issue',
      message: 'Security issue detected',
      description: 'Security issue detected',
      line: position.lineNumber,
      column: position.column,
      endLine: position.lineNumber,
      endColumn: position.column,
      suggestion: 'Review code for security issues'
    } : null;
  }

  private findIssueById(_id: string): SecurityIssue | null {
    // Implementation would depend on how issues are stored
    return null;
  }

  private generateAutoFix(_issue: SecurityIssue): string {
    // Basic auto-fix implementation
    switch (_issue.type) {
      case 'tx.origin':
        return 'msg.sender';
      default:
        return '';
    }
  }

  private scheduleAnalysis(_): void {
    if (_this.scanTimeout) {
      clearTimeout(_this.scanTimeout);
    }
    this.scanTimeout = setTimeout(() => {
      this.performSecurityScan(_);
    }, this.scanDelay);
  }

  private updateHoverTooltips(_position: monaco.Position): void {
    // Implementation for hover tooltips
  }

  // Update visual indicators in the editor
  private updateVisualIndicators(_result: SecurityScanResult): void {
    if (!this.config.enableVisualIndicators) return;

    // Clear existing decorations
    this.decorations = this.editor.deltaDecorations( this.decorations, []);

    // Create new decorations
    const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
    const markers: monaco.editor.IMarkerData[] = [];

    result.issues.forEach(issue => {
      // Add decoration for visual highlighting
      newDecorations.push({
        range: new monaco.Range( issue.line, issue.column, issue.endLine, issue.endColumn),
        options: {
          className: `security-${issue.severity}`,
          hoverMessage: { value: `**${issue.title}**: ${issue.message}` },
          minimap: { color: this.getSeverityColor(_issue.severity), position: 2 },
          overviewRuler: { color: this.getSeverityColor(_issue.severity), position: 2 }
        }
      });

      // Add marker for problems panel
      markers.push({
        severity: this.getSeverityMarkerLevel(_issue.severity),
        startLineNumber: issue.line,
        startColumn: issue.column,
        endLineNumber: issue.endLine,
        endColumn: issue.endColumn,
        message: `${issue.title}: ${issue.message}`,
        code: issue.id
      });
    });

    // Apply decorations and markers
    this.decorations = this.editor.deltaDecorations( [], newDecorations);
    monaco.editor.setModelMarkers( this.model, 'security-scanner', markers);
  }

  // Helper methods
  private getSeverityColor(_severity: string): string {
    switch (_severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#ffff00';
      default: return '#cccccc';
    }
  }

  private getSeverityMarkerLevel(_severity: string): monaco.MarkerSeverity {
    switch (_severity) {
      case 'critical':
      case 'high': return monaco.MarkerSeverity.Error;
      case 'medium': return monaco.MarkerSeverity.Warning;
      case 'low': return monaco.MarkerSeverity.Info;
      default: return monaco.MarkerSeverity.Hint;
    }
  }

  // Public API methods
  public addListener(_callback: (result: SecurityScanResult) => void): void {
    this.listeners.push(_callback);
  }

  public removeListener(_callback: (result: SecurityScanResult) => void): void {
    const index = this.listeners.indexOf(_callback);
    if (_index > -1) {
      this.listeners.splice( index, 1);
    }
  }

  private notifyListeners(_result: SecurityScanResult): void {
    this.listeners.forEach(callback => {
      try {
        callback(_result);
      } catch (_error) {
        console.error('Listener callback error:', error);
      }
    });
  }

  public getLastResult(_): SecurityScanResult | null {
    return this.lastAnalysisResult;
  }

  public updateConfig(_newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Educational Security Scanner Integration
  public async generateEducationalExplanation(
    issue: SecurityIssue,
    context: SecurityLearningContext
  ): Promise<string> {
    const prompt = `
      Explain this security issue for a ${context.userLevel} developer:

      Issue: ${issue.title}
      Description: ${issue.message}
      Current Learning Concept: ${context.currentConcept}

      Previous similar mistakes: ${context.previousMistakes.map(m => m.title).join( ', ')}

      Learning objectives: ${context.learningObjectives.join( ', ')}

      Provide a ${context.preferredExplanationStyle} explanation that:
      1. Connects to their current learning level
      2. References their learning objectives
      3. Builds on concepts they already understand
      4. Provides actionable next steps
    `;

    const response = await enhancedTutor.getAIResponse(
      prompt,
      { userId: context.userId },
      'explanation'
    );

    return response.content;
  }

  public createProgressiveHints(_issue: SecurityIssue): ProgressiveHint[] {
    const hints: ProgressiveHint[] = [];

    // Level 1: Socratic question
    hints.push({
      level: 1,
      content: `What do you think might happen if ${this.getVulnerabilityContext(_issue)}?`,
      type: 'question'
    });

    // Level 2: General hint
    hints.push({
      level: 2,
      content: `This issue is related to ${issue.category}. Consider how this affects contract security.`,
      type: 'hint'
    });

    // Level 3: Specific hint
    hints.push({
      level: 3,
      content: `Look at line ${issue.line}. ${this.getSpecificHint(_issue)}`,
      type: 'hint'
    });

    // Level 4: Example
    hints.push({
      level: 4,
      content: this.generateSecurityExample(_issue),
      type: 'example'
    });

    // Level 5: Solution
    hints.push({
      level: 5,
      content: issue.suggestion,
      type: 'solution'
    });

    return hints;
  }

  public suggestRelatedConcepts(_issue: SecurityIssue): ConceptLink[] {
    const concepts: ConceptLink[] = [];

    // Map security issues to learning concepts
    const conceptMappings = {
      'reentrancy': [
        { concept: 'checks-effects-interactions', relationship: 'prerequisite' as const },
        { concept: 'mutex-patterns', relationship: 'related' as const },
        { concept: 'pull-payment-pattern', relationship: 'advanced' as const }
      ],
      'access-control': [
        { concept: 'modifiers', relationship: 'prerequisite' as const },
        { concept: 'role-based-access', relationship: 'related' as const },
        { concept: 'multi-sig-patterns', relationship: 'advanced' as const }
      ]
    };

    const issueType = this.categorizeIssue(_issue);
    const relatedConcepts = conceptMappings[issueType] || [];

    return relatedConcepts.map(concept => ({
      ...concept,
      description: this.getConceptDescription(_concept.concept),
      learningResource: this.getLearningResourceUrl(_concept.concept)
    }));
  }

  private getVulnerabilityContext(_issue: SecurityIssue): string {
    // Generate contextual questions based on issue type
    const contexts = {
      'reentrancy': 'an external contract calls back into your function before it finishes executing',
      'access-control': 'anyone can call this function without proper authorization',
      'overflow': 'this arithmetic operation exceeds the maximum value for this data type'
    };

    return contexts[issue.type] || 'this security issue is exploited by an attacker';
  }

  private getSpecificHint(_issue: SecurityIssue): string {
    const hints = {
      'reentrancy': 'Check if external calls are made before state changes',
      'access-control': 'Verify if proper access modifiers are used',
      'overflow': 'Consider using SafeMath or Solidity 0.8+ built-in checks'
    };

    return hints[issue.type] || 'Review the security implications of this code';
  }

  private generateSecurityExample(_issue: SecurityIssue): string {
    const examples = {
      'reentrancy': `
        // Vulnerable:
        function withdraw() external {
          uint amount = balances[msg.sender];
          msg.sender.call{value: amount}("");
          balances[msg.sender] = 0;
        }

        // Secure:
        function withdraw() external {
          uint amount = balances[msg.sender];
          balances[msg.sender] = 0;
          msg.sender.call{value: amount}("");
        }
      `,
      'access-control': `
        // Vulnerable:
        function setOwner(_address newOwner) external {
          owner = newOwner;
        }

        // Secure:
        function setOwner(_address newOwner) external onlyOwner {
          owner = newOwner;
        }
      `
    };

    return examples[issue.type] || 'Example not available for this issue type';
  }

  private categorizeIssue(_issue: SecurityIssue): string {
    if (_issue.title.toLowerCase().includes('reentrancy')) return 'reentrancy';
    if (_issue.title.toLowerCase().includes('access')) return 'access-control';
    if (_issue.title.toLowerCase().includes('overflow')) return 'overflow';
    return 'general';
  }

  private getConceptDescription(_concept: string): string {
    const descriptions = {
      'checks-effects-interactions': 'A pattern to prevent reentrancy by ordering operations correctly',
      'mutex-patterns': 'Using locks to prevent concurrent execution',
      'modifiers': 'Function modifiers for access control and validation'
    };

    return descriptions[concept] || 'Learn more about this security concept';
  }

  private getLearningResourceUrl(_concept: string): string {
    return `/learn/concepts/${concept}`;
  }

  public dispose(_): void {
    if (_this.scanTimeout) {
      clearTimeout(_this.scanTimeout);
    }

    // Clear decorations and markers
    this.editor.deltaDecorations( this.decorations, []);
    monaco.editor.setModelMarkers( this.model, 'security-scanner', []);

    // Clear listeners
    this.listeners = [];
    this.analysisCache.clear(_);
  }
}

// Export singleton factory
export function createSecurityScanner(
  editor: monaco.editor.IStandaloneCodeEditor,
  userId: string
): SecurityScanner {
  return new SecurityScanner( editor, userId);
}
