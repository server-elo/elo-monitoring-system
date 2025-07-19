import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Target, Clock,
  ArrowRight, Brain, Shield, Code2,
  TrendingUp, Award, Calendar, Users, Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { withLearningModuleErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  skills: string[];
  projects: string[];
  completed: boolean;
  progress: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  modules: LearningModule[];
  skills: string[];
  careerPaths: string[];
}

interface AILearningPathProps {
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  interests?: string[];
  timeCommitment?: string;
  goals?: string[];
  onPathSelect?: (path: LearningPath) => void;
  className?: string;
}

const skillCategories = {
  fundamentals: { icon: BookOpen, color: 'blue' },
  security: { icon: Shield, color: 'red' },
  defi: { icon: TrendingUp, color: 'green' },
  nft: { icon: Star, color: 'purple' },
  dao: { icon: Users, color: 'orange' },
  advanced: { icon: Brain, color: 'pink' }
};

const AILearningPathComponent: React.FC<AILearningPathProps> = ({
  userLevel = 'beginner',
  interests = [],
  timeCommitment = '1 hour per day',
  goals = [],
  onPathSelect,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  useEffect(() => {
    generateLearningPaths();
  }, [userLevel, interests, timeCommitment, goals]);

  const generateLearningPaths = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockPaths: LearningPath[] = [
        {
          id: 'solidity-fundamentals',
          title: 'Solidity Fundamentals',
          description: 'Master the basics of Solidity programming and smart contract development',
          totalDuration: '6-8 weeks',
          difficulty: 'beginner',
          skills: ['Solidity Syntax', 'Smart Contracts', 'Testing', 'Deployment'],
          careerPaths: ['Smart Contract Developer', 'Blockchain Developer'],
          modules: [
            {
              id: 'intro',
              title: 'Introduction to Solidity',
              description: 'Learn Solidity syntax, data types, and basic concepts',
              difficulty: 'beginner',
              estimatedTime: '1 week',
              prerequisites: [],
              skills: ['Variables', 'Functions', 'Data Types'],
              projects: ['Hello World Contract'],
              completed: false,
              progress: 0
            },
            {
              id: 'contracts',
              title: 'Smart Contract Basics',
              description: 'Understand contract structure, state variables, and functions',
              difficulty: 'beginner',
              estimatedTime: '2 weeks',
              prerequisites: ['intro'],
              skills: ['Contract Structure', 'State Management', 'Events'],
              projects: ['Simple Storage Contract', 'Counter Contract'],
              completed: false,
              progress: 0
            },
            {
              id: 'advanced-features',
              title: 'Advanced Solidity Features',
              description: 'Explore inheritance, libraries, and advanced patterns',
              difficulty: 'intermediate',
              estimatedTime: '2 weeks',
              prerequisites: ['contracts'],
              skills: ['Inheritance', 'Libraries', 'Modifiers'],
              projects: ['Token Contract', 'Multi-sig Wallet'],
              completed: false,
              progress: 0
            },
            {
              id: 'testing-deployment',
              title: 'Testing and Deployment',
              description: 'Learn to test and deploy smart contracts',
              difficulty: 'intermediate',
              estimatedTime: '1-2 weeks',
              prerequisites: ['advanced-features'],
              skills: ['Unit Testing', 'Integration Testing', 'Deployment'],
              projects: ['Full DApp with Tests'],
              completed: false,
              progress: 0
            }
          ]
        },
        {
          id: 'defi-development',
          title: 'DeFi Development',
          description: 'Build decentralized finance applications and protocols',
          totalDuration: '10-12 weeks',
          difficulty: 'intermediate',
          skills: ['DeFi Protocols', 'Liquidity Pools', 'Yield Farming', 'Flash Loans'],
          careerPaths: ['DeFi Developer', 'Protocol Engineer'],
          modules: [
            {
              id: 'defi-basics',
              title: 'DeFi Fundamentals',
              description: 'Understand DeFi concepts and existing protocols',
              difficulty: 'intermediate',
              estimatedTime: '2 weeks',
              prerequisites: ['Solidity Fundamentals'],
              skills: ['DeFi Concepts', 'Protocol Analysis'],
              projects: ['Protocol Research'],
              completed: false,
              progress: 0
            },
            {
              id: 'tokens-standards',
              title: 'Token Standards',
              description: 'Master ERC-20, ERC-721, and other token standards',
              difficulty: 'intermediate',
              estimatedTime: '3 weeks',
              prerequisites: ['defi-basics'],
              skills: ['ERC-20', 'ERC-721', 'ERC-1155'],
              projects: ['Custom Token', 'NFT Collection'],
              completed: false,
              progress: 0
            },
            {
              id: 'amm-development',
              title: 'AMM Development',
              description: 'Build automated market makers and liquidity pools',
              difficulty: 'advanced',
              estimatedTime: '3 weeks',
              prerequisites: ['tokens-standards'],
              skills: ['AMM Logic', 'Liquidity Pools', 'Price Oracles'],
              projects: ['Simple DEX', 'Liquidity Pool'],
              completed: false,
              progress: 0
            },
            {
              id: 'advanced-defi',
              title: 'Advanced DeFi',
              description: 'Implement yield farming, flash loans, and complex protocols',
              difficulty: 'advanced',
              estimatedTime: '2-4 weeks',
              prerequisites: ['amm-development'],
              skills: ['Yield Farming', 'Flash Loans', 'Governance'],
              projects: ['Yield Farm Protocol', 'Flash Loan Arbitrage'],
              completed: false,
              progress: 0
            }
          ]
        },
        {
          id: 'security-auditing',
          title: 'Security & Auditing',
          description: 'Learn to identify and prevent smart contract vulnerabilities',
          totalDuration: '8-10 weeks',
          difficulty: 'advanced',
          skills: ['Security Analysis', 'Vulnerability Assessment', 'Code Review'],
          careerPaths: ['Security Auditor', 'Security Researcher'],
          modules: [
            {
              id: 'security-fundamentals',
              title: 'Security Fundamentals',
              description: 'Understand common vulnerabilities and attack vectors',
              difficulty: 'intermediate',
              estimatedTime: '2 weeks',
              prerequisites: ['Solidity Fundamentals'],
              skills: ['Vulnerability Types', 'Attack Vectors'],
              projects: ['Vulnerability Analysis'],
              completed: false,
              progress: 0
            },
            {
              id: 'auditing-tools',
              title: 'Auditing Tools',
              description: 'Master static analysis and testing tools',
              difficulty: 'advanced',
              estimatedTime: '3 weeks',
              prerequisites: ['security-fundamentals'],
              skills: ['Static Analysis', 'Fuzzing', 'Formal Verification'],
              projects: ['Tool-based Audit'],
              completed: false,
              progress: 0
            },
            {
              id: 'manual-review',
              title: 'Manual Code Review',
              description: 'Develop skills for thorough manual code review',
              difficulty: 'advanced',
              estimatedTime: '3-5 weeks',
              prerequisites: ['auditing-tools'],
              skills: ['Code Review', 'Report Writing', 'Risk Assessment'],
              projects: ['Complete Audit Report'],
              completed: false,
              progress: 0
            }
          ]
        }
      ];

      setLearningPaths(mockPaths);
    } catch (error) {
      console.error('Failed to generate learning paths:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/10';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getSkillIcon = (skill: string) => {
    const category = Object.entries(skillCategories).find(([key]) => 
      skill.toLowerCase().includes(key)
    );
    return category ? category[1].icon : Code2;
  };

  const selectPath = (path: LearningPath) => {
    setSelectedPath(path);
    onPathSelect?.(path);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Learning Path Generator</h2>
              <p className="text-gray-400">Personalized learning paths based on your goals and experience</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowCustomization(!showCustomization)}
            variant="outline"
            className="border-white/30"
          >
            <Target className="w-4 h-4 mr-2" />
            Customize
          </Button>
        </div>

        {/* User Profile Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-lg font-semibold ${getDifficultyColor(userLevel).split(' ')[0]}`}>
              {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)}
            </div>
            <div className="text-xs text-gray-400">Current Level</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-400">
              {timeCommitment}
            </div>
            <div className="text-xs text-gray-400">Time Commitment</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-400">
              {interests.length || 3}
            </div>
            <div className="text-xs text-gray-400">Interests</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-400">
              {goals.length || 2}
            </div>
            <div className="text-xs text-gray-400">Goals</div>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isGenerating && (
        <Card className="p-8 bg-white/10 backdrop-blur-md border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-white mb-2">Generating Your Learning Path</h3>
            <p className="text-gray-400">AI is analyzing your profile and creating personalized recommendations...</p>
          </div>
        </Card>
      )}

      {/* Learning Paths */}
      {!isGenerating && learningPaths.length > 0 && (
        <div className="grid gap-6">
          {learningPaths.map((path) => (
            <motion.div
              key={path.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`cursor-pointer transition-all duration-300 ${
                selectedPath?.id === path.id ? 'ring-2 ring-purple-400' : ''
              }`}
              onClick={() => selectPath(path)}
            >
              <Card className="p-6 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{path.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(path.difficulty)}`}>
                        {path.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3">{path.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{path.totalDuration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>{path.modules.length} modules</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      selectPath(path);
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Start Path
                  </Button>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Skills You'll Learn</h4>
                  <div className="flex flex-wrap gap-2">
                    {path.skills.slice(0, 6).map((skill, index) => {
                      const Icon = getSkillIcon(skill);
                      return (
                        <span
                          key={index}
                          className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                        >
                          <Icon className="w-3 h-3" />
                          <span>{skill}</span>
                        </span>
                      );
                    })}
                    {path.skills.length > 6 && (
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">
                        +{path.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Career Paths */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-white mb-2">Career Opportunities</h4>
                  <div className="flex flex-wrap gap-2">
                    {path.careerPaths.map((career, index) => (
                      <span
                        key={index}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300"
                      >
                        <Award className="w-3 h-3" />
                        <span>{career}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Module Preview */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Learning Modules</h4>
                  <div className="space-y-2">
                    {path.modules.slice(0, 3).map((module, index) => (
                      <div key={module.id} className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{module.title}</span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{module.estimatedTime}</span>
                      </div>
                    ))}
                    {path.modules.length > 3 && (
                      <div className="text-xs text-gray-400 ml-8">
                        +{path.modules.length - 3} more modules
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Selected Path Details */}
      <AnimatePresence>
        {selectedPath && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-purple-500/10 backdrop-blur-md border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Selected Learning Path</h3>
                <Button
                  onClick={() => onPathSelect?.(selectedPath)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Start Learning
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-white mb-2">Path Overview</h4>
                  <p className="text-gray-300 text-sm mb-4">{selectedPath.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white">{selectedPath.totalDuration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modules:</span>
                      <span className="text-white">{selectedPath.modules.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className={getDifficultyColor(selectedPath.difficulty).split(' ')[0]}>
                        {selectedPath.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-2">Module Breakdown</h4>
                  <div className="space-y-2">
                    {selectedPath.modules.map((module, index) => (
                      <div key={module.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-gray-300">{module.title}</span>
                        </div>
                        <span className="text-gray-400">{module.estimatedTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Wrap with learning module error boundary for specialized learning path error handling
export const AILearningPath = withLearningModuleErrorBoundary(AILearningPathComponent, {
  name: 'AILearningPath',
  enableRetry: true,
  maxRetries: 2,
  showErrorDetails: process.env.NODE_ENV === 'development'
});

export default AILearningPath;
