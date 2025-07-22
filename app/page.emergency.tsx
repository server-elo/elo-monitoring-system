
"use client";

import React, { useState, useEffect } from 'react';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
    
    // Track uptime
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-6 text-blue-400">
          🚀 Solidity Learning Platform
        </h1>
        
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-6 max-w-md mx-auto mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-green-400 font-semibold">DEPLOYMENT STABLE</span>
          </div>
          <p className="text-green-300 text-sm">
            Uptime: {Math.floor(uptime / 60)}m {uptime % 60}s
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-blue-400 text-2xl mb-3">📚</div>
            <h3 className="text-lg font-semibold mb-2">Learn Solidity</h3>
            <p className="text-gray-400 text-sm">
              Interactive tutorials and examples for blockchain development
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-green-400 text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Gas Optimization</h3>
            <p className="text-gray-400 text-sm">
              Advanced tools for optimizing smart contract performance
            </p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-purple-400 text-2xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-400 text-sm">
              Smart code analysis and suggestions powered by AI
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
