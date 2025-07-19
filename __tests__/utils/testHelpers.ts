/**
 * Test Helpers
 * Comprehensive utilities for testing across the platform
 */

import React from 'react';
import { faker } from '@faker-js/faker';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

// Re-export everything from testing utilities
export * from './dataGenerators';
export * from './assertionHelpers';
export * from './performanceHelpers';

// Test wrapper components
interface TestProvidersProps {
  children: ReactNode;
}

export const TestProviders = ({ children }: TestProvidersProps) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return React.createElement(QueryClientProvider, { client: queryClient }, children);
};

// Custom render function with providers
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, {
    wrapper: TestProviders,
    ...options,
  });
};

// Time utilities
export const waitFor = (ms: number = 0): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const waitForNextTick = (): Promise<void> => 
  new Promise(resolve => process.nextTick(resolve));

export const waitForMacroTask = (): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, 0));

// DOM utilities
export const createMockElement = (tagName: string = 'div', attributes: Record<string, string> = {}) => {
  const element = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
};

export const createMockFile = (
  name: string = 'test.sol',
  content: string = 'pragma solidity ^0.8.0;\n\ncontract Test {}',
  type: string = 'text/plain'
) => {
  return new File([content], name, { type });
};

// Mock fetch utilities
export const createMockResponse = <T>(
  data: T,
  status: number = 200,
  headers: Record<string, string> = {}
): Response => {
  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    blob: vi.fn().mockResolvedValue(new Blob([JSON.stringify(data)])),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    clone: vi.fn(),
  } as unknown as Response;

  return response;
};

export const mockFetch = (responses: Response[] | Response) => {
  const responseArray = Array.isArray(responses) ? responses : [responses];
  let callCount = 0;

  global.fetch = vi.fn().mockImplementation(() => {
    const response = responseArray[callCount] || responseArray[responseArray.length - 1];
    callCount++;
    return Promise.resolve(response);
  });

  return global.fetch;
};

// Error testing utilities
export const expectToThrow = async (
  fn: () => Promise<any> | any,
  expectedError?: string | RegExp | Error
) => {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect((error as Error).message).toContain(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect((error as Error).message).toMatch(expectedError);
      } else if (expectedError instanceof Error) {
        expect(error).toEqual(expectedError);
      }
    }
    return error;
  }
};

export const expectToReject = async (
  promise: Promise<any>,
  expectedError?: string | RegExp | Error
) => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect((error as Error).message).toContain(expectedError);
      } else if (expectedError instanceof RegExp) {
        expect((error as Error).message).toMatch(expectedError);
      } else if (expectedError instanceof Error) {
        expect(error).toEqual(expectedError);
      }
    }
    return error;
  }
};

// Mock implementation utilities
export const createMockImplementation = <T extends (...args: any[]) => any>(
  defaultReturn: ReturnType<T>,
  implementations: Record<string, ReturnType<T>> = {}
) => {
  return vi.fn().mockImplementation((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    return implementations[key] || defaultReturn;
  });
};

export const createAsyncMockImplementation = <T extends (...args: any[]) => Promise<any>>(
  defaultReturn: Awaited<ReturnType<T>>,
  implementations: Record<string, Awaited<ReturnType<T>>> = {},
  delay: number = 0
) => {
  return vi.fn().mockImplementation(async (...args: Parameters<T>) => {
    if (delay > 0) {
      await waitFor(delay);
    }
    const key = JSON.stringify(args);
    return implementations[key] || defaultReturn;
  });
};

// Test data state management
class TestDataStore {
  private data = new Map<string, any>();

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  get<T>(key: string): T | undefined {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  delete(key: string): boolean {
    return this.data.delete(key);
  }

  clear(): void {
    this.data.clear();
  }

  keys(): string[] {
    return Array.from(this.data.keys());
  }

  values<T>(): T[] {
    return Array.from(this.data.values());
  }

  entries<T>(): [string, T][] {
    return Array.from(this.data.entries());
  }
}

export const testDataStore = new TestDataStore();

// Console utilities for testing
export const suppressConsole = () => {
  const originalConsole = { ...console };
  
  beforeAll(() => {
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });
};

export const captureConsole = () => {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const originalConsole = { ...console };

  beforeAll(() => {
    console.log = vi.fn((...args) => logs.push(args.join(' ')));
    console.warn = vi.fn((...args) => warnings.push(args.join(' ')));
    console.error = vi.fn((...args) => errors.push(args.join(' ')));
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  return { logs, warnings, errors };
};

// Environment utilities
export const withEnvironment = (env: Record<string, string>) => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    Object.assign(process.env, env);
  });

  afterAll(() => {
    process.env = originalEnv;
  });
};

export const mockEnvironment = (env: Record<string, string>) => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, env);
  
  return () => {
    process.env = originalEnv;
  };
};

// Date and time utilities
export const mockDate = (date: Date | string | number) => {
  const mockDateValue = new Date(date);
  const originalDate = Date;

  beforeAll(() => {
    global.Date = class extends Date {
      constructor() {
        super();
        return mockDateValue;
      }
      
      static now() {
        return mockDateValue.getTime();
      }
    } as any;
  });

  afterAll(() => {
    global.Date = originalDate;
  });

  return mockDateValue;
};

export const freezeTime = (date: Date | string | number = new Date()) => {
  const frozenDate = new Date(date);
  vi.useFakeTimers();
  vi.setSystemTime(frozenDate);
  
  return {
    unfreeze: () => {
      vi.useRealTimers();
    },
    advance: (ms: number) => {
      vi.advanceTimersByTime(ms);
    },
    set: (newDate: Date | string | number) => {
      vi.setSystemTime(new Date(newDate));
    },
  };
};

// Random data utilities with consistent seeding
export const seedRandom = (seed: string = 'test-seed') => {
  faker.seed(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0));
};

export const resetRandom = () => {
  faker.seed();
};

// Test isolation utilities
export const isolateTest = () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testDataStore.clear();
    seedRandom();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
};

// Retry utilities for flaky tests
export const retryTest = async (
  testFn: () => Promise<void> | void,
  maxRetries: number = 3,
  delay: number = 100
) => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await testFn();
      return; // Success
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await waitFor(delay);
      }
    }
  }

  throw lastError;
};

// Memory leak detection utilities
export const detectMemoryLeaks = () => {
  let initialMemory: NodeJS.MemoryUsage;

  beforeAll(() => {
    if (global.gc) {
      global.gc();
    }
    initialMemory = process.memoryUsage();
  });

  afterAll(() => {
    if (global.gc) {
      global.gc();
    }
    const finalMemory = process.memoryUsage();
    const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Allow some growth but flag significant increases
    const maxAllowedGrowth = 50 * 1024 * 1024; // 50MB
    if (heapGrowth > maxAllowedGrowth) {
      console.warn(`Potential memory leak detected: Heap grew by ${Math.round(heapGrowth / 1024 / 1024)}MB`);
    }
  });
};

// Export all utilities as default for convenient importing
export default {
  renderWithProviders,
  waitFor,
  waitForNextTick,
  waitForMacroTask,
  createMockElement,
  createMockFile,
  createMockResponse,
  mockFetch,
  expectToThrow,
  expectToReject,
  createMockImplementation,
  createAsyncMockImplementation,
  testDataStore,
  suppressConsole,
  captureConsole,
  withEnvironment,
  mockEnvironment,
  mockDate,
  freezeTime,
  seedRandom,
  resetRandom,
  isolateTest,
  retryTest,
  detectMemoryLeaks,
};