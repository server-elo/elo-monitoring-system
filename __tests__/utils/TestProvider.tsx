/**
 * Test Provider Component
 * Wraps components with necessary providers for testing
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { vi } from 'vitest';

// Mock session for testing
const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: null
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
};

// Create a test query client with disabled retries and cache
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

interface TestProviderProps {
  children: React.ReactNode;
  session?: any;
  queryClient?: QueryClient;
}

export function TestProvider({ 
  children, 
  session = mockSession, 
  queryClient = createTestQueryClient() 
}: TestProviderProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}

// Helper to create a test provider with custom options
export function createTestProvider(options: Partial<TestProviderProps> = {}) {
  return function TestProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
      <TestProvider {...options}>
        {children}
      </TestProvider>
    );
  };
}

// Mock authenticated session provider
export function AuthenticatedProvider({ children }: { children: React.ReactNode }) {
  return (
    <TestProvider session={mockSession}>
      {children}
    </TestProvider>
  );
}

// Mock unauthenticated session provider
export function UnauthenticatedProvider({ children }: { children: React.ReactNode }) {
  return (
    <TestProvider session={null}>
      {children}
    </TestProvider>
  );
}

// Mock admin session provider
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const adminSession = {
    ...mockSession,
    user: {
      ...mockSession.user,
      role: 'ADMIN'
    }
  };

  return (
    <TestProvider session={adminSession}>
      {children}
    </TestProvider>
  );
}

// Test utilities for session management
export const testUtils = {
  mockSession,
  
  createMockSession: (overrides = {}) => ({
    ...mockSession,
    ...overrides
  }),
  
  createExpiredSession: () => ({
    ...mockSession,
    expires: new Date(Date.now() - 1000).toISOString() // Expired 1 second ago
  }),
  
  createAdminSession: () => ({
    ...mockSession,
    user: {
      ...mockSession.user,
      role: 'ADMIN'
    }
  })
};