'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TestimonialsSection() {
  // Check if we're in static export mode for GitHub Pages
  const isStaticExport = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';
  const basePath = isStaticExport ? '/learning_sol' : '';

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Smart Contract Developer at ConsenSys',
      avatar: `${basePath}/avatars/alex.jpg`,
      rating: 5,
      content: 'SolLearn transformed my understanding of Solidity. The AI-powered tutoring helped me identify and fix security vulnerabilities I never knew existed. Now I\'m confidently building DeFi protocols.',
      highlight: 'AI-powered tutoring',
    },
    {
      name: 'Sarah Johnson',
      role: 'Blockchain Engineer at Chainlink',
      avatar: `${basePath}/avatars/sarah.jpg`,
      rating: 5,
      content: 'The real-time collaboration feature is incredible. I learned more in 3 months with SolLearn than in a year of self-study. The gamification kept me motivated throughout my journey.',
      highlight: 'Real-time collaboration',
    },
    {
      name: 'Marcus Rodriguez',
      role: 'DeFi Protocol Founder',
      avatar: `${basePath}/avatars/marcus.jpg`,
      rating: 5,
      content: 'From zero to launching my own DeFi protocol in 6 months. SolLearn\'s project-based approach and testnet integration made the learning curve much smoother. Highly recommended!',
      highlight: 'Project-based learning',
    },
    {
      name: 'Emily Zhang',
      role: 'Solidity Instructor at Web3 University',
      avatar: `${basePath}/avatars/emily.jpg`,
      rating: 5,
      content: 'As an educator, I\'m impressed by SolLearn\'s curriculum structure. The progressive difficulty and hands-on exercises create an optimal learning environment for blockchain development.',
      highlight: 'Curriculum structure',
    },
    {
      name: 'David Kim',
      role: 'Senior Developer at Uniswap',
      avatar: `${basePath}/avatars/david.jpg`,
      rating: 5,
      content: 'The security focus in SolLearn is unmatched. Every lesson includes best practices and vulnerability prevention. It\'s like having a security audit expert as your personal tutor.',
      highlight: 'Security focus',
    },
    {
      name: 'Lisa Thompson',
      role: 'Blockchain Consultant',
      avatar: `${basePath}/avatars/lisa.jpg`,
      rating: 5,
      content: 'SolLearn\'s modern UI and smooth animations make learning enjoyable. The glassmorphism design and interactive elements create an immersive experience that keeps you engaged.',
      highlight: 'Modern UI/UX',
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Students Taught' },
    { number: '95%', label: 'Success Rate' },
    { number: '4.9/5', label: 'Average Rating' },
    { number: '500+', label: 'Projects Built' },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      
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
            Loved by
            <span className="block bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Developers Worldwide
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of developers who have transformed their careers with SolLearn. 
            Here's what they have to say about their learning experience.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <motion.div
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="glass p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-6 h-6 text-blue-400/30" />

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Highlight */}
              <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full mb-4">
                {testimonial.highlight}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <p className="text-lg text-gray-300 mb-6">
            Ready to join our community of successful developers?
          </p>
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Success Story
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
