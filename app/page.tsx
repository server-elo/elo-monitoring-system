// Enhanced Solidity Learning Platform - Updated 2025-06-23 14:00 UTC
import { Suspense } from 'react';
import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturesSection } from '@/components/sections/FeaturesSection';
import { CompetitiveAnalysisSection } from '@/components/sections/CompetitiveAnalysisSection';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { CTASection } from '@/components/sections/CTASection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EnhancedFeaturesShowcase } from '@/components/sections/EnhancedFeaturesShowcase';
import { GamificationPreview } from '@/components/sections/GamificationPreview';
import { InteractiveDemoSection } from '@/components/sections/InteractiveDemoSection';

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section aria-labelledby="hero-heading" role="banner">
        <Suspense fallback={<LoadingSpinner />}>
          <HeroSection />
        </Suspense>
      </section>

      {/* Enhanced Features Showcase - New Interactive UI */}
      <section aria-labelledby="features-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <EnhancedFeaturesShowcase />
        </Suspense>
      </section>

      {/* Interactive Demo Section */}
      <section aria-labelledby="demo-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <InteractiveDemoSection />
        </Suspense>
      </section>

      {/* Gamification Preview */}
      <section aria-labelledby="gamification-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <GamificationPreview />
        </Suspense>
      </section>

      {/* Features Section */}
      <section aria-labelledby="platform-features-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <FeaturesSection />
        </Suspense>
      </section>

      {/* Competitive Analysis */}
      <section aria-labelledby="comparison-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <CompetitiveAnalysisSection />
        </Suspense>
      </section>

      {/* Testimonials */}
      <section aria-labelledby="testimonials-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <TestimonialsSection />
        </Suspense>
      </section>

      {/* Call to Action */}
      <section aria-labelledby="cta-heading" role="region">
        <Suspense fallback={<LoadingSpinner />}>
          <CTASection />
        </Suspense>
      </section>
    </div>
  );
}
