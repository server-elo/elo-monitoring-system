'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'light'
  blur?: 'sm' | 'md' | 'lg'
  intensity?: 'low' | 'medium' | 'high'
}

export const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  (
    {
      className,
      variant = 'default',
      blur = 'md',
      intensity = 'medium',
      children,
      ...props
    },
    ref,
  ) => {
    const variants = {
      default: 'bg-white/10 backdrop-blur-md border-white/20',
      dark: 'bg-black/20 backdrop-blur-lg border-black/30',
      light: 'bg-white/30 backdrop-blur-sm border-white/40',
    }
    const blurs = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
    }
    const intensities = {
      low: 'bg-opacity-5',
      medium: 'bg-opacity-10',
      high: 'bg-opacity-20',
    }
    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-lg border',
          variants[variant],
          blurs[blur],
          intensities[intensity],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
Glass.displayName = 'Glass'

// Export aliases for compatibility
export const GlassCard = Glass
export const GlassContainer = Glass
export const Glassmorphism = Glass
