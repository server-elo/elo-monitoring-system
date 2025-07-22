import React, { ComponentType, forwardRef } from "react";
interface ErrorBoundaryConfig {
  name?: string;
  enableRetry?: boolean;
  maxRetries?: number;
  showErrorDetails?: boolean;
}
export function withAuthErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  config: ErrorBoundaryConfig = {},
) {
  const WrappedComponent = forwardRef<unknown, P>((props, ref) => {
    return <Component {...props} ref={ref} />;
  });
  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
