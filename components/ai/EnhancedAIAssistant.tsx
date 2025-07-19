import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SpeechRecognition, SpeechRecognitionEvent } from '../types/speech';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mic, MicOff, Volume2, VolumeX,
  BookOpen, Lightbulb, Bug, Zap, Settings,
  Copy, ThumbsUp, ThumbsDown, RotateCcw, Maximize2,
  Minimize2, Download, Star, Brain, Target
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import CustomToast from '../ui/CustomToast';
import { withAsyncErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    requestType?: string;
    codeExamples?: Array<{
      title: string;
      code: string;
      explanation: string;
    }>;
    suggestions?: string[];
    confidence?: number;
  };
}

interface EnhancedAIAssistantProps {
  onCodeAnalysis?: (code: string) => void;
  onConceptExplanation?: (concept: string) => void;
  currentCode?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

const quickActions = [
  { id: 'explain', label: 'Explain Code', icon: BookOpen, type: 'code-review' },
  { id: 'debug', label: 'Debug Error', icon: Bug, type: 'debug' },
  { id: 'optimize', label: 'Optimize Gas', icon: Zap, type: 'optimize' },
  { id: 'security', label: 'Security Check', icon: Target, type: 'security' },
  { id: 'concept', label: 'Learn Concept', icon: Brain, type: 'explain-concept' },
  { id: 'exercise', label: 'Practice Exercise', icon: Star, type: 'generate-exercise' },
];

const EnhancedAIAssistantComponent: React.FC<EnhancedAIAssistantProps> = ({
  onCodeAnalysis,
  onConceptExplanation,
  currentCode = '',
  userLevel = 'beginner',
  className = ''
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as Window & { webkitSpeechRecognition?: any; SpeechRecognition?: any }).webkitSpeechRecognition || (window as Window & { webkitSpeechRecognition?: any; SpeechRecognition?: any }).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          showToastMessage('Speech recognition error. Please try again.', 'error');
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const showToastMessage = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const sendMessage = async (message: string, type: string = 'question') => {
    if (!message.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          question: message,
          code: currentCode,
          currentSkills: [userLevel],
          goals: ['Learn Solidity'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: AIMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response.message,
          timestamp: new Date(),
          metadata: {
            requestType: type,
            codeExamples: data.response.codeExamples,
            suggestions: data.response.suggestions,
            confidence: Math.random() * 0.3 + 0.7, // Mock confidence score
          },
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Auto-speak response if enabled
        if (isSpeaking && synthRef.current) {
          const utterance = new SpeechSynthesisUtterance(data.response.message);
          utterance.rate = 0.8;
          utterance.pitch = 1;
          synthRef.current.speak(utterance);
        }
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      showToastMessage('Failed to get AI response', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract concepts from messages
  const extractConceptFromMessage = (message: string): string | null => {
    const conceptKeywords = [
      'smart contract', 'solidity', 'ethereum', 'blockchain', 'gas', 'wei', 'ether',
      'function', 'modifier', 'event', 'struct', 'mapping', 'array', 'inheritance',
      'interface', 'library', 'pragma', 'constructor', 'fallback', 'receive',
      'public', 'private', 'internal', 'external', 'view', 'pure', 'payable'
    ];

    const lowerMessage = message.toLowerCase();
    const foundConcept = conceptKeywords.find(keyword =>
      lowerMessage.includes(keyword)
    );

    return foundConcept || null;
  };

  // Enhanced sendMessage with callback usage
  const sendMessageWithCallbacks = async (message: string, type: string = 'question') => {
    await sendMessage(message, type);

    // Use the callback props based on message type
    if (type === 'analyze-code' && onCodeAnalysis && currentCode) {
      onCodeAnalysis(currentCode);
    }

    if (type === 'explain-concept' && onConceptExplanation) {
      const concept = extractConceptFromMessage(message);
      if (concept) {
        onConceptExplanation(concept);
      }
    }
  };

  const handleQuickAction = (action: typeof quickActions[0]) => {
    let message = '';
    switch (action.type) {
      case 'code-review':
        message = currentCode ? `Please review this Solidity code: ${currentCode}` : 'Please explain how to write good Solidity code';
        break;
      case 'debug':
        message = 'Help me debug this Solidity code and find potential issues';
        break;
      case 'optimize':
        message = 'How can I optimize this code for gas efficiency?';
        break;
      case 'security':
        message = 'Please check this code for security vulnerabilities';
        break;
      case 'explain-concept':
        message = 'Explain a Solidity concept I should learn';
        break;
      case 'generate-exercise':
        message = 'Generate a practice exercise for my current level';
        break;
      default:
        message = action.label;
    }
    sendMessage(message, action.type);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking && synthRef.current) {
      synthRef.current.cancel();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    showToastMessage('Message copied to clipboard', 'success');
  };

  const exportChat = () => {
    const chatData = messages.map(msg => ({
      type: msg.type,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    }));
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-chat-history.json';
    a.click();
    URL.revokeObjectURL(url);
    showToastMessage('Chat history exported', 'success');
  };

  const clearChat = () => {
    setMessages([]);
    showToastMessage('Chat history cleared', 'success');
  };

  return (
    <div className={`relative ${className}`}>
      <Card className={`bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50' : 'h-96'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">AI Learning Assistant</h3>
            <span className="text-xs text-gray-400">({userLevel})</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleSpeaking}
              variant="outline"
              size="sm"
              className="border-white/30"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="border-white/30"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="outline"
              size="sm"
              className="border-white/30"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-white/20">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                variant="outline"
                size="sm"
                className="border-white/30 text-xs"
                disabled={isLoading}
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-64">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about Solidity!</p>
              <p className="text-sm mt-2">I can help with code review, debugging, concepts, and more.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <p className="text-sm">{message.content}</p>
                
                {message.metadata?.codeExamples && (
                  <div className="mt-2 space-y-2">
                    {message.metadata.codeExamples.map((example, index) => (
                      <div key={index} className="bg-black/20 p-2 rounded text-xs">
                        <p className="font-semibold mb-1">{example.title}</p>
                        <pre className="bg-black/30 p-2 rounded overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                        <p className="mt-1 text-gray-300">{example.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {message.metadata?.suggestions && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold mb-1">Suggestions:</p>
                    <ul className="text-xs space-y-1">
                      {message.metadata.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <Lightbulb className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {message.type === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      <Button
                        onClick={() => copyMessage(message.content)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/20">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessageWithCallbacks(inputMessage)}
              placeholder={isListening ? 'Listening...' : 'Ask me anything about Solidity...'}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || isListening}
            />
            
            <Button
              onClick={isListening ? stopListening : startListening}
              variant="outline"
              size="sm"
              className="border-white/30"
              disabled={isLoading}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Button
              onClick={() => sendMessageWithCallbacks(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-0 z-50 w-64 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h4 className="font-semibold mb-4">AI Assistant Settings</h4>
            
            <div className="space-y-3">
              <Button
                onClick={exportChat}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Chat
              </Button>
              
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            </div>
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

// Wrap with async error boundary for AI API call error handling
export const EnhancedAIAssistant = withAsyncErrorBoundary(EnhancedAIAssistantComponent, {
  name: 'EnhancedAIAssistant',
  operationType: 'api',
  enableRetry: true,
  maxRetries: 3,
  showErrorDetails: process.env.NODE_ENV === 'development'
});

export default EnhancedAIAssistant;
