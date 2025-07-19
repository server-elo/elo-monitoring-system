import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, Download, Copy, Settings,
  Zap, Shield, Coins, Users, FileText, Layers, Play
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import CustomToast from '../ui/CustomToast';

interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'token' | 'defi' | 'nft' | 'dao' | 'utility';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface GeneratedContract {
  code: string;
  explanation: string;
  gasEstimate: number;
  securityNotes: string[];
  testCases: string[];
}

interface AIContractGeneratorProps {
  onCodeGenerated?: (code: string) => void;
  className?: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: 'erc20-token',
    name: 'ERC-20 Token',
    description: 'Standard fungible token with transfer, approval, and minting capabilities',
    category: 'token',
    difficulty: 'beginner',
    features: ['Transfer', 'Approval', 'Minting', 'Burning'],
    icon: Coins
  },
  {
    id: 'erc721-nft',
    name: 'ERC-721 NFT',
    description: 'Non-fungible token with metadata and enumerable features',
    category: 'nft',
    difficulty: 'intermediate',
    features: ['Minting', 'Metadata', 'Enumerable', 'Royalties'],
    icon: FileText
  },
  {
    id: 'multisig-wallet',
    name: 'Multi-Signature Wallet',
    description: 'Secure wallet requiring multiple signatures for transactions',
    category: 'utility',
    difficulty: 'advanced',
    features: ['Multi-sig', 'Proposal System', 'Time Locks', 'Emergency Stop'],
    icon: Shield
  },
  {
    id: 'staking-pool',
    name: 'Staking Pool',
    description: 'DeFi staking contract with rewards distribution',
    category: 'defi',
    difficulty: 'intermediate',
    features: ['Staking', 'Rewards', 'Compound Interest', 'Withdrawal'],
    icon: Zap
  },
  {
    id: 'dao-governance',
    name: 'DAO Governance',
    description: 'Decentralized governance with voting and proposal mechanisms',
    category: 'dao',
    difficulty: 'advanced',
    features: ['Voting', 'Proposals', 'Delegation', 'Execution'],
    icon: Users
  },
  {
    id: 'simple-storage',
    name: 'Simple Storage',
    description: 'Basic contract for storing and retrieving data',
    category: 'utility',
    difficulty: 'beginner',
    features: ['Store Data', 'Retrieve Data', 'Access Control'],
    icon: Layers
  }
];

