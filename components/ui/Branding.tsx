import React from 'react';
import { motion } from 'framer-motion';

// Logo Component
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  animated = true,
}) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const iconVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.05, rotate: 5 },
    tap: { scale: 0.95 },
  };

  const LogoIcon = () => (
    <motion.div
      className="relative"
      variants={animated ? iconVariants : {}}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      transition={{ duration: 0.2 }}
    >
      <svg
        className={`${sizeClasses[size]} w-auto text-brand-primary-500`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Solidity-inspired geometric logo */}
        <motion.path
          d="M20 4L32 16L20 28L8 16L20 4Z"
          fill="currentColor"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />
        <motion.path
          d="M20 12L28 20L20 28L12 20L20 12Z"
          fill="url(#gradient)"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Glow effect */}
      {animated && (
        <motion.div
          className="absolute inset-0 bg-brand-primary-500 rounded-full opacity-20 blur-lg"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.div>
  );

  const LogoText = () => (
    <motion.span
      className={`font-bold text-gradient ${textSizes[size]}`}
      initial={animated ? { opacity: 0, x: -20 } : {}}
      animate={animated ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      Solidity DevPath
    </motion.span>
  );

  if (variant === 'icon') {
    return <LogoIcon />;
  }

  if (variant === 'text') {
    return <LogoText />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon />
      <LogoText />
    </div>
  );
};

// Brand Colors Showcase
const BrandColors: React.FC = () => {
  const colors = [
    { name: 'Primary', class: 'bg-brand-primary-500', hex: '#8b5cf6' },
    { name: 'Accent', class: 'bg-brand-accent-500', hex: '#d946ef' },
    { name: 'Success', class: 'bg-brand-success-500', hex: '#22c55e' },
    { name: 'Warning', class: 'bg-brand-warning-500', hex: '#f59e0b' },
    { name: 'Error', class: 'bg-brand-error-500', hex: '#ef4444' },
    { name: 'Info', class: 'bg-brand-info-500', hex: '#3b82f6' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {colors.map((color, index) => (
        <motion.div
          key={color.name}
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className={`w-16 h-16 rounded-lg ${color.class} mx-auto mb-2 shadow-lg`} />
          <p className="text-sm font-medium text-brand-text-primary">{color.name}</p>
          <p className="text-xs text-brand-text-muted">{color.hex}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Typography Showcase
const Typography: React.FC = () => {
  const textStyles = [
    { name: 'Heading 1', class: 'text-4xl font-bold', text: 'The quick brown fox' },
    { name: 'Heading 2', class: 'text-3xl font-bold', text: 'The quick brown fox' },
    { name: 'Heading 3', class: 'text-2xl font-semibold', text: 'The quick brown fox' },
    { name: 'Heading 4', class: 'text-xl font-semibold', text: 'The quick brown fox' },
    { name: 'Body Large', class: 'text-lg', text: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Body', class: 'text-base', text: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Body Small', class: 'text-sm', text: 'The quick brown fox jumps over the lazy dog' },
    { name: 'Caption', class: 'text-xs text-brand-text-muted', text: 'The quick brown fox jumps over the lazy dog' },
  ];

  return (
    <div className="space-y-6">
      {textStyles.map((style, index) => (
        <motion.div
          key={style.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <p className="text-xs text-brand-text-muted mb-1">{style.name}</p>
          <p className={`${style.class} text-brand-text-primary`}>{style.text}</p>
        </motion.div>
      ))}
    </div>
  );
};

// Icon Library
interface IconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const icons: Record<string, React.ReactNode> = {
    code: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    book: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    quiz: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    trophy: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    chat: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    star: (
      <svg fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    check: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    x: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  };

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {icons[name] || icons.code}
    </span>
  );
};

// Animated Background
const AnimatedBackground: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-accent-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-60 h-60 bg-brand-info-500/5 rounded-full blur-3xl"
          animate={{
            x: [-50, 50, -50],
            y: [-30, 30, -30],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export {
  Logo,
  BrandColors,
  Typography,
  Icon,
  AnimatedBackground,
};

export default Logo;
