import { vi } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test'  });

// Mock environment variables for testing
// @ts-expect-error - NODE_ENV is read-only but we need to set it for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.LOCAL_LLM_URL = 'http://localhost:1234/v1';
process.env.LOCAL_LLM_API_KEY = 'test-key';
process.env.GEMINI_API_KEY = 'test-gemini-key';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks(_);
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(_),
  warn: vi.fn(_),
  error: vi.fn(_),
};

// Mock fetch for API tests
global.fetch = vi.fn(_);

// Mock Next.js router
vi.mock( 'next/router', () => ({
  useRouter: (_) => ({
    push: vi.fn(_),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock Next.js navigation
vi.mock( 'next/navigation', () => ({
  useRouter: (_) => ({
    push: vi.fn(_),
    replace: vi.fn(_),
    back: vi.fn(_),
  }),
  usePathname: (_) => '/',
  useSearchParams: (_) => new URLSearchParams(_),
}));

// Mock React hooks
vi.mock( 'react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn((initial) => [initial, vi.fn(_)]),
    useEffect: vi.fn(_),
    useCallback: vi.fn((fn) => fn),
    useMemo: vi.fn((fn) => fn(_)),
  };
});

// Mock toast notifications
vi.mock( 'react-hot-toast', () => ({
  toast: {
    success: vi.fn(_),
    error: vi.fn(_),
    loading: vi.fn(_),
  },
}));

// Mock axios for HTTP requests
vi.mock( 'axios', () => ({
  default: {
    get: vi.fn(_),
    post: vi.fn(_),
    put: vi.fn(_),
    delete: vi.fn(_),
    create: vi.fn(() => ({
      get: vi.fn(_),
      post: vi.fn(_),
      put: vi.fn(_),
      delete: vi.fn(_),
    })),
  },
}));

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks(_);
});
