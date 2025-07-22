#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QuantumUltimateFixer {
  constructor() {
    this.criticalFiles = {
      'components/GeminiChat.tsx': this.fixGeminiChat,
      'components/LandingPage.tsx': this.fixLandingPage,
      'components/MobileNavigation.tsx': this.fixMobileNavigation,
      'components/ModuleContent.tsx': this.fixModuleContent,
      'components/QuizComponent.tsx': this.fixQuizComponent,
      'app/auth/login/page.tsx': this.fixLoginPage,
      'app/learn/page.tsx': this.fixLearnPage,
      'sentry.client.config.ts': this.fixSentryConfig
    };
  }

  async fix() {
    console.log('🚀 Quantum Ultimate Fixer - Applying final fixes...\n');

    // Fix critical files with custom handlers
    for (const [filePath, fixFunction] of Object.entries(this.criticalFiles)) {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        console.log(`🔧 Fixing ${filePath}...`);
        fixFunction.call(this, fullPath);
      }
    }

    // Fix all comparison operators
    this.fixComparisonOperators();

    console.log('\n✅ All fixes applied!');
    
    // Run TypeScript check
    console.log('\n🔍 Running TypeScript check...\n');
    try {
      execSync('npx tsc --noEmit', { stdio: 'inherit' });
      console.log('✅ TypeScript compilation successful!');
    } catch (error) {
      console.log('⚠️  Some TypeScript errors remain. Run `npx tsc --noEmit` for details.');
    }
  }

  fixGeminiChat(filePath) {
    const content = `"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessageRole } from '../types';
import SendIcon from './icons/SendIcon';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface GeminiChatProps {
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  currentModuleTitle: string | null;
}

const GeminiChat: React.FC<GeminiChatProps> = ({
  chatMessages,
  onSendMessage,
  isLoading,
  currentModuleTitle
}) => {
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const getFormattedTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface-1 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary">
          AI Learning Assistant
        </h3>
        {currentModuleTitle && (
          <p className="text-sm text-brand-text-secondary">
            Module: {currentModuleTitle}
          </p>
        )}
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-brand-text-secondary py-8">
            <BotIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me anything about Solidity!</p>
            <p className="text-sm mt-2">I'm here to help you learn.</p>
          </div>
        ) : (
          chatMessages.map((message, index) => (
            <div
              key={index}
              className={\`flex \${
                message.role === ChatMessageRole.User
                  ? 'justify-end'
                  : 'justify-start'
              }\`}
            >
              <div
                className={\`flex max-w-[80%] \${
                  message.role === ChatMessageRole.User
                    ? 'flex-row-reverse'
                    : 'flex-row'
                } gap-3\`}
              >
                <div className="flex-shrink-0">
                  {message.role === ChatMessageRole.User ? (
                    <UserIcon className="w-8 h-8 text-brand-accent" />
                  ) : (
                    <BotIcon className="w-8 h-8 text-brand-primary" />
                  )}
                </div>
                <div
                  className={\`px-4 py-3 rounded-lg \${
                    message.role === ChatMessageRole.User
                      ? 'bg-brand-accent text-white'
                      : 'bg-brand-surface-2 text-brand-text-primary'
                  }\`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {getFormattedTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <BotIcon className="w-8 h-8 text-brand-primary" />
              <div className="px-4 py-3 rounded-lg bg-brand-surface-2">
                <SpinnerIcon className="w-5 h-5 animate-spin text-brand-primary" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-brand-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 bg-brand-surface-2 text-brand-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeminiChat;`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixLandingPage(filePath) {
    const content = `"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Code, 
  Trophy, 
  Users, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Structured Learning',
      description: 'Progress through carefully crafted modules from basics to advanced concepts'
    },
    {
      icon: Code,
      title: 'Interactive Coding',
      description: 'Write, test, and deploy smart contracts in our browser-based IDE'
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn XP, unlock achievements, and compete on leaderboards'
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Code together in real-time and learn from the community'
    }
  ];

  const benefits = [
    'Learn at your own pace with AI-powered assistance',
    'Build real-world projects and deploy to testnets',
    'Get instant feedback on your code',
    'Join a community of blockchain developers'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Solidity</span> Development
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The most comprehensive platform to learn smart contract development with AI-powered tutoring and real-time collaboration
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/learn"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Start Learning <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/code"
                className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Try the Editor <Code className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything You Need to Become a Solidity Expert
            </h2>
            <p className="text-xl text-gray-300">
              Our platform combines the best learning tools with cutting-edge technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                <feature.icon className="h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Sparkles className="h-16 w-16 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-12">
              Why Choose SolanaLearn?
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-center gap-3"
                >
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <p className="text-lg text-gray-300">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12"
          >
            <Zap className="h-16 w-16 text-yellow-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Start Your Blockchain Journey?
            </h2>
            <p className="text-xl text-gray-100 mb-8">
              Join thousands of developers learning Solidity the right way
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixMobileNavigation(filePath) {
    const content = `"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BookOpen,
  Code,
  Users,
  Trophy,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/code', label: 'Code', icon: Code },
  { href: '/collaborate', label: 'Collaborate', icon: Users },
  { href: '/achievements', label: 'Achievements', icon: Trophy }
];

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-4 bg-brand-accent rounded-full shadow-lg md:hidden"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Navigation Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-brand-surface-1 rounded-t-3xl shadow-xl md:hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={\`flex flex-col items-center gap-2 p-4 rounded-xl transition-all \${
                          isActive
                            ? 'bg-brand-accent text-white'
                            : 'hover:bg-brand-surface-2 text-brand-text-secondary'
                        }\`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar (Alternative) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface-1 border-t border-brand-border md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={\`flex flex-col items-center justify-center gap-1 transition-colors \${
                  isActive
                    ? 'text-brand-accent'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }\`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixModuleContent(filePath) {
    const content = `"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Lock,
  BookOpen,
  Code,
  Trophy
} from 'lucide-react';

