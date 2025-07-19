'use client';

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Users, Video, MessageSquare, Code, Share2 } from 'lucide-react';
import { CollaborationHub } from '@/components/collaboration/CollaborationHub';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { SmartBreadcrumbs } from '@/components/navigation/SmartNavigation';

export default function CollaboratePage() {
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
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Collaboration Hub</h1>
            <p className="text-gray-300 text-lg">Code together, learn together, build together</p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6 text-center">
              <Video className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-sm text-gray-400">Active Sessions</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <MessageSquare className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">48</div>
              <div className="text-sm text-gray-400">Online Users</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Code className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-sm text-gray-400">Shared Projects</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Share2 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">89</div>
              <div className="text-sm text-gray-400">Code Reviews</div>
            </GlassCard>
          </div>

          {/* Main Collaboration Hub */}
          <Suspense fallback={<LoadingSpinner />}>
            <CollaborationHub />
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}
