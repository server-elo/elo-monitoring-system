'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  BookOpen, 
  Code, 
  Shield, 
  Zap, 
  FileText, 
  Download,
  ExternalLink,
  Search
} from 'lucide-react';

export default function DocumentationPage() {
  const documentationSections = [
    {
      title: 'Getting Started',
      icon: <BookOpen className="w-6 h-6" />,
      description: 'Learn the basics of Solidity and smart contract development',
      links: [
        { name: 'Introduction to Solidity', href: '/learn/basics' },
        { name: 'Setting up Development Environment', href: '/learn/setup' },
        { name: 'Your First Smart Contract', href: '/learn/first-contract' },
        { name: 'Deploying to Testnet', href: '/learn/deployment' }
      ]
    },
    {
      title: 'Core Concepts',
      icon: <Code className="w-6 h-6" />,
      description: 'Deep dive into Solidity language features and patterns',
      links: [
        { name: 'Data Types and Variables', href: '/learn/data-types' },
        { name: 'Functions and Modifiers', href: '/learn/functions' },
        { name: 'Inheritance and Interfaces', href: '/learn/inheritance' },
        { name: 'Events and Logging', href: '/learn/events' }
      ]
    },
    {
      title: 'Security Best Practices',
      icon: <Shield className="w-6 h-6" />,
      description: 'Learn how to write secure smart contracts',
      links: [
        { name: 'Common Vulnerabilities', href: '/learn/security/vulnerabilities' },
        { name: 'Security Patterns', href: '/learn/security/patterns' },
        { name: 'Audit Checklist', href: '/learn/security/audit' },
        { name: 'Testing Strategies', href: '/learn/security/testing' }
      ]
    },
    {
      title: 'Advanced Topics',
      icon: <Zap className="w-6 h-6" />,
      description: 'Master advanced Solidity concepts and optimizations',
      links: [
        { name: 'Gas Optimization', href: '/learn/advanced/gas' },
        { name: 'Assembly and Low-level', href: '/learn/advanced/assembly' },
        { name: 'Proxy Patterns', href: '/learn/advanced/proxies' },
        { name: 'DeFi Protocols', href: '/learn/advanced/defi' }
      ]
    }
  ];

  const quickLinks = [
    { name: 'API Reference', href: '/api-docs', icon: <FileText className="w-4 h-4" /> },
    { name: 'Download PDF Guide', href: '#', icon: <Download className="w-4 h-4" /> },
    { name: 'GitHub Repository', href: 'https://github.com/ezekaj/learning_sol', icon: <ExternalLink className="w-4 h-4" /> },
    { name: 'Community Forum', href: '#', icon: <ExternalLink className="w-4 h-4" /> }
  ];

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
              Documentation
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Comprehensive guides, tutorials, and references for mastering Solidity development
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : '_self'}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                >
                  <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                    {link.icon}
                  </div>
                  <span className="text-white group-hover:text-blue-300 transition-colors">
                    {link.name}
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Documentation Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-white mb-8">Documentation Sections</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {documentationSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-blue-400">
                      {section.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 mb-6">
                    {section.description}
                  </p>
                  <div className="space-y-2">
                    {section.links.map((link) => (
                      <a
                        key={link.name}
                        href={link.href}
                        className="block text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
                      >
                        → {link.name}
                      </a>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Need Help?
              </h3>
              <p className="text-gray-300 mb-6">
                Can't find what you're looking for? Our community is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/collaborate"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Join Community
                </a>
                <a
                  href="https://zedigital.tech/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
