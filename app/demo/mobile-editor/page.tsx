'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export default function MobileEditorDemo(): ReactElement {
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
          <h1 className="text-4xl font-bold text-white mb-4">📱 Mobile Code Editor</h1>
          <p className="text-xl text-gray-300">Touch-optimized Solidity development</p>
        </div>

        {/* Editor Demo */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden mb-12">
          <div className="bg-black/30 px-4 py-3 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span className="mr-2">📱</span>
              Mobile Solidity Editor
            </h3>
          </div>
          <div className="p-6">
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
              <div className="text-green-400">// SPDX-License-Identifier: MIT</div>
              <div className="text-blue-400">pragma solidity ^0.8.0;</div>
              <div className="mt-4">
                <div className="text-purple-400">contract</div> <div className="text-yellow-400 inline">MobileToken</div> <div className="text-white inline">{'{'}</div>
              </div>
              <div className="ml-4 mt-2">
                <div className="text-blue-400">mapping</div><div className="text-white inline">(</div><div className="text-blue-400 inline">address</div> <div className="text-white inline">{'=>'}</div> <div className="text-blue-400 inline">uint256</div><div className="text-white inline">) </div><div className="text-blue-300 inline">public</div> <div className="text-white inline">balances;</div>
              </div>
              <div className="ml-4">
                <div className="text-blue-400">string</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">name = "Mobile Token";</div>
              </div>
              <div className="ml-4">
                <div className="text-blue-400">uint256</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">totalSupply = 1000000;</div>
              </div>
              
              <div className="ml-4 mt-4">
                <div className="text-purple-400">function</div> <div className="text-yellow-400 inline">transfer</div><div className="text-white inline">(</div><div className="text-blue-400 inline">address</div> <div className="text-white inline">to,</div> <div className="text-blue-400 inline">uint256</div> <div className="text-white inline">amount)</div> <div className="text-blue-300 inline">public</div> <div className="text-white inline">{'{'}</div>
              </div>
              <div className="ml-8">
                <div className="text-blue-300">require</div><div className="text-white inline">(balances[</div><div className="text-blue-300 inline">msg.sender</div><div className="text-white inline">] {'>='} amount, "Insufficient balance");</div>
              </div>
              <div className="ml-8">
                <div className="text-white">balances[</div><div className="text-blue-300 inline">msg.sender</div><div className="text-white inline">] -= amount;</div>
              </div>
              <div className="ml-8">
                <div className="text-white">balances[to] += amount;</div>
              </div>
              <div className="ml-4">
                <div className="text-white">{'}'}</div>
              </div>
              <div className="text-white">{'}'}</div>
              <div className="mt-4 w-2 h-6 bg-blue-400 animate-pulse"></div>
            </div>

            {/* Touch Controls */}
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Touch Gestures</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Swipe Left</span>
                    <span className="text-green-400">Compile</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Swipe Right</span>
                    <span className="text-blue-400">Save</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Swipe Up</span>
                    <span className="text-yellow-400">Results</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pinch</span>
                    <span className="text-purple-400">Zoom</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-green-600 hover:bg-green-700 text-white p-3 rounded text-sm">
                    ▶️ Compile
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded text-sm">
                    💾 Save
                  </button>
                  <button className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded text-sm">
                    🔍 Analyze
                  </button>
                  <button className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded text-sm">
                    🚀 Deploy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-white mb-4">Touch Optimized</h3>
            <p className="text-gray-300">
              Designed for mobile devices with touch gestures, swipe actions, and finger-friendly controls.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
            <p className="text-gray-300">
              Instant compilation feedback with real-time syntax highlighting and error detection.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-4">Secure by Design</h3>
            <p className="text-gray-300">
              Built-in security analysis and vulnerability detection for safer smart contracts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}