'use client';

;
import { ErrorProvider } from '@/lib/errors/ErrorContext';
import { AuthTesting } from '@/components/auth/AuthTesting';

export default function AuthTestingPage() {
  return (
    <ErrorProvider>
      <AuthTesting />
    </ErrorProvider>
  );
}
