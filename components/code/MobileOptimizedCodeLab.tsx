'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Lightbulb, Play, Save, Download, Upload, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
;
import { WalletConnect } from '@/components/blockchain/WalletConnect';
import { ContractDeployer } from '@/components/blockchain/ContractDeployer';
import { useToast } from '@/components/ui/use-toast';
import { useMobileDetect } from '@/lib/hooks/useMobileDetect';
import { MobileCodeEditor } from '@/components/editor/MobileCodeEditor';

// Dynamic import for desktop editor
const DesktopEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    )
  }
);

const DEFAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SimpleStorage
 * @dev Store and retrieve a value in a variable
 */
contract SimpleStorage {
    uint256 private storedData;
    
    event ValueChanged(uint256 newValue);
    
    /**
     * @dev Store a value
     * @param x The value to store
     */
    function set(uint256 x) public {
        storedData = x;
        emit ValueChanged(x);
    }
    
    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function get() public view returns (uint256) {
        return storedData;
    }
}`;

interface CompilationResult {
  success: boolean;
  bytecode?: string;
  abi?: any[];
  errors?: string[];
  warnings?: string[];
  gasEstimate?: number;
  securityIssues?: any[];
  optimizationSuggestions?: string[];
}

export function MobileOptimizedCodeLab() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isMobile, isTablet } = useMobileDetect();
  const { toast } = useToast();

  // Use mobile editor for mobile devices and tablets in portrait mode
  const useMobileEditor = isMobile || (isTablet && window.innerHeight > window.innerWidth);

  const handleCompile = async () => {
    if (!code.trim()) {
      toast({
        title: "No code to compile",
        description: "Please write some Solidity code first.",
        variant: "destructive",
      });
      return;
    }

    setIsCompiling(true);
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      setCompilationResult(result);

      if (result.success) {
        toast({
          title: "Compilation successful!",
          description: `Gas estimate: ${result.gasEstimate || 'N/A'}`,
        });
      } else {
        toast({
          title: "Compilation failed",
          description: result.errors?.[0] || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Compilation error",
        description: "Failed to compile contract. Please try again.",
        variant: "destructive",
      });
      console.error('Compilation error:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to backend/localStorage
      localStorage.setItem('savedContract', code);
      localStorage.setItem('savedContractDate', new Date().toISOString());
      
      toast({
        title: "Code saved!",
        description: "Your contract has been saved locally.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contract.sol';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Contract downloaded!",
      description: "Your contract has been saved to your device.",
    });
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
      toast({
        title: "File uploaded!",
        description: `Loaded ${file.name}`,
      });
    };
    reader.readAsText(file);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Solidity Contract',
          text: 'Check out my Solidity contract!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(code);
        toast({
          title: "Code copied!",
          description: "Contract code copied to clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy code to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  // Load saved code on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('savedContract');
    if (savedCode) {
      setCode(savedCode);
      const savedDate = localStorage.getItem('savedContractDate');
      if (savedDate) {
        toast({
          title: "Code restored",
          description: `Last saved: ${new Date(savedDate).toLocaleString()}`,
        });
      }
    }
  }, [toast]);

  if (useMobileEditor) {
    return (
      <div className="h-screen flex flex-col bg-gray-950">
        {/* Mobile Header */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Code Lab</h1>
          <WalletConnect />
        </div>

        {/* Mobile Editor */}
        <div className="flex-1 overflow-hidden">
          <MobileCodeEditor
            documentId="code-lab"
            initialContent={code}
            language="solidity"
            theme="vs-dark"
            height="100%"
            onContentChange={setCode}
            onRun={handleCompile}
            onShare={handleShare}
            autoSave={true}
            autoSaveInterval={3000}
          />
        </div>

        {/* Compilation Results Bottom Sheet */}
        {compilationResult && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 rounded-t-2xl shadow-xl max-h-[50vh] overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">
                  {compilationResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                </h3>
                <button
                  onClick={() => setCompilationResult(null)}
                  className="p-2 rounded-lg hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {compilationResult.errors && compilationResult.errors.length > 0 && (
                <div className="space-y-2 mb-4">
                  {compilationResult.errors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {compilationResult.success && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <p className="text-sm text-green-400">
                      Gas estimate: {compilationResult.gasEstimate || 'N/A'}
                    </p>
                  </div>
                  
                  {compilationResult.securityIssues && compilationResult.securityIssues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-yellow-400">Security Issues</h4>
                      {compilationResult.securityIssues.map((issue, index) => (
                        <div key={index} className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                          <p className="text-sm text-yellow-400">{JSON.stringify(issue)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Solidity Code Lab</h1>
          <p className="text-gray-400">Write, compile, and deploy smart contracts</p>
        </div>
        <WalletConnect />
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Code Editor</CardTitle>
                <CardDescription>Write your Solidity smart contract</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden border border-gray-800">
                <DesktopEditor
                  height="500px"
                  language="solidity"
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                  }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isCompiling ? 'Compiling...' : 'Compile'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results & Tools Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Compilation Results */}
          {compilationResult && (
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className={compilationResult.success ? 'text-green-400' : 'text-red-400'}>
                  {compilationResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {compilationResult.errors && compilationResult.errors.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {compilationResult.errors.map((error, index) => (
                      <div key={index} className="p-2 bg-red-900/20 border border-red-700 rounded text-sm text-red-400">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
                
                {compilationResult.success && (
                  <div className="space-y-3">
                    <div className="p-2 bg-green-900/20 border border-green-700 rounded">
                      <p className="text-sm text-green-400">
                        Gas estimate: {compilationResult.gasEstimate || 'N/A'}
                      </p>
                    </div>
                    
                    {compilationResult.securityIssues && compilationResult.securityIssues.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-400 mb-2">Security Issues</h4>
                        {compilationResult.securityIssues.map((issue, index) => (
                          <div key={index} className="p-2 bg-yellow-900/20 border border-yellow-700 rounded mb-2">
                            <p className="text-sm text-yellow-400">{JSON.stringify(issue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract Deployer */}
          {compilationResult?.success && compilationResult.bytecode && (
            <ContractDeployer
              bytecode={compilationResult.bytecode}
              abi={compilationResult.abi || []}
            />
          )}

          {/* Quick Tips */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Lightbulb className="w-5 h-5 mr-2" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-400">
                • Use <code className="bg-gray-800 px-1 rounded">pragma solidity ^0.8.0;</code> for latest features
              </p>
              <p className="text-sm text-gray-400">
                • Always include license identifier: <code className="bg-gray-800 px-1 rounded">// SPDX-License-Identifier: MIT</code>
              </p>
              <p className="text-sm text-gray-400">
                • Use events to log important state changes
              </p>
              <p className="text-sm text-gray-400">
                • Consider gas optimization in loops and storage operations
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".sol,.txt"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}