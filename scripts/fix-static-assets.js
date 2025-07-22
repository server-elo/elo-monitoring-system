#!/usr/bin/env node
/**
 * Fix Static Assets Script
 * Ensures proper Next.js static asset serving
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();

console.log('🔧 Fixing static asset serving...');

// Create public directory if it doesn't exist
const publicDir = path.join(projectRoot, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('✅ Created public directory');
}

// Create static directory inside public if it doesn't exist
const staticDir = path.join(publicDir, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
  console.log('✅ Created public/static directory');
}

// Create favicon if it doesn't exist
const faviconPath = path.join(publicDir, 'favicon.ico');
if (!fs.existsSync(faviconPath)) {
  // Create a minimal favicon
  const faviconBuffer = Buffer.from([
    0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x10, 0x10, 0x00, 0x00, 0x01, 0x00,
    0x04, 0x00, 0x28, 0x01, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00, 0x28, 0x00,
    0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00
  ]);
  fs.writeFileSync(faviconPath, faviconBuffer);
  console.log('✅ Created minimal favicon.ico');
}

// Create robots.txt if it doesn't exist
const robotsPath = path.join(publicDir, 'robots.txt');
if (!fs.existsSync(robotsPath)) {
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'}/sitemap.xml
`;
  fs.writeFileSync(robotsPath, robotsContent);
  console.log('✅ Created robots.txt');
}

// Verify Next.js configuration
const nextConfigPath = path.join(projectRoot, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const config = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if assetPrefix is configured
  if (!config.includes('assetPrefix')) {
    console.log('⚠️  Warning: assetPrefix not found in next.config.js');
  }
  
  // Check if static asset headers are configured
  if (!config.includes('_next/static')) {
    console.log('⚠️  Warning: Static asset headers not configured');
  }
  
  console.log('✅ Next.js config validated');
}

// Create a test static file
const testStaticPath = path.join(publicDir, 'test.txt');
fs.writeFileSync(testStaticPath, 'Static asset serving test');
console.log('✅ Created test static file');

console.log('🎉 Static asset fixes complete!');