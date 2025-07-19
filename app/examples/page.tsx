'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Code,
  Copy,
  Star,
  Play,
  GitBranch,
  Eye,
  Search,
  Filter
} from 'lucide-react';

export default function ExamplesPage() {
  const exampleCategories = [
    { name: 'All', count: 42, active: true },
    { name: 'Basic Contracts', count: 12, active: false },
    { name: 'DeFi', count: 8, active: false },
    { name: 'NFTs', count: 6, active: false },
    { name: 'DAOs', count: 4, active: false },
    { name: 'Games', count: 5, active: false },
    { name: 'Utilities', count: 7, active: false }
  ];

  const featuredExamples = [
    {
      id: 1,
      title: 'Simple Storage Contract',
      description: 'A basic contract demonstrating state variables and functions',
      category: 'Basic Contracts',
      difficulty: 'Beginner',
      stars: 245,
      views: 1250,
      language: 'Solidity',
      codePreview: `pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}`,
      githubUrl: 'https://github.com/ezekaj/learning_sol/examples/simple-storage',
      demoUrl: '/code?example=simple-storage'
    },
    {
      id: 2,
      title: 'ERC-20 Token Implementation',
      description: 'Complete ERC-20 token with minting, burning, and transfer functionality',
      category: 'DeFi',
      difficulty: 'Intermediate',
      stars: 189,
      views: 890,
      language: 'Solidity',
      codePreview: `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}`,
      githubUrl: 'https://github.com/ezekaj/learning_sol/examples/erc20-token',
      demoUrl: '/code?example=erc20-token'
    },
    {
      id: 3,
      title: 'NFT Collection Contract',
      description: 'ERC-721 NFT contract with metadata, minting limits, and royalties',
      category: 'NFTs',
      difficulty: 'Intermediate',
      stars: 156,
      views: 623,
      language: 'Solidity',
      codePreview: `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public constant MAX_SUPPLY = 10000;
    
    constructor() ERC721("MyNFT", "MNFT") {}
    
    function safeMint(address to) public onlyOwner {
        require(_tokenIdCounter < MAX_SUPPLY, "Max supply reached");
        _safeMint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }
}`,
      githubUrl: 'https://github.com/ezekaj/learning_sol/examples/nft-collection',
      demoUrl: '/code?example=nft-collection'
    },
    {
      id: 4,
      title: 'Decentralized Voting DAO',
      description: 'Governance contract with proposal creation, voting, and execution',
      category: 'DAOs',
      difficulty: 'Advanced',
      stars: 134,
      views: 456,
      language: 'Solidity',
      codePreview: `pragma solidity ^0.8.0;

contract VotingDAO {
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    function createProposal(string memory _description) public {
        // Implementation here
    }
}`,
      githubUrl: 'https://github.com/ezekaj/learning_sol/examples/voting-dao',
      demoUrl: '/code?example=voting-dao'
    }
  ];

  const quickExamples = [
    {
      title: 'Hello World Contract',
      description: 'Your first smart contract',
      difficulty: 'Beginner',
      href: '/code?example=hello-world'
    },
    {
      title: 'Multi-Signature Wallet',
      description: 'Secure wallet requiring multiple signatures',
      difficulty: 'Advanced',
      href: '/code?example=multisig-wallet'
    },
    {
      title: 'Escrow Contract',
      description: 'Trustless escrow for secure transactions',
      difficulty: 'Intermediate',
      href: '/code?example=escrow'
    },
    {
      title: 'Lottery Contract',
      description: 'Decentralized lottery with random winner selection',
      difficulty: 'Intermediate',
      href: '/code?example=lottery'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-400/10';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<LoadingSpinner />}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
              Code Examples
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore real-world Solidity examples and learn from production-ready smart contracts
            </p>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search examples..."
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors">
                <Filter className="w-5 h-5" />
                <span>Filter</span>
              </button>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex flex-wrap gap-2 justify-center">
              {exampleCategories.map((category, index) => (
                <motion.button
                  key={category.name}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    category.active
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                >
                  {category.name} ({category.count})
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Start Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickExamples.map((example, index) => (
                <motion.a
                  key={example.title}
                  href={example.href}
                  className="block p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Code className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="text-white group-hover:text-blue-300 transition-colors font-medium">
                      {example.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{example.description}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(example.difficulty)}`}>
                    {example.difficulty}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Featured Examples */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">Featured Examples</h2>
            <div className="space-y-8">
              {featuredExamples.map((example, index) => (
                <motion.div
                  key={example.id}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Info Section */}
                      <div className="lg:w-1/3">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(example.difficulty)}`}>
                            {example.difficulty}
                          </span>
                          <span className="text-sm text-gray-400">{example.category}</span>
                        </div>
                        
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {example.title}
                        </h3>
                        
                        <p className="text-gray-300 mb-4">
                          {example.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>{example.stars}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>{example.views}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                          <a
                            href={example.demoUrl}
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                          >
                            <Play className="w-4 h-4" />
                            <span>Try Example</span>
                          </a>
                          <a
                            href={example.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
                          >
                            <GitBranch className="w-4 h-4" />
                            <span>View Code</span>
                          </a>
                        </div>
                      </div>
                      
                      {/* Code Preview */}
                      <div className="lg:w-2/3">
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-400">{example.language}</span>
                            <button className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors">
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="text-sm text-gray-300 overflow-x-auto">
                            <code>{example.codePreview}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-8">
              <Code className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Build?
              </h3>
              <p className="text-gray-300 mb-6">
                Start with our examples and create your own smart contracts
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/code"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Open Code Lab
                </a>
                <a
                  href="/learn"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
                >
                  Learn Fundamentals
                </a>
              </div>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
