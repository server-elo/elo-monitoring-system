import React, { ReactElement } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthenticatedNavbar } from "@/components/navigation/AuthenticatedNavbar";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});
export const metadata: Metadata = {
  title: "Solidity Learning Platform",
  description: "Master Smart Contract Development",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): void {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="min-h-screen bg-background">
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
