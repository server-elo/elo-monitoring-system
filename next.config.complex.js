/** @type {import('next').NextConfig} */
const nextConfig = {
  // PRODUCTION-FIRST configuration to eliminate 404 chunk errors
  
  // Disable ALL experimental features
  experimental: {},
  
  // Basic configuration
  reactStrictMode: false,
  poweredByHeader: false,
  
  // Build configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Output configuration for stable builds
  output: 'standalone',
  
  // Webpack configuration for production stability
  webpack: (config, { dev, isServer }) => {
    // Fix "self is not defined" error
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        path: false,
        os: false,
      };
      
      // Define global variables for browser compatibility
      config.plugins = config.plugins || [];
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          'global': 'globalThis',
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        })
      );
    }
    
    // Production-stable chunk naming
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;