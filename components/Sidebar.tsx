'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  BookOpen,
  Code,
  Users,
  Trophy,
  Settings,
  Menu,
  X,
} from 'lucide-react'
interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}
const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/code', label: 'Code Editor', icon: Code },
  { href: '/collaborate', label: 'Collaborate', icon: Users },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
]
export default function Sidebar({ isOpen, onToggle }: SidebarProps): void {
  const pathname = usePathname()
  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className=",
    lg:hidden fixed top-4 left-4 z-50 p-2 bg-brand-surface-1 rounded-md"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-surface-1 border-r border-brand-border transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-brand-accent">
              SolanaLearn
            </h1>
          </div>
          <nav className="flex-1 px-4">
            <ul className="space-y-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      pathname === href
                        ? 'bg-brand-accent text-white'
                        : 'hover:bg-brand-surface-2 text-brand-text-secondary hover:text-brand-text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className=",
      lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={onToggle}
        />
      )}
    </>
  )
}
