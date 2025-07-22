"use client";

import { ReactElement, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FaFire,
  FaTrophy,
  FaChartLine,
  FaBook,
  FaCode,
  FaUsers,
  FaBriefcase,
  FaCertificate,
  FaArrowRight,
  FaClock,
  FaStar
} from "react-icons/fa";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { XPCounter } from "@/components/xp/XPCounter";
import { LevelUpCelebration } from "@/components/xp/LevelUpCelebration";
interface DashboardData {
  user: {
    name: string;
    level: number;
    totalXP: number;
    streak: number;
    skillLevel: string;
  };
  progress: {
    completedLessons: number;
    totalLessons: number;
    currentCourse?: {
      id: string;
      title: string;
      progress: number;
    };
    recentLessons: Array<{
      id: string;
      title: string;
      completedAt: string;
      score: number;
    }>;
  };
  achievements: {
    recent: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      unlockedAt: string;
    }>;
    total: number;
  };
  stats: {
    timeSpent: number;
    averageScore: number;
    projectsCompleted: number;
    certificatesEarned: number;
  };
  leaderboard: {
    userRank: number;
    topUsers: Array<{
      id: string;
      name: string;
      level: number;
      totalXP: number;
    }>;
  };
}
export default function DashboardPage(): ReactElement {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading || !dashboardData) {
    return (
      <ProtectedRoute>
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-400">Loading dashboard...</p>
      </div>
      </div>
      </ProtectedRoute>
    );
  }
  const xpForNextLevel = dashboardData.user.level * 1000;
  const xpProgress = (dashboardData.user.totalXP % 1000) / 10;
  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-900 py-12 px-4">
    <div className="max-w-7xl mx-auto">
    {/* Header */}
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-8"><div className="flex justify-between items-start">
    <div>
    <h1 className="text-4xl font-bold text-white mb-2">
    Welcome back, {dashboardData.user.name}!
    </h1>
    <p className="text-gray-400">
    Track your progress and continue learning
    </p>
    </div>
    <div className="text-right">
    <div className="flex items-center gap-2 mb-2">
    <FaFire className="text-orange-500" />
    <span className="text-2xl font-bold text-white">
    {dashboardData.user.streak}
    </span>
    <span className="text-gray-400">day streak</span>
    </div>
    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">
    {dashboardData.user.skillLevel}
    </Badge>
    </div>
    </div>
    </motion.div>
    {/* Stats Overview */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}><Card className="bg-gray-800 border-gray-700 hover:border-blue-600 transition-colors">
    <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
    <FaChartLine className="text-blue-500 text-2xl" />
    <span className="text-2xl font-bold text-white">
    Level {dashboardData.user.level}
    </span>
    </div>
    <Progress value={xpProgress} className="h-2 mb-2" />
    <p className="text-sm text-gray-400">
    {dashboardData.user.totalXP} / {xpForNextLevel} XP
    </p>
    </CardContent>
    </Card>
    </motion.div>
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}><Card className="bg-gray-800 border-gray-700 hover:border-green-600 transition-colors">
    <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
    <FaBook className="text-green-500 text-2xl" />
    <span className="text-2xl font-bold text-white">
    {dashboardData.progress.completedLessons}
    </span>
    </div>
    <p className="text-sm text-gray-400">Lessons Completed</p>
    <p className="text-xs text-gray-500 mt-1">
    {dashboardData.progress.totalLessons} total lessons
    </p>
    </CardContent>
    </Card>
    </motion.div>
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}><Card className="bg-gray-800 border-gray-700 hover:border-yellow-600 transition-colors">
    <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
    <FaTrophy className="text-yellow-500 text-2xl" />
    <span className="text-2xl font-bold text-white">
    {dashboardData.achievements.total}
    </span>
    </div>
    <p className="text-sm text-gray-400">Achievements</p>
    <p className="text-xs text-gray-500 mt-1">Keep earning!</p>
    </CardContent>
    </Card>
    </motion.div>
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}><Card className="bg-gray-800 border-gray-700 hover:border-purple-600 transition-colors">
    <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
    <FaStar className="text-purple-500 text-2xl" />
    <span className="text-2xl font-bold text-white">
    {dashboardData.stats.averageScore}%
    </span>
    </div>
    <p className="text-sm text-gray-400">Average Score</p>
    <p className="text-xs text-gray-500 mt-1">Great job!</p>
    </CardContent>
    </Card>
    </motion.div>
    </div>
    {/* Main Content */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Left Column - Progress & Activity */}
    <div className=",
    lg:col-span-2 space-y-6">
    {/* Current Course Progress */}
    {dashboardData.progress.currentCourse && (
      <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}><Card className="bg-gray-800 border-gray-700">
      <CardHeader>
      <CardTitle className="text-white">
      Continue Learning
      </CardTitle>
      </CardHeader>
      <CardContent>
      <div className="mb-4">
      <h3 className="text-lg font-semibold text-white mb-2">
      {dashboardData.progress.currentCourse.title}
      </h3>
      <Progress
      value={dashboardData.progress.currentCourse.progress}
      className="h-3 mb-2"
      />
      <p className="text-sm text-gray-400">
      {dashboardData.progress.currentCourse.progress}%
      Complete
      </p>
      </div>
      <Link
      href={`/learn/course/${dashboardData.progress.currentCourse.id}`}><Button className="w-full bg-blue-600 hover:bg-blue-700">
      Continue Course
      <FaArrowRight className="ml-2" />
      </Button>
      </Link>
      </CardContent>
      </Card>
      </motion.div>
    )}
    {/* Recent Activity */}
    <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 }}><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <CardTitle className="text-white">
    Recent Activity
    </CardTitle>
    </CardHeader>
    <CardContent>
    <div className="space-y-4">
    {dashboardData.progress.recentLessons.map((lesson: unknown) => (
      <div
      key={lesson.id}
      className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"><div>
      <h4 className="text-white font-medium">
      {lesson.title}
      </h4>
      <p className="text-sm text-gray-400">
      Completed{" "}
      {new Date(
        lesson.completedAt,
      ).toLocaleDateString()}
      </p>
      </div>
      <div className="text-right">
      <Badge className="bg-green-600/20 text-green-400 border-green-600">
      {lesson.score}%
      </Badge>
      </div>
      </div>
    ))}
    </div>
    </CardContent>
    </Card>
    </motion.div>
    {/* Quick Actions */}
    <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <CardTitle className="text-white">Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
    <div className="grid grid-cols-2 gap-4">
    <Link href="/learn">
    <Button
    variant="outline"
    className="w-full border-gray-600 hover:bg-gray-700"><FaBook className="mr-2" />
    Browse Courses
    </Button>
    </Link>
    <Link href="/code">
    <Button
    variant="outline"
    className="w-full border-gray-600 hover:bg-gray-700"><FaCode className="mr-2" />
    Code Playground
    </Button>
    </Link>
    <Link href="/collaborate">
    <Button
    variant="outline"
    className="w-full border-gray-600 hover:bg-gray-700"><FaUsers className="mr-2" />
    Collaborate
    </Button>
    </Link>
    <Link href="/jobs">
    <Button
    variant="outline"
    className="w-full border-gray-600 hover:bg-gray-700"><FaBriefcase className="mr-2" />
    Job Board
    </Button>
    </Link>
    </div>
    </CardContent>
    </Card>
    </motion.div>
    </div>
    {/* Right Column - Achievements & Leaderboard */}
    <div className="space-y-6">
    {/* Recent Achievements */}
    <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <div className="flex justify-between items-center">
    <CardTitle className="text-white">
    Recent Achievements
    </CardTitle>
    <Link href="/achievements">
    <Button
    variant="ghost"
    size="sm"
    className="text-blue-400">View All
    </Button>
    </Link>
    </div>
    </CardHeader>
    <CardContent>
    <div className="space-y-3">
    {dashboardData.achievements.recent.map((achievement: unknown) => (
      <div
      key={achievement.id}
      className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"><div className="text-2xl">{achievement.icon}</div>
      <div className="flex-1">
      <h4 className="text-white font-medium text-sm">
      {achievement.title}
      </h4>
      <p className="text-xs text-gray-400">
      {new Date(
        achievement.unlockedAt,
      ).toLocaleDateString()}
      </p>
      </div>
      </div>
    ))}
    </div>
    </CardContent>
    </Card>
    </motion.div>
    {/* Leaderboard */}
    <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.1 }}><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <CardTitle className="text-white">Leaderboard</CardTitle>
    </CardHeader>
    <CardContent>
    <div className="mb-4 p-3 bg-blue-600/20 rounded-lg border border-blue-600">
    <p className="text-sm text-blue-400">Your Rank</p>
    <p className="text-2xl font-bold text-white">
    #{dashboardData.leaderboard.userRank}
    </p>
    </div>
    <div className="space-y-2">
    {dashboardData.leaderboard.topUsers.map((user, index) => (
      <div
      key={user.id}
      className="flex items-center justify-between p-2"><div className="flex items-center gap-3">
      <span className="text-gray-400 font-mono">
      #{index + 1}
      </span>
      <span className="text-white">{user.name}</span>
      </div>
      <div className="flex items-center gap-2">
      <Badge className="bg-gray-700">
      Lvl {user.level}
      </Badge>
      <span className="text-sm text-gray-400">
      {user.totalXP} XP
      </span>
      </div>
      </div>
    ))}
    </div>
    </CardContent>
    </Card>
    </motion.div>
    {/* Study Stats */}
    <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}><Card className="bg-gray-800 border-gray-700">
    <CardHeader>
    <CardTitle className="text-white">Study Stats</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    <FaClock className="text-gray-400" />
    <span className="text-gray-400">Time Spent</span>
    </div>
    <span className="text-white font-medium">
    {Math.round(dashboardData.stats.timeSpent / 60)}h
    </span>
    </div>
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    <FaCode className="text-gray-400" />
    <span className="text-gray-400">Projects</span>
    </div>
    <span className="text-white font-medium">
    {dashboardData.stats.projectsCompleted}
    </span>
    </div>
    <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
    <FaCertificate className="text-gray-400" />
    <span className="text-gray-400">Certificates</span>
    </div>
    <span className="text-white font-medium">
    {dashboardData.stats.certificatesEarned}
    </span>
    </div>
    </CardContent>
    </Card>
    </motion.div>
    </div>
    </div>
    </div>
    {/* Level Up Celebration */}
    {showLevelUp && (
      <LevelUpCelebration
      newLevel={dashboardData.user.level}
      onComplete={() => setShowLevelUp(false)}
      />
    )}
    </div>
    </ProtectedRoute>
  );
}