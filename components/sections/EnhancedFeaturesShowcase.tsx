'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code,
  Users,
  Trophy,
  Brain,
  Play,
  ChevronRight,
  Star
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  stats: { label: string; value: string }[];
  preview: React.ReactNode;
}

export function EnhancedFeaturesShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);

  const features: Feature[] = [
    {
      id: 'interactive-learning',
      title: 'Interactive Code Editor',
      description: 'Learn Solidity with our advanced Monaco-based editor featuring real-time compilation, syntax highlighting, and intelligent code completion.',
      icon: <Code className="w-8 h-8" />,
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      stats: [
        { label: 'Code Challenges', value: '150+' },
        { label: 'Real-time Feedback', value: '100%' },
        { label: 'Success Rate', value: '94%' }
      ],
      preview: (
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
          <div className="text-purple-400">pragma solidity ^0.8.0;</div>
          <div className="text-blue-400">contract</div> <span className="text-yellow-400">HelloWorld</span> {'{'}
          <div className="ml-4 text-green-400">string public message;</div>
          <div className="ml-4">
            <span className="text-blue-400">constructor</span>() {'{'}
            <div className="ml-4 text-gray-300">message = <span className="text-green-400">"Hello, Solidity!"</span>;</div>
            {'}'}
          </div>
          {'}'}
        </div>
      )
    },
    {
      id: 'collaboration',
      title: 'Real-time Collaboration',
      description: 'Code together with peers in real-time, share knowledge, and learn from experienced developers in our collaborative environment.',
      icon: <Users className="w-8 h-8" />,
      color: 'text-green-400',
      gradient: 'from-green-500/20 to-emerald-500/20',
      stats: [
        { label: 'Active Users', value: '2.5K+' },
        { label: 'Study Groups', value: '45' },
        { label: 'Mentors Online', value: '24/7' }
      ],
      preview: (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold">A</div>
            <div className="flex-1 bg-green-500/20 rounded-lg p-2 text-sm">Working on smart contract deployment...</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">B</div>
            <div className="flex-1 bg-blue-500/20 rounded-lg p-2 text-sm">Great! Let me help with the gas optimization.</div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold">C</div>
            <div className="flex-1 bg-purple-500/20 rounded-lg p-2 text-sm">Check out this pattern for better security.</div>
          </div>
        </div>
      )
    },
    {
      id: 'gamification',
      title: 'Gamified Learning',
      description: 'Earn XP, unlock achievements, and climb the leaderboards as you master Solidity development through our comprehensive gamification system.',
      icon: <Trophy className="w-8 h-8" />,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      stats: [
        { label: 'Achievements', value: '50+' },
        { label: 'XP Rewards', value: '∞' },
        { label: 'Leaderboards', value: 'Live' }
      ],
      preview: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <div className="font-semibold text-white">First Contract</div>
                <div className="text-xs text-yellow-200">Deploy your first smart contract</div>
              </div>
            </div>
            <div className="text-yellow-400 font-bold">+500 XP</div>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-purple-400" />
              <div>
                <div className="font-semibold text-white">Security Expert</div>
                <div className="text-xs text-purple-200">Complete 10 security challenges</div>
              </div>
            </div>
            <div className="text-purple-400 font-bold">+1000 XP</div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-assistant',
      title: 'AI-Powered Assistant',
      description: 'Get instant help from our advanced AI assistant that understands Solidity, provides code suggestions, and explains complex concepts.',
      icon: <Brain className="w-8 h-8" />,
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 to-pink-500/20',
      stats: [
        { label: 'Response Time', value: '<2s' },
        { label: 'Accuracy', value: '96%' },
        { label: 'Languages', value: '10+' }
      ],
      preview: (
        <div className="space-y-3">
          <div className="bg-blue-500/20 rounded-lg p-3 text-sm">
            <div className="font-semibold text-blue-300 mb-1">You:</div>
            <div>How do I prevent reentrancy attacks?</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 text-sm">
            <div className="font-semibold text-purple-300 mb-1">AI Assistant:</div>
            <div>Use the Checks-Effects-Interactions pattern and consider implementing a reentrancy guard modifier...</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Experience the Future of Learning
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover the powerful features that make our platform the most advanced 
            way to learn Solidity and blockchain development.
          </p>
        </motion.div>

        {/* Feature Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {features.map((feature, index) => (
            <motion.button
              key={feature.id}
              onClick={() => setActiveFeature(index)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg border transition-all duration-300 ${
                activeFeature === index
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className={activeFeature === index ? feature.color : ''}>{feature.icon}</span>
              <span className="font-medium">{feature.title}</span>
            </motion.button>
          ))}
        </div>

        {/* Active Feature Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard
              className={`p-8 bg-gradient-to-br ${features[activeFeature].gradient} border-white/20`}
              hover={false}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Feature Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={features[activeFeature].color}>
                      {features[activeFeature].icon}
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      {features[activeFeature].title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-300 text-lg mb-6">
                    {features[activeFeature].description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {features[activeFeature].stats.map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-400">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <Link href="/learn">
                        <Play className="w-4 h-4 mr-2" />
                        Try It Now
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                      <Link href="/features">
                        Learn More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Feature Preview */}
                <div className="bg-slate-900/50 rounded-lg p-6 border border-white/10">
                  {features[activeFeature].preview}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
