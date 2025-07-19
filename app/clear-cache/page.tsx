'use client';

import React, { useEffect, useState } from 'react';

export default function ClearCachePage() {
  const [status, setStatus] = useState('Initializing...');
  const [isClearing, setIsClearing] = useState(false);

  const clearEverything = async () => {
    setIsClearing(true);
    setStatus('AGGRESSIVELY clearing all caches and service workers...');

    try {
      // Step 1: Unregister ALL service workers from all scopes
      if ('serviceWorker' in navigator) {
        // Get all registrations
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service workers to unregister`);
        
        // Unregister each one
        for (const registration of registrations) {
          try {
            await registration.unregister();
            console.log('Unregistered:', registration.scope);
          } catch (e) {
            console.error('Failed to unregister:', registration.scope, e);
          }
        }
        
        // Also try to clear the controller
        if (navigator.serviceWorker.controller) {
          console.log('Clearing controller');
          navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        
        setStatus(`Force unregistered ${registrations.length} service workers...`);
      }

      // Step 2: Clear ALL caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches to clear`);
        
        // Delete all caches
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            try {
              await caches.delete(cacheName);
              console.log('Deleted cache:', cacheName);
            } catch (e) {
              console.error('Failed to delete cache:', cacheName, e);
            }
          })
        );
        
        setStatus(`Force cleared ${cacheNames.length} caches...`);
      }

      // Step 3: Clear ALL storage
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name) {
              try {
                indexedDB.deleteDatabase(db.name);
                console.log('Deleted IndexedDB:', db.name);
              } catch (e) {
                console.error('Failed to delete IndexedDB:', db.name, e);
              }
            }
          }
        }
        
        setStatus('Cleared all storage types...');
      } catch (e) {
        console.warn('Could not clear some storage:', e);
      }

      // Step 4: Force reload without cache
      setStatus('✅ ALL CLEARED! Force reloading without cache...');
      
      // Force hard reload after 1 second
      setTimeout(() => {
        // Try multiple methods to ensure hard reload
        if ('caches' in window) {
          caches.keys().then(() => {
            (window as any).location.href = '/?nocache=' + Date.now();
          });
        } else {
          (window as any).location.href = '/?nocache=' + Date.now();
        }
      }, 1000);

    } catch (error) {
      console.error('Error during clearing:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    // Start clearing immediately when page loads
    clearEverything();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            {isClearing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : (
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            Cache Cleaner
          </h1>

          <p className="text-gray-300 mb-6">
            {status}
          </p>

          {!isClearing && (
            <div className="space-y-3">
              <button
                onClick={clearEverything}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Again
              </button>
              
              <a
                href="/"
                className="block w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-center rounded-lg transition-colors"
              >
                Go to Homepage
              </a>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">What this does:</h4>
            <ul className="text-xs text-gray-400 text-left space-y-1">
              <li>• Unregisters all service workers</li>
              <li>• Clears all browser caches</li>
              <li>• Clears localStorage & sessionStorage</li>
              <li>• Forces a fresh start</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}