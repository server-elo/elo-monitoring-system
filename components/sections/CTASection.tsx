'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap, Code, Users } from 'lucide-react';

export function CTASection() {
  const features = [
    { icon: Code, text: 'Interactive Code Editor' },
    { icon: Zap, text: 'AI-Powered Learning' },
    { icon: Users, text: 'Real-Time Collaboration' },
    { icon: Sparkles, text: 'Gamified Experience' },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-transparent" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-8"
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium">Start Your Journey Today</span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            className="text-4xl md:text-6xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            Ready to Master
            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Solidity Development?
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Join thousands of developers who have transformed their careers with our 
            comprehensive, AI-powered Solidity learning platform. Start building the future today.
          </motion.p>

          {/* Features List */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.text}
                className="flex items-center gap-2 text-gray-300"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                viewport={{ once: true }}
              >
                <feature.icon className="w-5 h-5 text-blue-400" />
                <span>{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            viewport={{ once: true }}
          >
            {/* Primary CTA */}
            <motion.button
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                <span>Start Learning Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              className="px-8 py-4 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/5 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Demo
            </motion.button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-400 mb-4">Trusted by developers at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-2xl font-bold">ConsenSys</div>
              <div className="text-2xl font-bold">Chainlink</div>
              <div className="text-2xl font-bold">Uniswap</div>
              <div className="text-2xl font-bold">OpenSea</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
}
