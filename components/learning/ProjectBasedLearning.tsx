import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  Code,
  Upload,
  TestTube,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Share2,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  Zap
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import CustomToast from '../ui/CustomToast';
import InteractiveCodeEditor from './InteractiveCodeEditor';

interface ProjectStep {
  id: string;
  title: string;
  description: string;
  instructions: string[];
  code?: string;
  tests?: string[];
  completed: boolean;
  hints?: string[];
  estimatedTime: number; // in minutes
}

interface Project {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'defi' | 'nft' | 'dao' | 'gaming' | 'utility';
  estimatedHours: number;
  xpReward: number;
  steps: ProjectStep[];
  currentStep: number;
  completed: boolean;
  deployed: boolean;
  deploymentAddress?: string;
  testnetUrl?: string;
  githubRepo?: string;
  liveDemo?: string;
}

interface DeploymentResult {
  success: boolean;
  transactionHash?: string;
  contractAddress?: string;
  gasUsed?: number;
  error?: string;
}

interface ProjectBasedLearningProps {
  projects: Project[];
  currentProject?: string;
  onProjectSelect?: (projectId: string) => void;
  onStepComplete?: (projectId: string, stepId: string) => void;
  onDeploy?: (projectId: string, code: string) => Promise<DeploymentResult>;
  className?: string;
}

const difficultyColors = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-red-500'
};

const categoryIcons = {
  defi: <Zap className="w-5 h-5" />,
  nft: <Eye className="w-5 h-5" />,
  dao: <GitBranch className="w-5 h-5" />,
  gaming: <Play className="w-5 h-5" />,
  utility: <Settings className="w-5 h-5" />
};

