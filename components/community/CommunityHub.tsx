'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BarChart3, Users, Activity, Star, Target, Award } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import { Leaderboards } from './Leaderboards';
import { CommunityStats } from './CommunityStats';
import { realTimeManager } from '@/lib/community/websocket';
import { useAuth } from '@/lib/hooks/useAuth';

interface CommunityHubProps {
  className?: string;
}

interface QuickStatsProps {
  loading: boolean;
}

function QuickStats({ loading }: QuickStatsProps) {
  const [stats, setStats] = useState({
    activeUsers: 0,
    onlineNow: 0,
    lessonsToday: 0,
    xpEarned: 0
  });

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      setStats(() => ({
        activeUsers: 1247 + Math.floor(Math.random() * 20) - 10,
        onlineNow: 89 + Math.floor(Math.random() * 10) - 5,
        lessonsToday: 156 + Math.floor(Math.random() * 5) - 2,
        xpEarned: 12450 + Math.floor(Math.random() * 100) - 50
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const quickStats = [
    {
      label: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      color: 'blue',
      change: '+2.3%'
    },
    {
      label: 'Online Now',
      value: stats.onlineNow.toString(),
      icon: Activity,
      color: 'green',
      change: '+5.1%'
    },
    {
      label: 'Lessons Today',
      value: stats.lessonsToday.toString(),
      icon: Target,
      color: 'purple',
      change: '+8.7%'
    },
    {
      label: 'XP Earned',
      value: stats.xpEarned.toLocaleString(),
      icon: Star,
      color: 'yellow',
      change: '+12.4%'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {quickStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
                {loading ? (
                  <div className="w-16 h-6 bg-gray-600 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-lg font-bold text-white mt-1">{stat.value}</p>
                )}
                <p className="text-green-400 text-xs mt-1">{stat.change}</p>
              </div>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-${stat.color}-500/20`)}>
                <stat.icon className={cn('w-4 h-4', `text-${stat.color}-400`)} />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionType: 'websocket' | 'polling';
  latency: number;
}

function ConnectionStatus({ isConnected, connectionType, latency }: ConnectionStatusProps) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={cn(
        'w-2 h-2 rounded-full',
        isConnected ? 'bg-green-400' : 'bg-red-400'
      )} />
      <span className="text-gray-400">
        {isConnected ? 'Connected' : 'Disconnected'} via {connectionType}
        {isConnected && latency > 0 && ` (${latency}ms)`}
      </span>
    </div>
  );
}

export function CommunityHub({ className }: CommunityHubProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboards' | 'statistics'>('overview');
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    connectionType: 'polling' as 'websocket' | 'polling',
    latency: 0
  });
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Monitor real-time connection status
    const updateConnectionStatus = () => {
      setConnectionStatus({
        isConnected: realTimeManager.isConnected(),
        connectionType: realTimeManager.getConnectionType(),
        latency: realTimeManager.getLatency()
      });
    };

    // Initial status
    updateConnectionStatus();

    // Update every 5 seconds
    const interval = setInterval(updateConnectionStatus, 5000);

    // Subscribe to connection changes
    const unsubscribe = realTimeManager.subscribe('connection', () => {
      updateConnectionStatus();
      setLastUpdate(new Date());
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
      description: 'Community highlights and quick stats'
    },
    {
      id: 'leaderboards',
      label: 'Leaderboards',
      icon: Trophy,
      description: 'Rankings and competitions'
    },
    {
      id: 'statistics',
      label: 'Statistics',
      icon: BarChart3,
      description: 'Detailed analytics and insights'
    }
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Hub</h1>
          <p className="text-gray-400 mt-1">
            Connect, compete, and grow with the Solidity learning community
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ConnectionStatus {...connectionStatus} />
          <div className="text-sm text-gray-400">
            Updated: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats loading={false} />

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center space-x-2 px-4 py-3 rounded-md text-sm font-medium transition-colors flex-1',
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              <div className="text-left">
                <div>{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Welcome Message */}
            {user && (
              <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border-white/20 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Welcome back, {user.name}!</h2>
                    <p className="text-gray-300">Ready to continue your Solidity journey?</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Community Highlights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                  Top Performers This Week
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Alice Johnson', xp: 2340, rank: 1 },
                    { name: 'Bob Smith', xp: 1980, rank: 2 },
                    { name: 'Carol Davis', xp: 1750, rank: 3 }
                  ].map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                          'bg-amber-600 text-white'
                        )}>
                          {performer.rank}
                        </div>
                        <span className="text-white">{performer.name}</span>
                      </div>
                      <span className="text-blue-400 font-medium">{performer.xp} XP</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setActiveTab('leaderboards')}
                  variant="outline"
                  className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                >
                  View Full Leaderboard
                </Button>
              </Card>

              {/* Recent Achievements */}
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-purple-400" />
                  Recent Achievements
                </h3>
                <div className="space-y-3">
                  {[
                    { title: 'Smart Contract Expert', user: 'Alice J.', time: '2 hours ago', icon: '📜' },
                    { title: 'Streak Master', user: 'Bob S.', time: '4 hours ago', icon: '🔥' },
                    { title: 'Community Helper', user: 'Carol D.', time: '6 hours ago', icon: '🤝' }
                  ].map((achievement) => (
                    <div key={achievement.title} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-sm">{achievement.icon}</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{achievement.title}</div>
                        <div className="text-xs text-gray-400">{achievement.user} • {achievement.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setActiveTab('statistics')}
                  variant="outline"
                  className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
                >
                  View All Statistics
                </Button>
              </Card>
            </div>

            {/* Activity Feed */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                Live Activity Feed
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[
                  { action: 'completed lesson', user: 'Alice Johnson', target: 'Smart Contract Basics', time: '2 min ago', icon: '📚' },
                  { action: 'earned achievement', user: 'Bob Smith', target: 'Gas Optimizer', time: '5 min ago', icon: '🏆' },
                  { action: 'started course', user: 'Carol Davis', target: 'Advanced Solidity', time: '8 min ago', icon: '🚀' },
                  { action: 'joined study group', user: 'David Wilson', target: 'DeFi Developers', time: '12 min ago', icon: '👥' },
                  { action: 'deployed contract', user: 'Eva Brown', target: 'Token Contract', time: '15 min ago', icon: '📜' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center">
                      <span className="text-xs">{activity.icon}</span>
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="text-white font-medium">{activity.user}</span>
                      <span className="text-gray-400"> {activity.action} </span>
                      <span className="text-blue-400">{activity.target}</span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'leaderboards' && (
          <motion.div
            key="leaderboards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Leaderboards />
          </motion.div>
        )}

        {activeTab === 'statistics' && (
          <motion.div
            key="statistics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <CommunityStats />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
