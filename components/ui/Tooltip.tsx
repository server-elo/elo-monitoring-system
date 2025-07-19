import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}

const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TooltipPrimitive.Provider delayDuration={300} skipDelayDuration={100}>
    {children}
  </TooltipPrimitive.Provider>
);

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  side = 'top',
  align = 'center',
  delayDuration = 300,
  disabled = false,
  className = '',
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <AnimatePresence>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={8}
            className={`
              z-50 overflow-hidden rounded-lg bg-brand-bg-dark border border-brand-bg-light/20
              px-3 py-2 text-sm text-brand-text-primary shadow-lg
              animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out 
              data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
              data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2
              data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2
              ${className}
            `}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {content}
              <TooltipPrimitive.Arrow className="fill-brand-bg-dark border-brand-bg-light/20" />
            </motion.div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </AnimatePresence>
    </TooltipPrimitive.Root>
  );
};

export { Tooltip, TooltipProvider };
export default Tooltip;
