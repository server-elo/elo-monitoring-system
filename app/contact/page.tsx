'use client';

import { useEffect } from 'react';

export default function Contact() {
  useEffect(() => {
    // Redirect to external contact page
    window.location.href = 'https://zedigital.tech/contact';
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Redirecting to contact page...</p>
        <p className="text-gray-400 text-sm mt-2">
          If you're not redirected automatically,
          <a
            href="https://zedigital.tech/contact"
            className="text-purple-400 hover:text-purple-300 underline ml-1"
          >
            click here
          </a>
        </p>
      </div>
    </div>
  );
}
