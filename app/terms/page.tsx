'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileText, Scale, Shield, AlertTriangle, Users, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      icon: <Scale className="w-6 h-6" />,
      content: [
        'By accessing and using SolanaLearn, you accept and agree to be bound by these Terms of Service',
        'If you do not agree to these terms, please do not use our platform',
        'These terms apply to all users, including visitors, registered users, and premium subscribers',
        'Continued use of the platform constitutes acceptance of any updated terms'
      ]
    },
    {
      title: 'User Responsibilities',
      icon: <Users className="w-6 h-6" />,
      content: [
        'Provide accurate and complete information when creating an account',
        'Maintain the security of your account credentials',
        'Use the platform only for lawful educational purposes',
        'Respect intellectual property rights and platform guidelines',
        'Report any security vulnerabilities or inappropriate content'
      ]
    },
    {
      title: 'Platform Usage',
      icon: <Shield className="w-6 h-6" />,
      content: [
        'Educational content is provided for learning purposes only',
        'Code examples should not be used in production without proper review',
        'Users retain ownership of their original code submissions',
        'Platform features may be modified or discontinued with notice',
        'Fair use policies apply to computational resources'
      ]
    },
    {
      title: 'Prohibited Activities',
      icon: <AlertTriangle className="w-6 h-6" />,
      content: [
        'Attempting to hack, disrupt, or compromise platform security',
        'Sharing malicious code or content that could harm others',
        'Violating intellectual property rights of others',
        'Creating multiple accounts to circumvent limitations',
        'Using the platform for commercial purposes without authorization'
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
              <FileText className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Terms of Service
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Please read these terms carefully before using our Solidity learning platform.
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
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to SolanaLearn</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms of Service ("Terms") govern your use of the SolanaLearn platform, including our website, 
                educational content, code laboratories, and community features. By using our services, you agree to 
                these terms and our Privacy Policy. Please read them carefully.
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
            {/* Intellectual Property */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Intellectual Property</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Platform Content</h4>
                  <p className="text-gray-300 text-sm">
                    All educational materials, tutorials, and platform features are owned by SolanaLearn or our licensors. 
                    You may use this content for personal learning but not for commercial redistribution.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">User Content</h4>
                  <p className="text-gray-300 text-sm">
                    You retain ownership of code and content you create. By sharing on our platform, you grant us 
                    a license to display and use your content for educational purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Disclaimers and Limitations</h3>
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h4 className="text-yellow-400 font-medium">Educational Purpose Only</h4>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Our platform is for educational purposes. Code examples and tutorials should not be used in 
                    production environments without proper security audits and testing.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">No Warranties</h4>
                  <p className="text-gray-300 text-sm">
                    The platform is provided "as is" without warranties of any kind. We do not guarantee 
                    uninterrupted service or error-free content.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">Limitation of Liability</h4>
                  <p className="text-gray-300 text-sm">
                    SolanaLearn shall not be liable for any indirect, incidental, or consequential damages 
                    arising from your use of the platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Termination */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Account Termination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-2">By You</h4>
                  <p className="text-gray-300 text-sm">
                    You may terminate your account at any time through your account settings or by contacting support.
                  </p>
                </div>
                <div>
                  <h4 className="text-white font-medium mb-2">By Us</h4>
                  <p className="text-gray-300 text-sm">
                    We may suspend or terminate accounts that violate these terms or engage in prohibited activities.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Questions About These Terms</h3>
              <p className="text-gray-300 mb-4">
                If you have questions about these Terms of Service, please contact us:
              </p>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <a 
                  href="https://zedigital.tech/contact" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Contact Legal Team
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
                Terms Updates
              </h3>
              <p className="text-gray-300 text-sm">
                We may update these Terms of Service from time to time. Continued use of the platform 
                after changes constitutes acceptance of the updated terms.
              </p>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
