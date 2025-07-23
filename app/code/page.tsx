'use client';

import { ReactElement, useState } from 'react';
import Link from 'next/link';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { Play, Download, Save, Share2, Zap, Bot } from 'lucide-react';

export default function CodeLabPage(): ReactElement {
  const [code, setCode] = useState(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyToken {
    string public name = "My Token";
    uint256 public totalSupply = 1000000;
    mapping(address => uint256) public balances;
    
    constructor() {
        balances[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}`);
  
  const [compilationResult, setCompilationResult] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleCompile = async () => {
    setIsCompiling(true);
    setCompilationResult('Compiling contract...');
    
    // Simulate compilation
    setTimeout(() => {
      setCompilationResult(`✅ Compilation successful!
      
Contract: MyToken
Size: 2.4KB
Gas estimate: 245,872
Optimization: Enabled

Generated artifacts:
- MyToken.sol
- MyToken.json (ABI)
- MyToken.bin (Bytecode)`);
      setIsCompiling(false);
    }, 2000);
  };

  const handleDeploy = () => {
    setCompilationResult('🚀 Deploying to testnet...\n\nTransaction hash: 0x1a2b3c4d5e6f7g8h9i0j...\nContract address: 0xABCD1234...\nGas used: 187,432\n\n✅ Contract deployed successfully!');
  };

  const handleSave = () => {
    // Mock save functionality
    alert('Code saved to your workspace!');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + '?code=' + encodeURIComponent(code));
    alert('Share link copied to clipboard!');
  };

  const handleAIAssist = () => {
    setCompilationResult('🤖 AI Assistant analyzing your code...\n\n💡 Suggestions:\n• Consider adding event emissions for transfers\n• Add access control for critical functions\n• Implement SafeMath for older Solidity versions\n• Add pause functionality for emergency stops\n\n🔍 Security Analysis: No critical issues found\n📊 Gas Optimization: Contract is well optimized');
  };

  const loadTemplate = (template: string) => {
    const templates = {
      erc20: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20Token is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
}`,
      nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("MyNFT", "MNFT") {}
    
    function mint(address to) public {
        _safeMint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }
}`,
      defi: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleDEX {
    mapping(address => uint256) public balances;
    uint256 public rate = 100; // 1 ETH = 100 tokens
    
    function buyTokens() public payable {
        require(msg.value > 0, "Send ETH to buy tokens");
        uint256 tokenAmount = msg.value * rate;
        balances[msg.sender] += tokenAmount;
    }
    
    function sellTokens(uint256 tokenAmount) public {
        require(balances[msg.sender] >= tokenAmount, "Insufficient tokens");
        uint256 ethAmount = tokenAmount / rate;
        balances[msg.sender] -= tokenAmount;
        payable(msg.sender).transfer(ethAmount);
    }
}`
    };
    
    if (templates[template as keyof typeof templates]) {
      setCode(templates[template as keyof typeof templates]);
      setSelectedTemplate(template);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">💻 Code Lab</h1>
          <p className="text-xl text-gray-300">Practice Solidity in our interactive coding environment</p>
        </div>

        {/* Template Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => loadTemplate('erc20')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTemplate === 'erc20' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              ERC-20 Token
            </button>
            <button 
              onClick={() => loadTemplate('nft')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTemplate === 'nft' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              NFT Contract
            </button>
            <button 
              onClick={() => loadTemplate('defi')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedTemplate === 'defi' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              DeFi Protocol
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="bg-black/30 px-4 py-3 border-b border-white/20 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Solidity Editor</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={handleSave}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Save Code"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Share Code"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-96 bg-gray-900 text-white font-mono text-sm p-4 rounded-lg border border-gray-600 focus:border-blue-400 outline-none resize-none"
                placeholder="Enter your Solidity code here..."
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={handleCompile}
                  disabled={isCompiling}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded font-semibold flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
                </button>
                <button 
                  onClick={handleDeploy}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Deploy</span>
                </button>
                <button 
                  onClick={handleAIAssist}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold flex items-center space-x-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Help</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output & Tools */}
          <div className="space-y-6">
            {/* Compilation Results */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Output Console</h3>
              </div>
              <div className="p-4">
                {compilationResult ? (
                  <pre className="text-sm text-white whitespace-pre-wrap font-mono bg-gray-900 p-4 rounded-lg overflow-auto max-h-64">
                    {compilationResult}
                  </pre>
                ) : (
                  <div className="text-gray-400 text-sm">
                    Click "Compile" to see compilation results, or use other tools to interact with your contract.
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">🤖 AI Assistant</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="bg-blue-900/50 rounded-lg p-3">
                    <div className="text-blue-400 text-sm font-semibold mb-1">AI Suggestion</div>
                    <div className="text-white text-sm">Consider adding access control to your transfer function using OpenZeppelin's Ownable pattern.</div>
                  </div>
                  <div className="bg-yellow-900/50 rounded-lg p-3">
                    <div className="text-yellow-400 text-sm font-semibold mb-1">Gas Optimization</div>
                    <div className="text-white text-sm">You can reduce gas costs by 15% by using uint128 instead of uint256 for smaller values.</div>
                  </div>
                </div>
                <div className="mt-4">
                  <input 
                    type="text" 
                    placeholder="Ask AI anything about your code..."
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Quick Templates</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    ERC-20 Token
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    ERC-721 NFT
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    DAO Contract
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    Multisig Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}