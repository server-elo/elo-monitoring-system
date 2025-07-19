'use client';

;
import { CommunityHub } from '@/components/community/CommunityHub';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function CommunityPage() {
  return (
    <ProtectedRoute
      permission={{
        requireAuth: true,
        roles: ['STUDENT', 'INSTRUCTOR', 'ADMIN'],
        permissions: ['community:access']
      }}
      redirectTo="/auth"
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommunityHub />
        </div>
      </div>
    </ProtectedRoute>
  );
}