export const ProjectBasedLearning: React.FC<ProjectBasedLearningProps> = ({
  projects,
  currentProject,
  onProjectSelect,
  onStepComplete,
  onDeploy,
  className = ''
}) => {
  const [selectedProject, setSelectedProject] = useState<string>(currentProject || projects[0]?.id);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  const [isRunning, setIsRunning] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const project = projects.find(p => p.id === selectedProject);
  const currentStep = project?.steps[project.currentStep];

  // Load project data and initialize state
  useEffect(() => {
    if (selectedProject && project) {
      // Initialize test results for all steps
      const initialTestResults: { [key: string]: boolean } = {};
      project.steps.forEach(step => {
        initialTestResults[step.id] = step.completed;
      });
      setTestResults(initialTestResults);
    }
  }, [selectedProject, project]);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    onProjectSelect?.(projectId);
  };

  const handleStepComplete = async (stepId: string) => {
    if (!project) return;
    
    // Run tests for the current step
    const testsPassed = await runTests(stepId);
    
    if (testsPassed) {
      onStepComplete?.(project.id, stepId);
      showToastMessage('Step completed successfully!', 'success');
    } else {
      showToastMessage('Tests failed. Please review your code.', 'error');
    }
  };

  const runTests = async (stepId: string): Promise<boolean> => {
    // Simulate running tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock test results
    const mockResults = {
      [stepId]: Math.random() > 0.3 // 70% success rate
    };
    
    setTestResults(prev => ({ ...prev, ...mockResults }));
    return mockResults[stepId];
  };

  const handleDeploy = async () => {
    if (!project || !currentStep?.code) return;

    setIsDeploying(true);

    try {
      const result = await onDeploy?.(project.id, currentStep.code);

      if (result) {
        setDeploymentResult(result);
        if (result.success) {
          showToastMessage('Contract deployed successfully!', 'success');
        } else {
          showToastMessage(`Deployment failed: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      showToastMessage('Deployment error occurred', 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    showToastMessage('Running code simulation...', 'success');
    setTimeout(() => {
      setIsRunning(false);
      showToastMessage('Code execution completed!', 'success');
    }, 2000);
  };

  const handlePauseExecution = () => {
    setIsRunning(false);
    showToastMessage('Code execution paused', 'warning');
  };

  const handleDownloadProject = () => {
    if (!project) return;

    const projectData = {
      title: project.title,
      description: project.description,
      steps: project.steps,
      code: currentStep?.code || ''
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastMessage('Project downloaded successfully!', 'success');
  };

  const handleShareProject = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const handleCopyShareLink = () => {
    if (!project) return;

    const shareUrl = `${window.location.origin}/projects/${project.id}`;
    navigator.clipboard.writeText(shareUrl);
    showToastMessage('Share link copied to clipboard!', 'success');
  };

  const handleShareToSocial = (platform: string) => {
    if (!project) return;

    const shareUrl = `${window.location.origin}/projects/${project.id}`;
    const shareText = `Check out this awesome Solidity project: ${project.title}`;

    let socialUrl = '';
    switch (platform) {
      case 'twitter':
        socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'discord':
        // Copy to clipboard for Discord
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showToastMessage('Share text copied for Discord!', 'success');
        return;
    }

    if (socialUrl) {
      window.open(socialUrl, '_blank');
    }
  };

  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
    const completedSteps = project.steps.filter(s => s.completed).length;
    const progress = (completedSteps / project.steps.length) * 100;
    
    return (
      <Card
        className={`p-6 cursor-pointer transition-all duration-300 ${
          selectedProject === project.id 
            ? 'bg-blue-500/20 border-blue-500/50' 
            : 'bg-white/10 border-white/20 hover:bg-white/20'
        }`}
        onClick={() => handleProjectSelect(project.id)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {categoryIcons[project.category]}
            <div>
              <h3 className="text-lg font-semibold text-white">{project.title}</h3>
              <p className="text-sm text-gray-300">{project.description}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <Badge 
              variant="secondary" 
              className={`${difficultyColors[project.difficulty]} text-white`}
            >
              {project.difficulty}
            </Badge>
            {project.deployed && (
              <Badge variant="secondary" className="bg-green-500 text-white">
                Deployed
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-gray-400 mb-4">
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{project.estimatedHours}h</span>
          </div>
          <div className="flex justify-between">
            <span>Steps:</span>
            <span>{completedSteps}/{project.steps.length}</span>
          </div>
          <div className="flex justify-between">
            <span>XP Reward:</span>
            <span className="text-yellow-400">+{project.xpReward}</span>
          </div>
        </div>
        
        <Progress value={progress} className="mb-2" />
        <div className="text-xs text-gray-400">
          {Math.round(progress)}% Complete
        </div>
        
        {project.deployed && project.deploymentAddress && (
          <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-400">Deployed Contract</div>
                <div className="text-xs text-green-300 font-mono">
                  {project.deploymentAddress.slice(0, 10)}...{project.deploymentAddress.slice(-8)}
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-green-500/50 text-green-400">
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const StepNavigation: React.FC = () => {
    if (!project) return null;
    
    return (
      <div className="flex items-center space-x-2 mb-6">
        {project.steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
              index < project.currentStep 
                ? 'bg-green-500 text-white' 
                : index === project.currentStep
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-400'
            }`}
          >
            {index < project.currentStep ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!project) {
    return <div>No project selected</div>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Project Selection */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Choose Your Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} />
          ))}
        </div>
      </div>

      {/* Current Project */}
      <div className="space-y-6">
        {/* Project Header */}
        <Card className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{project.title}</h2>
              <p className="text-gray-300">{project.description}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleDownloadProject}
                variant="outline"
                size="sm"
                className="border-white/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>

              <Button
                onClick={handleShareProject}
                variant="outline"
                size="sm"
                className="border-white/30"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

              {project.githubRepo && (
                <Button variant="outline" size="sm" className="border-white/30">
                  <GitBranch className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              )}
              {project.liveDemo && (
                <Button variant="outline" size="sm" className="border-white/30">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Demo
                </Button>
              )}
            </div>
          </div>
          
          <StepNavigation />
        </Card>

        {/* Current Step */}
        {currentStep && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Instructions */}
            <Card className="lg:col-span-1 p-6 bg-white/10 backdrop-blur-md border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">{currentStep.title}</h3>
              <p className="text-gray-300 mb-4">{currentStep.description}</p>
              
              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-white">Instructions:</h4>
                <ol className="space-y-2 text-sm text-gray-300">
                  {currentStep.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mt-0.5">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
              
              {currentStep.hints && (
                <div className="mb-6">
                  <Button
                    onClick={() => setShowHints(!showHints)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-500/50 text-yellow-400"
                  >
                    {showHints ? 'Hide' : 'Show'} Hints
                  </Button>
                  
                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg"
                      >
                        <div className="text-sm text-yellow-300 space-y-1">
                          {currentStep.hints.map((hint, index) => (
                            <div key={index}>💡 {hint}</div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              <div className="space-y-3">
                {/* Code Execution Controls */}
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Code Execution
                  </h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isRunning ? (
                        <>
                          <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                          Running
                        </>
                      ) : (
                        <>
                          <Rocket className="w-3 h-3 mr-1" />
                          Run
                        </>
                      )}
                    </Button>

                    {isRunning && (
                      <Button
                        onClick={handlePauseExecution}
                        size="sm"
                        variant="outline"
                        className="border-orange-500/50 text-orange-400"
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>

                {/* Test Results Display */}
                {Object.keys(testResults).length > 0 && (
                  <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                    <h4 className="text-sm font-medium text-white mb-2">Test Results</h4>
                    <div className="space-y-1">
                      {Object.entries(testResults).map(([stepId, passed]) => {
                        const step = project.steps.find(s => s.id === stepId);
                        return (
                          <div key={stepId} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">{step?.title || stepId}</span>
                            <span className={passed ? 'text-green-400' : 'text-red-400'}>
                              {passed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => handleStepComplete(currentStep.id)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={currentStep.completed}
                >
                  {currentStep.completed ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run Tests
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleDeploy}
                  disabled={isDeploying || !currentStep.completed}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isDeploying ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Deploy to Testnet
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-400 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Estimated time: {currentStep.estimatedTime} minutes
              </div>
            </Card>

            {/* Code Editor */}
            <div className="lg:col-span-2">
              <InteractiveCodeEditor
                initialCode={currentStep.code}
                onCodeChange={(code) => {
                  // Update step code
                  if (currentStep) {
                    currentStep.code = code;
                  }
                }}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* Deployment Results */}
        {deploymentResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`p-6 ${
              deploymentResult.success 
                ? 'bg-green-500/20 border-green-500/50' 
                : 'bg-red-500/20 border-red-500/50'
            }`}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                {deploymentResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                )}
                Deployment {deploymentResult.success ? 'Successful' : 'Failed'}
              </h3>
              
              {deploymentResult.success ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Contract Address:</span>
                    <span className="text-green-400 font-mono">
                      {deploymentResult.contractAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction Hash:</span>
                    <span className="text-green-400 font-mono">
                      {deploymentResult.transactionHash}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gas Used:</span>
                    <span className="text-green-400">
                      {deploymentResult.gasUsed?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-red-400 text-sm">
                  {deploymentResult.error}
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && project && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleCloseShareModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Share Project</h3>
                <Button
                  onClick={handleCloseShareModal}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Project Details</h4>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <div className="text-sm text-white font-medium">{project.title}</div>
                    <div className="text-xs text-gray-400">{project.description}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {project.steps.filter(s => s.completed).length}/{project.steps.length} steps completed
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Share Link</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/projects/${project.id}`}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white"
                    />
                    <Button
                      onClick={handleCopyShareLink}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Share on Social</h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleShareToSocial('twitter')}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-500/50 text-blue-400"
                    >
                      Twitter
                    </Button>
                    <Button
                      onClick={() => handleShareToSocial('linkedin')}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-600/50 text-blue-500"
                    >
                      LinkedIn
                    </Button>
                    <Button
                      onClick={() => handleShareToSocial('discord')}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-purple-500/50 text-purple-400"
                    >
                      Discord
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
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

export default ProjectBasedLearning;
