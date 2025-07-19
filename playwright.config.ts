import { defineConfig, devices } from '@playwright/test';

/**
 * Comprehensive Playwright Configuration for Solidity Learning Platform
 * Covers E2E testing across multiple browsers, devices, and scenarios
 */

export default defineConfig({
  // Test directory
  testDir: './__tests__/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['line'],
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Global timeout for each test
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Locale
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // Permissions
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },

  // Configure projects for major browsers
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // Desktop Chrome
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: '__tests__/e2e/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Desktop Firefox
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: '__tests__/e2e/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Desktop Safari
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile Chrome
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile Safari
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Tablet
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Microsoft Edge
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Google Chrome
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Performance testing project
    {
      name: 'performance',
      testMatch: /.*\.perf\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Security testing project
    {
      name: 'security',
      testMatch: /.*\.security\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // No auth state for security tests
      },
    },
    
    // API testing project
    {
      name: 'api',
      testMatch: /.*\.api\.ts/,
      use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
      },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
    },
  },

  // Global setup and teardown
  globalSetup: require.resolve('./__tests__/e2e/global-setup.ts'),
  globalTeardown: require.resolve('./__tests__/e2e/global-teardown.ts'),

  // Test timeout
  timeout: 60 * 1000, // 1 minute per test

  // Expect timeout
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
  },

  // Output directory
  outputDir: 'test-results/',

  // Maximum failures
  maxFailures: process.env.CI ? 10 : undefined,
});
