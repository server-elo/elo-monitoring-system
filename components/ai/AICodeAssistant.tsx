"use client";
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo
} from "react";
import { ReactElement } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Shield,
  Zap,
  Lightbulb,
  Code,
  MessageSquare,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  TrendingUp,
  FileCode,
  Search,
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Settings,
  Brain,
  Bug,
  Lock,
  Gauge,
  BookOpen,
  Terminal
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/Tooltip";
import type { SecurityIssue, GasOptimization } from "@/types/security";
import { cn } from "@/lib/utils";
interface CodeSuggestion {
  id: string;
  type: "completion" | "fix" | "refactor" | "optimization";
  title: string;
  description: string;
  code: string;
  impact?: "high" | "medium" | "low";
  confidence: number;
  line?: number;
  column?: number;
}
interface ErrorExplanation {
  error: string;
  explanation: string;
  possibleCauses: string[];
  solutions: string[];
  codeExamples?: string[];
  resources?: Array<{ title: string;
  url: string;
}>;
}
interface NaturalLanguageQuery {
  query: string;
  context?: string;
  intent: "generate" | "explain" | "fix" | "optimize" | "security";
}
interface AIAnalysisResult {
  securityIssues: SecurityIssue[];
  gasOptimizations: GasOptimization[];
  suggestions: CodeSuggestion[];
  bestPractices: Array<{
    title: string;
    description: string;
    severity: "info" | "warning" | "error";
    line?: number;
  }>;
  codeQuality: {
    score: number;
    readability: number;
    maintainability: number;
    security: number;
    gasEfficiency: number;
  };
}
interface AICodeAssistantProps {
  code: string;
  onCodeChange?: (newCode: string) => void;
  onSuggestionApply?: (suggestion: CodeSuggestion) => void;
  language?: string;
  className?: string;
  editorInstance?: unknown;
  // Monaco editor instance
  userId?: string;
}
export function AICodeAssistant({
  code,
  onCodeChange,
  onSuggestionApply,
  language = "solidity",
  className,
  editorInstance,
  userId
}: AICodeAssistantProps): ReactElement {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
  "security" | "gas" | "suggestions" | "quality"
  >("suggestions");
  const [naturalLanguageInput, setNaturalLanguageInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<
  "all" | "critical" | "high" | "medium" | "low"
  >("all");
  const [showSettings, setShowSettings] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Auto-analyze code when it changes
  useEffect(() => {
    if (!autoAnalyze || !code.trim()) return;
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    analysisTimeoutRef.current = setTimeout(() => {
      if (realTimeAnalysis) {
        analyzeCode();
      }
    }, 1000); // Debounce for 1 second
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [code, autoAnalyze, realTimeAnalysis]);
  const analyzeCode = useCallback(async () => {
    if (!code.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/code-assistant/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language,
          userId,
          includeSecurityAnalysis: true,
          includeGasOptimization: true,
          includeBestPractices: true,
          includeCodeQuality: true
        })
      });
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      const result = await response.json();
      setAnalysisResult(result.data);
    } catch (error) {
      console.error("Code analysis failed:", error);
      // Fallback to mock data for demonstration
      setAnalysisResult(generateMockAnalysis());
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language, userId]);
  const generateCodeFromNaturalLanguage = useCallback(async () => {
    if (!naturalLanguageInput.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/code-assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: naturalLanguageInput,
          context: code,
          language,
          userId
        })
      });
      if (!response.ok) {
        throw new Error("Generation failed");
      }
      const result = await response.json();
      if (result.success && result.data.code) {
        onCodeChange?.(result.data.code);
        setNaturalLanguageInput("");
      }
    } catch (error) {
      console.error("Code generation failed:", error);
      // Mock generation for demonstration
      const mockCode = generateMockSolidityCode(naturalLanguageInput);
      onCodeChange?.(mockCode);
      setNaturalLanguageInput("");
    } finally {
      setIsGenerating(false);
    }
  }, [naturalLanguageInput, code, language, userId, onCodeChange]);
  const applySuggestion = useCallback(
    (suggestion: CodeSuggestion) => {
      if (!editorInstance || !suggestion.line) return;
      // Apply the suggestion to the editor
      const model = editorInstance.getModel();
      if (model) {
        const lineContent = model.getLineContent(suggestion.line);
        const range = {
          startLineNumber: suggestion.line,
          startColumn: 1,
          endLineNumber: suggestion.line,
          endColumn: lineContent.length + 1
        };
        editorInstance.executeEdits("ai-assistant", [
        {
          range,
          text: suggestion.code,
          forceMoveMarkers: true
        }
        ]);
      }
      onSuggestionApply?.(suggestion);
    },
    [editorInstance, onSuggestionApply],
  );
  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);
  const toggleSuggestionExpansion = useCallback((id: string) => {
    setExpandedSuggestions((prev: unknown) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  // Filter security issues based on severity
  const filteredSecurityIssues = useMemo(() => {
    if (!analysisResult) return [];
    if (selectedSeverityFilter === "all") return analysisResult.securityIssues;
    return analysisResult.securityIssues.filter(
      (issue: unknown) => (issue.severity = selectedSeverityFilter),
    );
  }, [analysisResult, selectedSeverityFilter]);
  // Generate mock analysis data
  function generateMockAnalysis(): AIAnalysisResult {
    return {
      securityIssues: [
      {
        type: "vulnerability",
        severity: "high",
        title: "Reentrancy Vulnerability",
        message: "Function allows reentrancy attacks",
        description:
        "The withdraw function calls external contracts before updating state",
        line: 45,
        suggestion:
        "Use the checks-effects-interactions pattern or ReentrancyGuard",
        autoFixAvailable: true,
        confidence: 0.95
      },
      {
        type: "vulnerability",
        severity: "medium",
        title: "Unchecked External Call",
        message: "External call return value not checked",
        description: "The transfer function does not check the return value",
        line: 67,
        suggestion: "Always check return values of external calls",
        autoFixAvailable: true,
        confidence: 0.88
      }
      ],
      gasOptimizations: [
      {
        type: "Storage Optimization",
        line: 23,
        currentCost: 20000,
        optimizedCost: 15000,
        savings: 5000,
        description: "Pack struct variables to save storage slots",
        suggestion: "Reorder struct members by size to optimize storage",
        codeExample:
        "struct User {\n  uint256 balance;\n  uint32 lastActive;\n  address wallet;\n}"
      },
      {
        type: "Loop Optimization",
        line: 89,
        currentCost: 3000,
        optimizedCost: 2100,
        savings: 900,
        description: "Cache array length in loops",
        suggestion: "Store array.length in a variable before the loop",
        codeExample:
        "uint256 length = users.length;\nfor (uint256 i: 0; i < length; i++) {}"
      }
      ],
      suggestions: [
      {
        id: "sugg-1",
        type: "optimization",
        title: "Use Custom Errors Instead of Revert Strings",
        description:
        "Custom errors are more gas efficient than revert strings",
        code: "error InsufficientBalance();\nif (balance < amount) revert InsufficientBalance();",
        impact: "high",
        confidence: 0.92,
        line: 34
      },
      {
        id: "sugg-2",
        type: "fix",
        title: "Add Access Control",
        description: "Function should have access control modifier",
        code: 'modifier onlyOwner() {\n  require(msg.sender  === owner, "Not owner");\n  _;\n}',
        impact: "high",
        confidence: 0.89,
        line: 56
      }
      ],
      bestPractices: [
      {
        title: "Missing Event Emission",
        description: "State changes should emit events for transparency",
        severity: "warning",
        line: 78
      },
      {
        title: "Function Visibility Not Specified",
        description: "Always specify function visibility explicitly",
        severity: "error",
        line: 91
      }
      ],
      codeQuality: {
        score: 75,
        readability: 82,
        maintainability: 71,
        security: 68,
        gasEfficiency: 79
      }
    };
  }
  function generateMockSolidityCode(query: string): string {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("erc20") || lowerQuery.includes("token")) {
      return `// SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      interface IERC20 {
        function totalSupply() external view returns (uint256);
        function balanceOf(address account) external view returns (uint256);
        function transfer(address recipient;
        uint256 amount) external returns (bool);
        function allowance(address owner;
        address spender) external view returns (uint256);
        function approve(address spender;
        uint256 amount) external returns (bool);
        function transferFrom(address sender;
        address recipient;
        uint256 amount) external returns (bool);
        event Transfer(address indexed from;
        address indexed to;
        uint256 value);
        event Approval(address indexed owner;
        address indexed spender;
        uint256 value);
      }
      contract MyToken is IERC20 {
        mapping(address => uint256) private _balances;
        mapping(address => mapping(address => uint256)) private _allowances;
        uint256 private _totalSupply;
        string public name;
        string public symbol;
        uint8 public decimals;
        constructor(string memory _name, string memory _symbol, uint256 _initialSupply) {
          name: _name;
          symbol: _symbol;
          decimals: 18;
          _totalSupply = _initialSupply * 10**uint256(decimals);
          _balances[msg.sender] = _totalSupply;
          emit Transfer(address(0), msg.sender, _totalSupply);
        }
        // Implement all IERC20 functions...
      }`;
    } else if (lowerQuery.includes("nft") || lowerQuery.includes("erc721")) {
      return `// SPDX-License-Identifier: MIT
      pragma solidity ^0.8.0;
      import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
      import "@openzeppelin/contracts/access/Ownable.sol";
      contract MyNFT is ERC721, Ownable {
        uint256 private _tokenIdCounter;
        constructor() ERC721("MyNFT", "MNFT") {}
        function mint(address to) public onlyOwner {
          _safeMint(to, _tokenIdCounter);
          _tokenIdCounter++;
        }
      }`;
    }
    // Default smart contract template
    return `// SPDX-License-Identifier: MIT
    pragma solidity ^0.8.0;
    contract MyContract {
      // State variables
      address public owner;
      // Events
      event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
      // Modifiers
      modifier onlyOwner() {
        require(msg.sender  === owner, "Not the owner");
        _;
      }
      // Constructor
      constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
      }
      // Functions
      function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address oldOwner: owner;
        owner: newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
      }
    }`;
  }
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case ",
      critical":
      case ",
      error":
      return <XCircle className="w-4 h-4" />;
      case ",
      high":
      return <AlertCircle className="w-4 h-4" />;
      case ",
      medium":
      case ",
      warning":
      return <AlertTriangle className="w-4 h-4" />;
      case ",
      low":
      case ",
      info":
      return <Info className="w-4 h-4" />;
      default:
      return <Info className="w-4 h-4" />;
    }
  };
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case ",
      critical":
      case ",
      error":
      return "text-red-500 bg-red-500/10 border-red-500/20";
      case ",
      high":
      return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case ",
      medium":
      case ",
      warning":
      return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case ",
      low":
      case ",
      info":
      return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default:
      return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };
  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case ",
      high":
      return "text-red-500";
      case ",
      medium":
      return "text-yellow-500";
      case ",
      low":
      return "text-green-500";
      default:
      return "text-gray-500";
    }
  };
  return (
    <div className={cn("flex flex-col h-full", className)}>
    <Card className="flex-1 bg-white/10 backdrop-blur-md border border-white/20">
    {/* Header */}
    <div className="p-4 border-b border-white/20">
    <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
    <Bot className="w-5 h-5 text-purple-400" />
    <h3 className="font-semibold text-white">AI Code Assistant</h3>
    {isAnalyzing && (
      <Badge variant="secondary" className="animate-pulse">
      Analyzing...
      </Badge>
    )}
    </div>
    <div className="flex items-center space-x-2">
    <TooltipProvider>
    <Tooltip>
    <TooltipTrigger asChild>
    <Button
    variant="outline"
    size="sm"
    onClick={analyzeCode}
    disabled={isAnalyzing || !code.trim()}
    className="border-white/30"><RefreshCw
    className={cn("w-4 h-4", isAnalyzing && "animate-spin")}
    />
    </Button>
    </TooltipTrigger>
    <TooltipContent>
    <p>Refresh Analysis</p>
    </TooltipContent>
    </Tooltip>
    </TooltipProvider>
    <TooltipProvider>
    <Tooltip>
    <TooltipTrigger asChild>
    <Button
    variant="outline"
    size="sm"
    onClick={() => setShowSettings(!showSettings)}
    className="border-white/30"><Settings className="w-4 h-4" />
    </Button>
    </TooltipTrigger>
    <TooltipContent>
    <p>Settings</p>
    </TooltipContent>
    </Tooltip>
    </TooltipProvider>
    </div>
    </div>
    {/* Settings Panel */}
    <AnimatePresence>
    {showSettings && (
      <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="mt-4 space-y-2 overflow-hidden"><label className="flex items-center space-x-2 text-sm text-gray-300">
      <input
      type="checkbox"
      checked={autoAnalyze}
      onChange={(e: unknown) => setAutoAnalyze(e.target.checked)}
      className="rounded border-gray-600"
      />
      <span>Auto-analyze code changes</span>
      </label>
      <label className="flex items-center space-x-2 text-sm text-gray-300">
      <input
      type="checkbox"
      checked={realTimeAnalysis}
      onChange={(e: unknown) => setRealTimeAnalysis(e.target.checked)}
      className="rounded border-gray-600"
      />
      <span>Real-time analysis</span>
      </label>
      </motion.div>
    )}
    </AnimatePresence>
    </div>
    {/* Natural Language Input */}
    <div className="p-4 border-b border-white/20">
    <div className="flex space-x-2">
    <div className="flex-1 relative">
    <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400" />
    <input
    type="text"
    value={naturalLanguageInput}
    onChange={(e: unknown) => setNaturalLanguageInput(e.target.value)}
    onKeyPress={(e: unknown) =>
    (e.key = "Enter" && generateCodeFromNaturalLanguage())
  }
  placeholder="Describe what you want to build in natural language..."
  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
  disabled={isGenerating}
  />
  </div>
  <Button
  onClick={generateCodeFromNaturalLanguage}
  disabled={!naturalLanguageInput.trim() || isGenerating}
  className="bg-purple-600 hover:bg-purple-700">{isGenerating ? (
    <RefreshCw className="w-4 h-4 animate-spin" />
  ) : (
    <Terminal className="w-4 h-4" />
  )}
  <span className="ml-2">Generate</span>
  </Button>
  </div>
  <p className="text-xs text-gray-400 mt-2">
  Example: "Create an ERC20 token with mint and burn functions"
  </p>
  </div>
  {/* Main Content */}
  <div className="flex-1 overflow-hidden">
  {analysisResult ? (
    <Tabs
    value={activeTab}
    onValueChange={(value: unknown) => setActiveTab(value as any)}
    className="h-full flex flex-col"><TabsList className="m-4 grid w-[calc(100%-2rem)] grid-cols-4">
    <TabsTrigger
    value="suggestions"
    className="flex items-center space-x-1"><Lightbulb className="w-4 h-4" />
    <span>Suggestions</span>
    {analysisResult.suggestions.length>0 && (
      <Badge variant="secondary" className="ml-1">
      {analysisResult.suggestions.length}
      </Badge>
    )}
    </TabsTrigger>
    <TabsTrigger
    value="security"
    className="flex items-center space-x-1"><Shield className="w-4 h-4" />
    <span>Security</span>
    {analysisResult.securityIssues.length>0 && (
      <Badge variant="destructive" className="ml-1">
      {analysisResult.securityIssues.length}
      </Badge>
    )}
    </TabsTrigger>
    <TabsTrigger
    value="gas"
    className="flex items-center space-x-1"><Zap className="w-4 h-4" />
    <span>Gas</span>
    {analysisResult.gasOptimizations.length>0 && (
      <Badge variant="secondary" className="ml-1">
      {analysisResult.gasOptimizations.length}
      </Badge>
    )}
    </TabsTrigger>
    <TabsTrigger
    value="quality"
    className="flex items-center space-x-1"><Gauge className="w-4 h-4" />
    <span>Quality</span>
    </TabsTrigger>
    </TabsList>
    <ScrollArea className="flex-1">
    <div className="p-4">
    {/* Suggestions Tab */}
    <TabsContent value="suggestions" className="mt-0 space-y-3">
    {analysisResult.suggestions.length === 0 ? (
      <div className="text-center py-8 text-gray-400">
      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <p>No suggestions available</p>
      <p className="text-sm mt-2">Your code looks good!</p>
      </div>
    ) : (
      analysisResult.suggestions.map((suggestion: unknown) => (
        <Card
        key={suggestion.id}
        className="p-4 bg-white/5 border border-white/10"><div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
        <Badge variant="secondary">
        {suggestion.type}
        </Badge>
        {suggestion.impact && (
          <span
          className={cn(
            "text-sm font-medium",
            getImpactColor(suggestion.impact),
          )}>{suggestion.impact} impact
          </span>
        )}
        {suggestion.line && (
          <span className="text-xs text-gray-400">
          Line {suggestion.line}
          </span>
        )}
        </div>
        <div className="flex items-center space-x-1">
        <TooltipProvider>
        <Tooltip>
        <TooltipTrigger asChild>
        <Button
        variant="ghost"
        size="sm"
        onClick={() =>
        copyToClipboard(
          suggestion.code,
          suggestion.id,
        )
      }>{
        (copiedId = suggestion.id ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        ))
      }
      </Button>
      </TooltipTrigger>
      <TooltipContent>
      <p>Copy code</p>
      </TooltipContent>
      </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
      <Tooltip>
      <TooltipTrigger asChild>
      <Button
      variant="ghost"
      size="sm"
      onClick={() =>
      toggleSuggestionExpansion(suggestion.id)
    }>{expandedSuggestions.has(
      suggestion.id,
    ) ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )}
    </Button>
    </TooltipTrigger>
    <TooltipContent>
    <p>
    {expandedSuggestions.has(suggestion.id)
    ? "Collapse"
    : "Expand"}
    </p>
    </TooltipContent>
    </Tooltip>
    </TooltipProvider>
    {editorInstance && suggestion.line && (
      <TooltipProvider>
      <Tooltip>
      <TooltipTrigger asChild>
      <Button
      variant="default"
      size="sm"
      onClick={() =>
      applySuggestion(suggestion)
    }
    className="bg-purple-600 hover:bg-purple-700">Apply
    </Button>
    </TooltipTrigger>
    <TooltipContent>
    <p>Apply this suggestion</p>
    </TooltipContent>
    </Tooltip>
    </TooltipProvider>
  )}
  </div>
  </div>
  <h4 className="font-medium text-white mb-1">
  {suggestion.title}
  </h4>
  <p className="text-sm text-gray-300 mb-2">
  {suggestion.description}
  </p>
  <AnimatePresence>
  {expandedSuggestions.has(suggestion.id) && (
    <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="mt-3"><pre className="bg-black/30 p-3 rounded-lg text-xs overflow-x-auto">
    <code className="text-gray-300">
    {suggestion.code}
    </code>
    </pre>
    <div className="flex items-center justify-between mt-2">
    <span className="text-xs text-gray-400">
    Confidence:{" "}
    {Math.round(suggestion.confidence * 100)}%
    </span>
    </div>
    </motion.div>
  )}
  </AnimatePresence>
  </Card>
))
)}
</TabsContent>
{/* Security Tab */}
<TabsContent value="security" className="mt-0 space-y-3">
{/* Severity Filter */}
<div className="flex items-center space-x-2 mb-4">
<span className="text-sm text-gray-400">
Filter by severity:
</span>
<div className="flex space-x-1">
{(
  ["all", "critical", "high", "medium", "low"] as const
).map((severity: unknown) => (
  <Button
  key={severity}
  variant={
    selectedSeverityFilter === severity
    ? "default"
    : "outline"
  }
  size="sm"
  onClick={() => setSelectedSeverityFilter(severity)}
  className={cn(
    "text-xs",
    (selectedSeverityFilter =
    severity && "bg-purple-600"),
  )}>{severity.charAt(0).toUpperCase() +
  severity.slice(1)}
  </Button>
))}
</div>
</div>
{
  (filteredSecurityIssues.length = 0 ? (
    <div className="text-center py-8 text-gray-400">
    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>No security issues found</p>
    <p className="text-sm mt-2">
    Your code appears to be secure!
    </p>
    </div>
  ) : (
    filteredSecurityIssues.map((issue, index) => (
      <Card
      key={index}
      className={cn(
        "p-4 border",
        getSeverityColor(issue.severity),
      )}><div className="flex items-start space-x-3">
      <div
      className={cn(
        "mt-0.5",
        getSeverityColor(issue.severity).split(
          " ",
        )[0],
      )}>{getSeverityIcon(issue.severity)}
      </div>
      <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
      <h4 className="font-medium text-white">
      {issue.title}
      </h4>
      {issue.line && (
        <span className="text-xs text-gray-400">
        Line {issue.line}
        </span>
      )}
      </div>
      <p className="text-sm text-gray-300 mb-2">
      {issue.description}
      </p>
      {issue.suggestion && (
        <div className="mt-2">
        <p className="text-xs text-blue-300 flex items-start">
        <Lightbulb className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
        {issue.suggestion}
        </p>
        </div>
      )}
      {issue.autoFixAvailable && (
        <Button
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={() => {
          /* Implement auto-fix */
        }}><CheckCircle className="w-3 h-3 mr-1" />
        Auto-fix available
        </Button>
      )}
      </div>
      </div>
      </Card>
    ))
  ))
}
</TabsContent>
{/* Gas Tab */}
<TabsContent value="gas" className="mt-0 space-y-3">
{
  (analysisResult.gasOptimizations.length = 0 ? (
    <div className="text-center py-8 text-gray-400">
    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
    <p>No gas optimizations found</p>
    <p className="text-sm mt-2">
    Your code is already gas efficient!
    </p>
    </div>
  ) : (
    <>
    <Card className="p-4 bg-green-500/10 border border-green-500/20">
    <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
    <TrendingUp className="w-5 h-5 text-green-400" />
    <span className="font-medium text-green-400">
    Total Potential Savings
    </span>
    </div>
    <span className="text-2xl font-bold text-green-400">
    {analysisResult.gasOptimizations
    .reduce(
      (sum, opt) => sum + (opt.savings || 0),
      0,
    )
    .toLocaleString()}{" "}
    gas
    </span>
    </div>
    </Card>
    {analysisResult.gasOptimizations.map(
      (optimization, index) => (
        <Card
        key={index}
        className="p-4 bg-white/5 border border-white/10"><div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-white">
        {optimization.type}
        </h4>
        {optimization.line && (
          <span className="text-xs text-gray-400">
          Line {optimization.line}
          </span>
        )}
        </div>
        <p className="text-sm text-gray-300 mb-3">
        {optimization.description}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
        <p className="text-xs text-gray-400">
        Current
        </p>
        <p className="text-sm font-medium text-red-400">
        {optimization.currentCost.toLocaleString()}{" "}
        gas
        </p>
        </div>
        <div>
        <p className="text-xs text-gray-400">
        Optimized
        </p>
        <p className="text-sm font-medium text-green-400">
        {optimization.optimizedCost.toLocaleString()}{" "}
        gas
        </p>
        </div>
        <div>
        <p className="text-xs text-gray-400">
        Savings
        </p>
        <p className="text-sm font-medium text-blue-400">
        -
        {optimization.savings?.toLocaleString() ||
        0}{" "}
        gas
        </p>
        </div>
        </div>
        {optimization.codeExample && (
          <div className="mt-3">
          <p className="text-xs text-gray-400 mb-1">
          Suggested implementation:
          </p>
          <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
          <code className="text-gray-300">
          {optimization.codeExample}
          </code>
          </pre>
          </div>
        )}
        </Card>
      ),
    )}
    </>
  ))
}
</TabsContent>
{/* Quality Tab */}
<TabsContent value="quality" className="mt-0 space-y-4">
<Card className="p-4 bg-white/5 border border-white/10">
<h4 className="font-medium text-white mb-4">
Code Quality Metrics
</h4>
<div className="space-y-3">
{Object.entries(analysisResult.codeQuality).map(
  ([metric, value]) => (
    <div key={metric}>
    <div className="flex items-center justify-between mb-1">
    <span className="text-sm capitalize text-gray-300">
    {metric === "gasEfficiency"
    ? "Gas Efficiency"
    : metric}
    </span>
    <span
    className={cn(
      "text-sm font-medium",
      value >= 80
      ? "text-green-400"
      : value >= 60
      ? "text-yellow-400"
      : "text-red-400",
    )}>{value}%
    </span>
    </div>
    <div className="w-full bg-gray-700 rounded-full h-2">
    <div
    className={cn(
      "h-2 rounded-full transition-all",
      value >= 80
      ? "bg-green-500"
      : value >= 60
      ? "bg-yellow-500"
      : "bg-red-500",
    )}
    style={{ width: `${value}%` }}
    />
    </div>
    </div>
  ),
)}
</div>
</Card>
{analysisResult.bestPractices.length>0 && (
  <Card className="p-4 bg-white/5 border border-white/10">
  <h4 className="font-medium text-white mb-4">
  Best Practice Violations
  </h4>
  <div className="space-y-2">
  {analysisResult.bestPractices.map(
    (practice, index) => (
      <div
      key={index}
      className={cn(
        "p-3 rounded-lg border",
        getSeverityColor(practice.severity),
      )}><div className="flex items-start space-x-2">
      <div
      className={cn(
        "mt-0.5",
        getSeverityColor(practice.severity).split(
          " ",
        )[0],
      )}>{getSeverityIcon(practice.severity)}
      </div>
      <div className="flex-1">
      <div className="flex items-center justify-between">
      <h5 className="font-medium text-white">
      {practice.title}
      </h5>
      {practice.line && (
        <span className="text-xs text-gray-400">
        Line {practice.line}
        </span>
      )}
      </div>
      <p className="text-sm text-gray-300 mt-1">
      {practice.description}
      </p>
      </div>
      </div>
      </div>
    ),
  )}
  </div>
  </Card>
)}
</TabsContent>
</div>
</ScrollArea>
</Tabs>
) : (
  <div className="flex items-center justify-center h-full p-8">
  <div className="text-center">
  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-white mb-2">
  AI Code Assistant Ready
  </h3>
  <p className="text-gray-400 mb-4">
  Start writing code to get real-time analysis and suggestions
  </p>
  <div className="space-y-2 text-sm text-gray-500">
  <p className="flex items-center justify-center">
  <Shield className="w-4 h-4 mr-2" />
  Security vulnerability detection
  </p>
  <p className="flex items-center justify-center">
  <Zap className="w-4 h-4 mr-2" />
  Gas optimization recommendations
  </p>
  <p className="flex items-center justify-center">
  <Lightbulb className="w-4 h-4 mr-2" />
  Best practices enforcement
  </p>
  <p className="flex items-center justify-center">
  <Code className="w-4 h-4 mr-2" />
  Code completion & generation
  </p>
  </div>
  </div>
  </div>
)}
</div>
</Card>
</div>
);
}
export default AICodeAssistant;
