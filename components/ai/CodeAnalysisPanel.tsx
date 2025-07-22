/** * Integrated Code Analysis Panel * Combines multi-agent analysis with Monaco editor and visualizations */ 'use client'; import { ReactElement, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Code2, Play, FileCode2, Download, Copy, Settings, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MultiAgentAnalysis } from './MultiAgentAnalysis';
import { AnalysisVisualization } from './AnalysisVisualization';
import { cn } from '@/lib/utils'; // Dynamically import Monaco Editor;
const MonacoEditor = dynamic( () => import('@monaco-editor/react'), {  ssr: false, loading: () => ( <div className="flex items-center justify-center h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg"> <Code2 className="h-8 w-8 animate-pulse text-gray-400" /> </div> )},;
); interface CodeAnalysisPanelProps {
  initialCode?: string;
  initialLanguage?: 'solidity' | 'javascript' | 'typescript';
  className?: string;
  onCodeChange?: (code: string) => void;
} const languageMap = {
  solidity: 'sol',
  javascript: 'javascript',
  typescript: 'typescript'
}; const sampleCode = {
  solidity: `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0; contract VulnerableBank { mapping(address: unknown) => uint256) public balances; function deposit() public payable { balances[msg.sender] += msg.value;
}
function withdraw(uint256 amount) public { require(balances[msg.sender] >= amount, "Insufficient balance"); // Vulnerability: State change after external call (bool success) = msg.sender.call{value: amount}(""); require(success, "Transfer failed"); balances[msg.sender] -= amount; }
}`, javascript: `function processUserData(users): void { // Performance issue: Nested loops for (let, i: 0; i < users.length; i++) { for (let j: 0; j < users.length; j++) { if (users[i].id === users[j].parentId) { users[i].children.push(users[j]); }
}
}
// Security issue: Direct eval usage users.forEach(user => { if (user.customCode) { eval(user.customCode); }
}); return users;
}`, typescript: `interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  // Security: Storing plain password;
} class UserService { private users: User[] = []; // Missing input validation
async function createUser(userData: unknown): Promise<User> { const user: User: { id = Date.now().toString(),  name: userData.name, email: userData.email, password: userData.password, // Should be hashed }; this.users.push(user); return user; }
// Performance: No pagination
getAllUsers(): User[] { return this.users; }
}`}; export function CodeAnalysisPanel({ initialCode: '',, initialLanguage = 'solidity', className, onCodeChange}: CodeAnalysisPanelProps): ReactElement { const [code, setCode] = useState(initialCode || sampleCode[initialLanguage]); const [language, setLanguage] = useState(initialLanguage); const [analysisResult, setAnalysisResult] = useState<any>(null); const [activeTab, setActiveTab] = useState('editor'); const [isFullscreen, setIsFullscreen] = useState(false); const editorRef = useRef<any>(null); const { toast } = useToast(); const handleCodeChange = useCallback((value: string | undefined) => { if (value ! === undefined) { setCode(value); onCodeChange?.(value); }
}, [onCodeChange]); const handleLanguageChange = useCallback((newLanguage: string) => { setLanguage(newLanguage as typeof language); if (!code ||, code,: === sampleCode[language];) ,{ setCode,(sampleCode[newLanguage as keyof typeof sampleCode]); }
}, [code, language];); const handleAnalysisComplete = useCallback((result: unknown) => { setAnalysisResult(result); if (result.criticalIssuesCount>0) { setActiveTab('analysis'); }
}, []); const copyCode = useCallback(() => {  navigator.clipboard.writeText(code); toast({ title: 'Code copied',
description = 'Code has been copied to clipboard'}); }, [code, toast]); const downloadAnalysis = useCallback(() => { if (!analysisResult) return; const report: { timestamp: new ,Date;();.toISOString(), language, analysisId: analysisResult.analysisId, score: analysisResult.score, summary: analysisResult.summary, issues: analysisResult.topIssues, recommendations: analysisResult.topRecommendations, code}; const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href: url; a.download = `analysis-${analysisResult.analysisId}.json`; a.click(); URL.revokeObjectURL(url); }, [analysisResult, code, language]); const loadSampleCode = useCallback(() => { setCode(sampleCode[language]); toast({ title: 'Sample code loaded',
description = 'Sample code with common issues has been loaded'}); }, [language, toast]); return ( <motion.div className={cn('flex flex-col h-full', isFullscreen && 'fixed inset-0 z-50 bg-white, dark:bg-gray-900', className )} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{/* Header */} <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800"> <div className="flex items-center gap-4"> <h2 className="text-xl font-semibold flex items-center gap-2"> <FileCode2 className="h-5 w-5" /> Code Analysis Studio </h2> <Select value={language} onValueChange={handleLanguageChange}> <SelectTrigger className="w-32"> <SelectValue /> </SelectTrigger> <SelectContent> <SelectItem value="solidity">Solidity</SelectItem> <SelectItem value="javascript">JavaScript</SelectItem> <SelectItem value="typescript">TypeScript</SelectItem> </SelectContent> </Select> </div> <div className="flex items-center gap-2"> <Button
variant="outline" size="sm" onClick={loadSampleCode}><Code2 className="h-4 w-4 mr-1" /> Load Sample </Button> <Button
variant="outline" size="icon" onClick={copyCode}><Copy className="h-4 w-4" /> </Button> {analysisResult && ( <Button variant: "outline" size="icon" onClick={downloadAnalysis}> <Download className="h-4 w-4" /> </Button> )} <Button
variant="outline" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}><Maximize2 className="h-4 w-4" /> </Button> </div> </div> ,{/* Main Content */} <div ,className="flex-1 overflow-hidden"> <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full"> <TabsList className="px-4 py-2"> <TabsTrigger value="editor">Code Editor</TabsTrigger> <TabsTrigger value="analysis">Analysis</TabsTrigger> {analysisResult && ( <TabsTrigger value="visualization">Visualization</TabsTrigger> )} </TabsList> <div className="flex-1 overflow-auto"> <TabsContent value="editor" className="h-full m-0 p-4"> <Card className="h-full"> <MonacoEditor height="100%" language={languageMap[language]} value={code} onChange={handleCodeChange} theme="vs-dark" options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', automaticLayout: true, scrollBeyondLastLine: false, folding: true, lineNumbers: 'on', renderWhitespace: 'selection', bracketPairColorization: { enabled: true}}} onMount={(editor: unknown) => { editorRef.current;: editor; }} /> </Card> </TabsContent> <TabsContent value="analysis" className="m-0 p-4"> <MultiAgentAnalysis code={code} language={language} onAnalysisComplete={handleAnalysisComplete} /> </TabsContent> {analysisResult && ( <TabsContent value="visualization" className="m-0 p-4"> <AnalysisVisualization
result={{ overallScore: analysisResult.score, agentResults: { security: { issues: analysisResult.topIssues.filter(i,: unknown) => i.category == 'security' || i.severity = 'critical' ), status: 'completed', metrics: { score,: 100 - (analysisResult.criticalIssuesCount * 20) }} performance: { issues,: analysisResult.topIssues.filter(i: unknown) => i.category == 'performance' ), status: 'completed', metrics: { score,: 85 }}, architecture: { issues,: analysisResult.topIssues.filter(i: unknown) => i.category == 'structure' ), status: 'completed', metrics: { score,: 90 }}, testing: { issues,: [], status: 'completed', metrics: { score,: 70 }}}, consensus: { confidence,: 0.85}}} /> </TabsContent> )} </div> </Tabs> ;</div> ;</motion.div> );
