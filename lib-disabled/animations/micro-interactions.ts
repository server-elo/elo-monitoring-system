'use client'; import { Variants } from 'framer-motion'; /** * Comprehensive micro-interaction animations for enhanced user engagement * Designed for extended learning sessions with eye-friendly transitions */ // Button hover and click animations
export const buttonVariants: Variants = { const idle = {
  scale: 1,
  boxShadow: '0 4px 6px -1px rgba( 0,
  0,
  0,
  0.1),
  0 2px 4px -1px rgba( 0,
  0,
  0,
  0.06)',
  transition: { duration: 0.2,
  ease: 'easeOut'
}
}, const hover = {
  scale: 1.02,
  boxShadow: '0 10px 15px -3px rgba( 0,
  0,
  0,
  0.1),
  0 4px 6px -2px rgba( 0,
  0,
  0,
  0.05)',
  transition: { duration: 0.2,
  ease: 'easeOut'
}
}, const tap = {
  scale: 0.98,
  transition: { duration: 0.1,
  ease: 'easeInOut'
}
}, const loading = {
  scale: [1,
  1.02,
  1],
  transition: { duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut'
}
}
}; // Card hover animations with glassmorphism enhancement
export const cardVariants: Variants = { const idle = {
  scale: 1,
  rotateY: 0,
  boxShadow: '0 4px 6px -1px rgba( 0,
  0,
  0,
  0.1)',
  backdropFilter: 'blur(10px)',
  transition: { duration: 0.3,
  ease: 'easeOut'
}
}, const hover = {
  scale: 1.03,
  rotateY: 2,
  boxShadow: '0 20px 25px -5px rgba( 0,
  0,
  0,
  0.1),
  0 10px 10px -5px rgba( 0,
  0,
  0,
  0.04)',
  backdropFilter: 'blur(15px)',
  transition: { duration: 0.3,
  ease: 'easeOut'
}
}, const tap = {
  scale: 0.97,
  transition: { duration: 0.1
}
}
}; // Progress bar animations
export const progressVariants: Variants = { initial: { width: 0, opacity: 0 }, animate: (progress: number) => ({ width: `${progress }%`, opacity: 1, transition: { duration: 1.2, ease: 'easeOut' } }), const pulse = {
  opacity: [0.6,
  1,
  0.6],
  transition: { duration: 2,
  repeat: Infinity,
  ease: 'easeInOut'
}
}
}; // Achievement unlock animations
export const achievementVariants: Variants = { const hidden = {
  scale: 0,
  rotate: -180,
  opacity: 0
}, const visible = {
  scale: [0,
  1.2,
  1],
  rotate: [0,
  10,
  0],
  opacity: 1,
  transition: { duration: 0.8,
  ease: 'easeOut',
  times: [0,
  0.6,
  1]
}
}, const celebration = {
  scale: [1,
  1.1,
  1],
  rotate: [0,
  5,
  -5,
  0],
  transition: { duration: 0.6,
  repeat: 3,
  ease: 'easeInOut'
}
}
}; // Loading spinner variants
export const spinnerVariants: Variants = { const spin = {
  rotate: 360,
  transition: { duration: 1,
  repeat: Infinity,
  ease: 'linear'
}
}, const pulse = {
  scale: [1,
  1.2,
  1],
  opacity: [0.5,
  1,
  0.5],
  transition: { duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut'
}
}
}; // Notification slide-in animations
export const notificationVariants: Variants = { const hidden = {
  x: 300,
  opacity: 0,
  scale: 0.8
}, const visible = {
  x: 0,
  opacity: 1,
  scale: 1,
  transition: { type: 'spring',
  stiffness: 300,
  damping: 30
}
}, const exit = {
  x: 300,
  opacity: 0,
  scale: 0.8,
  transition: { duration: 0.3,
  ease: 'easeIn'
}
}
}; // Form field focus animations
export const inputVariants: Variants = { const idle = {
  borderColor: 'rgba( 255,
  255,
  255,
  0.2)',
  boxShadow: '0 0 0 0 rgba( 59,
  130,
  246,
  0)',
  transition: { duration: 0.2
}
}, const focus = {
  borderColor: 'rgba( 59,
  130,
  246,
  0.5)',
  boxShadow: '0 0 0 3px rgba( 59,
  130,
  246,
  0.1)',
  transition: { duration: 0.2
}
}, const error = {
  borderColor: 'rgba( 239,
  68,
  68,
  0.5)',
  boxShadow: '0 0 0 3px rgba( 239,
  68,
  68,
  0.1)',
  transition: { duration: 0.2
}
}, const success = {
  borderColor: 'rgba( 34,
  197,
  94,
  0.5)',
  boxShadow: '0 0 0 3px rgba( 34,
  197,
  94,
  0.1)',
  transition: { duration: 0.2
}
}
}; // Page transition animations
export const pageVariants: Variants = { const initial = {
  opacity: 0,
  y: 20,
  scale: 0.98
}, const animate = {
  opacity: 1,
  y: 0,
  scale: 1,
  transition: { duration: 0.5,
  ease: 'easeOut',
  staggerChildren: 0.1
}
}, const exit = {
  opacity: 0,
  y: -20,
  scale: 0.98,
  transition: { duration: 0.3,
  ease: 'easeIn'
}
}
}; // Stagger animation for lists
export const staggerVariants: Variants = { const animate = {
  transition: { staggerChildren: 0.1,
  delayChildren: 0.2
}
}
}; export const staggerItemVariants: Variants = { const initial = {
  opacity: 0,
  y: 20,
  scale: 0.9
}, const animate = {
  opacity: 1,
  y: 0,
  scale: 1,
  transition: { duration: 0.4,
  ease: 'easeOut'
}
}
}; // Floating action button animations
export const fabVariants: Variants = { const idle = {
  scale: 1,
  rotate: 0,
  boxShadow: '0 4px 12px rgba( 0,
  0,
  0,
  0.15)'
}, const hover = {
  scale: 1.1,
  rotate: 5,
  boxShadow: '0 8px 25px rgba( 0,
  0,
  0,
  0.2)',
  transition: { duration: 0.2
}
}, const tap = {
  scale: 0.95,
  transition: { duration: 0.1
}
}
}; // Tooltip animations
export const tooltipVariants: Variants = { const hidden = {
  opacity: 0,
  scale: 0.8,
  y: 10
}, const visible = {
  opacity: 1,
  scale: 1,
  y: 0,
  transition: { duration: 0.2,
  ease: 'easeOut'
}
}
}; // Modal animations
export const modalVariants: Variants = { const hidden = {
  opacity: 0,
  scale: 0.8,
  y: 50
}, const visible = {
  opacity: 1,
  scale: 1,
  y: 0,
  transition: { type: 'spring',
  stiffness: 300,
  damping: 30
}
}, const exit = {
  opacity: 0,
  scale: 0.8,
  y: 50,
  transition: { duration: 0.2,
  ease: 'easeIn'
}
}
}; // Backdrop animations
export const backdropVariants: Variants = { hidden: { opacity: 0 }, const visible = {
  opacity: 1,
  transition: { duration: 0.3
}
}, const exit = {
  opacity: 0,
  transition: { duration: 0.2
}
}
}; // Code editor animations
export const codeEditorVariants: Variants = { const idle = {
  borderColor: 'rgba( 255,
  255,
  255,
  0.1)',
  boxShadow: '0 0 0 0 rgba( 59,
  130,
  246,
  0)'
}, const focus = {
  borderColor: 'rgba( 59,
  130,
  246,
  0.3)',
  boxShadow: '0 0 0 2px rgba( 59,
  130,
  246,
  0.1)',
  transition: { duration: 0.3
}
}, const success = {
  borderColor: 'rgba( 34,
  197,
  94,
  0.3)',
  boxShadow: '0 0 0 2px rgba( 34,
  197,
  94,
  0.1)',
  transition: { duration: 0.3
}
}, const error = {
  borderColor: 'rgba( 239,
  68,
  68,
  0.3)',
  boxShadow: '0 0 0 2px rgba( 239,
  68,
  68,
  0.1)',
  transition: { duration: 0.3
}
}
}; // Gamification animations
export const xpGainVariants: Variants = { const hidden = {
  opacity: 0,
  y: 0,
  scale: 0.5
}, const visible = {
  opacity: [0,
  1,
  1,
  0],
  y: [0,
  -30,
  -60,
  -100],
  scale: [0.5,
  1.2,
  1,
  0.8],
  transition: { duration: 2,
  times: [0,
  0.2,
  0.8,
  1],
  ease: 'easeOut'
}
}
}; // Collaboration cursor animations
export const cursorVariants: Variants = { const idle = {
  scale: 1,
  opacity: 0.8
}, const active = {
  scale: [1,
  1.2,
  1],
  opacity: [0.8,
  1,
  0.8],
  transition: { duration: 0.6,
  repeat: Infinity,
  ease: 'easeInOut'
}
}
}; // Attention-grabbing pulse for important elements
export const attentionVariants: Variants = { const idle = {
  scale: 1,
  opacity: 1
}, const pulse = {
  scale: [1,
  1.05,
  1],
  opacity: [1,
  0.8,
  1],
  transition: { duration: 2,
  repeat: Infinity,
  ease: 'easeInOut'
}
}, const glow = {
  boxShadow: [ '0 0 5px rgba( 59,
  130,
  246,
  0.3)',
  '0 0 20px rgba( 59,
  130,
  246,
  0.6)',
  '0 0 5px rgba( 59,
  130,
  246,
  0.3)'
  ],
  transition: { duration: 2,
  repeat: Infinity,
  ease: 'easeInOut'
}
}
}; // Utility function to create custom spring transitions
export const createSpringTransition = ( stiffness: 300, damping: 30, mass = 1) => ({ type: 'spring' as const, stiffness, damping, mass
}); // Utility function for eased transitions
export const createEaseTransition = ( duration = 0.3, ease = 'easeOut') => ({ duration, ease
}); // Presets for common animation combinations
export const animationPresets = {
  const gentleHover = { whileHover: { scale: 1.02,
  transition: { duration: 0.2
} }, whileTap: { scale: 0.98, transition: { duration: 0.1 } } }, strongHover: { whileHover: { scale: 1.05, transition: { duration: 0.2 } }, whileTap: { scale: 0.95, transition: { duration: 0.1 } } }, fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.5 } } }, slideInRight: { initial: { opacity: 0, x: 50 }, animate: { opacity: 1, x: 0, transition: { duration: 0.4 } } }, scaleIn: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } } }
};
