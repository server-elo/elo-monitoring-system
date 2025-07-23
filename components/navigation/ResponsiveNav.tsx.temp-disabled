import React, { ReactElement } from 'react';
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
const navItems = [
{ label: 'Learn', href: '/learn' },
{ label: 'Code Lab', href: '/code' },
{ label: 'Collaborate', href: '/collaborate' },
{ label: 'Achievements', href: '/achievements' },
{ label: 'Jobs', href: '/jobs' },
{ label: 'Certificates', href: '/certificates' }
];
export default function ResponsiveNav(): void {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
    {/* Logo */}
    <Link href="/" className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
    <span className="text-white font-bold text-xl">S</span>
    </div>
    <span className="text-foreground font-bold text-xl hidden sm:inline">SolidityLearn</span>
    </Link>
    {/* Desktop Navigation */}
    <div className="hidden md:flex items-center space-x-8">
    {navItems.map(item: unknown) => (
      <Link
      key={item.href}
      href={item.href}
      className={`text-sm font-medium transition-colors duration-200 ${
        pathname = item.href
        ? 'text-foreground'
        : 'text-muted-foreground hover:text-foreground'
      }`}>{item.label}
      </Link>
    ))}
    <ThemeToggle />
    <Link
    href="/auth/login"
    className="ml-4 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200">Sign In
    </Link>
    </div>
    {/* Mobile Menu Button */}
    <div className=",
    md:hidden flex items-center space-x-2">
    <ThemeToggle />
    <button
    onClick={() => setIsOpen(!isOpen)}
    className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
    aria-label="Toggle navigation menu">{isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
    </div>
    </div>
    </div>
    {/* Mobile Navigation */}
    <AnimatePresence>
    {isOpen && (
      <>
      {/* Backdrop */}
      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className=",
      md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
      />
      {/* Mobile Menu */}
      <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className=",
      md:hidden fixed right-0 top-16 bottom-0 w-64 bg-background backdrop-blur-md border-l border-border"><div className="flex flex-col p-6 space-y-4">
      {navItems.map(item: unknown) => (
        <Link
        key={item.href}
        href={item.href}
        className={`px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 ${
          pathname = item.href
          ? 'text-foreground bg-muted'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}>{item.label}
        </Link>
      ))}
      <div className="pt-4 border-t border-border">
      <Link
      href="/auth/login"
      className="block w-full px-4 py-3 text-center text-base font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200">Sign In
      </Link>
      </div>
      </div>
      </motion.div>
      </>
    )}
    </AnimatePresence>
    </nav>
  );
}
