'use client';

import { ReactElement } from 'react';
import Link from 'next/link';

export const NotFoundPage = (): ReactElement => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 max-w-md">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;