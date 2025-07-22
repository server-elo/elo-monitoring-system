'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export default function LearnPage(): ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-white">SolanaLearn</Link>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-300 hover:text-white">← Back to Home</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📚 Learning Center</h1>
          <p className="text-xl text-gray-300">Master Solidity with our structured learning path</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Beginner Course */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🌱</div>
            <h3 className="text-xl font-bold text-white mb-4">Solidity Basics</h3>
            <p className="text-gray-300 mb-4">Learn the fundamentals of Solidity programming</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>• Variables and Data Types</li>
              <li>• Functions and Modifiers</li>
              <li>• Smart Contract Structure</li>
              <li>• Basic Deployment</li>
            </ul>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
              Start Course
            </button>
          </div>

          {/* Intermediate Course */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-4">Advanced Patterns</h3>
            <p className="text-gray-300 mb-4">Learn advanced Solidity development patterns</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>• Inheritance and Interfaces</li>
              <li>• Design Patterns</li>
              <li>• Gas Optimization</li>
              <li>• Error Handling</li>
            </ul>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold">
              Start Course
            </button>
          </div>

          {/* Expert Course */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-4">DeFi Protocols</h3>
            <p className="text-gray-300 mb-4">Build complex DeFi applications</p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6">
              <li>• DEX Implementation</li>
              <li>• Lending Protocols</li>
              <li>• Yield Farming</li>
              <li>• Cross-chain Bridges</li>
            </ul>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold">
              Start Course
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Your Learning Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Solidity Basics</span>
                <span>75% Complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Advanced Patterns</span>
                <span>30% Complete</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{width: '30%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>DeFi Protocols</span>
                <span>Not Started</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}