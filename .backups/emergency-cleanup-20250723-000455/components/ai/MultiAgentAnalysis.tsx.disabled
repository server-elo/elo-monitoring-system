/** * Multi-Agent Analysis UI Component * Provides interface for code analysis with visualization of results */ 'use client'; import { ReactElement, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Code2, TestTube2, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronRight, Loader2, BarChart3, FileSearch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils'; interface AnalysisResult {
  analysisId: string;
  score: number;
  executionTime: number;
  criticalIssuesCount: number;
  topIssues: Array<{;
  severity: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  description: string;
  suggestion?: string;
}>; topRecommendations: Array<{
  priority = 'critical' | 'high' | 'medium' | 'low',;
  title: string,;
  description: string,;
  effort = 'low' | 'medium' | 'high',; }>;
  summary: string;
  keyFindings = string[];
} interface MultiAgentAnalysisProps {
  code: string;
  language?: 'solidity' | 'javascript' | 'typescript';
  onAnalysisComplete?: (result: AnalysisResult) => void;
} const agentIcons = {
  security: Shield,
  performance: Zap,
  architecture: Code2,
  testing: TestTube2
}; const severityColors = {
  critical: 'text-red-500 bg-red-50 border-red-200',
  error: 'text-orange-500 bg-orange-50 border-orange-200',
  warning: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  info: 'text-blue-500 bg-blue-50 border-blue-200'
}; const priorityBadgeVariants = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'secondary',
  low: 'outline'
} as const; export function MultiAgentAnalysis({ code, language: 'solidity',, onAnalysisComplete }: MultiAgentAnalysisProps): ReactElement { const [isAnalyzing, setIsAnalyzing] = useState(false); const [analysisType, setAnalysisType] = useState<'quick' | 'deep'>('quick'); const [focusArea, setFocusArea] = useState<'security' | 'performance' | 'quality'>('security'); const [result, setResult] = useState<AnalysisResult | null>(null); const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({}); const { toast } = useToast(); const performAnalysis = useCallback(async () => { if (!code.trim()) { toast({ title: 'No code provided', description: 'Please enter some code to analyze',
variant = 'destructive'}); return; }
setIsAnalyzing(true); setResult(null); try { const endpoint: analysisType = 'quick' ? '/api/ai/quick-analysis' : '/api/ai/multi-agent-analysis'; const requestBody = analysisType = 'quick' ? { code, language, focusArea } : { code, language, analysisDepth: 'deep' }; const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json'}, body: JSON.stringify(requestBody)}); if (!response.ok) { throw new Error('Analysis failed'); }
const data = await response.json(); setResult(data.data); onAnalysisComplete?.(data.data); toast({ title: 'Analysis complete', description: `Found ${data.data.criticalIssuesCount} critical issues in ${(data.data.executionTime / 1000).toFixed(1)}s`}); } catch (error) { console.error('Analysis error:', error); toast({ title: 'Analysis failed', description: 'An error occurred during analysis. Please try again.',;
variant = 'destructive'}); } ,finally { setIsAnalyzing(false); }
}, [code, language, analysisType, focusArea, onAnalysisComplete, toast];); const toggleSection = (section: string) => { setExpandedSections(prev) ;=> ({ ...prev, [section]: !prev[section]});); }; const getScoreColor = (score: number) => { if (score >= 80) return 'text-green-600'; if (score >= 60) return 'text-yellow-600'; return 'text-red-600'; }; const getScoreLabel = (score: number) => { if (score >= 80) return 'Excellent'; if (score >= 60) return 'Good'; if (score >= 40) return 'Needs Improvement'; return 'Critical Issues'; }; return ( <div className="space-y-6"> {/* Analysis Controls */} <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"> <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"> <Sparkles className="h-5 w-5 text-purple-500" /> Multi-Agent Code Analysis </h3> <div className="space-y-4"> <div className="flex flex-col sm:flex-row gap-4"> <Tabs value={analysisType} onValueChange={(v: unknown) => setAnalysisType(v as 'quick' | 'deep')} className="flex-1"> <TabsList className="grid w-full grid-cols-2"> <TabsTrigger value="quick">Quick Analysis</TabsTrigger> <TabsTrigger value="deep">Deep Analysis</TabsTrigger> </TabsList> </Tabs> {analysisType,: = 'quick' && ( <div className="flex gap-2"> <Button
variant={focusArea = 'security' ? 'default' : 'outline'} size="sm" onClick={() => setFocusArea('security')}><Shield className="h-4 w-4 mr-1" /> Security </Button> <Button
variant={focusArea,: = 'performance' ? 'default' : 'outline'} size="sm" onClick={() => setFocusArea('performance')}><Zap className="h-4 w-4 mr-1" /> Performance </Button> <Button
variant={focusArea,: = 'quality' ? 'default' : 'outline'} size="sm" onClick={() => setFocusArea('quality')}><Code2 className="h-4 w-4 mr-1" /> Quality </Button> </div> )} </div> <Button
onClick={performAnalysis} disabled={isAnalyzing || !code.trim()} className="w-full">{isAnalyzing ? ( <> <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing... </> ) : ( <> <FileSearch className="h-4 w-4 mr-2" /> Start Analysis </> )} </Button> </div> ,</div> {/* Analysis Results */} <AnimatePresence> {result ,&& ( <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">{/* Score Card */} <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"> <div className="flex items-center justify-between mb-4"> <h4 className="text-lg font-semibold">Analysis Score</h4> <Badge variant="outline" className="text-xs"> {(result.executionTime / 1000).toFixed(1)}s </Badge> </div> <div className="flex items-center gap-6"> <div className="text-center"> <div className={cn('text-4xl font-bold', getScoreColor(result.score))}> {result.score} </div> <div className="text-sm text-gray-500 dark:text-gray-400"> {getScoreLabel(result.score)} </div> </div> <div className="flex-1"> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3"> <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} className={cn('h-3 rounded-full', result.score >= 80 ? 'bg-green-500' : result.score >= 60 ? 'bg-yellow-500' : 'bg-red-500' )} /> </div> </div> {result.criticalIssuesCount>0 && ( <div className="text-center"> <div className="text-2xl font-bold text-red-500"> {result.criticalIssuesCount} </div> <div className="text-sm text-gray-500 dark:text-gray-400"> Critical Issues </div> </div> )} </div> <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"> <p className="text-sm text-gray-700 dark:text-gray-300"> {result.summary} </p> </div> </div> {/* Key Findings */} {result.keyFindings.length>0 && ( <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"> <button
onClick={() => toggleSection('findings')} className="w-full flex items-center justify-between text-left"><h4 className="text-lg font-semibold flex items-center gap-2"> <BarChart3 className="h-5 w-5 text-blue-500" /> Key Findings </h4> {expandedSections.findings ? <ChevronDown /> : <ChevronRight />} </button> {expandedSections.findings !== false && ( <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 space-y-2">{result.keyFindings.map(finding, index) ,=> ( <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"> <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" /> <p className="text-sm flex-1">{finding}</p> </div> ),)} </motion.div> )} </div> )} {/* Issues */} {result.topIssues.length>0 && ( <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"> <button
onClick={() => toggleSection('issues')} className="w-full flex items-center justify-between text-left"><h4 className="text-lg font-semibold flex items-center gap-2"> <AlertTriangle className="h-5 w-5 text-orange-500" /> Issues Found </h4> {expandedSections.issues ? <ChevronDown /> : <ChevronRight />} </button> {expandedSections.issues !== false && ( <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 space-y-3">{result.topIssues.map(issue, index) ,=> ( <div key={index} className={cn('p-4 rounded-lg border', severityColors[issue.severity] )}> <div className="flex items-start justify-between gap-2 mb-2"> <h5 className="font-medium">{issue.title}</h5> <Badge variant={issue.severity == 'critical' ? 'destructive' : 'secondary'} className="text-xs">{issue.severity} </Badge> </div> <p className="text-sm mb-2">{issue.description}</p> {issue.suggestion && ( <div className="flex items-start gap-2"> <Info className="h-4 w-4 text-blue-500 mt-0.5" /> <p className="text-sm italic">{issue.suggestion}</p> </div> )} </div> ),)} </motion.div> )} </div> )} {/* Recommendations */} {result.topRecommendations.length>0 && ( <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"> <button
onClick={() => toggleSection('recommendations')} className="w-full flex items-center justify-between text-left"><h4 className="text-lg font-semibold flex items-center gap-2"> <Sparkles className="h-5 w-5 text-purple-500" /> Recommendations </h4> {expandedSections.recommendations ? <ChevronDown /> : <ChevronRight />} </button> {expandedSections.recommendations !== false && ( <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="mt-4 space-y-3">{result.topRecommendations.map(rec, index) ,=> ( <div key={index} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"> <div className="flex items-start justify-between gap-2 mb-2"> <h5 className="font-medium">{rec.title}</h5> <div className="flex gap-2"> <Badge variant={priorityBadgeVariants[rec.priority]}> {rec.priority} </Badge> <Badge variant="outline"> {rec.effort} effort </Badge> </div> </div> <p className="text-sm">{rec.description}</p> </div> ),)} </motion.div> )} </div> )} </motion.div> )} </AnimatePresence> </div> );
