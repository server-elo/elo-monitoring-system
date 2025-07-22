import React, { ReactElement } from 'react';
"use client";
import * as React from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";
export interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  touchTarget?: boolean;
}
export const EnhancedButton = React.forwardRef<
HTMLButtonElement,
EnhancedButtonProps
>(
  (
    {
      loading: false,
      loadingText = "Loading...",
      touchTarget: false,
      children,
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
      ref={ref}
      className={cn(touchTarget && "min-h-[44px] min-w-[44px]", className)}
      disabled={disabled || loading}
      {...props}>{loading ? loadingText : children}
      </Button>
    );
  },
);
EnhancedButton.displayName = "EnhancedButton";
export const AsyncSubmitButton = React.forwardRef<
HTMLButtonElement,
{
  onSubmit: () => Promise<void>;
  submitText: string;
  loadingText: string;
  disabled?: boolean;
  className?: string;
  touchTarget?: boolean;
  asyncOptions?: unknown;
}
>(
  (
    {
      onSubmit,
      submitText,
      loadingText,
      disabled,
      className,
      touchTarget,
      ...props
    },
    ref,
  ) => {
    const [loading, setLoading] = React.useState(false);
    const handleClick = async () => {
      setLoading(true);
      try {
        await onSubmit();
      } finally {
        setLoading(false);
      }
    };
    return (
      <EnhancedButton
      ref={ref}
      onClick={handleClick}
      loading={loading}
      loadingText={loadingText}
      disabled={disabled || loading}
      className={className}
      touchTarget={touchTarget}
      {...props}>{submitText}
      </EnhancedButton>
    );
  },
);
AsyncSubmitButton.displayName = "AsyncSubmitButton";
