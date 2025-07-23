"use client"

import { ReactElement, ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactElement;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps): ReactElement {
  // Simplified protected route - in production, add actual auth logic
  return <>{children}</>;
}

export default ProtectedRoute;