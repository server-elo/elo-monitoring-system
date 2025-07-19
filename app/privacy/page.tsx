'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      icon: <Database className="w-6 h-6" />,
      content: [
        'Account information (email, username, profile data)',
        'Learning progress and achievements',
        'Code submissions and project data',
        'Usage analytics and performance metrics',
        'Communication preferences and feedback'
      ]
    },
    {
      title: 'How We Use Your Information',
      icon: <Eye className="w-6 h-6" />,
      content: [
        'Provide and improve our educational services',
        'Track learning progress and personalize content',
        'Enable collaboration and community features',
        'Send important updates and notifications',
        'Analyze platform usage for improvements'
      ]
    },
    {
      title: 'Data Protection',
      icon: <Lock className="w-6 h-6" />,
      content: [
        'End-to-end encryption for sensitive data',
        'Regular security audits and monitoring',
        'Secure cloud infrastructure with backups',
        'Access controls and authentication',
        'GDPR and CCPA compliance measures'
      ]
    },
    {
      title: 'Data Sharing',
      icon: <Users className="w-6 h-6" />,
      content: [
        'We never sell your personal information',
        'Limited sharing with trusted service providers',
        'Anonymous analytics for platform improvement',
        'Legal compliance when required by law',
        'User consent for any additional sharing'
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Suspense fallback={<LoadingSpinner />}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Privacy Policy
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </motion.div>

          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Our Commitment to Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                At SolanaLearn, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our 
                Solidity learning platform. We believe in transparency and want you to understand exactly how your data is handled.
              </p>
            </div>
          </motion.div>

          {/* Main Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-blue-400">
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {section.title}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-300 flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Additional Sections */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 space-y-8"
          >
            {/* Cookies */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Cookies and Tracking</h3>
              <p className="text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. 
                You can control cookie preferences through your browser settings.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Essential Cookies</h4>
                  <p className="text-sm text-gray-400">Required for basic platform functionality</p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-gray-400">Help us understand how you use our platform</p>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Your Rights</h3>
              <p className="text-gray-300 mb-4">
                You have the right to access, update, or delete your personal information. You can also opt-out of certain 
                communications and data processing activities.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Access</h4>
                  <p className="text-sm text-gray-400">View your data</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Update</h4>
                  <p className="text-sm text-gray-400">Modify your information</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Delete</h4>
                  <p className="text-sm text-gray-400">Remove your account</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Contact Us</h3>
              <p className="text-gray-300 mb-4">
                If you have questions about this Privacy Policy or how we handle your data, please contact us:
              </p>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <a 
                  href="https://zedigital.tech/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </motion.div>

          {/* Updates Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-12"
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Policy Updates
              </h3>
              <p className="text-gray-300 text-sm">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes 
                via email or through our platform notifications.
              </p>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
