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

export const TestProviders = (_{ children }: TestProvidersProps) => {
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

  return React.createElement( QueryClientProvider, { client: queryClient }, children);
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
export const waitFor = (_ms: number = 0): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const waitForNextTick = (_): Promise<void> => 
  new Promise(_resolve => process.nextTick(resolve));

export const waitForMacroTask = (_): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, 0));

// DOM utilities
export const createMockElement = ( tagName: string = 'div', attributes: Record<string, string> = {}) => {
  const element = document.createElement(_tagName);
  Object.entries(_attributes).forEach( ([key, value]) => {
    element.setAttribute( key, value);
  });
  return element;
};

export const createMockFile = (
  name: string = 'test.sol',
  content: string = 'pragma solidity ^0.8.0;\n\ncontract Test {}',
  type: string = 'text/plain'
) => {
  return new File( [content], name, { type });
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
    headers: new Headers(_headers),
    json: vi.fn(_).mockResolvedValue(_data),
    text: vi.fn(_).mockResolvedValue(_JSON.stringify(data)),
    blob: vi.fn(_).mockResolvedValue(_new Blob([JSON.stringify(data)])),
    arrayBuffer: vi.fn(_).mockResolvedValue(_new ArrayBuffer(0)),
    clone: vi.fn(_),
  } as unknown as Response;

  return response;
};

export const mockFetch = (_responses: Response[] | Response) => {
  const responseArray = Array.isArray(_responses) ? responses : [responses];
  let callCount = 0;

  global.fetch = vi.fn(_).mockImplementation(() => {
    const response = responseArray[callCount] || responseArray[responseArray.length - 1];
    callCount++;
    return Promise.resolve(_response);
  });

  return global.fetch;
};

