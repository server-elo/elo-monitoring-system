'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Cookie, Settings, Shield, BarChart, Users, Check, X } from 'lucide-react';

export default function CookiePolicyPage() {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always required
    analytics: true,
    marketing: false,
    personalization: true
  });

  const cookieTypes = [
    {
      name: 'Essential Cookies',
      icon: <Shield className="w-6 h-6" />,
      description: 'Required for basic platform functionality and security',
      required: true,
      examples: [
        'Authentication and session management',
        'Security and fraud prevention',
        'Basic platform functionality',
        'User preferences and settings'
      ]
    },
    {
      name: 'Analytics Cookies',
      icon: <BarChart className="w-6 h-6" />,
      description: 'Help us understand how users interact with our platform',
      required: false,
      examples: [
        'Page views and user journeys',
        'Feature usage statistics',
        'Performance monitoring',
        'Error tracking and debugging'
      ]
    },
    {
      name: 'Personalization Cookies',
      icon: <Users className="w-6 h-6" />,
      description: 'Customize your learning experience and content recommendations',
      required: false,
      examples: [
        'Learning path recommendations',
        'Customized dashboard layout',
        'Progress tracking preferences',
        'Content difficulty adjustments'
      ]
    }
  ];

  const handlePreferenceChange = (type: string, value: boolean) => {
    if (type === 'essential') return; // Essential cookies cannot be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const savePreferences = () => {
    // In a real implementation, this would save to localStorage or send to server
    console.log('Saving cookie preferences:', cookiePreferences);
    alert('Cookie preferences saved successfully!');
  };

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
              <Cookie className="w-12 h-12 text-blue-400 mr-4" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Cookie Policy
              </h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              Learn about how we use cookies to improve your learning experience and protect your privacy.
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
              <h2 className="text-2xl font-bold text-white mb-4">What Are Cookies?</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us 
                provide you with a better experience by remembering your preferences, keeping you logged in, and 
                helping us understand how you use our platform.
              </p>
              <p className="text-gray-300 leading-relaxed">
                We use different types of cookies for various purposes, and you have control over which ones you 
                allow (except for essential cookies that are required for the platform to function).
              </p>
            </div>
          </motion.div>

          {/* Cookie Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Types of Cookies We Use</h2>
            <div className="space-y-6">
              {cookieTypes.map((type, index) => (
                <motion.div
                  key={type.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-400">
                        {type.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {type.name}
                        </h3>
                        {type.required && (
                          <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full mt-1">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreferenceChange(
                          type.name.toLowerCase().split(' ')[0], 
                          !cookiePreferences[type.name.toLowerCase().split(' ')[0] as keyof typeof cookiePreferences]
                        )}
                        disabled={type.required}
                        className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                          cookiePreferences[type.name.toLowerCase().split(' ')[0] as keyof typeof cookiePreferences]
                            ? 'bg-blue-600' 
                            : 'bg-gray-600'
                        } ${type.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                          cookiePreferences[type.name.toLowerCase().split(' ')[0] as keyof typeof cookiePreferences]
                            ? 'translate-x-6' 
                            : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">
                    {type.description}
                  </p>
                  <div>
                    <h4 className="text-white font-medium mb-2">Examples:</h4>
                    <ul className="space-y-1">
                      {type.examples.map((example, exampleIndex) => (
                        <li key={exampleIndex} className="text-gray-400 text-sm flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Cookie Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">
                  Manage Your Cookie Preferences
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                You can control which cookies we use by adjusting your preferences above. Changes will take effect 
                immediately and will be remembered for future visits.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={savePreferences}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Check className="w-5 h-5" />
                  <span>Save Preferences</span>
                </button>
                <button
                  onClick={() => setCookiePreferences({
                    essential: true,
                    analytics: false,
                    marketing: false,
                    personalization: false
                  })}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                  <span>Reject All Optional</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Browser Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mb-12"
          >
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Browser Cookie Settings</h3>
              <p className="text-gray-300 mb-4">
                You can also manage cookies through your browser settings. Here's how to access cookie settings 
                in popular browsers:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['Chrome', 'Firefox', 'Safari', 'Edge'].map((browser) => (
                  <div key={browser} className="bg-white/5 rounded-lg p-3 text-center">
                    <h4 className="text-white font-medium mb-1">{browser}</h4>
                    <p className="text-gray-400 text-xs">Settings → Privacy → Cookies</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Questions About Cookies?
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                If you have questions about our use of cookies or this policy, please contact us.
              </p>
              <a
                href="https://zedigital.tech/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                <span>Contact Support</span>
              </a>
            </div>
          </motion.div>
        </Suspense>
      </div>
    </div>
  );
}
