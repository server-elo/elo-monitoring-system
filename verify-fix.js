#!/usr/bin/env node

/**;
 * Comprehensive verification script for 404 chunk error fix
 * Tests all critical chunks and validates the fix is working
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';

// All chunks that should exist and return 200  
const REQUIRED_CHUNKS = [
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app/layout.js',
  '/_next/static/chunks/app-pages-internals.js',
  '/_next/static/chunks/app/not-found.js',
  '/_next/static/chunks/polyfills.js',
  '/_next/static/css/app/layout.css'
];

// Old problematic Turbopack URLs that should NOT exist (should be 404)
const SHOULD_NOT_EXIST = [
  '/_next/static/chunks/%5Broot-of-the-server%5D__cba5afb4._.css',
  '/_next/static/chunks/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_fd44f5a4._.js',
  '/_next/static/chunks/node_modules_next_dist_client_8f19e6fb._.js'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const fullUrl = `${BASE_URL}${url}`;
    const client = fullUrl.startsWith('https') ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode === 200
      });
    });
    
    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        success: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false
      });
    });
  });
}

async function runVerification() {
  console.log('🔍 QUANTUM DEEP FIX VERIFICATION');
  console.log('===');
  console.log('');
  
  // Test main page loads
  console.log('📄 Testing main page...');
  const mainPage = await testUrl('/');
  if (mainPage.success) {
    console.log('✅ Main page loads successfully');
  } else {
    console.log(`❌ Main page failed: ${mainPage.status}`);
    return false;
  }
  
  console.log('');
  
  // Test required chunks
  console.log('📦 Testing required chunks...');
  let allChunksOk = true;
  
  for (const chunk of REQUIRED_CHUNKS) {
    const result = await testUrl(chunk);
    if (result.success) {
      console.log(`✅ ${chunk}`);
    } else {
      console.log(`❌ ${chunk} - Status: ${result.status}`);
      allChunksOk = false;
    }
  }
  
  console.log('');
  
  // Test that old problematic URLs are properly 404
  console.log('🚫 Testing old Turbopack URLs (should be 404)...');
  let oldUrlsCorrect = true;
  
  for (const url of SHOULD_NOT_EXIST) {
    const result = await testUrl(url);
    if (result.status === 404) {
      console.log(`✅ ${url} - Correctly returns 404`);
    } else {
      console.log(`❌ ${url} - Unexpected status: ${result.status}`);
      oldUrlsCorrect = false;
    }
  }
  
  console.log('');
  console.log('🏁 FINAL VERIFICATION RESULTS');
  console.log('===');
  
  if (allChunksOk && oldUrlsCorrect && mainPage.success) {
    console.log('🎉 SUCCESS! 404 chunk errors have been COMPLETELY FIXED!');
    console.log('');
    console.log('✅ All webpack chunks load correctly');
    console.log('✅ Old Turbopack URLs properly return 404');
    console.log('✅ Main application loads without errors');
    console.log('');
    console.log('🚀 You can now test in Firefox - there should be ZERO 404 errors!');
    return true;
  } else {
    console.log('❌ VERIFICATION FAILED - Issues remain:');
    if (!allChunksOk) console.log('   - Some required chunks are missing');
    if (!oldUrlsCorrect) console.log('   - Old Turbopack URLs still exist');
    if (!mainPage.success) console.log('   - Main page not loading');
    return false;
  }
}

// Run verification
if (require.main === module) {
  runVerification().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runVerification };