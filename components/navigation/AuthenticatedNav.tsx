import React, { ReactElement } from "react";
("use client");
import { useState, useEffect, ReactElement } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  BarChart3,
  Trophy,
  BookOpen,
  Code,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthenticationModal } from "@/components/auth/AuthenticationModal";
import { Badge } from "@/components/ui/badge";
const navItems = [
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Code Lab", href: "/code", icon: Code },
  { label: "Collaborate", href: "/collaborate", icon: Users },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Jobs", href: "/jobs" },
  { label: "Certificates", href: "/certificates" },
];
export default function AuthenticatedNav(): ReactElement {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);
  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-foreground font-bold text-xl hidden sm:inline">
                SolidityLearn
              </span>
            </Link>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item: unknown) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                      pathname === item.href
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon size={16} />}
                    {item.label}
                  </Link>
                );
              })}
              <ThemeToggle />
              {/* User Menu */}
              {status === "loading" ? (
                <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse" />
              ) : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                    >
                      <Avatar className="h-10 w-10">
                        <img
                          src={
                            session.user?.image ||
                            `https://ui-avatars.com/api/?name=${session.user?.name}&background=3b82f6&color=fff`
                          }
                          alt={session.user?.name || "User"}
                          className="rounded-full"
                        />
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user?.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user?.email}
                        </p>
                        {session.user?.role && (
                          <Badge
                            variant="secondary"
                            className="mt-1 w-fit text-xs"
                          >
                            {session.user.role}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 dark:text-red-400"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="ml-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  Sign In
                </Button>
              )}
            </div>
            {/* Mobile Menu Button */}
            <div
              className=",
    md:hidden flex items-center space-x-2"
            >
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
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
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 20 }}
                className=",
      md:hidden fixed right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-sm bg-background border-l border-border overflow-y-auto"
              >
                <div className="p-4">
                  {/* User Info (Mobile) */}
                  {session && (
                    <div className="mb-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <img
                            src={
                              session.user?.image ||
                              `https://ui-avatars.com/api/?name=${session.user?.name}&background=3b82f6&color=fff`
                            }
                            alt={session.user?.name || "User"}
                            className="rounded-full"
                          />
                        </Avatar>
                        <div>
                          <p className="font-medium">{session.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    {session && (
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center space-x-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <BarChart3 size={20} />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/profile"
                          className="flex items-center space-x-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <User size={20} />
                          <span>Profile</span>
                        </Link>
                      </>
                    )}
                    {navItems.map((item: unknown) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center space-x-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          {Icon && <Icon size={20} />}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    {session && (
                      <>
                        <div className="border-t border-border my-4" />
                        <Link
                          href="/settings"
                          className="flex items-center space-x-3 px-4 py-3 text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                          <Settings size={20} />
                          <span>Settings</span>
                        </Link>
                      </>
                    )}
                  </div>
                  {/* Auth Button (Mobile) */}
                  <div className="mt-6">
                    {session ? (
                      <Button
                        onClick={handleSignOut}
                        variant="outline"
                        className="w-full border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowAuthModal(true)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
      {/* Authentication Modal */}
      <AuthenticationModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
