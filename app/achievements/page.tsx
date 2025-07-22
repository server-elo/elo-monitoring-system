import React, { ReactElement } from "react";
export default function AchievementsPage(): void {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-white mb-6">Achievements</h1>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <p className="text-gray-300 mb-4">
          Track your progress and unlock achievements as you master Solidity
          development.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  First Contract
                </h3>
                <p className="text-sm text-gray-400">
                  Deploy your first smart contract
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  DeFi Master
                </h3>
                <p className="text-sm text-gray-400">
                  Complete all DeFi tutorials
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Security Expert
                </h3>
                <p className="text-sm text-gray-400">
                  Pass all security challenges
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
