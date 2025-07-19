import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp' | 'slideDown';
  duration?: number;
  delay?: number;
}

const transitionVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  variant = 'fade',
  duration = 0.3,
  delay = 0,
}) => {
  return (
    <motion.div
      className={className}
      variants={transitionVariants[variant]}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

// Stagger container for animating lists
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.1,
  delayChildren = 0,
}) => {
  const containerVariants: Variants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
};

// Stagger item for use within StaggerContainer
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = '',
  variant = 'slideUp',
}) => {
  const itemVariants: Variants = {
    initial: transitionVariants[variant].initial,
    animate: transitionVariants[variant].animate,
  };

  return (
    <motion.div
      className={className}
      variants={itemVariants}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

// Animated presence wrapper for route transitions
interface RouteTransitionProps {
  children: React.ReactNode;
  routeKey: string;
  className?: string;
}

const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  routeKey,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        className={className}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Floating animation component
interface FloatingProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'strong';
  duration?: number;
}

const Floating: React.FC<FloatingProps> = ({
  children,
  className = '',
  intensity = 'subtle',
  duration = 3,
}) => {
  const intensityMap = {
    subtle: 5,
    medium: 10,
    strong: 15,
  };

  return (
    <motion.div
      className={className}
      animate={{
        y: [-intensityMap[intensity], intensityMap[intensity]],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// Pulse animation component
interface PulseProps {
  children: React.ReactNode;
  className?: string;
  scale?: [number, number];
  duration?: number;
}

const Pulse: React.FC<PulseProps> = ({
  children,
  className = '',
  scale = [1, 1.05],
  duration = 2,
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        scale,
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
};

// Reveal animation for scroll-triggered animations
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  duration?: number;
  delay?: number;
}

const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  direction = 'up',
  distance = 50,
  duration = 0.6,
  delay = 0,
}) => {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        ...directionMap[direction],
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  RouteTransition,
  Floating,
  Pulse,
  Reveal,
};

export default PageTransition;
