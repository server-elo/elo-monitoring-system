'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export default function CertificatesPage(): ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-white">SolanaLearn</Link>
            <Link href="/" className="text-gray-300 hover:text-white">← Back to Home</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">📜 Certificates</h1>
          <p className="text-xl text-gray-300">Blockchain-verified credentials for your skills</p>
        </div>

        {/* Certificate Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">🏅</div>
            <div className="text-2xl font-bold text-green-400">3</div>
            <div className="text-gray-300">Earned</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">⏳</div>
            <div className="text-2xl font-bold text-yellow-400">2</div>
            <div className="text-gray-300">In Progress</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">🔒</div>
            <div className="text-2xl font-bold text-purple-400">5</div>
            <div className="text-gray-300">Locked</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-blue-400">100%</div>
            <div className="text-gray-300">Verified</div>
          </div>
        </div>

        {/* Earned Certificates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🏅 Earned Certificates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-md rounded-xl border border-green-500/50 overflow-hidden">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
                <div className="text-3xl mb-2">🎖️</div>
                <div className="text-lg font-bold mb-1">Certificate of Achievement</div>
                <div className="text-sm opacity-90">Solidity Fundamentals</div>
                <div className="text-xs mt-2 opacity-75">Blockchain Verified #SF2025-001</div>
              </div>
              <div className="p-4">
                <div className="text-green-400 text-sm mb-2">✅ Earned December 15, 2024</div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm">
                    View on Chain
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-2 rounded-lg text-sm">
                    Download
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-md rounded-xl border border-blue-500/50 overflow-hidden">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 text-center text-white">
                <div className="text-3xl mb-2">🥇</div>
                <div className="text-lg font-bold mb-1">Excellence Certificate</div>
                <div className="text-sm opacity-90">Smart Contract Security</div>
                <div className="text-xs mt-2 opacity-75">NFT Certificate #SCS2025-007</div>
              </div>
              <div className="p-4">
                <div className="text-blue-400 text-sm mb-2">✅ Earned January 8, 2025</div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm">
                    View NFT
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-2 rounded-lg text-sm">
                    Share
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-md rounded-xl border border-purple-500/50 overflow-hidden">
              <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-8 text-center text-white">
                <div className="text-3xl mb-2">💎</div>
                <div className="text-lg font-bold mb-1">Master Certificate</div>
                <div className="text-sm opacity-90">Gas Optimization</div>
                <div className="text-xs mt-2 opacity-75">SBT Token #GO2025-023</div>
              </div>
              <div className="p-4">
                <div className="text-purple-400 text-sm mb-2">✅ Earned January 20, 2025</div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm">
                    View SBT
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-2 rounded-lg text-sm">
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">⏳ In Progress</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">DeFi Protocols</h3>
                  <p className="text-gray-400">Advanced Certificate</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>7/10 modules</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{width: '70%'}}></div>
                </div>
              </div>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold">
                Continue Learning
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🌐</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cross-Chain Development</h3>
                  <p className="text-gray-400">Expert Certificate</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progress</span>
                  <span>3/8 modules</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-cyan-500 h-2 rounded-full" style={{width: '38%'}}></div>
                </div>
              </div>
              <button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-lg font-semibold">
                Continue Learning
              </button>
            </div>
          </div>
        </div>

        {/* Available Certificates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">🔒 Available Certificates</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-600/50 opacity-75">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🛡️</div>
                <h3 className="text-lg font-bold text-gray-400">Security Auditing</h3>
                <p className="text-gray-500 text-sm">Professional Certificate</p>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Requirements: Complete Security Fundamentals + 2 Audit Projects
              </div>
              <button className="w-full bg-gray-700 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                Locked
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-600/50 opacity-75">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-lg font-bold text-gray-400">Layer 2 Solutions</h3>
                <p className="text-gray-500 text-sm">Expert Certificate</p>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Requirements: Complete DeFi Protocols + Layer 2 Course
              </div>
              <button className="w-full bg-gray-700 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                Locked
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-600/50 opacity-75">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">👑</div>
                <h3 className="text-lg font-bold text-gray-400">Blockchain Architect</h3>
                <p className="text-gray-500 text-sm">Master Certificate</p>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Requirements: Earn 5 certificates + Capstone Project
              </div>
              <button className="w-full bg-gray-700 text-gray-400 px-4 py-3 rounded-lg font-semibold cursor-not-allowed">
                Locked
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
