/**
 * Interactive Solidity Code Editor Component
 *
 * A comprehensive code editor with real-time compilation, error detection,
 * code templates, and split-pane layout for an immersive Solidity development experience.
 */

'use client'

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactElement,
} from 'react'
import dynamic from 'next/dynamic'
import * as monaco from 'monaco-editor'
import { getCompiler, type CompilationResult } from '@/lib/compiler'
import { MonacoSoliditySetup } from '@/lib/editor/MonacoSoliditySetup'
import { solidityTemplates, getTemplateById } from '@/lib/editor/templates'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
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
  Shield,
} from 'lucide-react'

// Monaco Editor lazy loading to prevent SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
})

interface CompilationError {
  severity: 'error' | 'warning' | 'info'
  message: string
  line?: number
  column?: number
  source?: string
}

interface CompilationResult {
  success: boolean
  errors: CompilationError[]
  warnings: CompilationError[]
  bytecode?: string
  abi?: any[]
  gasEstimate?: number
  compilationTime?: number
}

interface SolidityEditorProps {
  initialCode?: string
  onCodeChange?: (code: string) => void
  onCompile?: (result: CompilationResult) => void
  height?: string | number
  theme?: 'light' | 'dark'
  readOnly?: boolean
  showMinimap?: boolean
  showLineNumbers?: boolean
  autoCompile?: boolean
  templateId?: string
  className?: string
}

const defaultCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract {
    uint256 public value;
    
    constructor(uint256 _initialValue) {
        value = _initialValue;
    }
    
    function setValue(uint256 _newValue) public {
        value = _newValue;
    }
    
    function getValue() public view returns (uint256) {
        return value;
    }
}`

export const SolidityEditor: React.FC<SolidityEditorProps> = ({
  initialCode = defaultCode,
  onCodeChange,
  onCompile,
  height = '600px',
  theme = 'light',
  readOnly = false,
  showMinimap = true,
  showLineNumbers = true,
  autoCompile = true,
  templateId,
  className = '',
}) => {
  const [code, setCode] = useState<string>(initialCode)
  const [compilationResult, setCompilationResult] =
    useState<CompilationResult | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    templateId || '',
  )
  const [activeTab, setActiveTab] = useState<string>('editor')
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null)

  const compilerRef = useRef<any>(null)
  const { toast } = useToast()

  // Initialize Monaco Solidity setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      MonacoSoliditySetup.initialize()
    }
  }, [])

  // Initialize compiler
  useEffect(() => {
    const initCompiler = async () => {
      if (!compilerRef.current) {
        compilerRef.current = await getCompiler()
      }
    }
    initCompiler()
  }, [])

  // Handle template change
  useEffect(() => {
    if (templateId && templateId !== selectedTemplate) {
      const template = getTemplateById(templateId)
      if (template) {
        setCode(template.code)
        setSelectedTemplate(templateId)
      }
    }
  }, [templateId, selectedTemplate])

  // Auto-compile when code changes
  useEffect(() => {
    if (autoCompile && code && code.trim() && !isCompiling) {
      const timeoutId = setTimeout(() => {
        handleCompile()
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [code, autoCompile, isCompiling])

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode)
      onCodeChange?.(newCode)
    },
    [onCodeChange],
  )

  const handleCompile = useCallback(async () => {
    if (!compilerRef.current || !code.trim()) return

    setIsCompiling(true)

    try {
      const startTime = Date.now()
      const result = await compilerRef.current.compile(code)
      const compilationTime = Date.now() - startTime

      const compilationResult: CompilationResult = {
        ...result,
        compilationTime,
      }

      setCompilationResult(compilationResult)
      onCompile?.(compilationResult)

      if (result.success) {
        toast({
          title: 'Compilation Successful',
          description: `Compiled in ${compilationTime}ms`,
          variant: 'default',
        })
      } else {
        toast({
          title: 'Compilation Failed',
          description: `${result.errors.length} error(s) found`,
          variant: 'destructive',
        })
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: 'Compilation Error',
        description: errorMessage,
        variant: 'destructive',
      })

      setCompilationResult({
        success: false,
        errors: [
          {
            severity: 'error',
            message: errorMessage,
          },
        ],
        warnings: [],
      })
    } finally {
      setIsCompiling(false)
    }
  }, [code, onCompile, toast])

  const handleTemplateChange = useCallback((templateId: string) => {
    if (templateId === 'custom') {
      setCode(defaultCode)
    } else {
      const template = getTemplateById(templateId)
      if (template) {
        setCode(template.code)
      }
    }
    setSelectedTemplate(templateId)
  }, [])

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: 'Code Copied',
        description: 'Code has been copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy code to clipboard',
        variant: 'destructive',
      })
    }
  }, [code, toast])

  const handleDownloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contract.sol'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: 'Download Started',
      description: 'Contract file is being downloaded',
    })
  }, [code, toast])

  const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
    language: 'solidity',
    theme: theme === 'dark' ? 'vs-dark' : 'vs-light',
    readOnly,
    minimap: { enabled: showMinimap },
    lineNumbers: showLineNumbers ? 'on' : 'off',
    fontSize: 14,
    tabSize: 2,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    folding: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: true,
    parameterHints: { enabled: true },
    formatOnType: true,
    formatOnPaste: true,
  }

  return (
    <div
      className={`solidity-editor bg-background border border-border rounded-lg overflow-hidden ${className}`}
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Code className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Solidity Editor</h3>
          </div>

          <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Choose template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom Contract</SelectItem>
              {solidityTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="flex items-center space-x-1"
          >
            <Copy className="h-4 w-4" />
            <span>Copy</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCode}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>

          <Button
            onClick={handleCompile}
            disabled={isCompiling}
            size="sm"
            className="flex items-center space-x-1"
          >
            {isCompiling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger
            value="editor"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <FileText className="h-4 w-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger
            value="output"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            <Package className="h-4 w-4 mr-2" />
            Output
            {compilationResult && (
              <span
                className={`ml-2 w-2 h-2 rounded-full ${compilationResult.success ? 'bg-green-500' : 'bg-red-500'}`}
              />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-0">
          <MonacoEditor
            height={height}
            value={code}
            onChange={(value) => handleCodeChange(value || '')}
            options={editorOptions}
            onMount={(editor) => setEditorInstance(editor)}
          />
        </TabsContent>

        <TabsContent value="output" className="mt-0 p-4">
          <ScrollArea className="h-96">
            {!compilationResult ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Compile your contract to see the output</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Compilation Status */}
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {compilationResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-semibold">
                        {compilationResult.success
                          ? 'Compilation Successful'
                          : 'Compilation Failed'}
                      </span>
                    </div>
                    {compilationResult.compilationTime && (
                      <span className="text-sm text-muted-foreground">
                        {compilationResult.compilationTime}ms
                      </span>
                    )}
                  </div>

                  {compilationResult.gasEstimate && (
                    <div className="mt-2 flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">
                        Gas Estimate:{' '}
                        {compilationResult.gasEstimate.toLocaleString()}
                      </span>
                    </div>
                  )}
                </Card>

                {/* Errors */}
                {compilationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Errors ({compilationResult.errors.length})
                    </h4>
                    {compilationResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription>
                          {error.line && (
                            <span className="font-mono text-sm">
                              Line {error.line}:{' '}
                            </span>
                          )}
                          {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {compilationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Warnings ({compilationResult.warnings.length})
                    </h4>
                    {compilationResult.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertDescription>
                          {warning.line && (
                            <span className="font-mono text-sm">
                              Line {warning.line}:{' '}
                            </span>
                          )}
                          {warning.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}

                {/* Bytecode */}
                {compilationResult.success && compilationResult.bytecode && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      Bytecode
                    </h4>
                    <Card className="p-4">
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                        {compilationResult.bytecode}
                      </pre>
                    </Card>
                  </div>
                )}

                {/* ABI */}
                {compilationResult.success && compilationResult.abi && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      ABI
                    </h4>
                    <Card className="p-4">
                      <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(compilationResult.abi, null, 2)}
                      </pre>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
