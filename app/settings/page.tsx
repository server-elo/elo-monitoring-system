'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Dynamically import SettingsPage with SSR disabled
const SettingsPage = dynamic(() => import('@/components/settings/SettingsPage').then(mod => ({ default: mod.SettingsPage })), {
  ssr: false,
  loading: () => <LoadingSpinner />
});

export default function Settings() {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <SettingsPage />
        </Suspense>
      </div>
    </div>
  );
}
