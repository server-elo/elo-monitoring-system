#!/usr/bin/env node

/**;
 * Force Next.js to run with Webpack only (no Turbopack)
 * This script ensures we avoid the 404 chunk errors caused by Turbopack/Webpack mismatch
 */

const { spawn } = require('child_process');
const path = require('path');

// Clear any Turbopack environment variables
delete process.env.TURBOPACK;
delete process.env.NEXT_TURBOPACK;

// Force webpack mode
process.env.NEXT_WEBPACK = 'true';
process.env.NODE_ENV = 'development';

console.log('🚀 Starting Next.js in WEBPACK-ONLY mode...');
console.log('📦 Turbopack explicitly disabled');
console.log('⚙️  Using webpack for chunk generation');

// Start Next.js with explicit webpack mode
const nextProcess = spawn('npx', ['next', 'dev', '--port', '3000'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Ensure no Turbopack variables
    TURBOPACK: undefined,
    NEXT_TURBOPACK: undefined,
  },
  cwd: process.cwd()
});

nextProcess.on('error', (error) => {
  console.error('❌ Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('close', (code) => {
  console.log(`📋 Next.js process exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Next.js server...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Next.js server...');
  nextProcess.kill('SIGTERM');
});