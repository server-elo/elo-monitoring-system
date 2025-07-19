const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  
  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/__tests__/fixtures/',
    '<rootDir>/__tests__/utils/',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
    '!**/*.config.{js,ts}',
    '!**/middleware.ts',
    '!app/layout.tsx',
    '!app/loading.tsx',
    '!app/error.tsx',
    '!app/not-found.tsx',
  ],
  
  // Coverage thresholds per PRP requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Security modules (95% coverage)
    'lib/security/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'lib/auth/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Core API modules (90% coverage)
    'lib/api/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'app/api/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Business logic modules (85% coverage)
    'lib/learning/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'lib/achievements/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'lib/curriculum/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // UI components (80% coverage)
    'components/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Database operations (95% coverage)
    'lib/database/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // Cache systems (90% coverage)
    'lib/cache/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Real-time systems (85% coverage)
    'lib/collaboration/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    'lib/websocket/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover',
  ],
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Global test setup
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
  
  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/__tests__/unit/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/__tests__/integration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'api',
      testMatch: ['<rootDir>/__tests__/api/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'database',
      testMatch: ['<rootDir>/__tests__/database/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'security',
      testMatch: ['<rootDir>/__tests__/security/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testTimeout: 45000,
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/__tests__/performance/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testTimeout: 60000,
    },
    {
      displayName: 'collaboration',
      testMatch: ['<rootDir>/__tests__/collaboration/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testTimeout: 45000,
    },
  ],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Solidity Learning Platform - Test Report',
      },
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Error handling
  errorOnDeprecated: true,
  
  // Snapshot serializers
  snapshotSerializers: ['enzyme-to-json/serializer'],
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Notify mode
  notify: false,
  notifyMode: 'failure-change',
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
