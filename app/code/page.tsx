'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export default function CodeLabPage(): ReactElement {
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
          <h1 className="text-4xl font-bold text-white mb-4">💻 Code Lab</h1>
          <p className="text-xl text-gray-300">Practice Solidity in our interactive coding environment</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Code Editor */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="bg-black/30 px-4 py-3 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Solidity Editor</h3>
            </div>
            <div className="p-4">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400">// SPDX-License-Identifier: MIT</div>
                <div className="text-blue-400">pragma solidity ^0.8.0;</div>
                <div className="mt-4">
                  <div className="text-purple-400">contract</div> <div className="text-yellow-400 inline">MyToken</div> <div className="text-white inline">{'{'}</div>
                </div>
                <div className="ml-4 mt-2">
                  <div className="text-blue-400">string</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">name = "My Token";</div>
                </div>
                <div className="ml-4">
                  <div className="text-blue-400">uint256</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">totalSupply = 1000000;</div>
                </div>
                <div className="ml-4 mt-4">
                  <div className="text-purple-400">function</div> <div className="text-yellow-400 inline">transfer</div><div className="text-white inline">(</div><div className="text-blue-400 inline">address</div> <div className="text-white inline">to,</div> <div className="text-blue-400 inline">uint256</div> <div className="text-white inline">amount)</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">{'{'}</div>
                </div>
                <div className="ml-8">
                  <div className="text-gray-500">// Transfer logic here</div>
                </div>
                <div className="ml-4">
                  <div className="text-white">{'}'}</div>
                </div>
                <div className="text-white">{'}'}</div>
                <div className="mt-4 w-2 h-6 bg-blue-400 animate-pulse"></div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold">
                  ▶️ Compile
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
                  🚀 Deploy
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold">
                  🤖 AI Help
                </button>
              </div>
            </div>
          </div>

          {/* Output & Tools */}
          <div className="space-y-6">
            {/* Compilation Results */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Compilation Results</h3>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-2 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>✅ Compilation successful</span>
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  <div>Gas estimate: 245,891</div>
                  <div>Contract size: 1.2 KB</div>
                  <div>Optimization: enabled</div>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">🤖 AI Assistant</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  <div className="bg-blue-900/50 rounded-lg p-3">
                    <div className="text-blue-400 text-sm font-semibold mb-1">AI Suggestion</div>
                    <div className="text-white text-sm">Consider adding access control to your transfer function using OpenZeppelin's Ownable pattern.</div>
                  </div>
                  <div className="bg-yellow-900/50 rounded-lg p-3">
                    <div className="text-yellow-400 text-sm font-semibold mb-1">Gas Optimization</div>
                    <div className="text-white text-sm">You can reduce gas costs by 15% by using uint128 instead of uint256 for smaller values.</div>
                  </div>
                </div>
                <div className="mt-4">
                  <input 
                    type="text" 
                    placeholder="Ask AI anything about your code..."
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Templates */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="bg-black/30 px-4 py-3 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Quick Templates</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    ERC-20 Token
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    ERC-721 NFT
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    DAO Contract
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded text-sm">
                    Multisig Wallet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}