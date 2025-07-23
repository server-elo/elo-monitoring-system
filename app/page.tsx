'use client';

import { ReactElement, useEffect } from 'react';
import Link from 'next/link';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { useCourseStore } from '@/lib/stores/courseStore';

export default function HomePage(): ReactElement {
  const { loadCourses } = useCourseStore();

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Master <span className="text-blue-400">Solidity</span> Development
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Learn blockchain development with interactive lessons, AI-powered tutoring, and real-world projects. 
            Build the future of decentralized applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/learn" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              🚀 Start Learning
            </Link>
            <Link href="/code" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
              💻 Try Code Lab
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-4">AI-Powered Learning</h3>
            <p className="text-gray-300">
              Get personalized help from our AI tutor. Debug code, understand concepts, and accelerate your learning.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-4">Mobile Optimized</h3>
            <p className="text-gray-300">
              Learn anywhere with our mobile-first design. Code on your phone, tablet, or desktop seamlessly.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-4">Real-time Collaboration</h3>
            <p className="text-gray-300">
              Work together with other developers in real-time. Share code, debug together, and learn faster.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Join Thousands of Developers</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-400 mb-2">10,000+</div>
            <div className="text-gray-300">Students</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-green-400 mb-2">500+</div>
            <div className="text-gray-300">Lessons</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-purple-400 mb-2">50+</div>
            <div className="text-gray-300">Projects</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-yellow-400 mb-2">24/7</div>
            <div className="text-gray-300">AI Support</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 SolanaLearn. Master the Future of Blockchain Development.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}