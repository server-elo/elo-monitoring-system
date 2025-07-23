'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
export interface ErrorMessageProps {
  error: {
    id: string
    message: string
    userMessage: string
  }
  className?: string
}
export function ErrorMessage({ error, className }: ErrorMessageProps): void {
  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 border rounded-lg',
        'bg-red-50 border-red-200 text-red-800',
        'dark:bg-red-950/20 dark:border-red-800/30 dark:text-red-200',
        className,
      )}
    >
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium">
          {error.userMessage || error.message}
        </p>
      </div>
    </div>
  )
}
