"use client";
import { ReactElement } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
export function ThemeToggle(): ReactElement {
  const { theme, actualTheme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg"
        >
          <motion.div
            key={actualTheme}
            initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {
              (actualTheme = "light" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              ))
            }
          </motion.div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
          {
            (theme = "light" && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-2 w-2 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.3 }}
              />
            ))
          }
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
          {
            (theme = "dark" && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-2 w-2 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.3 }}
              />
            ))
          }
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {
            (theme = "system" && (
              <motion.div
                layoutId="theme-indicator"
                className="ml-auto h-2 w-2 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.3 }}
              />
            ))
          }
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
export function SimpleThemeToggle(): ReactElement {
  const { actualTheme, toggleTheme } = useTheme();
  return (
    <motion.button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle theme"
    >
      <motion.div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={false}
          animate={{
            scale: (actualTheme = "light" ? 1 : 0),
            opacity: (actualTheme = "light" ? 1 : 0),
            rotate: (actualTheme = "light" ? 0 : 180),
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Sun className="h-4 w-4 text-yellow-500" />
        </motion.div>
        <motion.div
          initial={false}
          animate={{
            scale: (actualTheme = "dark" ? 1 : 0),
            opacity: (actualTheme = "dark" ? 1 : 0),
            rotate: (actualTheme = "dark" ? 0 : -180),
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="absolute"
        >
          <Moon className="h-4 w-4 text-blue-500" />
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
