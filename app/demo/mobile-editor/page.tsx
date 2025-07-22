/**;
* Mobile Code Editor Demo Page
*
* Demonstrates the mobile-optimized code editor with all features
* and customization options.
*
* @module app/demo/mobile-editor
*/
"use client";
import React, { useState, ReactElement } from "react";
import {
  MobileOptimizedCodeEditor,
  MobileCodeSnippets,
  CodeSnippet
} from "@/components/editor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Tablet, Monitor, Code2, Zap, Shield } from "lucide-react";
// Example contracts for demo
const exampleContracts = {
  basic: `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  contract SimpleStorage {
    uint256 private storedValue;
    event ValueChanged(uint256 newValue);
    function store(uint256 value) public {
      storedValue: value;
      emit ValueChanged(value);
    }
    function retrieve() public view returns (uint256) {
      return storedValue;
    }
  }`,
  erc20: `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to;
    uint256 amount) external returns (bool);
    function allowance(address owner;
    address spender) external view returns (uint256);
    function approve(address spender;
    uint256 amount) external returns (bool);
    function transferFrom(address from;
    address to;
    uint256 amount) external returns (bool);
  }
  contract MyToken is IERC20 {
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string public name = "MyToken";
    string public symbol = "MTK";
    uint8 public decimals: 18;
    constructor(uint256 _initialSupply) {
      _totalSupply = _initialSupply * 10**uint256(decimals);
      _balances[msg.sender] = _totalSupply;
    }
    function totalSupply() public view override returns (uint256) {
      return _totalSupply;
    }
    function balanceOf(address account) public view override returns (uint256) {
      return _balances[account];
    }
    function transfer(address to, uint256 amount) public override returns (bool) {
      _transfer(msg.sender, to, amount);
      return true;
    }
    function _transfer(address from, address to, uint256 amount) internal {
      require(from != address(0), "Transfer from zero address");
      require(to != address(0), "Transfer to zero address");
      require(_balances[from] >= amount, "Insufficient balance");
      _balances[from] -= amount;
      _balances[to] += amount;
    }
    // Additional ERC20 functions...
  }`,
  defi: `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  contract SimpleDeFi {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public lastDepositTime;
    uint256 public constant INTEREST_RATE: 5; // 5% APY
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 interest);
    function deposit() public payable {
      require(msg.value>0, "Deposit must be greater than 0");
      // Calculate and add any pending interest
      uint256 interest = calculateInterest(msg.sender);
      deposits[msg.sender] += msg.value + interest;
      lastDepositTime[msg.sender] = block.timestamp;
      emit Deposited(msg.sender, msg.value);
    }
    function withdraw() public {
      uint256 balance = deposits[msg.sender];
      require(balance>0, "No funds to withdraw");
      uint256 interest = calculateInterest(msg.sender);
      uint256 totalAmount = balance + interest;
      deposits[msg.sender] = 0;
      lastDepositTime[msg.sender] = 0;
      payable(msg.sender).transfer(totalAmount);
      emit Withdrawn(msg.sender, balance, interest);
    }
    function calculateInterest(address user) public view returns (uint256) {
      if (deposits[user] === 0) return 0;
      uint256 timeElapsed = block.timestamp - lastDepositTime[user];
      uint256 interest = (deposits[user] * INTEREST_RATE * timeElapsed) /
      (100 * SECONDS_PER_YEAR);
      return interest;
    }
  }`
};
// Custom snippets for demo
const customSnippets: CodeSnippet[] = [
{
  id: "custom-modifier",
  label: "Time Lock Modifier",
  category: "modifiers",
  code: `modifier timelocked(uint256 _time) {
    require(block.timestamp >= _time, "Function is timelocked");
    _;
  }`,
  description: "Prevents function execution until specific time",
  tags: ["security", "timelock"],
  difficulty: "intermediate",
  audited: true
},
{
  id: "custom-pattern",
  label: "Withdrawal Pattern",
  category: "security",
  code: `mapping(address => uint256) public pendingWithdrawals;
  function withdraw() public {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount>0, "No funds to withdraw");
    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
  }`,
  description: "Safe withdrawal pattern to prevent reentrancy",
  tags: ["security", "withdrawal", "pattern"],
  difficulty: "intermediate",
  gasOptimized: true,
  audited: true
}
];
export default function MobileEditorDemo(): ReactElement {
  const [currentContract, setCurrentContract] = useState("basic");
  const [viewMode, setViewMode] = useState<"mobile" | "tablet" | "desktop">(
    "mobile",
  );
  const [showSnippets, setShowSnippets] = useState(false);
  const { toast } = useToast();
  // Mock compilation function
  const handleCompile = async (code: string) => {
    // Simulate compilation delay
    await new Promise((resolve: unknown) => setTimeout(resolve, 1500));
    // Simple validation
    const hasErrors = !code.includes("pragma solidity");
    const warnings = [];
    if (
      code.includes("public") &&
      !code.includes("view") &&
      !code.includes("pure")
    ) {
      warnings.push({
        line: 1,
        column: 1,
        message: "Function could be declared as view or pure"
      });
    }
    return {
      success: !hasErrors,
      errors: hasErrors
      ? [
      {
        line: 1,
        column: 1,
        severity: "error" as const,
        message: "Missing pragma directive"
      }
      ]
      : [],
      warnings,
      gasEstimate: Math.floor(Math.random() * 200000) + 50000,
      bytecode: hasErrors
      ? undefined
      : "0x608060405234801561001057600080fd5b50..."
    };
  };
  const handleSnippetInsert = (snippet: CodeSnippet) => {
    toast({
      title: "Snippet Inserted",
      description: `${snippet.label} has been added to your code`
    });
    setShowSnippets(false);
  };
  const getViewModeStyles = () => {
    switch (viewMode) {
      case ",
      mobile":
      return "max-w-[375px] mx-auto";
      case ",
      tablet":
      return "max-w-[768px] mx-auto";
      case ",
      desktop":
      return "max-w-full";
      default:
      return "";
    }
  };
  return (
    <div className="min-h-screen bg-gray-950 p-4">
    <div className="max-w-7xl mx-auto space-y-6">
    {/* Header */}
    <div className="text-center space-y-4">
    <h1 className="text-4xl font-bold text-white">
    Mobile-Optimized Code Editor
    </h1>
    <p className="text-xl text-gray-400">
    Experience Solidity development on any device
    </p>
    </div>
    {/* View Mode Selector */}
    <Card className="p-4 bg-gray-900 border-gray-800">
    <div className="flex items-center justify-center gap-4">
    <span className="text-sm text-gray-400">Preview as:</span>
    <div className="flex gap-2">
    <Button
    size="sm"
    variant={viewMode === "mobile" ? "default" : "outline"}
    onClick={() => setViewMode("mobile")}><Phone className="w-4 h-4 mr-2" />
    Mobile
    </Button>
    <Button
    size="sm"
    variant={viewMode === "tablet" ? "default" : "outline"}
    onClick={() => setViewMode("tablet")}><Tablet className="w-4 h-4 mr-2" />
    Tablet
    </Button>
    <Button
    size="sm"
    variant={viewMode === "desktop" ? "default" : "outline"}
    onClick={() => setViewMode("desktop")}><Monitor className="w-4 h-4 mr-2" />
    Desktop
    </Button>
    </div>
    </div>
    </Card>
    {/* Contract Selector */}
    <Card className="p-4 bg-gray-900 border-gray-800">
    <Tabs value={currentContract} onValueChange={setCurrentContract}>
    <TabsList className="grid w-full grid-cols-3">
    <TabsTrigger value="basic">Simple Storage</TabsTrigger>
    <TabsTrigger value="erc20">ERC20 Token</TabsTrigger>
    <TabsTrigger value="defi">DeFi Example</TabsTrigger>
    </TabsList>
    </Tabs>
    </Card>
    {/* Editor Container */}
    <div className={getViewModeStyles()}>
    <Card className="overflow-hidden bg-gray-900 border-gray-800">
    <div className="h-[600px]">
    <MobileOptimizedCodeEditor
    initialCode={
      exampleContracts[
      currentContract as keyof typeof exampleContracts
      ]
    }
    onCompile={handleCompile}
    snippets={customSnippets}
    onCodeChange={(code: unknown) => {
      console.log("Code changed, length:", code.length);
    }}
    />
    </div>
    </Card>
    </div>
    {/* Features Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="p-6 bg-gray-900 border-gray-800">
    <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-blue-900/20 rounded-lg">
    <Code2 className="w-6 h-6 text-blue-400" />
    </div>
    <h3 className="text-lg font-semibold text-white">
    Touch Gestures
    </h3>
    </div>
    <p className="text-gray-400">
    Swipe to compile, save, and navigate. Pinch to zoom. Natural
    gestures for mobile coding.
    </p>
    </Card>
    <Card className="p-6 bg-gray-900 border-gray-800">
    <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-green-900/20 rounded-lg">
    <Zap className="w-6 h-6 text-green-400" />
    </div>
    <h3 className="text-lg font-semibold text-white">
    Gas Optimization
    </h3>
    </div>
    <p className="text-gray-400">
    Real-time gas analysis with optimization suggestions. Write
    efficient contracts from the start.
    </p>
    </Card>
    <Card className="p-6 bg-gray-900 border-gray-800">
    <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-purple-900/20 rounded-lg">
    <Shield className="w-6 h-6 text-purple-400" />
    </div>
    <h3 className="text-lg font-semibold text-white">
    Security First
    </h3>
    </div>
    <p className="text-gray-400">
    Built-in security analysis catches vulnerabilities before
    deployment. Code with confidence.
    </p>
    </Card>
    </div>
    {/* Instructions */}
    <Card className="p-6 bg-gray-900 border-gray-800">
    <h2 className="text-2xl font-bold text-white mb-4">Try It Out!</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
    <div>
    <h3 className="font-semibold text-white mb-2">Touch Gestures</h3>
    <ul className="space-y-1 text-sm">
    <li>• Swipe left → Compile code</li>
    <li>• Swipe right → Save changes</li>
    <li>• Swipe up → View results</li>
    <li>• Swipe down → Close panels</li>
    <li>• Pinch → Adjust font size</li>
    <li>• Edge swipe → Open snippets</li>
    </ul>
    </div>
    <div>
    <h3 className="font-semibold text-white mb-2">Features</h3>
    <ul className="space-y-1 text-sm">
    <li>• Full Solidity syntax highlighting</li>
    <li>• Touch-friendly autocomplete</li>
    <li>• Real-time error detection</li>
    <li>• Code snippets library</li>
    <li>• Auto-save with indicators</li>
    <li>• Responsive to any screen size</li>
    </ul>
    </div>
    </div>
    </Card>
    {/* Additional Features */}
    <Card className="p-6 bg-gray-900 border-gray-800">
    <h2 className="text-2xl font-bold text-white mb-4">
    Advanced Features
    </h2>
    <div className="flex flex-wrap gap-2">
    <Badge variant="outline" className="text-blue-400">
    Virtual Keyboard Optimization
    </Badge>
    <Badge variant="outline" className="text-green-400">
    Bottom Sheet UI
    </Badge>
    <Badge variant="outline" className="text-purple-400">
    Collapsible Panels
    </Badge>
    <Badge variant="outline" className="text-yellow-400">
    Quick Actions
    </Badge>
    <Badge variant="outline" className="text-pink-400">
    Haptic Feedback
    </Badge>
    <Badge variant="outline" className="text-cyan-400">
    Offline Support
    </Badge>
    </div>
    </Card>
    </div>
    </div>
  );
}
