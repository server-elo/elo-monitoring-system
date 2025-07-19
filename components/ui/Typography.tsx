'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  gradient?: boolean;
  eyeFriendly?: boolean;
}

// Heading components with optimal typography
export function H1({ children, className, animate = false, gradient = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.h1 : 'h1';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  } : {};

  return (
    <Component
      className={cn(
        'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
        'leading-tight',
        eyeFriendly && 'text-comfortable',
        gradient && 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function H2({ children, className, animate = false, gradient = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.h2 : 'h2';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 }
  } : {};

  return (
    <Component
      className={cn(
        'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
        'leading-snug',
        eyeFriendly && 'text-comfortable',
        gradient && 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function H3({ children, className, animate = false, gradient = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.h3 : 'h3';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component
      className={cn(
        'scroll-m-20 text-2xl font-semibold tracking-tight',
        'leading-snug',
        eyeFriendly && 'text-comfortable',
        gradient && 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function H4({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.h4 : 'h4';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25 }
  } : {};

  return (
    <Component
      className={cn(
        'scroll-m-20 text-xl font-semibold tracking-tight',
        'leading-relaxed',
        eyeFriendly && 'text-comfortable',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

// Body text components
export function Paragraph({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.p : 'p';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={cn(
        'leading-7 [&:not(:first-child)]:mt-6',
        'text-base',
        eyeFriendly && 'text-comfortable leading-8',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function Lead({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.p : 'p';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component
      className={cn(
        'text-xl text-muted-foreground',
        'leading-relaxed',
        eyeFriendly && 'text-large leading-8',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function Large({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.div : 'div';
  const animationProps = animate ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={cn(
        'text-lg font-semibold',
        'leading-relaxed',
        eyeFriendly && 'text-large',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function Small({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.small : 'small';
  const animationProps = animate ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15 }
  } : {};

  return (
    <Component
      className={cn(
        'text-sm font-medium leading-none',
        eyeFriendly && 'text-base leading-relaxed',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function Muted({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.p : 'p';
  const animationProps = animate ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={cn(
        'text-sm text-muted-foreground',
        'leading-relaxed',
        eyeFriendly && 'text-base leading-7',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

// Code and technical text
export function Code({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
        'leading-relaxed',
        eyeFriendly && 'text-base px-2 py-1',
        className
      )}
    >
      {children}
    </code>
  );
}

export function Pre({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <pre
      className={cn(
        'mb-4 mt-6 overflow-x-auto rounded-lg border bg-zinc-950 py-4 px-6 text-sm',
        'leading-relaxed font-mono',
        eyeFriendly && 'text-base py-6 px-8 leading-7',
        className
      )}
    >
      {children}
    </pre>
  );
}

// List components
export function List({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.ul : 'ul';
  const animationProps = animate ? {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, staggerChildren: 0.1 }
  } : {};

  return (
    <Component
      className={cn(
        'my-6 ml-6 list-disc [&>li]:mt-2',
        'leading-7',
        eyeFriendly && 'leading-8 [&>li]:mt-3',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

export function ListItem({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.li : 'li';
  const animationProps = animate ? {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.2 }
  } : {};

  return (
    <Component
      className={cn(
        'leading-7',
        eyeFriendly && 'leading-8 text-comfortable',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

// Blockquote
export function Blockquote({ children, className, animate = false, eyeFriendly = false }: TypographyProps) {
  const Component = animate ? motion.blockquote : 'blockquote';
  const animationProps = animate ? {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  } : {};

  return (
    <Component
      className={cn(
        'mt-6 border-l-2 pl-6 italic',
        'leading-8',
        eyeFriendly && 'leading-9 text-comfortable pl-8',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  );
}

// Table components with improved readability
export function Table({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <div className="my-6 w-full overflow-y-auto">
      <table
        className={cn(
          'w-full',
          eyeFriendly && 'text-comfortable',
          className
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <thead className={cn('[&_tr]:border-b', eyeFriendly && '[&_tr]:border-b-2', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: Omit<TypographyProps, 'animate' | 'eyeFriendly'>) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className }: Omit<TypographyProps, 'animate' | 'eyeFriendly'>) {
  return (
    <tr className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        eyeFriendly && 'h-14 px-6 text-comfortable',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <td
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        'leading-relaxed',
        eyeFriendly && 'p-6 text-comfortable leading-7',
        className
      )}
    >
      {children}
    </td>
  );
}

// Utility component for readable content
export function ReadableContent({ children, className, eyeFriendly = false }: Omit<TypographyProps, 'animate'>) {
  return (
    <div
      className={cn(
        'prose prose-slate dark:prose-invert max-w-none',
        'prose-headings:scroll-m-20 prose-headings:tracking-tight',
        'prose-h1:text-4xl prose-h1:font-extrabold prose-h1:lg:text-5xl',
        'prose-h2:text-3xl prose-h2:font-semibold prose-h2:border-b prose-h2:pb-2',
        'prose-h3:text-2xl prose-h3:font-semibold',
        'prose-h4:text-xl prose-h4:font-semibold',
        'prose-p:leading-7 prose-p:[&:not(:first-child)]:mt-6',
        'prose-blockquote:mt-6 prose-blockquote:border-l-2 prose-blockquote:pl-6 prose-blockquote:italic',
        'prose-ul:my-6 prose-ul:ml-6 prose-ul:list-disc prose-ul:[&>li]:mt-2',
        'prose-code:relative prose-code:rounded prose-code:bg-muted prose-code:px-[0.3rem] prose-code:py-[0.2rem] prose-code:font-mono prose-code:text-sm prose-code:font-semibold',
        'prose-pre:mb-4 prose-pre:mt-6 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:border prose-pre:bg-zinc-950 prose-pre:py-4 prose-pre:px-6 prose-pre:text-sm',
        eyeFriendly && [
          'prose-lg',
          'prose-p:leading-8',
          'prose-headings:leading-tight',
          'prose-li:leading-8',
          'prose-blockquote:leading-9',
          'prose-code:text-base prose-code:px-2 prose-code:py-1',
          'prose-pre:text-base prose-pre:py-6 prose-pre:px-8 prose-pre:leading-7'
        ],
        className
      )}
    >
      {children}
    </div>
  );
}
