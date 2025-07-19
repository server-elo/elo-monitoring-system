'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Code,
  CheckCircle,
  Zap,
  Terminal,
  FileText,
  Lightbulb,
  Copy,
  Download
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CodeStep {
  id: number;
  title: string;
  description: string;
  code: string;
  explanation: string;
  output?: string;
  isExecuting?: boolean;
  isComplete?: boolean;
}

export function InteractiveDemoSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showOutput, setShowOutput] = useState(false);

  const codeSteps: CodeStep[] = [
    {
      id: 0,
      title: "Contract Declaration",
      description: "Start by declaring your smart contract",
      code: `pragma solidity ^0.8.0;

contract SimpleStorage {
    // State variable to store a number
    uint256 private storedData;
}`,
      explanation: "Every Solidity contract starts with a pragma directive and contract declaration. The pragma specifies the compiler version.",
      output: "✅ Contract structure defined"
    },
    {
      id: 1,
      title: "Constructor Function",
      description: "Initialize your contract with a constructor",
      code: `    constructor(uint256 _initialValue) {
        storedData = _initialValue;
        emit DataStored(_initialValue);
    }`,
      explanation: "The constructor runs once when the contract is deployed. It's perfect for setting initial values.",
      output: "✅ Constructor added - Contract will initialize with a value"
    },
    {
      id: 2,
      title: "Events & Functions",
      description: "Add events and functions for interaction",
      code: `    event DataStored(uint256 value);
    
    function set(uint256 _value) public {
        storedData = _value;
        emit DataStored(_value);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }`,
      explanation: "Events provide a way to log contract activity. Functions allow external interaction with your contract.",
      output: "✅ Contract is now fully functional and ready for deployment!"
    }
  ];

  const executeStep = async (stepIndex: number) => {
    setIsExecuting(true);
    setCurrentStep(stepIndex);
    
    // Simulate compilation/execution time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCompletedSteps(prev => [...prev, stepIndex]);
    setShowOutput(true);
    setIsExecuting(false);
    
    // Auto-advance to next step after showing output
    setTimeout(() => {
      setShowOutput(false);
      if (stepIndex < codeSteps.length - 1) {
        setCurrentStep(stepIndex + 1);
      }
    }, 3000);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setShowOutput(false);
    setIsExecuting(false);
  };

  const copyCode = () => {
    const fullCode = `pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedData;
    
    event DataStored(uint256 value);
    
    constructor(uint256 _initialValue) {
        storedData = _initialValue;
        emit DataStored(_initialValue);
    }
    
    function set(uint256 _value) public {
        storedData = _value;
        emit DataStored(_value);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}`;
    
    navigator.clipboard.writeText(fullCode);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Try It Yourself
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience our interactive learning environment. Write, compile, and deploy 
            your first smart contract in real-time with guided assistance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-bold text-white">Tutorial Steps</h3>
              </div>

              <div className="space-y-4">
                {codeSteps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      currentStep === index
                        ? 'bg-blue-500/20 border-blue-500/50'
                        : completedSteps.includes(index)
                        ? 'bg-green-500/20 border-green-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    onClick={() => !isExecuting && setCurrentStep(index)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        completedSteps.includes(index)
                          ? 'bg-green-500 text-white'
                          : currentStep === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {completedSteps.includes(index) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{step.title}</div>
                        <div className="text-sm text-gray-400">{step.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <Button 
                  onClick={() => executeStep(currentStep)}
                  disabled={isExecuting || completedSteps.includes(currentStep)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {isExecuting ? (
                    <>
                      <Terminal className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : completedSteps.includes(currentStep) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Step
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={resetDemo}
                  variant="outline"
                  className="w-full border-gray-500/30 text-gray-300 hover:bg-gray-500/10"
                >
                  Reset Demo
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Code Editor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Code className="w-6 h-6 text-purple-400" />
                  <h3 className="text-xl font-bold text-white">Smart Contract Editor</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-green-500/30 text-green-400">
                    Solidity ^0.8.0
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyCode}
                    className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Code Display */}
              <div className="bg-slate-900 rounded-lg p-6 font-mono text-sm mb-6 min-h-[400px] border border-white/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <pre className="text-gray-300 whitespace-pre-wrap">
                      <code dangerouslySetInnerHTML={{
                        __html: codeSteps[currentStep].code
                          .replace(/pragma/g, '<span class="text-purple-400">pragma</span>')
                          .replace(/solidity/g, '<span class="text-purple-400">solidity</span>')
                          .replace(/contract/g, '<span class="text-blue-400">contract</span>')
                          .replace(/function/g, '<span class="text-blue-400">function</span>')
                          .replace(/constructor/g, '<span class="text-blue-400">constructor</span>')
                          .replace(/event/g, '<span class="text-blue-400">event</span>')
                          .replace(/uint256/g, '<span class="text-green-400">uint256</span>')
                          .replace(/public/g, '<span class="text-yellow-400">public</span>')
                          .replace(/private/g, '<span class="text-yellow-400">private</span>')
                          .replace(/view/g, '<span class="text-yellow-400">view</span>')
                          .replace(/returns/g, '<span class="text-yellow-400">returns</span>')
                          .replace(/emit/g, '<span class="text-orange-400">emit</span>')
                          .replace(/"[^"]*"/g, '<span class="text-green-300">$&</span>')
                          .replace(/\/\/.*$/gm, '<span class="text-gray-500">$&</span>')
                      }} />
                    </pre>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Explanation */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-white mb-1">Explanation</div>
                    <div className="text-gray-300 text-sm">
                      {codeSteps[currentStep].explanation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Output */}
              <AnimatePresence>
                {showOutput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="font-semibold text-green-300 mb-1">Execution Result</div>
                        <div className="text-green-200 text-sm">
                          {codeSteps[currentStep].output}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 mt-6">
                <Button asChild className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  <Link href="/learn">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Full Course
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                  <Link href="/playground">
                    <Code className="w-4 h-4 mr-2" />
                    Open Playground
                  </Link>
                </Button>
                <Button variant="outline" className="border-gray-500/30 text-gray-300 hover:bg-gray-500/10">
                  <Download className="w-4 h-4 mr-2" />
                  Download Code
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Progress Indicator */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex justify-center space-x-2 mb-4">
            {codeSteps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  completedSteps.includes(index)
                    ? 'bg-green-500'
                    : currentStep === index
                    ? 'bg-blue-500'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          <div className="text-gray-400 text-sm">
            Step {currentStep + 1} of {codeSteps.length} • {completedSteps.length} completed
          </div>
        </motion.div>
      </div>
    </section>
  );
}
