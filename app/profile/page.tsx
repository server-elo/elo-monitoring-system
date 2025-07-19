'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { User, Settings, Award, BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { SmartBreadcrumbs } from '@/components/navigation/SmartNavigation';

// Dynamically import UserProfile with SSR disabled
const UserProfile = dynamic(() => import('@/components/profile/UserProfile').then(mod => ({ default: mod.UserProfile })), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function Profile() {
  return (
    <ProtectedRoute permission={{ requireAuth: true }}>
      <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <SmartBreadcrumbs />
          </div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Your Profile</h1>
            <p className="text-gray-300 text-lg">Manage your learning journey and preferences</p>
          </motion.div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <GlassCard className="p-6 text-center hover:bg-white/10 transition-colors cursor-pointer">
              <Settings className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white">Settings</div>
              <div className="text-sm text-gray-400">Customize your experience</div>
            </GlassCard>

            <GlassCard className="p-6 text-center hover:bg-white/10 transition-colors cursor-pointer">
              <Award className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white">Achievements</div>
              <div className="text-sm text-gray-400">View your progress</div>
            </GlassCard>

            <GlassCard className="p-6 text-center hover:bg-white/10 transition-colors cursor-pointer">
              <BarChart3 className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-semibold text-white">Analytics</div>
              <div className="text-sm text-gray-400">Track your learning</div>
            </GlassCard>
          </div>

          {/* Main Profile Component */}
          <Suspense fallback={<LoadingSpinner />}>
            <UserProfile />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}
