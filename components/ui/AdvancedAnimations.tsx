import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Advanced Glass Card with 3D tilt effect
interface TiltGlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'heavy';
}

const TiltGlassCard: React.FC<TiltGlassCardProps> = ({
  children,
  className = '',
  intensity = 'medium',
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['17.5deg', '-17.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-17.5deg', '17.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const blurIntensities = {
    light: 'backdrop-blur-sm',
    medium: 'backdrop-blur-md',
    heavy: 'backdrop-blur-lg',
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: 'preserve-3d',
      }}
      className={`
        relative p-6 rounded-xl bg-white/10 border border-white/20 ${blurIntensities[intensity]}
        shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer
        ${className}
      `}
    >
      {/* Enhanced glass shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 rounded-xl pointer-events-none"
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          transform: 'translateZ(75px)',
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </motion.div>
  );
};

// Morphing Neumorphic Button
interface MorphButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const MorphButton: React.FC<MorphButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    primary: 'bg-brand-primary-200 text-brand-primary-800',
    secondary: 'bg-gray-200 text-gray-800',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      className={`
        ${variants[variant]} ${sizes[size]}
        font-medium rounded-xl relative overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-brand-primary-500/50
        transition-all duration-200
      `}
      style={{
        boxShadow: isPressed
          ? 'inset 6px 6px 12px rgba(0,0,0,0.15), inset -6px -6px 12px rgba(255,255,255,0.8)'
          : isHovered
          ? '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.9)'
          : '6px 6px 12px rgba(0,0,0,0.15), -6px -6px 12px rgba(255,255,255,0.8)',
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {/* Morphing background effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
        animate={{
          opacity: isHovered ? 0.6 : 0.3,
          scale: isPressed ? 0.95 : 1,
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/10 rounded-xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isPressed ? 1 : 0,
          opacity: isPressed ? 0.3 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </motion.button>
  );
};

// Liquid Glass Loading Animation
const LiquidGlassLoader: React.FC = () => {
  return (
    <div className="relative w-24 h-24 mx-auto">
      {/* Glass container */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
        {/* Liquid animation */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-primary-400/60 to-brand-primary-300/40 rounded-full"
          animate={{
            height: ['20%', '80%', '20%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Bubbles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/40 rounded-full"
            style={{
              left: `${30 + i * 20}%`,
              bottom: '10%',
            }}
            animate={{
              y: [-40, -60],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      
      {/* Rotating ring */}
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-white/40 rounded-full"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

// Floating Glass Panel
interface FloatingGlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

const FloatingGlassPanel: React.FC<FloatingGlassPanelProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      className={`
        relative p-6 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl
        shadow-2xl ${className}
      `}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        y: -5,
        transition: { duration: 0.2 },
      }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-brand-primary-500/10 rounded-2xl"
        animate={{
          background: [
            'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(139,92,246,0.1) 100%)',
            'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)',
            'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(139,92,246,0.1) 100%)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// Neumorphic Progress Ring
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const NeumorphicProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = '#8B5CF6',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="relative bg-gray-200 rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        boxShadow: 'inset 6px 6px 12px rgba(0,0,0,0.15), inset -6px -6px 12px rgba(255,255,255,0.8)',
      }}
    >
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="text-2xl font-bold text-gray-800"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
};

export {
  TiltGlassCard,
  MorphButton,
  LiquidGlassLoader,
  FloatingGlassPanel,
  NeumorphicProgressRing,
};

export default {
  TiltGlassCard,
  MorphButton,
  LiquidGlassLoader,
  FloatingGlassPanel,
  NeumorphicProgressRing,
};
