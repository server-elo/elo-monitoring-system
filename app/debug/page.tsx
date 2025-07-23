'use client';

import { useEffect } from 'react';

export default function DebugPage() {
  useEffect(() => {
    // Log all link and script tags
    console.log('=== CSS Debug Info ===');
    
    // Check for CSS files
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`Found ${links.length} stylesheet links:`);
    links.forEach((link, i) => {
      console.log(`${i + 1}. ${link.getAttribute('href')}`);
    });
    
    // Check for script tags
    const scripts = document.querySelectorAll('script[src]');
    console.log(`\nFound ${scripts.length} script tags:`);
    scripts.forEach((script, i) => {
      console.log(`${i + 1}. ${script.getAttribute('src')}`);
    });
    
    // Check computed styles
    const body = document.body;
    const computedStyles = window.getComputedStyle(body);
    console.log('\nBody computed styles:');
    console.log('- Background:', computedStyles.backgroundColor);
    console.log('- Font Family:', computedStyles.fontFamily);
    console.log('- Color:', computedStyles.color);
    
    // Check if Tailwind classes work
    const testDiv = document.createElement('div');
    testDiv.className = 'bg-blue-500';
    document.body.appendChild(testDiv);
    const testStyles = window.getComputedStyle(testDiv);
    console.log('\nTailwind test (bg-blue-500):');
    console.log('- Background:', testStyles.backgroundColor);
    document.body.removeChild(testDiv);
    
    // Check for service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`\nFound ${registrations.length} service workers`);
        registrations.forEach(reg => {
          console.log('- SW Scope:', reg.scope);
          console.log('- SW Active:', reg.active?.scriptURL);
        });
      });
    }
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">CSS Debug Page</h1>
      <p className="mb-4">Check the browser console for debugging information.</p>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Test 1: Basic Tailwind Classes</h2>
          <div className="mt-2">
            <span className="bg-blue-500 text-white p-2 rounded">Blue Background</span>
            <span className="ml-2 bg-red-500 text-white p-2 rounded">Red Background</span>
            <span className="ml-2 bg-green-500 text-white p-2 rounded">Green Background</span>
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Test 2: Flexbox</h2>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-purple-500 text-white p-2 rounded">Flex 1</div>
            <div className="flex-1 bg-purple-500 text-white p-2 rounded">Flex 2</div>
            <div className="flex-1 bg-purple-500 text-white p-2 rounded">Flex 3</div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Test 3: Grid</h2>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="bg-indigo-500 text-white p-2 rounded">Grid 1</div>
            <div className="bg-indigo-500 text-white p-2 rounded">Grid 2</div>
            <div className="bg-indigo-500 text-white p-2 rounded">Grid 3</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 border-2 border-dashed border-gray-400 rounded">
        <h2 className="font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1">
          <li>Open browser DevTools (F12)</li>
          <li>Check the Console tab for debug output</li>
          <li>Check the Network tab for any 404 errors</li>
          <li>Check the Application tab for Service Workers</li>
        </ol>
      </div>
    </div>
  );
}