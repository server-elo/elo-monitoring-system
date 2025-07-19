'use client';

;
import { ErrorProvider } from '@/lib/errors/ErrorContext';
import { ErrorTesting } from '@/components/ui/ErrorTesting';

export default function ErrorTestingPage() {
  return (
    <ErrorProvider>
      <ErrorTesting />
    </ErrorProvider>
  );
}
