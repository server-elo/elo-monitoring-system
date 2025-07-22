import React, { ReactElement } from "react";
import Link from "next/link";
import { BookOpen, Code, Users, Trophy, ArrowRight } from "lucide-react";
import { HeroSection } from "@/components/sections/HeroSection";
export default function HomePage(): void {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <HeroSection />
      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Everything You Need to Become a Solidity Expert
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/learn" className="group">
              <div className="bg-card backdrop-blur-sm rounded-lg p-6 border border-border hover:border-blue-500 transition-all">
                <BookOpen className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Interactive Lessons
                </h3>
                <p className="text-muted-foreground">
                  Learn by doing with hands-on tutorials and real-world examples
                </p>
              </div>
            </Link>
            <Link href="/code" className="group">
              <div className="bg-card backdrop-blur-sm rounded-lg p-6 border border-border hover:border-purple-500 transition-all">
                <Code className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Code Playground
                </h3>
                <p className="text-muted-foreground">
                  Write, test, and deploy contracts directly in your browser
                </p>
              </div>
            </Link>
            <Link href="/collaborate" className="group">
              <div className="bg-card backdrop-blur-sm rounded-lg p-6 border border-border hover:border-green-500 transition-all">
                <Users className="w-12 h-12 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Live Collaboration
                </h3>
                <p className="text-muted-foreground">
                  Code together with peers and learn from experienced developers
                </p>
              </div>
            </Link>
            <Link href="/achievements" className="group">
              <div className="bg-card backdrop-blur-sm rounded-lg p-6 border border-border hover:border-yellow-500 transition-all">
                <Trophy className="w-12 h-12 text-yellow-400 mb-4" />
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Earn Achievements
                </h3>
                <p className="text-muted-foreground">
                  Track progress and get blockchain-verified certificates
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Blockchain Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers learning Solidity the right way.
          </p>
          <Link
            href="/learn"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all text-lg"
          >
            Start Learning Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
