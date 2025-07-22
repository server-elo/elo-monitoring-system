/**
 * @fileoverview Quantum Production Deployment Configuration
 * @module deployment.config
 */

/**
 * Comprehensive deployment configuration for quantum-optimized production environment.
 * Implements advanced performance monitoring, caching strategies, and deployment workflows.
 */

module.exports = {
  // Environment Configuration
  environments: {
    production: {
      name: 'production',
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://solidity-learn.vercel.app',
      cdn: {
        enabled: true,
        domain: process.env.CDN_DOMAIN || 'cdn.solidity-learn.com',
        regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      },
      monitoring: {
        enabled: true,
        sentry: {
          dsn: process.env.SENTRY_DSN,
          environment: 'production',
          tracesSampleRate: 0.1,
          profilesSampleRate: 0.1,
        },
        analytics: {
          googleAnalytics: process.env.GA_MEASUREMENT_ID,
          vercelAnalytics: true,
          webVitals: true,
        },
      },
    },
    staging: {
      name: 'staging',
      url: 'https://staging-solidity-learn.vercel.app',
      cdn: {
        enabled: true,
        domain: 'staging-cdn.solidity-learn.com',
        regions: ['us-east-1'],
      },
      monitoring: {
        enabled: true,
        sentry: {
          dsn: process.env.SENTRY_DSN,
          environment: 'staging',
          tracesSampleRate: 1.0,
          profilesSampleRate: 1.0,
        },
      },
    },
  },

  // Performance Optimization Configuration
  performance: {
    // Bundle optimization targets
    bundleSize: {
      maxTotalSize: '1MB',
      maxChunkSize: '250KB',
      maxAssetSize: '100KB',
    },
    
    // Core Web Vitals targets
    webVitals: {
      FCP: 1800, // First Contentful Paint (ms)
      LCP: 2500, // Largest Contentful Paint (ms)
      FID: 100,  // First Input Delay (ms)
      CLS: 0.1,  // Cumulative Layout Shift
      TTFB: 800, // Time to First Byte (ms)
      INP: 200,  // Interaction to Next Paint (ms)
    },
    
    // Lighthouse targets
    lighthouse: {
      performance: 90,
      accessibility: 95,
      bestPractices: 95,
      seo: 95,
      pwa: 90,
    },
    
    // Caching configuration
    caching: {
      staticAssets: {
        maxAge: 31536000, // 1 year
        strategy: 'immutable',
      },
      dynamicContent: {
        maxAge: 3600, // 1 hour
        strategy: 'stale-while-revalidate',
      },
      api: {
        maxAge: 300, // 5 minutes
        strategy: 'network-first',
      },
    },
  },

  // Deployment Configuration
  deployment: {
    // Build configuration
    build: {
      target: 'serverless',
      outputStandalone: true,
      generateBuildId: () => {
        return process.env.GITHUB_SHA || `build-${Date.now()}`;
      },
    },
    
    // Vercel configuration
    vercel: {
      project: 'solidity-learning-platform',
      framework: 'nextjs',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm ci',
      devCommand: 'npm run dev',
      
      // Function configuration
      functions: {
        'pages/api/**/*.js': {
          maxDuration: 30,
          memory: 1024,
        },
        'pages/api/ai/**/*.js': {
          maxDuration: 60,
          memory: 2048,
        },
      },
      
      // Headers configuration
      headers: [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
          ],
        },
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-cache, no-store, must-revalidate',
            },
          ],
        },
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ],
      
      // Redirects configuration
      redirects: [
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
        {
          source: '/docs',
          destination: '/learn',
          permanent: false,
        },
      ],
      
      // Rewrites configuration
      rewrites: [
        {
          source: '/api/health',
          destination: '/api/monitoring/health',
        },
      ],
    },
    
    // Environment variables
    environmentVariables: {
      required: [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'GOOGLE_AI_API_KEY',
      ],
      optional: [
        'SENTRY_DSN',
        'GA_MEASUREMENT_ID',
        'CDN_DOMAIN',
        'REDIS_URL',
      ],
    },
    
    // Health checks
    healthChecks: {
      enabled: true,
      endpoints: [
        '/api/health',
        '/api/monitoring/status',
      ],
      timeout: 30000,
      interval: 60000,
    },
  },

  // Quality Gates
  qualityGates: {
    // Performance gates
    performance: {
      bundleSize: {
        threshold: 1000, // KB
        blocking: true,
      },
      buildTime: {
        threshold: 300, // seconds
        blocking: false,
      },
      lighthouse: {
        performance: 85,
        accessibility: 90,
        blocking: true,
      },
    },
    
    // Security gates
    security: {
      vulnerabilities: {
        high: 0,
        medium: 5,
        blocking: true,
      },
      dependencies: {
        outdated: 10,
        blocking: false,
      },
    },
    
    // Code quality gates
    codeQuality: {
      coverage: {
        threshold: 80,
        blocking: true,
      },
      eslint: {
        errors: 0,
        warnings: 10,
        blocking: true,
      },
      typescript: {
        errors: 0,
        blocking: true,
      },
    },
  },

  // Rollback Configuration
  rollback: {
    strategy: 'immediate',
    triggers: [
      'error_rate > 5%',
      'response_time > 5000ms',
      'availability < 99%',
    ],
    notifications: {
      slack: process.env.SLACK_WEBHOOK,
      email: ['admin@solidity-learn.com'],
    },
  },

  // Monitoring and Alerting
  monitoring: {
    metrics: {
      webVitals: true,
      errorTracking: true,
      performanceMetrics: true,
      businessMetrics: true,
      userBehavior: true,
    },
    
    alerts: {
      errorRate: {
        threshold: 1, // %
        window: '5m',
      },
      responseTime: {
        threshold: 3000, // ms
        window: '5m',
      },
      availability: {
        threshold: 99, // %
        window: '5m',
      },
      buildFailure: {
        immediate: true,
      },
    },
    
    dashboards: {
      grafana: {
        enabled: true,
        url: process.env.GRAFANA_URL,
      },
      vercelAnalytics: {
        enabled: true,
      },
    },
  },

  // Feature Flags
  featureFlags: {
    quantumOptimizations: true,
    aiTutoring: true,
    realTimeCollaboration: true,
    blockchainIntegration: true,
    advancedAnalytics: false, // Gradual rollout
  },

  // CDN Configuration
  cdn: {
    provider: 'vercel',
    regions: [
      'us-east-1',
      'us-west-2',
      'eu-west-1',
      'eu-central-1',
      'ap-southeast-1',
      'ap-northeast-1',
    ],
    
    // Asset optimization
    assets: {
      images: {
        formats: ['avif', 'webp', 'jpg'],
        quality: 80,
        sizes: [640, 750, 828, 1080, 1200, 1920],
      },
      
      fonts: {
        preload: [
          '/fonts/inter-var.woff2',
          '/fonts/jetbrains-mono.woff2',
        ],
        display: 'swap',
      },
      
      scripts: {
        compression: 'gzip',
        minification: true,
      },
    },
  },

  // Database Configuration
  database: {
    connectionPooling: {
      min: 2,
      max: 20,
      idle: 10000,
    },
    
    migrations: {
      autoRun: false,
      strategy: 'safe',
    },
    
    backups: {
      enabled: true,
      frequency: 'daily',
      retention: 30, // days
    },
  },

  // Rate Limiting
  rateLimiting: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5, // login attempts
    },
    
    ai: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // AI requests
    },
  },
};

// Validation function
function validateConfig(config) {
  const errors = [];
  
  // Required environment variables
  const requiredEnvVars = config.deployment.environmentVariables.required;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }
  
  // Performance thresholds
  if (config.performance.bundleSize.maxTotalSize) {
    const maxSize = parseInt(config.performance.bundleSize.maxTotalSize);
    if (maxSize > 2048) { // 2MB
      errors.push('Bundle size threshold too high - maximum recommended is 2MB');
    }
  }
  
  if (errors.length > 0) {
    console.error('Deployment configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Deployment configuration validated successfully');
}

// Export configuration and validation
module.exports.validateConfig = validateConfig;

// Auto-validate in production
if (process.env.NODE_ENV === 'production') {
  validateConfig(module.exports);
}