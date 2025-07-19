/**
 * Lighthouse CI Configuration
 * 
 * Configures Lighthouse audits for performance monitoring
 * with custom budgets and assertions for the Solidity Learning Platform.
 */

module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3, // Run multiple times for consistency
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000', // Home page
        'http://localhost:3000/lessons', // Lessons page
        'http://localhost:3000/dashboard', // Dashboard
        'http://localhost:3000/playground', // Code playground
        'http://localhost:3000/achievements' // Achievements
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        emulatedFormFactor: 'mobile', // Test mobile performance
        throttling: {
          rttMs: 150,
          throughputKbps: 1600, // Slow 3G
          cpuSlowdownMultiplier: 4
        }
      }
    },
    assert: {
      assertions: {
        // Performance budgets
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3500 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 102400 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1048576 }], // 1MB
        'resource-summary:font:size': ['warn', { maxNumericValue: 256000 }], // 250KB
        'resource-summary:total:size': ['error', { maxNumericValue: 2097152 }], // 2MB

        // Performance metrics
        'interactive': ['error', { maxNumericValue: 4000 }],
        'max-potential-fid': ['error', { maxNumericValue: 130 }],
        'server-response-time': ['error', { maxNumericValue: 500 }],

        // Best practices
        'uses-text-compression': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'warn',
        'offscreen-images': 'warn',
        'render-blocking-resources': 'warn',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',

        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',

        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',

        // PWA
        'is-on-https': 'warn',
        'service-worker': 'warn',
        'viewport': 'error',
        'apple-touch-icon': 'warn',
        'themed-omnibox': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lighthouse-ci.db'
      }
    }
  }
};