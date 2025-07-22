'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, BookOpen, Code, Users, Trophy, Menu, X } from 'lucide-react'
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/code', label: 'Code', icon: Code },
  { href: '/collaborate', label: 'Collaborate', icon: Users },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
]
export default function MobileNavigation(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-4 bg-brand-accent rounded-full shadow-lg md:hidden"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6 text-white" />
        )}
      </button>
      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            {/* Navigation Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-brand-surface-1 rounded-t-3xl shadow-xl md:hidden"
            >
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsOpen(false)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-accent text-white'
                            : 'hover:bg-brand-surface-2 text-brand-text-secondary'
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs font-medium">{label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Bottom Navigation Bar (Alternative) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface-1 border-t border-brand-border md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-brand-accent'
                    : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
