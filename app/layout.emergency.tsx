
"use client";

import React from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Solidity Learning Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-900">
            <header className="bg-gray-800 border-b border-gray-700">
              <div className="container mx-auto px-4 py-4">
                <h1 className="text-white text-xl font-semibold">
                  Solidity Learning Platform
                </h1>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
