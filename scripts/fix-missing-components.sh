#!/bin/bash
# Phase 1.1: Fix Missing UI Components Script

echo "🔧 Phase 1.1: Resolving missing UI components..."

# Create Glass.tsx as replacement for Glassmorphism
cat > components/ui/Glass.tsx << 'EOF'
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'light'
  blur?: 'sm' | 'md' | 'lg'
}

export const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = 'default', blur = 'md', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg border",
          {
            'default': 'bg-white/10 backdrop-blur-md border-white/20',
            'dark': 'bg-black/20 backdrop-blur-lg border-black/30',
            'light': 'bg-white/30 backdrop-blur-sm border-white/40',
          }[variant],
          {
            'sm': 'backdrop-blur-sm',
            'md': 'backdrop-blur-md',
            'lg': 'backdrop-blur-lg',
          }[blur],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Glass.displayName = "Glass"

export const GlassCard = Glass
export const Glassmorphism = Glass // Alias for compatibility
EOF

echo "✅ Created Glass.tsx component"

# Update all imports from Glassmorphism to Glass
echo "📝 Updating imports from Glassmorphism to Glass..."
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./dist/*" | while read file; do
  if grep -q "from ['\"]\@/components/ui/Glassmorphism['\"]" "$file"; then
    sed -i "s|from '@/components/ui/Glassmorphism'|from '@/components/ui/Glass'|g" "$file"
    sed -i "s|from \"@/components/ui/Glassmorphism\"|from \"@/components/ui/Glass\"|g" "$file"
    echo "  ✓ Updated: $file"
  fi
done

# Create other missing animation components
echo "🎨 Creating missing animation components..."

# AnimatedButton
if [ ! -f "components/ui/AnimatedButton.tsx" ]; then
cat > components/ui/AnimatedButton.tsx << 'EOF'
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Button, ButtonProps } from "./button"

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { animation?: 'scale' | 'glow' | 'pulse' }
>(({ animation = 'scale', ...props }, ref) => {
  const animations = {
    scale: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 }
    },
    glow: {
      whileHover: { boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)" }
    },
    pulse: {
      animate: { scale: [1, 1.05, 1] },
      transition: { repeat: Infinity, duration: 2 }
    }
  };

  return (
    <motion.div {...animations[animation]}>
      <Button ref={ref} {...props} />
    </motion.div>
  );
});
AnimatedButton.displayName = "AnimatedButton"
EOF
echo "  ✓ Created AnimatedButton.tsx"
fi

# Enhanced Button
if [ ! -f "components/ui/EnhancedButton.tsx" ]; then
cat > components/ui/EnhancedButton.tsx << 'EOF'
"use client"

import * as React from "react"
import { Button, ButtonProps } from "./button"
import { cn } from "@/lib/utils"

export interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ loading, loadingText, children, disabled, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading ? (
          <>
            <span className="mr-2 animate-spin">⏳</span>
            {loadingText || "Loading..."}
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)
EnhancedButton.displayName = "EnhancedButton"
EOF
echo "  ✓ Created EnhancedButton.tsx"
fi

# GlassmorphismModal (compatibility)
if [ ! -f "components/ui/GlassmorphismModal.tsx" ]; then
cat > components/ui/GlassmorphismModal.tsx << 'EOF'
"use client"

export { Glass as GlassmorphismModal } from "./Glass"
EOF
echo "  ✓ Created GlassmorphismModal.tsx (alias)"
fi

# Update component index
echo "📚 Updating component index..."
cat > components/ui/index.ts << 'EOF'
// Core UI Components
export * from './button'
export * from './input'
export * from './label'
export * from './card'
export * from './dialog'
export * from './alert'
export * from './badge'
export * from './checkbox'
export * from './select'
export * from './textarea'
export * from './toast'
export * from './toaster'
export * from './use-toast'
export * from './dropdown-menu'
export * from './tabs'
export * from './progress'
export * from './slider'
export * from './switch'
export * from './separator'
export * from './scroll-area'
export * from './avatar'

// Custom Components
export * from './Glass'
export { Glassmorphism } from './Glass' // Compatibility export
export * from './AnimatedButton'
export * from './EnhancedButton'
export * from './LoadingSpinner'
export * from './SkeletonLoader'
export * from './ErrorMessage'
export * from './EmptyState'
export * from './Modal'
export * from './Notification'
EOF

echo "✅ Phase 1.1 Complete: UI components resolved"