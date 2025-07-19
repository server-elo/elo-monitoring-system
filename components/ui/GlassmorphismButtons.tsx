'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { EnhancedButton, EnhancedButtonProps } from './EnhancedButton';
import { cn } from '@/lib/utils';

// Glassmorphism button variants
export interface GlassmorphismButtonProps extends Omit<EnhancedButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger';
  intensity?: 'light' | 'medium' | 'heavy';
  tint?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'neutral';
  glow?: boolean;
  frosted?: boolean;
}

const glassVariants = {
  primary: {
    base: 'bg-blue-500/20 border-blue-400/30 text-blue-100 hover:bg-blue-500/30',
    glow: 'shadow-blue-500/25'
  },
  secondary: {
    base: 'bg-purple-500/20 border-purple-400/30 text-purple-100 hover:bg-purple-500/30',
    glow: 'shadow-purple-500/25'
  },
  accent: {
    base: 'bg-pink-500/20 border-pink-400/30 text-pink-100 hover:bg-pink-500/30',
    glow: 'shadow-pink-500/25'
  },
  neutral: {
    base: 'bg-white/10 border-white/20 text-white hover:bg-white/20',
    glow: 'shadow-white/25'
  },
  success: {
    base: 'bg-green-500/20 border-green-400/30 text-green-100 hover:bg-green-500/30',
    glow: 'shadow-green-500/25'
  },
  warning: {
    base: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-100 hover:bg-yellow-500/30',
    glow: 'shadow-yellow-500/25'
  },
  danger: {
    base: 'bg-red-500/20 border-red-400/30 text-red-100 hover:bg-red-500/30',
    glow: 'shadow-red-500/25'
  }
};

const intensityClasses = {
  light: 'backdrop-blur-sm',
  medium: 'backdrop-blur-md',
  heavy: 'backdrop-blur-lg'
};

export function GlassmorphismButton({
  variant = 'primary',
  intensity = 'medium',
  tint,
  glow = false,
  frosted = true,
  className,
  children,
  ...props
}: GlassmorphismButtonProps) {
  const variantConfig = glassVariants[variant];
  
  return (
    <EnhancedButton
      {...props}
      className={cn(
        // Base glassmorphism styles
        'relative border rounded-lg font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent',
        
        // Backdrop blur intensity
        frosted && intensityClasses[intensity],
        
        // Variant-specific styles
        variantConfig.base,
        
        // Glow effect
        glow && `shadow-lg ${variantConfig.glow}`,
        
        // Focus ring color
        `focus:ring-${variant === 'neutral' ? 'white' : variant}-500/50`,
        
        className
      )}
      glowEffect={glow}
      rippleEffect
      touchTarget
      showFeedback
    >
      {/* Glass shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 rounded-lg pointer-events-none" />
      
      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </EnhancedButton>
  );
}

// Neumorphism button variants
export interface NeumorphismButtonProps extends Omit<EnhancedButtonProps, 'variant'> {
  variant?: 'raised' | 'pressed' | 'flat';
  colorScheme?: 'light' | 'dark';
  intensity?: 'subtle' | 'medium' | 'strong';
}

const neumorphismVariants = {
  light: {
    raised: 'bg-gray-100 shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]',
    pressed: 'bg-gray-100 shadow-[inset_8px_8px_16px_#d1d9e6,inset_-8px_-8px_16px_#ffffff]',
    flat: 'bg-gray-100 shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]'
  },
  dark: {
    raised: 'bg-gray-800 shadow-[8px_8px_16px_#1a1a1a,-8px_-8px_16px_#2a2a2a] hover:shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#2a2a2a]',
    pressed: 'bg-gray-800 shadow-[inset_8px_8px_16px_#1a1a1a,inset_-8px_-8px_16px_#2a2a2a]',
    flat: 'bg-gray-800 shadow-[4px_4px_8px_#1a1a1a,-4px_-4px_8px_#2a2a2a]'
  }
};

export function NeumorphismButton({
  variant = 'raised',
  colorScheme = 'light',
  intensity = 'medium',
  className,
  children,
  ...props
}: NeumorphismButtonProps) {
  const variantConfig = neumorphismVariants[colorScheme][variant];
  
  return (
    <EnhancedButton
      {...props}
      className={cn(
        // Base neumorphism styles
        'relative border-none rounded-xl font-medium transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        
        // Color scheme
        colorScheme === 'light' ? 'text-gray-700 focus:ring-blue-500' : 'text-gray-300 focus:ring-blue-400',
        
        // Variant-specific shadows
        variantConfig,
        
        className
      )}
      rippleEffect
      touchTarget
      showFeedback
    >
      {children}
    </EnhancedButton>
  );
}

// Preset glassmorphism button components
export function GlassPrimaryButton(props: Omit<GlassmorphismButtonProps, 'variant'>) {
  return (
    <GlassmorphismButton
      {...props}
      variant="primary"
      glow
      intensity="medium"
    />
  );
}

export function GlassSecondaryButton(props: Omit<GlassmorphismButtonProps, 'variant'>) {
  return (
    <GlassmorphismButton
      {...props}
      variant="secondary"
      intensity="light"
    />
  );
}

export function GlassSuccessButton(props: Omit<GlassmorphismButtonProps, 'variant'>) {
  return (
    <GlassmorphismButton
      {...props}
      variant="success"
      glow
      intensity="medium"
    />
  );
}

export function GlassDangerButton(props: Omit<GlassmorphismButtonProps, 'variant'>) {
  return (
    <GlassmorphismButton
      {...props}
      variant="danger"
      glow
      intensity="medium"
    />
  );
}

// Floating action button with glassmorphism
export function GlassFloatingActionButton(props: GlassmorphismButtonProps) {
  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <GlassmorphismButton
        {...props}
        className={cn(
          'w-14 h-14 rounded-full p-0 flex items-center justify-center',
          props.className
        )}
        variant="primary"
        glow
        intensity="heavy"
        touchTarget
        tooltip="Floating action"
      />
    </motion.div>
  );
}

// Card with glassmorphism buttons
export function GlassButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'md',
  className
}: {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6'
  };

  return (
    <div className={cn(
      'flex',
      orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
}

// Interactive button showcase
export function ButtonShowcase() {
  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Enhanced Button System</h1>
        <p className="text-gray-300">Comprehensive button components with glassmorphism, accessibility, and async handling</p>
      </div>

      {/* Glassmorphism Buttons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Glassmorphism Buttons</h2>
        <GlassButtonGroup>
          <GlassPrimaryButton>Primary</GlassPrimaryButton>
          <GlassSecondaryButton>Secondary</GlassSecondaryButton>
          <GlassSuccessButton>Success</GlassSuccessButton>
          <GlassDangerButton>Danger</GlassDangerButton>
        </GlassButtonGroup>
      </div>

      {/* Neumorphism Buttons */}
      <div className="space-y-4 p-6 bg-gray-100 rounded-xl">
        <h2 className="text-2xl font-semibold text-gray-800">Neumorphism Buttons</h2>
        <GlassButtonGroup>
          <NeumorphismButton variant="raised">Raised</NeumorphismButton>
          <NeumorphismButton variant="pressed">Pressed</NeumorphismButton>
          <NeumorphismButton variant="flat">Flat</NeumorphismButton>
        </GlassButtonGroup>
      </div>

      {/* Floating Action Button */}
      <GlassFloatingActionButton>
        +
      </GlassFloatingActionButton>
    </div>
  );
}
