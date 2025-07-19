'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Play,
  Clock,
  Star,
  Users,
  Trophy,
  Filter,
  Search
} from 'lucide-react';

export default function TutorialsPage() {
  const tutorialCategories = [
    { name: 'All', count: 24, active: true },
    { name: 'Beginner', count: 8, active: false },
    { name: 'Intermediate', count: 10, active: false },
    { name: 'Advanced', count: 6, active: false },
    { name: 'DeFi', count: 5, active: false },
    { name: 'NFTs', count: 4, active: false }
  ];

  const featuredTutorials = [
    {
      id: 1,
      title: 'Building Your First Smart Contract',
      description: 'Learn the fundamentals of Solidity by creating a simple storage contract',
      duration: '45 min',
      difficulty: 'Beginner',
      rating: 4.8,
      students: 1250,
      thumbnail: '/api/placeholder/400/225',
      tags: ['Solidity', 'Basics', 'Smart Contracts'],
      instructor: 'Sarah Chen',
      href: '/learn/tutorials/first-contract'
    },
    {
      id: 2,
      title: 'Creating an ERC-20 Token',
      description: 'Step-by-step guide to implementing your own cryptocurrency token',
      duration: '1h 20min',
      difficulty: 'Intermediate',
      rating: 4.9,
      students: 890,
      thumbnail: '/api/placeholder/400/225',
      tags: ['ERC-20', 'Tokens', 'Standards'],
      instructor: 'Alex Rodriguez',
      href: '/learn/tutorials/erc20-token'
    },
    {
      id: 3,
      title: 'DeFi Yield Farming Protocol',
      description: 'Build a complete yield farming protocol with staking and rewards',
      duration: '2h 15min',
      difficulty: 'Advanced',
      rating: 4.7,
      students: 456,
      thumbnail: '/api/placeholder/400/225',
      tags: ['DeFi', 'Yield Farming', 'Staking'],
      instructor: 'Michael Kim',
      href: '/learn/tutorials/yield-farming'
    },
    {
      id: 4,
      title: 'NFT Marketplace Development',
      description: 'Create a full-featured NFT marketplace with minting and trading',
      duration: '3h 30min',
      difficulty: 'Advanced',
      rating: 4.6,
      students: 623,
      thumbnail: '/api/placeholder/400/225',
      tags: ['NFT', 'Marketplace', 'ERC-721'],
      instructor: 'Emma Thompson',
      href: '/learn/tutorials/nft-marketplace'
    }
  ];

  const quickStartTutorials = [
    {
      title: 'Solidity in 10 Minutes',
      duration: '10 min',
      href: '/learn/quick/solidity-basics'
    },
    {
      title: 'Deploy to Testnet',
      duration: '15 min',
      href: '/learn/quick/testnet-deploy'
    },
    {
      title: 'Gas Optimization Tips',
      duration: '12 min',
      href: '/learn/quick/gas-optimization'
    },
    {
      title: 'Security Checklist',
      duration: '8 min',
      href: '/learn/quick/security-checklist'
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
              Tutorials
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Learn Solidity through hands-on tutorials and practical examples
            </p>
            
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tutorials..."
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
              {tutorialCategories.map((category, index) => (
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

          {/* Quick Start Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStartTutorials.map((tutorial, index) => (
                <motion.a
                  key={tutorial.title}
                  href={tutorial.href}
                  className="block p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <Play className="w-5 h-5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="text-white group-hover:text-blue-300 transition-colors font-medium">
                      {tutorial.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{tutorial.duration}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Featured Tutorials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">Featured Tutorials</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredTutorials.map((tutorial, index) => (
                <motion.a
                  key={tutorial.id}
                  href={tutorial.href}
                  className="block bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Play className="w-12 h-12 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </span>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{tutorial.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{tutorial.students}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {tutorial.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-4">
                      {tutorial.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-300">{tutorial.rating}</span>
                        </div>
                        <span className="text-sm text-gray-400">by {tutorial.instructor}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {tutorial.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white/10 text-xs text-gray-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.a>
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
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Start Learning?
              </h3>
              <p className="text-gray-300 mb-6">
                Join thousands of developers mastering Solidity with our interactive tutorials
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/learn"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Start Learning
                </a>
                <a
                  href="/code"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
                >
                  Try Code Lab
                </a>
              </div>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
