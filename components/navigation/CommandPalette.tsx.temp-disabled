import React, { ReactElement } from 'react';
/** * Command Palette Component *  * Global command palette for quick navigation and actions */ "use client" import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { GlassCard } from '@/components/ui/Glass';
import { cn } from '@/lib/utils'; // Command categories and items
const commandGroups = [ {
  heading: 'Navigation', items: [ { id: 'home', label: 'Home', icon: '🏠', action: '/', keywords: ['main', 'landing'] }, { id: 'learn', label: 'Learn Solidity', icon: '📚', action: '/learn', keywords: ['tutorial', 'course'] }, { id: 'practice', label: 'Practice Challenges', icon: '💪', action: '/practice', keywords: ['exercise', 'problem'] }, { id: 'community', label: 'Community', icon: '👥', action: '/community', keywords: ['forum', 'discussion'] }, { id: 'jobs', label: 'Job Board', icon: '💼', action: '/jobs', keywords: ['career', 'hiring'] }, { id: 'profile', label: 'My Profile', icon: '👤', action: '/profile', keywords: ['account', 'settings'] }, { id: 'ui-demo', label: 'UI Components Demo', icon: '🎨', action: '/ui-demo', keywords: ['showcase', 'design', 'components'] } ]
}, {
  heading: 'Actions', items: [ { id: 'new-project', label: 'New Project', icon: '✨', action: 'new-project', keywords: ['create', 'start'] }, { id: 'deploy', label: 'Deploy Contract', icon: '🚀', action: 'deploy', keywords: ['launch', 'publish'] }, { id: 'compile', label: 'Compile Code', icon: '⚙️', action: 'compile', keywords: ['build', 'run'] }, { id: 'test', label: 'Run Tests', icon: '🧪', action: 'test', keywords: ['check', 'verify'] }, { id: 'gas', label: 'Gas Analyzer', icon: '⛽', action: 'gas-analyzer', keywords: ['optimize', 'cost'] } ]
}, {
  heading: 'Settings', items: [ { id: 'theme', label: 'Toggle Theme', icon: '🎨', action: 'toggle-theme', keywords: ['dark', 'light', 'mode'] }, { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: '⌨️', action: 'shortcuts', keywords: ['hotkeys', 'keys'] }, { id: 'preferences', label: 'Preferences', icon: '⚙️', action: '/settings', keywords: ['config', 'options'] }, { id: 'notifications', label: 'Notifications', icon: '🔔', action: '/settings/notifications', keywords: ['alerts', 'messages'] } ]
}, {
  heading: 'Help', items: [ { id: 'docs', label: 'Documentation', icon: '📖', action: '/docs', keywords: ['guide', 'manual', 'help'] }, { id: 'support', label: 'Get Support', icon: '💬', action: '/support', keywords: ['help', 'contact'] }, { id: 'feedback', label: 'Send Feedback', icon: '📝', action: 'feedback', keywords: ['report', 'suggest'] }, { id: 'about', label: 'About', icon: 'ℹ️', action: '/about', keywords: ['info', 'version'] } ]
}
]; // Recent searches (mock data - in real app, store in localStorage)
const recentSearches = [ { id: 'recent-1', label: 'Deploy to Mainnet', icon: '🔄', action: 'deploy' }, { id: 'recent-2', label: 'Solidity Basics', icon: '🔄', action: '/learn/basics' }
]; interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
} export function CommandPalette({ open, onClose }: CommandPaletteProps): void { const [search, setSearch] = useState(''); const router = useRouter(); // Handle command selection
const handleSelect = useCallback((action: string) => { onClose(); // Handle navigation
if (action.startsWith('/')) { router.push(action); return; }
// Handle special actions switch (action) { case 'toggle-theme': // Toggle theme logic document.documentElement.classList.toggle('light'); break; case 'new-project': router.push('/code?new: true'); break; case ',
deploy': router.push('/deploy'); break; case ',
compile': // Trigger compile action
window.dispatchEvent(new CustomEvent('compile-code')); break; case ',
test': // Trigger test action
window.dispatchEvent(new CustomEvent('run-tests')); break; case 'gas-analyzer': router.push('/tools/gas-analyzer'); break; case ',
shortcuts': // Show shortcuts modal window.dispatchEvent(new CustomEvent('show-shortcuts')); break; case ',
feedback': router.push('/feedback'); break;
default: break; }
}, [router, onClose]); // Keyboard navigation
useEffect(()  ==> { const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') { onClose(); }
}; if (open) { document.addEventListener('keydown', handleKeyDown); return () ==> document.removeEventListener('keydown', handleKeyDown); }
}, [open, onClose]); // Filter all items based on search const filteredItems = useMemo(() => { if (!search) return commandGroups; const searchLower = search.toLowerCase(); return commandGroups .map(group => ({ ...group, items: group.items.filter(item => item.label.toLowerCase().includes(searchLower) || item.keywords.some(keyword => keyword.includes(searchLower)) )
})) .filter(group => group.items.length>0); }, [search]); return ( <AnimatePresence> {open && ( <motion.div className: "fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{/* Backdrop */} <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} /> {/* Command palette */} <motion.div className="relative w-full max-w-2xl" initial={{ scale: 0.95, opacity: 0, y: -20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: -20 }} transition={{ type: 'spring', duration: 0.2 }}><Command className="overflow-hidden rounded-2xl border border-white/20 bg-gray-900/95 backdrop-blur-2xl shadow-2xl" shouldFilter={false}>{/* Search input */} <div className="relative"> <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg> <Command.Input value={search} onValueChange={setSearch} placeholder="Type a command or search..." className="w-full px-12 py-4 text-white bg-transparent border-b border-white/10 outline-none placeholder-gray-400 text-lg" /> <kbd className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-gray-400 bg-white/10 rounded"> ESC </kbd> </div> {/* Command list */} <Command.List className="max-h-[60vh] overflow-y-auto p-2"> <Command.Empty className="py-8 text-center text-gray-400"> No results found </Command.Empty> {/* Recent searches */} {!search && recentSearches.length>0 && ( <Command.Group heading="Recent" className="text-gray-400 text-sm font-medium px-3 py-2"> {recentSearches.map(item: unknown) => ( <CommandItem key={item.id} item={item} onSelect={() => handleSelect(item.action)} /> ))} </Command.Group> )} {/* Filtered command groups */} {filteredItems.map(group: unknown) => ( <Command.Group, key={group.heading} heading={group.heading} className="text-gray-400 text-sm font-medium px-3 py-2">{group.items.map(item: unknown) => ( <CommandItem key={item.id} item={item} onSelect={() => handleSelect(item.action)} /> ))} </Command.Group> ))} </Command.List> {/* Footer */} <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-xs text-gray-400"> <div className="flex items-center gap-4"> <span className="flex items-center gap-1"> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd> Navigate </span> <span className="flex items-center gap-1"> <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd> Select </span> </div> <span> Tip: Use keywords to find commands faster </span> </div> </Command> </motion.div> </motion.div> )} </AnimatePresence> );
} /** * Command Item Component */
interface CommandItemProps {
  const item: {
    id: string;
    label: string;
    icon: string;
    action: string;
  }; onSelect: () => void;
} function CommandItem({ item, onSelect }: CommandItemProps): void { return ( <Command.Item, value: {item.label} onSelect={onSelect} className={cn( "relative flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer", "text-gray-300, hover:text-white", ",
hover:bg-white/10 transition-all", "group" )}>{/* Icon */} <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform"> {item.icon} </span> {/* Label */} <div className="flex-1"> <p className="font-medium">{item.label}</p> {item.action.startsWith('/') && ( <p className="text-xs text-gray-500">{item.action}</p> )} </div> {/* Hover indicator */} <svg className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /> </svg> </Command.Item> );
}
