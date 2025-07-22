"use client";

import React, { useState, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wand2, Download, Copy, Settings, Zap, Shield, 
  Coins, Users, FileText, Layers, Play, Check 
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';

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
  const [solidityVersion, setSolidityVersion] = useState('0.8.19');
  const [includeComments, setIncludeComments] = useState(true);
  const [optimizeGas, setOptimizeGas] = useState(true);
  const [includeTests, setIncludeTests] = useState(false);

  const { toast } = useToast();

  const generateContract = async (): Promise<void> => {
    if (!selectedTemplate) {
      toast({
        title: "Template Required",
        description: "Please select a contract template",
        variant: "destructive",
      });
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
      
      toast({
        title: "Contract Generated",
        description: "Your smart contract has been generated successfully!",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockContract = (template: ContractTemplate, requirements: string): string => {
    const contractName = template.name.replace(/[^a-zA-Z0-9]/g, '');
    
    return `// SPDX-License-Identifier: MIT
pragma solidity ^${solidityVersion};

${includeComments ? `/**
 * @title ${template.name}
 * @dev ${template.description}
 * Generated by AI Contract Generator
 ${requirements ? `* Custom Requirements: ${requirements}` : ''}
 */` : ''}

contract ${contractName} {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    ${template.features.map(feature => 
      `// ${feature} functionality
    // Implementation will be generated based on template`
    ).join('\n    ')}
    
    ${requirements ? `
    // Custom requirements implementation
    // ${requirements}` : ''}
}`;
  };

  const generateExplanation = (template: ContractTemplate): string => {
    return `This ${template.name} contract implements ${template.description.toLowerCase()}. 
It includes the following features: ${template.features.join(', ')}. 
The contract follows best practices for ${template.difficulty} level development.`;
  };

  const generateSecurityNotes = (template: ContractTemplate): string[] => {
    return [
      'Access control implemented with onlyOwner modifier',
      'Consider implementing emergency pause functionality',
      'Validate all user inputs before processing',
      'Use ReentrancyGuard for external calls',
      'Consider implementing time locks for critical functions'
    ];
  };

  const generateTestCases = (template: ContractTemplate): string[] => {
    return [
      'Test contract deployment and initialization',
      'Test access control mechanisms',
      'Test main functionality with valid inputs',
      'Test edge cases and error conditions',
      'Test gas optimization and limits'
    ];
  };

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to Clipboard",
        description: "Contract code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`ai-contract-generator ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">AI Contract Generator</h2>
        <p className="text-gray-400">Generate smart contracts using AI-powered templates</p>
      </div>

      {/* Template Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Choose a Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractTemplates.map((template) => {
            const IconComponent = template.icon;
            return (
              <Card
                key={template.id}
                className={`p-4 cursor-pointer transition-all hover:border-blue-500 ${
                  selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-500/10' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <IconComponent className="w-8 h-8 text-blue-400" />
                  <Badge 
                    className={`text-xs ${getDifficultyColor(template.difficulty)} text-white`}
                    variant="secondary"
                  >
                    {template.difficulty}
                  </Badge>
                </div>
                <h4 className="font-semibold mb-2">{template.name}</h4>
                <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Requirements */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Custom Requirements</h3>
        <Textarea
          placeholder="Describe any specific features or modifications you need..."
          value={customRequirements}
          onChange={(e) => setCustomRequirements(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="mb-4"
        >
          <Settings className="w-4 h-4 mr-2" />
          Advanced Options
        </Button>

        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Solidity Version</label>
                  <Select value={solidityVersion} onValueChange={setSolidityVersion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8.19">0.8.19</SelectItem>
                      <SelectItem value="0.8.18">0.8.18</SelectItem>
                      <SelectItem value="0.8.17">0.8.17</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Include Comments</label>
                    <Switch
                      checked={includeComments}
                      onCheckedChange={setIncludeComments}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Optimize Gas</label>
                    <Switch
                      checked={optimizeGas}
                      onCheckedChange={setOptimizeGas}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Include Tests</label>
                    <Switch
                      checked={includeTests}
                      onCheckedChange={setIncludeTests}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateContract}
        disabled={!selectedTemplate || isGenerating}
        className="w-full mb-6"
        size="lg"
      >
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mr-2"
            >
              <Wand2 className="w-5 h-5" />
            </motion.div>
            Generating Contract...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2" />
            Generate Contract
          </>
        )}
      </Button>

      {/* Generated Contract Display */}
      <AnimatePresence>
        {generatedContract && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Contract</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedContract.code)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Card className="p-4">
              <pre className="text-sm overflow-x-auto">
                <code>{generatedContract.code}</code>
              </pre>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold mb-2">Explanation</h4>
                <p className="text-sm text-gray-400">{generatedContract.explanation}</p>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold mb-2">Gas Estimate</h4>
                <p className="text-sm text-gray-400">
                  ~{generatedContract.gasEstimate.toLocaleString()} gas
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <h4 className="font-semibold mb-2">Security Notes</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                {generatedContract.securityNotes.map((note, index) => (
                  <li key={index} className="flex items-start">
                    <Shield className="w-3 h-3 mr-2 mt-1 text-yellow-400 flex-shrink-0" />
                    {note}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIContractGenerator;