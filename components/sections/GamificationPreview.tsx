'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Zap,
  Crown,
  Flame,
  TrendingUp,
  Award,
  Users,
  ChevronRight
} from 'lucide-react';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp: number;
  unlocked: boolean;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  level: number;
  xp: number;
  avatar: string;
  streak: number;
}

export function GamificationPreview() {
  const [currentLevel, setCurrentLevel] = useState(5);
  const [currentXP, setCurrentXP] = useState(2750);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  const xpToNextLevel = 3000;
  const levelProgress = (currentXP / xpToNextLevel) * 100;

  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first Solidity lesson',
      icon: <Star className="w-6 h-6" />,
      rarity: 'common',
      xp: 100,
      unlocked: true
    },
    {
      id: '2',
      title: 'Smart Contract Master',
      description: 'Deploy 10 smart contracts',
      icon: <Trophy className="w-6 h-6" />,
      rarity: 'rare',
      xp: 500,
      unlocked: true
    },
    {
      id: '3',
      title: 'Security Expert',
      description: 'Complete all security challenges',
      icon: <Award className="w-6 h-6" />,
      rarity: 'epic',
      xp: 1000,
      unlocked: false
    },
    {
      id: '4',
      title: 'DeFi Pioneer',
      description: 'Build a complete DeFi protocol',
      icon: <Crown className="w-6 h-6" />,
      rarity: 'legendary',
      xp: 2500,
      unlocked: false
    }
  ];

  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'Alex Chen', level: 12, xp: 15420, avatar: '👨‍💻', streak: 45 },
    { rank: 2, name: 'Sarah Kim', level: 11, xp: 14890, avatar: '👩‍💻', streak: 32 },
    { rank: 3, name: 'You', level: currentLevel, xp: currentXP, avatar: '🚀', streak: 7 },
    { rank: 4, name: 'Mike Johnson', level: 8, xp: 12340, avatar: '👨‍🔬', streak: 12 },
    { rank: 5, name: 'Emma Davis', level: 7, xp: 11980, avatar: '👩‍🎓', streak: 8 }
  ];

  const rarityColors = {
    common: 'from-gray-400 to-gray-600 border-gray-400',
    rare: 'from-blue-400 to-blue-600 border-blue-400',
    epic: 'from-purple-400 to-purple-600 border-purple-400',
    legendary: 'from-yellow-400 to-orange-500 border-yellow-400'
  };

  // Demo interactions
  const handleEarnXP = () => {
    const newXP = currentXP + 250;
    setCurrentXP(newXP);
    
    if (newXP >= xpToNextLevel) {
      setCurrentLevel(prev => prev + 1);
      setCurrentXP(newXP - xpToNextLevel);
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }
  };

  const handleUnlockAchievement = () => {
    const lockedAchievements = achievements.filter(a => !a.unlocked);
    if (lockedAchievements.length > 0) {
      const achievement = lockedAchievements[0];
      setUnlockedAchievement(achievement);
      setTimeout(() => setUnlockedAchievement(null), 4000);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
            Level Up Your Learning
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience our comprehensive gamification system that makes learning Solidity 
            engaging, rewarding, and fun. Earn XP, unlock achievements, and compete with peers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress & Level */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-white mb-2">
                  {currentLevel}
                </div>
                <div className="text-gray-300">Current Level</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress to Level {currentLevel + 1}</span>
                  <span className="text-white">{currentXP}/{xpToNextLevel} XP</span>
                </div>
                <Progress value={levelProgress} className="h-3" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">{currentXP.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Total XP</div>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-400 mx-auto mb-1" />
                  <div className="text-lg font-bold text-white">7</div>
                  <div className="text-xs text-gray-400">Day Streak</div>
                </div>
              </div>

              {/* Demo Buttons */}
              <div className="space-y-3 mt-6">
                <Button 
                  onClick={handleEarnXP}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Complete Challenge (+250 XP)
                </Button>
                <Button 
                  onClick={handleUnlockAchievement}
                  variant="outline"
                  className="w-full border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Unlock Achievement
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold text-white">Achievements</h3>
              </div>

              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${
                      achievement.unlocked 
                        ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} opacity-100` 
                        : 'bg-gray-500/20 border-gray-500/30 opacity-60'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        achievement.unlocked ? 'text-white' : 'text-gray-500'
                      }`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${
                          achievement.unlocked ? 'text-white' : 'text-gray-500'
                        }`}>
                          {achievement.title}
                        </div>
                        <div className={`text-sm ${
                          achievement.unlocked ? 'text-gray-200' : 'text-gray-600'
                        }`}>
                          {achievement.description}
                        </div>
                      </div>
                      <div className="text-yellow-400 font-bold text-sm">
                        +{achievement.xp}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <GlassCard className="p-6 h-full">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="w-6 h-6 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Leaderboard</h3>
              </div>

              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <motion.div
                    key={entry.rank}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                      entry.name === 'You' 
                        ? 'bg-blue-500/20 border border-blue-500/30' 
                        : 'bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      entry.rank <= 3 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {entry.rank <= 3 ? <Crown className="w-4 h-4" /> : entry.rank}
                    </div>
                    
                    <div className="text-2xl">{entry.avatar}</div>
                    
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        entry.name === 'You' ? 'text-blue-300' : 'text-white'
                      }`}>
                        {entry.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        Level {entry.level}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-yellow-400 font-semibold">
                        {entry.xp.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center">
                        <Flame className="w-3 h-3 mr-1" />
                        {entry.streak}d
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Button asChild className="w-full mt-6" variant="outline">
                <Link href="/leaderboard">
                  View Full Leaderboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </GlassCard>
          </motion.div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
            <Link href="/learn">
              <TrendingUp className="w-5 h-5 mr-2" />
              Start Your Journey
            </Link>
          </Button>
        </motion.div>
      </div>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-8 text-center border-2 border-yellow-400"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 mx-auto mb-4"
              >
                <Star className="w-full h-full text-yellow-400" />
              </motion.div>
              <div className="text-3xl font-bold text-white mb-2">LEVEL UP!</div>
              <div className="text-xl text-yellow-200">Level {currentLevel}</div>
              <div className="text-sm text-blue-200 mt-2">You're getting stronger!</div>
            </motion.div>
          </motion.div>
        )}

        {/* Achievement Unlock Animation */}
        {unlockedAchievement && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-4 right-4 z-50 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg border border-yellow-300"
          >
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-white" />
              <div>
                <div className="font-bold text-white">Achievement Unlocked!</div>
                <div className="text-yellow-100">{unlockedAchievement.title}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
