'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Code, Brain, Users, Zap } from 'lucide-react';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation timeline
      const tl = gsap.timeline();
      
      tl.fromTo(titleRef.current, 
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      )
      .fromTo(subtitleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      )
      .fromTo(ctaRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" },
        "-=0.3"
      )
      .fromTo(featuresRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power3.out" },
        "-=0.2"
      );

      // Floating animation for feature cards
      gsap.to(featuresRef.current?.children || [], {
        y: -10,
        duration: 2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized tutoring with advanced AI assistance"
    },
    {
      icon: Code,
      title: "Interactive Coding",
      description: "Real-time compilation and deployment to testnets"
    },
    {
      icon: Users,
      title: "Collaborative Learning",
      description: "Pair programming and peer learning sessions"
    },
    {
      icon: Zap,
      title: "Gamified Progress",
      description: "XP, achievements, and competitive leaderboards"
    }
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
      role="banner"
    >
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"
        aria-hidden="true"
        role="img"
        aria-label="Decorative grid pattern background"
      />

      {/* Animated Background Elements */}
      <div className="absolute inset-0" aria-hidden="true">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <motion.h1
            id="hero-heading"
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0 }}
          >
            <span className="gradient-text">Master Solidity</span>
            <br />
            <span className="text-white">Build the Future</span>
          </motion.h1>

          <motion.p
            ref={subtitleRef}
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            role="text"
          >
            The most comprehensive Solidity learning platform with AI-powered tutoring,
            real-time collaboration, and hands-on blockchain development.
            Join thousands of developers building the decentralized future.
          </motion.p>

          <motion.div
            ref={ctaRef}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0 }}
            role="group"
            aria-label="Primary actions"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg min-h-[44px]"
              asChild
            >
              <Link
                href="/learn"
                aria-label="Start learning Solidity for free - Begin your blockchain development journey"
              >
                Start Learning Free
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg min-h-[44px]"
              asChild
            >
              <Link
                href="/demo"
                aria-label="Watch platform demo - See SolanaLearn features in action"
              >
                <Play className="mr-2 w-5 h-5" aria-hidden="true" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <section
          ref={featuresRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          aria-label="Platform features overview"
          role="region"
        >
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              className="glass p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 relative"
              whileHover={{ scale: 1.05, y: -5 }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  delay: index * 0.2, // Use index for staggered animation
                  duration: 0.6
                }
              }}
              role="article"
              aria-labelledby={`feature-${index}-title`}
              aria-describedby={`feature-${index}-description`}
            >
              {/* Feature priority badge using index */}
              <div
                className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg"
                aria-label={`Feature ${index + 1} of ${features.length}`}
                role="img"
              >
                {index + 1}
              </div>

              <div
                className={`w-12 h-12 bg-gradient-to-br ${
                  index % 4 === 0 ? 'from-blue-500 to-purple-600' :
                  index % 4 === 1 ? 'from-purple-500 to-pink-600' :
                  index % 4 === 2 ? 'from-green-500 to-blue-600' :
                  'from-orange-500 to-red-600'
                } rounded-lg flex items-center justify-center mb-4 mx-auto relative overflow-hidden`}
                role="img"
                aria-label={`${feature.title} icon`}
              >
                <feature.icon className="w-6 h-6 text-white relative z-10" aria-hidden="true" />
                {/* Highlight top features */}
                {index < 2 && (
                  <div
                    className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                    aria-label="Priority feature indicator"
                    role="img"
                  />
                )}
              </div>

              <h3
                id={`feature-${index}-title`}
                className="text-lg font-semibold text-white mb-2"
              >
                {feature.title}
                {/* Priority indicator for first two features */}
                {index < 2 && (
                  <span
                    className="ml-2 text-xs bg-yellow-400/20 text-yellow-400 px-2 py-1 rounded-full"
                    aria-label="Priority feature"
                  >
                    Priority
                  </span>
                )}
              </h3>
              <p
                id={`feature-${index}-description`}
                className="text-gray-400 text-sm"
              >
                {feature.description}
              </p>

              {/* Progress indicator based on index */}
              <div
                className="mt-3 flex items-center justify-center space-x-1"
                role="progressbar"
                aria-label={`Feature ${index + 1} of ${features.length}`}
                aria-valuenow={index + 1}
                aria-valuemin={1}
                aria-valuemax={features.length}
              >
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-1 rounded-full transition-all duration-300 ${
                      i <= index ? 'bg-blue-400' : 'bg-gray-600'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </motion.article>
          ))}
        </section>

        {/* Stats */}
        <motion.div
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {[
            { label: "Active Learners", value: "10,000+" },
            { label: "Courses", value: "50+" },
            { label: "Projects Built", value: "25,000+" },
            { label: "Success Rate", value: "94%" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
        </div>
      </motion.div>
    </section>
  );
}