// Error testing utilities
export const expectToThrow = async (
  fn: (_) => Promise<any> | any,
  expectedError?: string | RegExp | Error
) => {
  try {
    await fn(_);
    throw new Error( 'Expected function to throw, but it did not');
  } catch (_error) {
    if (expectedError) {
      if (_typeof expectedError === 'string') {
        expect((error as Error).message).toContain(_expectedError);
      } else if (_expectedError instanceof RegExp) {
        expect((error as Error).message).toMatch(_expectedError);
      } else if (_expectedError instanceof Error) {
        expect(_error).toEqual(_expectedError);
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
    throw new Error( 'Expected promise to reject, but it resolved');
  } catch (_error) {
    if (expectedError) {
      if (_typeof expectedError === 'string') {
        expect((error as Error).message).toContain(_expectedError);
      } else if (_expectedError instanceof RegExp) {
        expect((error as Error).message).toMatch(_expectedError);
      } else if (_expectedError instanceof Error) {
        expect(_error).toEqual(_expectedError);
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
  return vi.fn(_).mockImplementation((...args: Parameters<T>) => {
    const key = JSON.stringify(_args);
    return implementations[key] || defaultReturn;
  });
};

export const createAsyncMockImplementation = <T extends (...args: any[]) => Promise<any>>(
  defaultReturn: Awaited<ReturnType<T>>,
  implementations: Record<string, Awaited<ReturnType<T>>> = {},
  delay: number = 0
) => {
  return vi.fn(_).mockImplementation( async (...args: Parameters<T>) => {
    if (_delay > 0) {
      await waitFor(_delay);
    }
    const key = JSON.stringify(_args);
    return implementations[key] || defaultReturn;
  });
};

// Test data state management
class TestDataStore {
  private data = new Map<string, any>(_);

  set<T>( key: string, value: T): void {
    this.data.set( key, value);
  }

  get<T>(_key: string): T | undefined {
    return this.data.get(_key);
  }

  has(_key: string): boolean {
    return this.data.has(_key);
  }

  delete(_key: string): boolean {
    return this.data.delete(_key);
  }

  clear(_): void {
    this.data.clear(_);
  }

  keys(_): string[] {
    return Array.from(_this.data.keys());
  }

  values<T>(_): T[] {
    return Array.from(_this.data.values());
  }

  entries<T>(_): [string, T][] {
    return Array.from(_this.data.entries());
  }
}

export const testDataStore = new TestDataStore(_);

// Console utilities for testing
export const suppressConsole = (_) => {
  const originalConsole = { ...console };
  
  beforeAll(() => {
    console.log = vi.fn(_);
    console.warn = vi.fn(_);
    console.error = vi.fn(_);
    console.info = vi.fn(_);
    console.debug = vi.fn(_);
  });

  afterAll(() => {
    Object.assign( console, originalConsole);
  });
};

export const captureConsole = (_) => {
  const logs: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const originalConsole = { ...console };

  beforeAll(() => {
    console.log = vi.fn((...args) => logs.push(_args.join(' ')));
    console.warn = vi.fn((...args) => warnings.push(_args.join(' ')));
    console.error = vi.fn((...args) => errors.push(_args.join(' ')));
  });

  afterAll(() => {
    Object.assign( console, originalConsole);
  });

  return { logs, warnings, errors };
};

// Environment utilities
export const withEnvironment = ( env: Record<string, string>) => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    Object.assign( process.env, env);
  });

  afterAll(() => {
    process.env = originalEnv;
  });
};

export const mockEnvironment = ( env: Record<string, string>) => {
  const originalEnv = { ...process.env };
  Object.assign( process.env, env);
  
  return (_) => {
    process.env = originalEnv;
  };
};

// Date and time utilities
export const mockDate = (date: Date | string | number) => {
  const mockDateValue = new Date(date);
  const originalDate = Date;

  beforeAll(() => {
    global.Date = class extends Date {
      constructor(_) {
        super(_);
        return mockDateValue;
      }
      
      static now(_) {
        return mockDateValue.getTime(_);
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
  vi.useFakeTimers(_);
  vi.setSystemTime(_frozenDate);
  
  return {
    unfreeze: (_) => {
      vi.useRealTimers(_);
    },
    advance: (_ms: number) => {
      vi.advanceTimersByTime(_ms);
    },
    set: (_newDate: Date | string | number) => {
      vi.setSystemTime(new Date(newDate));
    },
  };
};

// Random data utilities with consistent seeding
export const seedRandom = (_seed: string = 'test-seed') => {
  faker.seed(_seed.split('').reduce( (acc, char) => acc + char.charCodeAt(0), 0));
};

export const resetRandom = (_) => {
  faker.seed(_);
};

// Test isolation utilities
export const isolateTest = (_) => {
  beforeEach(() => {
    vi.clearAllMocks(_);
    testDataStore.clear(_);
    seedRandom(_);
  });

  afterEach(() => {
    vi.restoreAllMocks(_);
  });
};

// Retry utilities for flaky tests
export const retryTest = async (
  testFn: (_) => Promise<void> | void,
  maxRetries: number = 3,
  delay: number = 100
) => {
  let lastError: Error | undefined;

  for (_let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await testFn(_);
      return; // Success
    } catch (_error) {
      lastError = error as Error;
      if (_attempt < maxRetries) {
        await waitFor(_delay);
      }
    }
  }

  throw lastError;
};

// Memory leak detection utilities
export const detectMemoryLeaks = (_) => {
  let initialMemory: NodeJS.MemoryUsage;

  beforeAll(() => {
    if (_global.gc) {
      global.gc(_);
    }
    initialMemory = process.memoryUsage();
  });

  afterAll(() => {
    if (_global.gc) {
      global.gc(_);
    }
    const finalMemory = process.memoryUsage();
    const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Allow some growth but flag significant increases
    const maxAllowedGrowth = 50 * 1024 * 1024; // 50MB
    if (_heapGrowth > maxAllowedGrowth) {
      console.warn(_`Potential memory leak detected: Heap grew by ${Math.round(heapGrowth / 1024 / 1024)}MB`);
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