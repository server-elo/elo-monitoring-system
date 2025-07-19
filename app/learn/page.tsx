'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamically import LearningDashboard with SSR disabled to prevent build errors
const LearningDashboard = dynamic(() => import('@/components/learning/LearningDashboard').then(mod => ({ default: mod.LearningDashboard })), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function LearnPage() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <LearningDashboard />
        </Suspense>
      </div>
    </div>
  );
}
