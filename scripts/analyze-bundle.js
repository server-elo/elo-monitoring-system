#!/usr/bin/env node
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// This script can be used to analyze the bundle
console.log(`
🔍 Bundle Analysis Setup Complete!

To analyze your bundle:

1. Run the analysis build:
   ANALYZE=true npm run build

2. The bundle analyzer will open automatically in your browser

3. You can also generate a static report:
   npm run build:analyze

Bundle optimization tips:
- Look for large dependencies that can be replaced
- Check for duplicate modules
- Identify code that can be lazy loaded
- Find opportunities for tree shaking
`);

module.exports = withBundleAnalyzer;