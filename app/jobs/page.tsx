'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export default function JobsPage(): ReactElement {
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
          <h1 className="text-4xl font-bold text-white mb-4">💼 Blockchain Jobs</h1>
          <p className="text-xl text-gray-300">Find your next opportunity in Web3</p>
        </div>

        {/* Job Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
            All Jobs
          </button>
          <button className="bg-white/10 text-gray-300 hover:bg-white/20 px-4 py-2 rounded-lg">
            Remote
          </button>
          <button className="bg-white/10 text-gray-300 hover:bg-white/20 px-4 py-2 rounded-lg">
            Full-time
          </button>
          <button className="bg-white/10 text-gray-300 hover:bg-white/20 px-4 py-2 rounded-lg">
            Senior Level
          </button>
          <button className="bg-white/10 text-gray-300 hover:bg-white/20 px-4 py-2 rounded-lg">
            $150k+
          </button>
        </div>

        {/* Job Listings */}
        <div className="space-y-6">
          {/* Featured Job */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/50">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🔥</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Lead Solidity Developer</h3>
                  <p className="text-yellow-300">Ethereum Foundation • Remote • $180k-$250k</p>
                </div>
              </div>
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                FEATURED
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Join the core Ethereum development team to build next-generation blockchain infrastructure. 
              Lead smart contract architecture and mentor junior developers.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-yellow-600/30 text-yellow-200 px-3 py-1 rounded-full text-sm">Solidity</span>
              <span className="bg-blue-600/30 text-blue-200 px-3 py-1 rounded-full text-sm">Ethereum</span>
              <span className="bg-purple-600/30 text-purple-200 px-3 py-1 rounded-full text-sm">Leadership</span>
              <span className="bg-green-600/30 text-green-200 px-3 py-1 rounded-full text-sm">Remote</span>
            </div>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-semibold">
              Apply Now
            </button>
          </div>

          {/* Regular Jobs */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Senior Smart Contract Developer</h3>
                  <p className="text-gray-300">Uniswap Labs • New York, NY • $150k-$200k</p>
                </div>
              </div>
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                New
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Build and optimize smart contracts for the leading DEX protocol. Experience with AMM algorithms and gas optimization required.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-600/30 text-blue-200 px-3 py-1 rounded-full text-sm">Solidity</span>
              <span className="bg-purple-600/30 text-purple-200 px-3 py-1 rounded-full text-sm">DeFi</span>
              <span className="bg-orange-600/30 text-orange-200 px-3 py-1 rounded-full text-sm">Gas Optimization</span>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold">
              Apply Now
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛡️</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Smart Contract Auditor</h3>
                  <p className="text-gray-300">OpenZeppelin • Remote • $120k-$180k</p>
                </div>
              </div>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm">
                Hot
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Conduct security audits of smart contracts and identify vulnerabilities. Strong background in cryptography and security preferred.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-red-600/30 text-red-200 px-3 py-1 rounded-full text-sm">Security</span>
              <span className="bg-blue-600/30 text-blue-200 px-3 py-1 rounded-full text-sm">Auditing</span>
              <span className="bg-green-600/30 text-green-200 px-3 py-1 rounded-full text-sm">Remote</span>
            </div>
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
              Apply Now
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Blockchain Developer</h3>
                  <p className="text-gray-300">Chainlink • San Francisco, CA • $140k-$190k</p>
                </div>
              </div>
              <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                Urgent
              </span>
            </div>
            <p className="text-gray-300 mb-4">
              Develop oracle networks and cross-chain infrastructure. Experience with multiple blockchain protocols required.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-purple-600/30 text-purple-200 px-3 py-1 rounded-full text-sm">Oracles</span>
              <span className="bg-blue-600/30 text-blue-200 px-3 py-1 rounded-full text-sm">Cross-chain</span>
              <span className="bg-yellow-600/30 text-yellow-200 px-3 py-1 rounded-full text-sm">Infrastructure</span>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
              Apply Now
            </button>
          </div>
        </div>

        {/* Job Stats */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Market Insights</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">247</div>
              <div className="text-gray-300">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">$165k</div>
              <div className="text-gray-300">Avg Salary</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">73%</div>
              <div className="text-gray-300">Remote Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">+28%</div>
              <div className="text-gray-300">Job Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
