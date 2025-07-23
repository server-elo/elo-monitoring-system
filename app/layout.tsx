import React, { ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

// Use next/font for optimized font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Solidity Learning Platform",
  description: "Master Smart Contract Development",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): ReactElement {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        {/* Critical CSS for preventing FOUC */}
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              background: #ffffff;
              font-family: var(--font-inter), system-ui, -apple-system, sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            
            /* Hide content until CSS loads */
            .css-loading {
              visibility: hidden;
              opacity: 0;
            }
            
            .css-loaded {
              visibility: visible;
              opacity: 1;
              transition: opacity 0.3s ease;
            }
            
            /* Prevent layout shift */
            * {
              box-sizing: border-box;
            }
            
            /* Basic theme colors */
            :root {
              --background: 0 0% 100%;
              --foreground: 222.2 84% 4.9%;
            }
            
            @media (prefers-color-scheme: dark) {
              :root {
                --background: 222.2 84% 4.9%;
                --foreground: 210 40% 98%;
              }
              
              body {
                background: hsl(222.2 84% 4.9%);
                color: hsl(210 40% 98%);
              }
            }
          `
        }} />
        
        {/* Ensure CSS loads before render */}
        <script dangerouslySetInnerHTML={{
          __html: `
            // Mark when CSS is loaded
            document.addEventListener('DOMContentLoaded', function() {
              document.body.classList.remove('css-loading');
              document.body.classList.add('css-loaded');
            });
            
            // Fallback after 100ms
            setTimeout(function() {
              document.body.classList.remove('css-loading');
              document.body.classList.add('css-loaded');
            }, 100);
          `
        }} />
        {/* Fix for static file requests */}
        <script src="/fix-static-requests.js" />
      </head>
      <body className="min-h-screen bg-background css-loading">
        <SessionProvider>
          <ThemeProvider
            defaultTheme="system"
            storageKey="solidity-platform-theme"
          >
            <AuthenticatedNavbar />
            <main className="pt-16">{children}</main>
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}