interface Module {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  lessons: Lesson[];
  prerequisites?: string[];
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  type: 'theory' | 'practice' | 'quiz';
}

interface ModuleContentProps {
  module: Module;
  onLessonSelect: (lessonId: string) => void;
  userProgress: Record<string, boolean>;
}

export default function ModuleContent({
  module,
  onLessonSelect,
  userProgress
}: ModuleContentProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    const completed = new Set(
      Object.entries(userProgress)
        .filter(([_, isCompleted]) => isCompleted)
        .map(([lessonId]) => lessonId)
    );
    setCompletedLessons(completed);
  }, [userProgress]);

  const getProgress = () => {
    const total = module.lessons.length;
    const completed = module.lessons.filter(lesson => 
      completedLessons.has(lesson.id)
    ).length;
    return (completed / total) * 100;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400 bg-green-400/10';
      case 'intermediate':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'advanced':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'theory':
        return BookOpen;
      case 'practice':
        return Code;
      case 'quiz':
        return Trophy;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Module Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-surface-1 rounded-xl p-6 mb-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-brand-text-primary mb-2">
              {module.title}
            </h1>
            <p className="text-brand-text-secondary">
              {module.description}
            </p>
          </div>
          <span className={\`px-3 py-1 rounded-full text-sm font-medium \${getDifficultyColor(module.difficulty)}\`}>
            {module.difficulty}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-brand-text-secondary">Progress</span>
            <span className="text-brand-accent font-medium">{Math.round(getProgress())}%</span>
          </div>
          <div className="h-2 bg-brand-surface-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: \`\${getProgress()}%\` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
            />
          </div>
        </div>

        {/* Module Info */}
        <div className="flex items-center gap-6 text-sm text-brand-text-secondary">
          <span>⏱️ {module.estimatedTime}</span>
          <span>📚 {module.lessons.length} lessons</span>
          <span>✅ {completedLessons.size} completed</span>
        </div>
      </motion.div>

      {/* Prerequisites */}
      {module.prerequisites && module.prerequisites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-6"
        >
          <h3 className="text-yellow-400 font-semibold mb-2">Prerequisites</h3>
          <ul className="space-y-1">
            {module.prerequisites.map((prereq, index) => (
              <li key={index} className="flex items-center gap-2 text-yellow-200/80">
                <ChevronRight className="h-4 w-4" />
                <span>{prereq}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Lessons List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {module.lessons.map((lesson, index) => {
          const isCompleted = completedLessons.has(lesson.id);
          const Icon = getLessonIcon(lesson.type);
          const isLocked = lesson.locked && !isCompleted;

          return (
            <motion.button
              key={lesson.id}
              onClick={() => !isLocked && onLessonSelect(lesson.id)}
              disabled={isLocked}
              whileHover={!isLocked ? { scale: 1.02 } : {}}
              whileTap={!isLocked ? { scale: 0.98 } : {}}
              className={\`w-full p-4 rounded-lg border transition-all \${
                isLocked
                  ? 'bg-brand-surface-1/50 border-brand-border/50 cursor-not-allowed opacity-60'
                  : isCompleted
                  ? 'bg-brand-surface-2 border-brand-accent/30 hover:border-brand-accent/50'
                  : 'bg-brand-surface-1 border-brand-border hover:border-brand-accent/30'
              }\`}
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {isLocked ? (
                    <Lock className="h-5 w-5 text-brand-text-secondary" />
                  ) : isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-brand-text-secondary" />
                  )}
                </div>

                {/* Lesson Icon */}
                <div className={\`p-2 rounded-lg \${
                  isCompleted ? 'bg-brand-accent/20' : 'bg-brand-surface-3'
                }\`}>
                  <Icon className={\`h-5 w-5 \${
                    isCompleted ? 'text-brand-accent' : 'text-brand-text-secondary'
                  }\`} />
                </div>

                {/* Lesson Info */}
                <div className="flex-1 text-left">
                  <h4 className={\`font-medium \${
                    isCompleted ? 'text-brand-text-primary' : 'text-brand-text-secondary'
                  }\`}>
                    {lesson.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-brand-text-secondary">
                    <span>{lesson.type}</span>
                    <span>•</span>
                    <span>{lesson.duration}</span>
                  </div>
                </div>

                {/* Chevron */}
                {!isLocked && (
                  <ChevronRight className="h-5 w-5 text-brand-text-secondary" />
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixQuizComponent(filePath) {
    const content = `"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Trophy
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizComponentProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
  moduleTitle: string;
}

export default function QuizComponent({
  questions,
  onComplete,
  moduleTitle
}: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setShowResult(true);
    setShowExplanation(true);
    
    if (isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
      setScore(score + 1);
      setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete(score);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setScore(0);
    setAnsweredQuestions(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400 bg-green-400/10';
      case 'medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'hard':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">
          {moduleTitle} - Quiz
        </h2>
        <div className="flex items-center justify-between mb-4">
          <span className="text-brand-text-secondary">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className={\`px-3 py-1 rounded-full text-sm font-medium \${getDifficultyColor(currentQuestion.difficulty)}\`}>
            {currentQuestion.difficulty}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="h-2 bg-brand-surface-2 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: \`\${progress}%\` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-brand-primary to-brand-accent"
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-brand-surface-1 rounded-xl p-6 mb-6"
        >
          <h3 className="text-xl font-semibold text-brand-text-primary mb-6">
            {currentQuestion.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correctAnswer;
              const showCorrectness = showResult && (isSelected || isCorrect);

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  disabled={showResult}
                  className={\`w-full p-4 rounded-lg border-2 text-left transition-all \${
                    showCorrectness
                      ? isCorrect
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-red-500 bg-red-500/10'
                      : isSelected
                      ? 'border-brand-accent bg-brand-accent/10'
                      : 'border-brand-border hover:border-brand-accent/50'
                  }\`}
                >
                  <div className="flex items-center justify-between">
                    <span className={\`\${
                      showCorrectness
                        ? isCorrect
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-brand-text-primary'
                    }\`}>
                      {option}
                    </span>
                    {showCorrectness && (
                      <div>
                        {isCorrect ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : isSelected ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : null}
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
              >
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium mb-1">Explanation</p>
                    <p className="text-blue-300/80 text-sm">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-brand-text-secondary">
          Score: <span className="font-semibold text-brand-accent">{score}/{questions.length}</span>
        </div>
        
        <div className="flex gap-3">
          {showResult ? (
            <>
              {isLastQuestion ? (
                <>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-brand-surface-2 text-brand-text-primary rounded-lg hover:bg-brand-surface-3 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Retry Quiz
                  </button>
                  <button
                    onClick={() => onComplete(score)}
                    className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors flex items-center gap-2"
                  >
                    Complete
                    <Trophy className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors flex items-center gap-2"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="px-6 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}`;

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixLoginPage(filePath) {
    // Read current content and just fix the comparison operators
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/={5,}/g, '===');
    content = content.replace(/!={3,}/g, '!==');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixLearnPage(filePath) {
    // Read current content and just fix the comparison operators
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/={5,}/g, '===');
    content = content.replace(/!={3,}/g, '!==');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixSentryConfig(filePath) {
    // Read current content and just fix the comparison operators
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/={5,}/g, '===');
    content = content.replace(/!={3,}/g, '!==');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  }

  fixComparisonOperators() {
    console.log('\n🔧 Fixing comparison operators globally...');
    
    const files = this.getAllFiles('.');
    let fixedCount = 0;
    
    files.forEach(file => {
      try {
        let content = fs.readFileSync(file, 'utf8');
        const originalContent = content;
        
        // Fix excessive equals signs
        content = content.replace(/={5,}/g, '===');
        content = content.replace(/={4}/g, '==');
        
        // Fix excessive not equals
        content = content.replace(/!={3,}/g, '!==');
        
        // Fix arrow functions that have excessive >
        content = content.replace(/=>{2,}/g, '=>');
        
        if (content !== originalContent) {
          fs.writeFileSync(file, content, 'utf8');
          fixedCount++;
        }
      } catch (error) {
        // Skip files we can't process
      }
    });
    
    console.log(`✅ Fixed comparison operators in ${fixedCount} files`);
  }

  getAllFiles(dir) {
    const files = [];
    const excludePaths = ['node_modules', '.next', '.git', 'dist', 'build'];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    const scanDir = (currentDir) => {
      try {
        const entries = fs.readdirSync(currentDir);
        
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry);
          
          if (excludePaths.some(exclude => fullPath.includes(exclude))) {
            continue;
          }
          
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDir(fullPath);
          } else if (stat.isFile() && extensions.includes(path.extname(fullPath))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    scanDir(dir);
    return files;
  }
}

// Execute
const fixer = new QuantumUltimateFixer();
fixer.fix().catch(console.error);