'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { withCodeEditorErrorBoundary } from '@/lib/components/ErrorBoundaryHOCs';

// Dynamically import MobileOptimizedCodeLab with SSR disabled to prevent build errors
const MobileOptimizedCodeLab = dynamic(
  () => import('@/components/code/MobileOptimizedCodeLab').then(mod => ({ default: mod.MobileOptimizedCodeLab })), 
  {
    ssr: false,
    loading: () => <LoadingSpinner />
  }
);

function CodePage() {
  // For static export, we don't use authentication
  // This allows the page to be pre-rendered successfully

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <MobileOptimizedCodeLab />
        </Suspense>
      </div>
    </div>
  );
}

// Wrap with code editor error boundary for specialized error handling
export default withCodeEditorErrorBoundary(CodePage, {
  name: 'CodePage',
  enableRetry: true,
  maxRetries: 2,
  showErrorDetails: process.env.NODE_ENV === 'development'
});