export const AIContractGenerator: React.FC<AIContractGeneratorProps> = ({
  onCodeGenerated,
  className = ''
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [customRequirements, setCustomRequirements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState<GeneratedContract | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  // Advanced options
  const [solidityVersion, setSolidityVersion] = useState('0.8.19');
  const [includeComments, setIncludeComments] = useState(true);
  const [optimizeGas, setOptimizeGas] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const generateContract = async () => {
    if (!selectedTemplate) {
      showToastMessage('Please select a contract template', 'warning');
      return;
    }

    setIsGenerating(true);

    try {
      // Simulate AI contract generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockContract: GeneratedContract = {
        code: generateMockContract(selectedTemplate, customRequirements),
        explanation: generateExplanation(selectedTemplate),
        gasEstimate: Math.floor(Math.random() * 500000) + 100000,
        securityNotes: generateSecurityNotes(selectedTemplate),
        testCases: generateTestCases(selectedTemplate)
      };

      setGeneratedContract(mockContract);
      onCodeGenerated?.(mockContract.code);
      showToastMessage('Contract generated successfully!', 'success');
    } catch (error) {
      showToastMessage('Failed to generate contract', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContract = (template: ContractTemplate, requirements: string): string => {
    // Process custom requirements to add additional features
    const processedRequirements = requirements ? processCustomRequirements(requirements) : '';

    const baseContract = `// SPDX-License-Identifier: MIT
pragma solidity ^${solidityVersion};

${includeComments ? `/**
 * @title ${template.name}
 * @dev ${template.description}
 * Generated by AI Contract Generator
 ${requirements ? `* Custom Requirements: ${requirements}` : ''}
 */` : ''}

contract ${template.name.replace(/[^a-zA-Z0-9]/g, '')} {
    ${template.features.map(feature => `    // ${feature} functionality`).join('\n')}
    ${processedRequirements ? `    // Custom requirements implementation\n${processedRequirements}` : ''}

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    ${generateContractFunctions(template)}
}`;

    return baseContract;
  };

  // New function to process custom requirements into code features
  const processCustomRequirements = (requirements: string): string => {
    const lowerReq = requirements.toLowerCase();
    let additionalCode = '';

    if (lowerReq.includes('pause') || lowerReq.includes('emergency')) {
      additionalCode += `
    bool public paused = false;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    function pause() public onlyOwner {
        paused = true;
    }

    function unpause() public onlyOwner {
        paused = false;
    }`;
    }

    if (lowerReq.includes('whitelist') || lowerReq.includes('allowlist')) {
      additionalCode += `
    mapping(address => bool) public whitelist;

    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }

    function addToWhitelist(address user) public onlyOwner {
        whitelist[user] = true;
    }

    function removeFromWhitelist(address user) public onlyOwner {
        whitelist[user] = false;
    }`;
    }

    if (lowerReq.includes('fee') || lowerReq.includes('commission')) {
      additionalCode += `
    uint256 public feePercentage = 250; // 2.5%
    address public feeRecipient;

    function setFeePercentage(uint256 _feePercentage) public onlyOwner {
        require(_feePercentage <= 1000, "Fee too high"); // Max 10%
        feePercentage = _feePercentage;
    }

    function setFeeRecipient(address _feeRecipient) public onlyOwner {
        feeRecipient = _feeRecipient;
    }`;
    }

    return additionalCode;
  };

  const generateContractFunctions = (template: ContractTemplate): string => {
    // Use the template parameter to generate specific functions based on category
    switch (template.category) {
      case 'token':
        return generateTokenFunctions();
      case 'nft':
        return generateNFTFunctions();
      case 'defi':
        return generateDeFiFunctions();
      case 'dao':
        return generateDAOFunctions();
      default:
        return generateUtilityFunctions();
    }
  };

  const generateTokenFunctions = (): string => {
    return `
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    uint256 public totalSupply;
    string public name = "Generated Token";
    string public symbol = "GTK";
    uint8 public decimals = 18;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        balances[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }`;
  };

  const generateNFTFunctions = (): string => {
    return `
    mapping(uint256 => address) public tokenOwner;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public tokenApprovals;

    uint256 public nextTokenId = 1;
    string public baseURI;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    function mint(address to) public onlyOwner {
        uint256 tokenId = nextTokenId++;
        tokenOwner[tokenId] = to;
        balanceOf[to]++;
        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        return tokenOwner[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        require(tokenOwner[tokenId] == from, "Not token owner");
        require(msg.sender == from || tokenApprovals[tokenId] == msg.sender, "Not approved");

        tokenOwner[tokenId] = to;
        balanceOf[from]--;
        balanceOf[to]++;
        delete tokenApprovals[tokenId];

        emit Transfer(from, to, tokenId);
    }`;
  };

  const generateDeFiFunctions = (): string => {
    return `
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public rewards;

    uint256 public rewardRate = 100; // per second
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    function stake(uint256 amount) public {
        require(amount > 0, "Cannot stake 0");
        stakes[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) public {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        stakes[msg.sender] -= amount;
        totalStaked -= amount;
        emit Withdrawn(msg.sender, amount);
    }

    function claimRewards() public {
        uint256 reward = calculateReward(msg.sender);
        rewards[msg.sender] = 0;
        emit RewardClaimed(msg.sender, reward);
    }

    function calculateReward(address user) public view returns (uint256) {
        return stakes[user] * rewardRate / 1000;
    }`;
  };

  const generateDAOFunctions = (): string => {
    return `
    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 deadline;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, string description);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);

    function createProposal(string memory description) public {
        require(votingPower[msg.sender] > 0, "No voting power");
        proposals[proposalCount] = Proposal({
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            deadline: block.timestamp + 7 days,
            executed: false
        });
        emit ProposalCreated(proposalCount, description);
        proposalCount++;
    }

    function vote(uint256 proposalId, bool support) public {
        require(votingPower[msg.sender] > 0, "No voting power");
        require(block.timestamp < proposals[proposalId].deadline, "Voting ended");

        if (support) {
            proposals[proposalId].votesFor += votingPower[msg.sender];
        } else {
            proposals[proposalId].votesAgainst += votingPower[msg.sender];
        }

        emit VoteCast(proposalId, msg.sender, support);
    }`;
  };

  const generateUtilityFunctions = (): string => {
    return `
    mapping(address => bool) public authorized;
    uint256 public value;

    event ValueUpdated(uint256 newValue);
    event AuthorizationChanged(address indexed user, bool authorized);

    function setValue(uint256 newValue) public onlyOwner {
        value = newValue;
        emit ValueUpdated(newValue);
    }

    function authorize(address user) public onlyOwner {
        authorized[user] = true;
        emit AuthorizationChanged(user, true);
    }

    function deauthorize(address user) public onlyOwner {
        authorized[user] = false;
        emit AuthorizationChanged(user, false);
    }

    function getValue() public view returns (uint256) {
        return value;
    }`;
  };



  const generateExplanation = (template: ContractTemplate): string => {
    return `This ${template.name} contract implements ${template.description.toLowerCase()}. 
    
Key features include:
${template.features.map(feature => `• ${feature}`).join('\n')}

The contract follows best practices for security and gas optimization. All functions include proper access controls and input validation.`;
  };

  const generateSecurityNotes = (template: ContractTemplate): string[] => {
    const baseNotes = [
      'All external functions include proper access controls',
      'Input validation is implemented for all parameters',
      'Reentrancy protection is in place where needed',
      'Integer overflow protection using Solidity 0.8+',
      'Events are emitted for important state changes'
    ];

    // Add template-specific security notes
    const templateSpecificNotes: { [key: string]: string[] } = {
      'erc20-token': [
        'Transfer functions include zero-address checks',
        'Approval mechanisms prevent double-spending attacks',
        'Minting functions are restricted to authorized addresses'
      ],
      'erc721-nft': [
        'Token ownership is properly tracked and validated',
        'Metadata URI functions include existence checks',
        'Transfer approvals are cleared after use'
      ],
      'multisig-wallet': [
        'Multi-signature validation prevents single points of failure',
        'Time locks provide additional security for critical operations',
        'Emergency stop mechanisms protect against exploits'
      ],
      'staking-pool': [
        'Reward calculations prevent manipulation attacks',
        'Staking/unstaking includes proper balance validations',
        'Interest rate changes are time-locked for transparency'
      ],
      'dao-governance': [
        'Voting power calculations prevent manipulation',
        'Proposal execution includes proper validation',
        'Delegation mechanisms include proper authorization'
      ]
    };

    const specificNotes = templateSpecificNotes[template.id] || [];
    return [...baseNotes, ...specificNotes];
  };

  const generateTestCases = (template: ContractTemplate): string[] => {
    const baseTests = [
      'Test contract deployment and initialization',
      'Test access control mechanisms',
      'Test main functionality with valid inputs',
      'Test edge cases and error conditions',
      'Test gas usage and optimization'
    ];

    // Add template-specific test cases
    const templateSpecificTests: { [key: string]: string[] } = {
      'erc20-token': [
        'Test token transfers between accounts',
        'Test approval and allowance mechanisms',
        'Test minting and burning functionality',
        'Test total supply calculations',
        'Test transfer restrictions and limits'
      ],
      'erc721-nft': [
        'Test NFT minting and ownership tracking',
        'Test metadata URI functionality',
        'Test transfer and approval mechanisms',
        'Test enumeration functions',
        'Test royalty calculations'
      ],
      'multisig-wallet': [
        'Test multi-signature transaction creation',
        'Test signature validation and execution',
        'Test time lock mechanisms',
        'Test emergency stop functionality',
        'Test owner management operations'
      ],
      'staking-pool': [
        'Test staking and unstaking operations',
        'Test reward calculation accuracy',
        'Test compound interest mechanisms',
        'Test withdrawal restrictions',
        'Test emergency withdrawal scenarios'
      ],
      'dao-governance': [
        'Test proposal creation and validation',
        'Test voting mechanisms and power calculations',
        'Test proposal execution workflows',
        'Test delegation functionality',
        'Test quorum and threshold validations'
      ]
    };

    const specificTests = templateSpecificTests[template.id] || [];
    return [...baseTests, ...specificTests];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToastMessage('Code copied to clipboard!', 'success');
  };

  const downloadContract = () => {
    if (!generatedContract) return;
    
    const blob = new Blob([generatedContract.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTemplate?.name.replace(/[^a-zA-Z0-9]/g, '')}.sol`;
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage('Contract downloaded!', 'success');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      token: 'bg-blue-500/20 text-blue-300',
      defi: 'bg-green-500/20 text-green-300',
      nft: 'bg-purple-500/20 text-purple-300',
      dao: 'bg-orange-500/20 text-orange-300',
      utility: 'bg-gray-500/20 text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors.utility;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-400',
      intermediate: 'text-yellow-400',
      advanced: 'text-red-400'
    };
    return colors[difficulty as keyof typeof colors] || colors.beginner;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wand2 className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Contract Generator</h2>
              <p className="text-gray-400">Generate smart contracts with AI assistance</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            variant="outline"
            className="border-white/30"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>
      </Card>

      {/* Advanced Options */}
      <AnimatePresence>
        {showAdvancedOptions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-white/5 backdrop-blur-md border border-white/10">
              <h3 className="font-semibold text-white mb-4">Advanced Options</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Solidity Version</label>
                  <select
                    value={solidityVersion}
                    onChange={(e) => setSolidityVersion(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                  >
                    <option value="0.8.19">0.8.19</option>
                    <option value="0.8.18">0.8.18</option>
                    <option value="0.8.17">0.8.17</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="comments"
                    checked={includeComments}
                    onChange={(e) => setIncludeComments(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="comments" className="text-sm text-gray-300">Include Comments</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimize"
                    checked={optimizeGas}
                    onChange={(e) => setOptimizeGas(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="optimize" className="text-sm text-gray-300">Optimize Gas</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="tests"
                    checked={includeTests}
                    onChange={(e) => setIncludeTests(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="tests" className="text-sm text-gray-300">Include Tests</label>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Selection */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Choose a Contract Template</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractTemplates.map((template) => (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-purple-400 bg-purple-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <template.icon className="w-6 h-6 text-purple-400" />
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <span className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                </div>
              </div>
              
              <h4 className="font-semibold text-white mb-2">{template.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{template.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {template.features.slice(0, 3).map((feature, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                  >
                    {feature}
                  </span>
                ))}
                {template.features.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">
                    +{template.features.length - 3}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Custom Requirements */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Requirements (Optional)</h3>
        
        <textarea
          value={customRequirements}
          onChange={(e) => setCustomRequirements(e.target.value)}
          placeholder="Describe any specific features or modifications you need..."
          className="w-full h-24 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        <div className="flex justify-end mt-4">
          <Button
            onClick={generateContract}
            disabled={!selectedTemplate || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Contract
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Contract */}
      <AnimatePresence>
        {generatedContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Generated Contract</h3>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => copyToClipboard(generatedContract.code)}
                    variant="outline"
                    size="sm"
                    className="border-white/30"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  
                  <Button
                    onClick={downloadContract}
                    variant="outline"
                    size="sm"
                    className="border-white/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Contract Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-semibold text-green-400">
                    ~{generatedContract.gasEstimate.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">Estimated Gas</div>
                </div>
                
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-semibold text-blue-400">
                    {generatedContract.securityNotes.length}
                  </div>
                  <div className="text-xs text-gray-400">Security Features</div>
                </div>
                
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-semibold text-purple-400">
                    {generatedContract.testCases.length}
                  </div>
                  <div className="text-xs text-gray-400">Test Cases</div>
                </div>
              </div>

              {/* Code Display */}
              <div className="bg-black/30 rounded-lg p-4 mb-4">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{generatedContract.code}</code>
                </pre>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Explanation</h4>
                <p className="text-gray-300 text-sm whitespace-pre-line">
                  {generatedContract.explanation}
                </p>
              </div>

              {/* Security Notes */}
              <div className="mb-4">
                <h4 className="font-semibold text-white mb-2">Security Features</h4>
                <ul className="space-y-1">
                  {generatedContract.securityNotes.map((note, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                      <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Test Cases */}
              <div>
                <h4 className="font-semibold text-white mb-2">Recommended Tests</h4>
                <ul className="space-y-1">
                  {generatedContract.testCases.map((test, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-300">
                      <Play className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span>{test}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {showToast && (
          <CustomToast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIContractGenerator;
