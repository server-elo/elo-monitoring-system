module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/learn',
        'http://localhost:3000/code',
        'http://localhost:3000/dashboard',
        'http://localhost:3000/auth',
      ],
      startServerCommand: 'npm run build && npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        formFactor: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      },
    },
    assert: {
      assertions: {
        // Performance assertions
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'categories:pwa': ['warn', { minScore: 0.80 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 400000 }], // 400KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 100000 }], // 100KB
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }], // 500KB
        'resource-summary:font:size': ['error', { maxNumericValue: 150000 }], // 150KB
        'resource-summary:total:size': ['error', { maxNumericValue: 1000000 }], // 1MB

        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'meta-viewport': 'error',

        // Best Practices
        'uses-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'external-anchors-use-rel-noopener': 'error',

        // SEO
        'document-title': 'error',
        'meta-description': 'error',
        'robots-txt': 'warn',
        'canonical': 'warn',

        // PWA
        'service-worker': 'warn',
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'content-width': 'warn',
        'viewport': 'error',
        'apple-touch-icon': 'warn',
        'maskable-icon': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      // For production, you might want to use:
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-build-token',
    },
  },
  
  // Mobile configuration
  mobile: {
    collect: {
      settings: {
        preset: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        },
        formFactor: 'mobile',
      },
    },
    assert: {
      assertions: {
        // More lenient thresholds for mobile
        'categories:performance': ['error', { minScore: 0.75 }],
        'first-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 600 }],
        'speed-index': ['error', { maxNumericValue: 5000 }],
      },
    },
  },

  // Custom budgets for different pages
  budgets: [
    {
      path: '/',
      resourceSizes: [
        { resourceType: 'script', budget: 400 },
        { resourceType: 'stylesheet', budget: 100 },
        { resourceType: 'image', budget: 500 },
        { resourceType: 'font', budget: 150 },
        { resourceType: 'total', budget: 1000 },
      ],
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'stylesheet', budget: 5 },
        { resourceType: 'image', budget: 20 },
        { resourceType: 'font', budget: 3 },
        { resourceType: 'third-party', budget: 5 },
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'cumulative-layout-shift', budget: 0.1 },
        { metric: 'total-blocking-time', budget: 300 },
        { metric: 'speed-index', budget: 3000 },
      ],
    },
    {
      path: '/learn',
      resourceSizes: [
        { resourceType: 'script', budget: 350 },
        { resourceType: 'total', budget: 800 },
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 1800 },
        { metric: 'largest-contentful-paint', budget: 2200 },
      ],
    },
    {
      path: '/code',
      resourceSizes: [
        { resourceType: 'script', budget: 800 }, // Monaco Editor is heavy
        { resourceType: 'total', budget: 1500 },
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 2500 },
        { metric: 'largest-contentful-paint', budget: 4000 },
      ],
    },
    {
      path: '/dashboard',
      resourceSizes: [
        { resourceType: 'script', budget: 450 },
        { resourceType: 'total', budget: 1200 },
      ],
      timings: [
        { metric: 'first-contentful-paint', budget: 2000 },
        { metric: 'largest-contentful-paint', budget: 2800 },
      ],
    },
  ],

  // Plugins configuration
  plugins: [
    // Add custom plugins here if needed
  ],

  // Custom audit configuration
  extends: [
    // You can extend from preset configurations
    // 'lighthouse:default',
  ],

  // Settings for different environments
  environments: {
    development: {
      collect: {
        numberOfRuns: 1,
        settings: {
          onlyCategories: ['performance'],
        },
      },
      assert: {
        assertions: {
          'categories:performance': ['warn', { minScore: 0.7 }],
        },
      },
    },
    staging: {
      collect: {
        numberOfRuns: 2,
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.8 }],
          'categories:accessibility': ['error', { minScore: 0.9 }],
        },
      },
    },
    production: {
      collect: {
        numberOfRuns: 5,
      },
      assert: {
        assertions: {
          'categories:performance': ['error', { minScore: 0.9 }],
          'categories:accessibility': ['error', { minScore: 0.95 }],
          'categories:best-practices': ['error', { minScore: 0.95 }],
          'categories:seo': ['error', { minScore: 0.95 }],
          'categories:pwa': ['error', { minScore: 0.85 }],
        },
      },
    },
  },
};
