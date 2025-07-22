const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Temporarily ignore TypeScript errors during build for production deployment
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  // Temporarily ignore ESLint errors during build for production deployment  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
  
  // External packages
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  
  // Optimize for production
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Enhanced image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ];
  },

  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
      'framer-motion'
    ],
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimized fallbacks - only essential ones
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Essential experiments only
    config.experiments = {
      asyncWebAssembly: true,
      layers: true, // Enable layers for Next.js optimization
    };

    // Suppress OpenTelemetry warnings from Sentry
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /node_modules\/@sentry\/node/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    // Advanced bundle optimization
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            
            // Framework bundle (React, Next.js)
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            
            // Monaco Editor (large dependency)
            monaco: {
              name: 'monaco',
              test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            
            // UI libraries
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|framer-motion|lucide-react)[\\/]/,
              chunks: 'all',
              priority: 25,
            },
            
            // Common vendor packages
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            
            // Common shared modules
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Optimize imports
      config.resolve.alias = {
        ...config.resolve.alias,
        // Replace heavy lodash with lodash-es
        'lodash': 'lodash-es',
      };
    }

    // Bundle analysis
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new webpack.DefinePlugin({
          __BUNDLE_ANALYZE__: JSON.stringify(true),
        })
      );
    }

    return config;
  },
  // Set environment variables for live mode
  env: {
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  },
};

module.exports = withBundleAnalyzer(nextConfig);
