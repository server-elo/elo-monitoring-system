'use client';

import { ReactElement, useEffect } from 'react';
import Link from 'next/link';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { useUserStore } from '@/lib/stores/userStore';

export default function AchievementsPage(): ReactElement {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🏆 Achievements</h1>
          <p className="text-xl text-gray-300">Track your progress and unlock rewards</p>
        </div>

        {/* Achievement Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-yellow-400">12</div>
            <div className="text-gray-300">Achievements</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-blue-400">850</div>
            <div className="text-gray-300">XP Points</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-orange-400">7</div>
            <div className="text-gray-300">Day Streak</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="text-3xl mb-2">👑</div>
            <div className="text-2xl font-bold text-purple-400">3</div>
            <div className="text-gray-300">Level</div>
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Unlocked Achievements */}
          <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-800/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/50">
            <div className="text-4xl mb-4">🥇</div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">First Contract</h3>
            <p className="text-gray-300 text-sm mb-3">Deploy your first smart contract</p>
            <div className="text-xs text-yellow-500 font-semibold">UNLOCKED • +100 XP</div>
          </div>

          <div className="bg-gradient-to-r from-green-600/20 to-green-800/20 backdrop-blur-md rounded-xl p-6 border border-green-500/50">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-bold text-green-400 mb-2">Knowledge Seeker</h3>
            <p className="text-gray-300 text-sm mb-3">Complete 10 lessons</p>
            <div className="text-xs text-green-500 font-semibold">UNLOCKED • +150 XP</div>
          </div>

          <div className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/50">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-lg font-bold text-blue-400 mb-2">Code Master</h3>
            <p className="text-gray-300 text-sm mb-3">Write 1000 lines of Solidity</p>
            <div className="text-xs text-blue-500 font-semibold">UNLOCKED • +200 XP</div>
          </div>

          <div className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/50">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-lg font-bold text-purple-400 mb-2">Collaborator</h3>
            <p className="text-gray-300 text-sm mb-3">Join 5 collaboration sessions</p>
            <div className="text-xs text-purple-500 font-semibold">UNLOCKED • +100 XP</div>
          </div>

          {/* Locked Achievements */}
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-600/50 opacity-60">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">DeFi Pioneer</h3>
            <p className="text-gray-500 text-sm mb-3">Create your first DeFi protocol</p>
            <div className="text-xs text-gray-500 font-semibold">LOCKED • +500 XP</div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div className="bg-orange-500 h-1 rounded-full" style={{width: '60%'}}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">3/5 requirements</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-600/50 opacity-60">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-lg font-bold text-gray-400 mb-2">Security Expert</h3>
            <p className="text-gray-500 text-sm mb-3">Find and fix 10 vulnerabilities</p>
            <div className="text-xs text-gray-500 font-semibold">LOCKED • +300 XP</div>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
              <div className="bg-red-500 h-1 rounded-full" style={{width: '20%'}}></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">2/10 vulnerabilities</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Level Progress</h2>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-purple-400">Level 3</div>
            <div className="flex-1">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>850 / 1000 XP</span>
                <span>150 XP to Level 4</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
