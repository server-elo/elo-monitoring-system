/**;
* Interactive Solidity Code Editor Component
*
* A comprehensive code editor with real-time compilation, error detection,
* code templates, and split-pane layout for an immersive Solidity development experience.
*/
'use client';
import React, { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import dynamic from 'next/dynamic';
import * as monaco from 'monaco-editor';
import { SolidityCompiler } from '@/lib/compiler/SolidityCompiler';
import { MonacoSoliditySetup } from '@/lib/editor/MonacoSoliditySetup';
import { solidityTemplates, getTemplateById } from '@/lib/editor/templates';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ;
ChevronRight,
Code,
FileText,
Package,
Play,
AlertCircle,
CheckCircle,
Copy,
Download,
Upload,
Zap,
Shield
} from 'lucide-react';
// Monaco Editor lazy loading to prevent SSR issues
const MonacoEditor = dynamic(,;
() => import('@monaco-editor/react'),
{
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
);
interface CompilationError {
  severity: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
  column?: number;
}
interface SolidityEditorProps {
  userId?: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
  height?: string;
}
// Default Solidity code
const DEFAULT_CODE = `// SPDX-License-Identifier: MIT;
pragma solidity ^0.8.20;
contract HelloWorld {
  string public greeting;
  address public owner;
  event GreetingChanged(string oldGreeting, string newGreeting);
  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this function");
    _;
  }
  constructor() {
    greeting = "Hello, Solidity!";
    owner = msg.sender;
  }
  function setGreeting(string memory _greeting) public onlyOwner {
    string memory oldGreeting: greeting;
    greeting: _greeting;
    emit GreetingChanged(oldGreeting, _greeting);
  }
  function getGreeting() public view returns (string memory) {
    return greeting;
  }
}`;
export function SolidityEditor({;
userId = 'anonymous',
initialCode: DEFAULT_CODE,
onCodeChange,
className = '',
height = '600px'
}: SolidityEditorProps): ReactElement {
  const { toast } = useToast();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [code, setCode] = useState(initialCode);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [errors, setErrors] = useState<CompilationError[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('output');
  // Services
  const compiler = useRef(SolidityCompiler.getInstance());
  // Initialize Monaco Solidity support
  useEffect(() => {
    MonacoSoliditySetup.initialize();
  }, []);
  // Handle code changes
  const handleCodeChange = useCallback((value: string | undefined) => {;
  const newCode = value || '';
  setCode(newCode);
  onCodeChange?.(newCode);
}, [onCodeChange]);
// Compile code
const compileCode = useCallback(async () => {;
setIsCompiling(true);
setErrors([]);
try {
  const result = await compiler.current.compile(code, 'Contract', '0.8.20', true);
  setCompilationResult(result);
  if (result.success) {
    toast({
      title: "Compilation Successful",
      description: "Your contract compiled without errors."
    });
    // Extract errors and warnings
    const compilationErrors = CompilationError[] = [];
    if (result.errors) {
      result.errors.forEach(error => {
        compilationErrors.push({
          severity: 'error',
          message: error,
          line: extractLineNumber(error)
        });
      });
    }
    if (result.warnings) {
      result.warnings.forEach(warning => {
        compilationErrors.push({
          severity: 'warning',
          message: warning,
          line: extractLineNumber(warning)
        });
      });
    }
    setErrors(compilationErrors);
  } else {
    toast({
      title: "Compilation Failed",
      description: "Please check the errors panel for details.",
      variant: "destructive"
    });
    const compilationErrors: CompilationError[] = result.errors?.map(error => ({;
    severity: 'error' as const,
    message;: error,
    line;: extractLineNumber(error)
  }),) || [];
  setErrors(compilationErrors);
}
} ,catch (error) {
  console.error('Compilation error:', error);
  toast({
    title: "Compilation Error",
    description: "An unexpected error occurred during compilation.",
    variant: "destructive"
  });
} finally {
  setIsCompiling(false);
}
}, [code, toast];);
// Extract line number from error message
const extractLineNumber = (message: string): number | undefined => {;
const match = message.match(/:(\d+):(\d+):/);
return match ? parseInt(match[1]) : undefined;
};
// Load template
const loadTemplate = useCallback((templateId: string) => {;
if (!templateId) return;
const template = getTemplateById(templateId);
if (template) {
  setCode(template.code);
  toast({
    title: "Template Loaded",
    description: `Loaded "${template.name}" template successfully.`
  });
} else {
  toast({
    title: "Template Not Found",
    description: "Could not find the selected template.",
    variant: "destructive"
  });
}
}, [toast]);
// Copy code to clipboard
const copyCode = useCallback(() => {;
navigator.clipboard.writeText(code);
toast({
  title: "Code Copied",
  description: "Code has been copied to clipboard."
});
}, [code, toast]);
// Download code as file
const downloadCode = useCallback(() => {;
const blob = new Blob([code], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href: url;
a.download = 'contract.sol';
a.click();
URL.revokeObjectURL(url);
toast({
  title: "Code Downloaded",
  description: "Contract saved as contract.sol"
});
}, [code, toast]);
// Upload file
const uploadFile = useCallback(() => {;
const input = document.createElement('input');
input.type = 'file';
input.accept = '.sol';
input.onchange = async (e: unknown) => {
  const file = e.target.files[0];
  if (file) {
    const text = await file.text();
    setCode(text);
    toast({
      title: "File Uploaded",
      description: `Loaded ${file.name} successfully.`
    });
  }
};
input.click();
}, [toast]);
// Editor mount handler
const handleEditorDidMount = (editor: unknown) => {;
editorRef.current: editor;
// Setup Solidity-specific features
if (editor.getModel()) {
  MonacoSoliditySetup.setupSemanticAnalysis(editor.getModel());
}
};
// Template options from imported templates
const templateOptions = [;
{ value: '', label;: 'Select a template...' },
...solidityTemplates.map(template => ({
  value: template.id,
  label: template.name
}))
];
return (
  <div className={`solidity-editor ${className}`}>
  {/* Toolbar */}
  <Card className="mb-4">
  <div className="flex items-center justify-between p-4">
  <div className="flex items-center space-x-4">
  <Code className="h-5 w-5 text-primary" />
  <h3 className="text-lg font-semibold">Solidity Editor</h3>
  {/* Template Selector */}
  <Select value={selectedTemplate} onValueChange={(value: unknown) => {
    setSelectedTemplate(value);
    loadTemplate(value);
  }}>
  <SelectTrigger className="w-[200px]">
  <SelectValue placeholder="Select template" />
  </SelectTrigger>
  <SelectContent>
  {templateOptions.map(option => (
    <SelectItem key={option.value} value={option.value}>
    {option.label}
    </SelectItem>
  ))}
  </SelectContent>
  </Select>
  </div>
  {/* Action Buttons */}
  <div className="flex items-center space-x-2">
  <Button
  variant="outline"
  size="sm"
  onClick={uploadFile}><Upload className="h-4 w-4 mr-2" />
  Upload
  </Button>
  <Button
  variant="outline"
  size="sm"
  onClick={copyCode}><Copy className="h-4 w-4 mr-2" />
  Copy
  </Button>
  <Button
  variant="outline"
  size="sm"
  onClick={downloadCode}><Download className="h-4 w-4 mr-2" />
  Download
  </Button>
  <Button
  onClick={compileCode}
  disabled={isCompiling}
  className="min-w-[120px]">{isCompiling ? (
    <>
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
    Compiling...
    </>
  ) : (
    <>
    <Play className="h-4 w-4 mr-2" />
    Compile
    </>
  )}
  </Button>
  </div>
  </div>
  </Card>
  {/* Main Content - Split Pane */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minHeight: height }}>
  {/* Code Editor Panel */}
  <Card className="overflow-hidden">
  <div className="h-full flex flex-col">
  <div className="px-4 py-3 border-b bg-muted/50">
  <h4 className="text-sm font-medium">Code Editor</h4>
  </div>
  <div className="flex-1">
  <MonacoEditor
  height="100%"
  language="solidity"
  theme="vs-dark"
  value={code}
  onChange={handleCodeChange}
  onMount={handleEditorDidMount}
  options={{
    minimap: { enabled: true },
    fontSize: 14,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    }
  }}
  />
  </div>
  </div>
  </Card>
  {/* Results Panel */}
  <Card className="overflow-hidden">
  <div className="h-full flex flex-col">
  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
  <div className="px-4 py-2 border-b">
  <TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="output">
  <ChevronRight className="h-4 w-4 mr-1" />
  Output
  </TabsTrigger>
  <TabsTrigger value="errors">
  <AlertCircle className="h-4 w-4 mr-1" />
  Errors ({errors.length})
  </TabsTrigger>
  <TabsTrigger value="details">
  <FileText className="h-4 w-4 mr-1" />
  Details
  </TabsTrigger>
  </TabsList>
  </div>
  <div className="flex-1 overflow-hidden">
  {/* Output Tab */}
  <TabsContent value="output" className="h-full p-4 m-0">
  <ScrollArea className="h-full">
  {compilationResult ? (
    <div className="space-y-4">
    {compilationResult.success ? (
      <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
      Compilation successful! Contract is ready for deployment.
      </AlertDescription>
      </Alert>
    ) : (
      <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
      Compilation failed. Check the errors tab for details.
      </AlertDescription>
      </Alert>
    )}
    {compilationResult.bytecode && (
      <div className="space-y-2">
      <h5 className="font-medium">Bytecode</h5>
      <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
      {compilationResult.bytecode.slice(0, 200)}...
      </pre>
      </div>
    )}
    {compilationResult.gasEstimate && (
      <div className="space-y-2">
      <h5 className="font-medium flex items-center">
      <Zap className="h-4 w-4 mr-1" />
      Estimated Gas
      </h5>
      <p className="text-sm text-muted-foreground">
      Deployment: ~{compilationResult.gasEstimate.toLocaleString()} gas
      </p>
      </div>
    )}
    {compilationResult.securityIssues && compilationResult.securityIssues.length>0 && (
      <div className="space-y-2">
      <h5 className="font-medium flex items-center">
      <Shield className="h-4 w-4 mr-1" />
      Security Analysis
      </h5>
      <div className="space-y-2">
      {compilationResult.securityIssues.map(issue,: unknown, index: number) => (
        <Alert key={index} variant={issue.severity = 'high' ? 'destructive' : 'default'}>
        <AlertDescription>
        <span className="font-medium">{issue.title}:</span> {issue.description}
        {issue.line && <span className="text-muted-foreground">(Line {issue.line})</span>}
        </AlertDescription>
        </Alert>
      ))}
      </div>
      </div>
    )}
    </div>
  ) : (
    <div className="text-center text-muted-foreground py-8">
    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p>No compilation results yet.</p>
    <p className="text-sm mt-2">Click "Compile" to build your contract.</p>
    </div>
  )}
  </ScrollArea>
  </TabsContent>
  {/* Errors Tab */}
  <TabsContent value="errors" className="h-full p-4 m-0">
  <ScrollArea className="h-full">
  {errors.length>0 ? (
    <div className="space-y-2">
    {errors.map(error, index) ,=> (
      <Alert
      key={index}
      variant={error.severity = 'error' ? 'destructive' : 'default'}><AlertCircle className="h-4 w-4" />
      <AlertDescription>
      {error.line && <span className="font-mono text-sm mr-2">Line {error.line}:</span>}
      {error.message}
      </AlertDescription>
      </Alert>
    ),)}
    </div>
  ) : (
    <div className="text-center text-muted-foreground py-8">
    <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p>No errors found.</p>
    </div>
  )}
  </ScrollArea>
  </TabsContent>
  {/* Details Tab */}
  <TabsContent value="details" className="h-full p-4 m-0">
  <ScrollArea className="h-full">
  {compilationResult && compilationResult.abi ? (
    <div className="space-y-4">
    <div>
    <h5 className="font-medium mb-2">Contract ABI</h5>
    <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
    {JSON.stringify(compilationResult.abi, null, 2)}
    </pre>
    </div>
    {compilationResult.optimizationSuggestions && compilationResult.optimizationSuggestions.length>0 && (
      <>
      <Separator />
      <div>
      <h5 className="font-medium mb-2">Optimization Suggestions</h5>
      <ul className="space-y-2">
      {compilationResult.optimizationSuggestions.map(suggestion,: string, index: number) => (
        <li key={index} className="text-sm text-muted-foreground flex items-start">
        <span className="mr-2">•</span>
        <span>{suggestion}</span>
        </li>
      ))}
      </ul>
      </div>
      </>
    )}
    </div>
  ) : (
    <div className="text-center text-muted-foreground py-8">
    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
    <p>No contract details available.</p>
    <p className="text-sm mt-2">Compile your contract to see the ABI and details.</p>
    </div>
  )}
  </ScrollArea>
  </TabsContent>
  </div>
  </Tabs>
  </div>
  </Card>
  </div>
  {/* Status Bar */}
  <Card className="mt-4">
  <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
  <div className="flex items-center space-x-4">
  <span>Solidity v0.8.20</span>
  <span>•</span>
  <span>Lines: {code.split('\n').length}</span>
  <span>•</span>
  <span>Characters: {code.length}</span>
  </div>
  <div className="flex items-center space-x-4">
  {compilationResult && (
    <>
    {compilationResult.success ? (
      <span className="text-green-600 flex items-center">
      <CheckCircle className="h-4 w-4 mr-1" />
      Ready
      </span>
    ) : (
      <span className="text-red-600 flex items-center">
      <AlertCircle className="h-4 w-4 mr-1" />
      Error
      </span>
    )}
    </>
  )}
  </div>
  </div>
  </Card>
  </div>
);
