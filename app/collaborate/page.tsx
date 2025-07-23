'use client';

import { ReactElement, useState } from 'react';
import Link from 'next/link';
import { AuthenticatedNavbar } from '@/components/navigation/AuthenticatedNavbar';
import { Users, GitBranch, MessageCircle, Plus } from 'lucide-react';

export default function CollaboratePage(): ReactElement {
  const handleJoinProject = (projectName: string) => {
    alert(`Joining project: ${projectName}. Check your notifications for team invite!`);
  };

  const handleCreateProject = () => {
    alert('Create Project modal would open here. Feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <AuthenticatedNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">🤝 Collaborate</h1>
          <p className="text-xl text-gray-300">Work together on blockchain projects</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">🚀 Active Projects</h3>
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded p-3">
                <div className="font-semibold text-white">DEX Protocol</div>
                <div className="text-sm text-gray-300">Building a decentralized exchange</div>
                <div className="text-xs text-blue-400 mt-1">3 collaborators</div>
              </div>
              <div className="bg-gray-800/50 rounded p-3">
                <div className="font-semibold text-white">NFT Marketplace</div>
                <div className="text-sm text-gray-300">Creating an art trading platform</div>
                <div className="text-xs text-green-400 mt-1">5 collaborators</div>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">💻 Live Coding Sessions</h3>
            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded p-3">
                <div className="font-semibold text-white">Smart Contract Security</div>
                <div className="text-sm text-gray-300">Live now - Join the session</div>
                <div className="text-xs text-red-400 mt-1">🔴 Live - 12 viewers</div>
              </div>
              <div className="bg-gray-800/50 rounded p-3">
                <div className="font-semibold text-white">DeFi Workshop</div>
                <div className="text-sm text-gray-300">Starting in 30 minutes</div>
                <div className="text-xs text-yellow-400 mt-1">⏰ Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}