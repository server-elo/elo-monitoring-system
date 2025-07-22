import React, { ReactElement } from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MainProviders } from "@/lib/providers/AppProvider";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter"
});
export const metadata: Metadata = {
  title: "SolanaLearn - Master Solidity Development",
  description:
  "The most comprehensive Solidity learning platform with AI-powered tutoring, real-time collaboration, and hands-on blockchain development.",
  keywords: [
  "Solidity",
  "Blockchain",
  "Smart Contracts",
  "Web3",
  "Ethereum",
  "DeFi",
  "Learning Platform"
  ],
  authors: [{ name: "SolanaLearn Team" }],
  openGraph: {
    title: "SolanaLearn - Master Solidity Development",
    description: "Learn Solidity with AI-powered tutoring and real-time collaboration",
    url: "https://solanalearn.dev",
    siteName: "SolanaLearn",
    images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "SolanaLearn Platform"
    }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SolanaLearn - Master Solidity Development",
    description:
    "Learn Solidity with AI-powered tutoring and real-time collaboration",
    images: ["/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    google: "your-google-verification-code"
  }
};
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): void {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
    <meta name="theme-color" content="#3b82f6" />
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta
    name="apple-mobile-web-app-status-bar-style"
    content="black-translucent"
    />
    <meta name="apple-mobile-web-app-title" content="Learn Solidity" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    </head>
    <body className={inter.className}>
    <MainProviders>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    {/* Main content */}
    <main
    id="main-content"
    className="relative"
    role="main"
    tabIndex={-1}>{children}
    </main>
    </div>
    </MainProviders>
    </body>
    </html>
  );
}
