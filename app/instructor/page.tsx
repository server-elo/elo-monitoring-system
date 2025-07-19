'use client';

;
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { BookOpen, Users, BarChart3, Settings, PlusCircle, Edit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InstructorPage() {
  return (
    <ProtectedRoute
      permission={{
        requireAuth: true,
        roles: ['INSTRUCTOR', 'ADMIN'],
        permissions: ['instructor:access']
      }}
      redirectTo="/unauthorized"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-500/20 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Instructor Dashboard</h1>
            <p className="text-gray-300">Create and manage Solidity courses and content</p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-sm text-gray-400">Active Courses</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">456</div>
              <div className="text-sm text-gray-400">Total Students</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">89%</div>
              <div className="text-sm text-gray-400">Completion Rate</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Settings className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">4.8</div>
              <div className="text-sm text-gray-400">Avg Rating</div>
            </GlassCard>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <PlusCircle className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Create New Course</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Design and publish new Solidity learning content for students.
              </p>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors">
                Start Creating
              </button>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Edit className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Manage Courses</h3>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Edit existing courses, update content, and manage student progress.
              </p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                Manage Content
              </button>
            </GlassCard>
          </div>

          {/* Recent Courses */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Courses</h3>
            <div className="space-y-3">
              {[
                { title: 'Solidity Fundamentals', students: 89, progress: 78 },
                { title: 'Smart Contract Security', students: 67, progress: 92 },
                { title: 'DeFi Development', students: 45, progress: 65 },
              ].map((course, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{course.title}</h4>
                    <p className="text-gray-400 text-sm">{course.students} students enrolled</p>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">{course.progress}%</div>
                    <div className="text-gray-400 text-sm">Avg Progress</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Success Message */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg">
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">
                ✅ Instructor route protection working correctly!
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
