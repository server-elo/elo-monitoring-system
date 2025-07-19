'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Star } from 'lucide-react';

export function CompetitiveAnalysisSection() {
  const competitors = [
    {
      name: 'CryptoZombies',
      logo: '🧟',
      strengths: ['Gamification', 'Beginner-friendly', 'Interactive lessons'],
      weaknesses: ['Limited advanced topics', 'No real-time collaboration', 'Outdated UI'],
      rating: 4.2,
    },
    {
      name: 'Alchemy University',
      logo: '🔮',
      strengths: ['Comprehensive curriculum', 'Industry partnerships', 'Career support'],
      weaknesses: ['Expensive', 'Less interactive', 'No AI assistance'],
      rating: 4.5,
    },
    {
      name: 'Buildspace',
      logo: '🚀',
      strengths: ['Project-based', 'Community-driven', 'Modern approach'],
      weaknesses: ['Cohort-based only', 'Limited individual learning', 'No structured path'],
      rating: 4.3,
    },
    {
      name: 'SolLearn',
      logo: '⚡',
      strengths: ['AI-powered tutoring', 'Real-time collaboration', 'Modern UI/UX', 'Free access', 'Comprehensive features'],
      weaknesses: [],
      rating: 5.0,
      isOurs: true,
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              SolLearn?
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how we compare to other popular Solidity learning platforms and discover 
            what makes us the superior choice for your blockchain education.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {competitors.map((competitor, index) => (
            <motion.div
              key={competitor.name}
              className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                competitor.isOurs
                  ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 ring-2 ring-blue-500/20'
                  : 'glass border-white/10 hover:border-white/20'
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              {competitor.isOurs && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Our Platform
                  </div>
                </div>
              )}

              {/* Logo and Name */}
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{competitor.logo}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{competitor.name}</h3>
                <div className="flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(competitor.rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-400 ml-2">{competitor.rating}</span>
                </div>
              </div>

              {/* Strengths */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {competitor.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              {competitor.weaknesses.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Weaknesses</h4>
                  <ul className="space-y-1">
                    {competitor.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {competitor.isOurs && competitor.weaknesses.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-green-400 font-semibold">Perfect Score!</div>
                  <div className="text-sm text-gray-400">No significant weaknesses</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-gray-300 mb-6">
            Ready to experience the most advanced Solidity learning platform?
          </p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Learning for Free
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
