import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { MainProviders } from '@/lib/providers/AppProvider';
import { SimpleErrorBoundary } from '@/components/errors/SimpleErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/ui/Accessibility';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SolanaLearn - Master Solidity Development',
  description: 'The most comprehensive Solidity learning platform with AI-powered tutoring, real-time collaboration, and hands-on blockchain development.',
  keywords: ['Solidity', 'Blockchain', 'Smart Contracts', 'Web3', 'Ethereum', 'DeFi', 'Learning Platform'],
  authors: [{ name: 'SolanaLearn Team' }],
  openGraph: {
    title: 'SolanaLearn - Master Solidity Development',
    description: 'Learn Solidity with AI-powered tutoring and real-time collaboration',
    url: 'https://solanalearn.dev',
    siteName: 'SolanaLearn',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SolanaLearn Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SolanaLearn - Master Solidity Development',
    description: 'Learn Solidity with AI-powered tutoring and real-time collaboration',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // FORCE BROWSER TO ALWAYS BE ONLINE
            Object.defineProperty(navigator, 'onLine', {
              get: () => true,
              configurable: true
            });
            
            // Remove all offline event listeners
            window.addEventListener = new Proxy(window.addEventListener, {
              apply(target, thisArg, args) {
                const [event] = args;
                if (event === 'offline' || event === 'online') {
                  return;
                }
                return target.apply(thisArg, args);
              }
            });
            
            // Aggressively prevent and remove all service workers
            if ('serviceWorker' in navigator) {
              // Unregister all existing service workers
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                }
              });
              
              // Prevent any new registrations
              const originalRegister = navigator.serviceWorker.register;
              navigator.serviceWorker.register = function() {
                return Promise.reject(new Error('Service workers are disabled'));
              };
              
              // Listen for messages from service worker to reload
              navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'RELOAD') {
                  window.location.reload();
                }
              });
            }
          `
        }} />
      </head>
      <body className={inter.className}>
        <MainProviders>
          <SimpleErrorBoundary>
            {/* Skip Links for Accessibility */}
            <SkipLink targetId="main-content">Skip to main content</SkipLink>
            <SkipLink targetId="navigation">Skip to navigation</SkipLink>

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
              {/* Navigation */}
              <Navigation />

              {/* Main content */}
              <main id="main-content" className="relative" role="main" tabIndex={-1}>
                {children}
              </main>

              {/* Footer */}
              <Footer />
            </div>

            {/* Global UI Components */}
            <Toaster />
          </SimpleErrorBoundary>
        </MainProviders>
      </body>
    </html>
  );
}