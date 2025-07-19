export interface SecurityIssue {
  id?: string;
  type: 'vulnerability' | 'gas-optimization' | 'best-practice' | 'warning' | 'style' | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  description: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  suggestion?: string;
  codeExample?: string;
  category?: 'security' | 'gas' | 'style' | 'best-practice';
  gasImpact?: number;
  autoFixAvailable?: boolean;
  confidence?: number;
  source?: 'local-llm' | 'fallback' | 'pattern-only';
  analysisTime?: number;
}

export interface SecurityScanResult {
  issues: SecurityIssue[];
  overallScore: number;
  scanTime: number;
  suggestions: string[];
  aiAnalysisUsed: boolean;
  cacheHit: boolean;
}

export interface GasOptimization {
  type: string;
  line: number;
  currentCost: number;
  optimizedCost: number;
  savings?: number;
  description: string;
  suggestion: string;
  codeExample?: string;
}

export interface SecurityStats {
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  totalIssues: number;
  overallScore: number;
  gasOptimizations: number;
  potentialSavings: number;
}