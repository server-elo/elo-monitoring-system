'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Code, 
  Shield, 
  Lightbulb, 
  Target, 
  Mic, 
  MicOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AIResponse {
  content: string;
  model: string;
  responseTime: number;
  confidence: number;
  suggestions: string[];
  nextSteps: string[];
  relatedConcepts: string[];
  codeExamples?: string[];
  visualAids?: string[];
}

interface SecurityAnalysis {
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    line?: number;
    recommendation: string;
  }>;
  gasOptimizations: Array<{
    description: string;
    impact: 'low' | 'medium' | 'high';
    beforeCode: string;
    afterCode: string;
    gasSavings: number;
  }>;
  bestPractices: Array<{
    category: string;
    recommendation: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  overallScore: number;
}

interface UserContext {
  currentLevel: number;
  skillLevel: string;
  totalXP: number;
  streak: number;
  weakAreas: string[];
  strongAreas: string[];
  preferredLearningStyle: string;
}

export default function EnhancedAITutor() {
  const [activeTab, setActiveTab] = useState('chat');
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [securityAnalysis, setSecurityAnalysis] = useState<SecurityAnalysis | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>>([]);

  // Load user context on component mount
  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const response = await fetch('/api/ai/enhanced-tutor?action=context');
      const data = await response.json();
      if (data.success) {
        setUserContext(data.data);
      }
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  };

  const handleAIRequest = async (action: string, payload: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/enhanced-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });

      const data = await response.json();
      if (data.success) {
        setResponse(data.data);
        
        // Add to conversation history
        setConversationHistory(prev => [
          ...prev,
          { type: 'user', content: payload.prompt || payload.concept || 'Request', timestamp: new Date() },
          { type: 'ai', content: data.data.content || JSON.stringify(data.data), timestamp: new Date() }
        ]);

        toast.success(`Response from ${data.data.model} (${data.data.responseTime}ms)`);
      } else {
        toast.error(data.error || 'AI request failed');
      }
    } catch (error) {
      toast.error('Failed to communicate with AI tutor');
      console.error('AI request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplainConcept = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a concept to explain');
      return;
    }
    handleAIRequest('explain', { concept: prompt });
  };

  const handleAnalyzeCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter code to analyze');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/security-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();
      if (data.success) {
        setSecurityAnalysis(data.data);
        toast.success(`Security analysis completed (${data.data.analysisTime}ms)`);
      } else {
        toast.error(data.error || 'Security analysis failed');
      }
    } catch (error) {
      toast.error('Failed to analyze code security');
      console.error('Security analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateChallenge = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a topic for the challenge');
      return;
    }
    handleAIRequest('generate-challenge', { topic: prompt });
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.success('Listening... Speak now!');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      toast.success('Voice input captured');
    };

    recognition.onerror = (event: any) => {
      toast.error(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* User Context Display */}
      {userContext && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Your Learning Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Level</p>
                <p className="font-semibold">{userContext.currentLevel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Skill Level</p>
                <Badge variant="outline">{userContext.skillLevel}</Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">XP</p>
                <p className="font-semibold">{userContext.totalXP}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Streak</p>
                <p className="font-semibold">{userContext.streak} days</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Strong Areas</p>
                <div className="flex flex-wrap gap-1">
                  {userContext.strongAreas.map((area, index) => (
                    <Badge key={index} variant="default" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">Areas to Improve</p>
                <div className="flex flex-wrap gap-1">
                  {userContext.weakAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main AI Tutor Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced AI Tutor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="analyze">Code Analysis</TabsTrigger>
              <TabsTrigger value="challenge">Challenges</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask me anything about Solidity, smart contracts, or blockchain development..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={isListening ? () => setIsListening(false) : handleVoiceInput}
                      variant="outline"
                      size="sm"
                      className="p-2"
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExplainConcept} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
                    Explain Concept
                  </Button>
                  <Button 
                    onClick={handleGenerateChallenge} 
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Generate Challenge
                  </Button>
                </div>
              </div>

              {response && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>AI Response</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{response.model}</Badge>
                        <Badge variant="secondary">{response.responseTime}ms</Badge>
                        <Progress value={response.confidence * 100} className="w-20" />
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap">{response.content}</div>
                    </div>
                    
                    {response.suggestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Suggestions:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {response.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {response.relatedConcepts.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">Related Concepts:</h4>
                        <div className="flex flex-wrap gap-1">
                          {response.relatedConcepts.map((concept, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste your Solidity code here for security analysis..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
                <Button 
                  onClick={handleAnalyzeCode} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                  Analyze Security
                </Button>
              </div>

              {securityAnalysis && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Security Analysis Results</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Overall Score:</span>
                          <Badge 
                            variant={securityAnalysis.overallScore >= 80 ? "default" : 
                                   securityAnalysis.overallScore >= 60 ? "secondary" : "destructive"}
                          >
                            {securityAnalysis.overallScore}/100
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Progress value={securityAnalysis.overallScore} className="mb-4" />
                      
                      {securityAnalysis.vulnerabilities.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Vulnerabilities:</h4>
                          <div className="space-y-2">
                            {securityAnalysis.vulnerabilities.map((vuln, index) => (
                              <div key={index} className="flex items-start gap-2 p-2 border rounded">
                                <div className={`p-1 rounded ${getSeverityColor(vuln.severity)}`}>
                                  {getSeverityIcon(vuln.severity)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{vuln.type}</p>
                                  <p className="text-sm text-gray-600">{vuln.description}</p>
                                  <p className="text-sm text-blue-600 mt-1">{vuln.recommendation}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {securityAnalysis.gasOptimizations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Gas Optimizations:</h4>
                          <div className="space-y-2">
                            {securityAnalysis.gasOptimizations.map((opt, index) => (
                              <div key={index} className="p-2 border rounded">
                                <p className="font-medium">{opt.description}</p>
                                <p className="text-sm text-green-600">Potential savings: {opt.gasSavings} gas</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="challenge">
              <div className="text-center py-8">
                <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Challenge generation feature coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">
                  This will generate personalized coding challenges based on your skill level and learning progress.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {conversationHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No conversation history yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Start chatting with the AI tutor to see your conversation history here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversationHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : 'bg-gray-50 border-l-4 border-gray-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">
                            {message.type === 'user' ? 'You' : 'AI Tutor'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
