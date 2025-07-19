'use client';

;
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlassCard } from '@/components/ui/Glassmorphism';
import { Users, MessageCircle, Calendar, Award, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MentorPage() {
  return (
    <ProtectedRoute
      permission={{
        requireAuth: true,
        roles: ['MENTOR', 'INSTRUCTOR', 'ADMIN'],
        permissions: ['mentor:access']
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
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Mentor Dashboard</h1>
            <p className="text-gray-300">Guide and support students in their Solidity learning journey</p>
          </motion.div>

          {/* Mentorship Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <GlassCard className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">24</div>
              <div className="text-sm text-gray-400">Active Mentees</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">156</div>
              <div className="text-sm text-gray-400">Messages This Week</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Calendar className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-sm text-gray-400">Sessions This Week</div>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">4.9</div>
              <div className="text-sm text-gray-400">Mentor Rating</div>
            </GlassCard>
          </div>

          {/* Active Mentees */}
          <GlassCard className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Active Mentees</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Alice Johnson', progress: 85, lastActive: '2 hours ago', status: 'active' },
                { name: 'Bob Smith', progress: 62, lastActive: '1 day ago', status: 'needs_help' },
                { name: 'Carol Davis', progress: 94, lastActive: '30 minutes ago', status: 'active' },
                { name: 'David Wilson', progress: 45, lastActive: '3 days ago', status: 'inactive' },
                { name: 'Eva Brown', progress: 78, lastActive: '5 hours ago', status: 'active' },
                { name: 'Frank Miller', progress: 33, lastActive: '1 hour ago', status: 'needs_help' },
              ].map((mentee, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{mentee.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      mentee.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      mentee.status === 'needs_help' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {mentee.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{mentee.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${mentee.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Last active: {mentee.lastActive}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Messages</h3>
              <div className="space-y-3">
                {[
                  { from: 'Alice Johnson', message: 'Can you help me with smart contract deployment?', time: '10 min ago' },
                  { from: 'Bob Smith', message: 'Thanks for the explanation on gas optimization!', time: '2 hours ago' },
                  { from: 'Carol Davis', message: 'When is our next session scheduled?', time: '1 day ago' },
                ].map((msg, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-medium text-sm">{msg.from}</span>
                      <span className="text-gray-400 text-xs">{msg.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {[
                  { student: 'Alice Johnson', topic: 'Smart Contract Security', time: 'Today 3:00 PM' },
                  { student: 'David Wilson', topic: 'Solidity Basics Review', time: 'Tomorrow 10:00 AM' },
                  { student: 'Eva Brown', topic: 'DeFi Project Discussion', time: 'Friday 2:00 PM' },
                ].map((session, index) => (
                  <div key={index} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-medium text-sm">{session.student}</span>
                      <span className="text-blue-400 text-xs">{session.time}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{session.topic}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Success Message */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">
                ✅ Mentor route protection working correctly!
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
