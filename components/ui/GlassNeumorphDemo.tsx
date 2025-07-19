import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GlassContainer, 
  GlassCard, 
  GlassButton, 
  GlassInput,
  GlassModal 
} from './Glassmorphism';
import { 
  NeumorphicContainer, 
  NeumorphicButton, 
  NeumorphicCard, 
  NeumorphicInput,
  NeumorphicToggle,
  NeumorphicProgress 
} from './Neumorphism';

const GlassNeumorphDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggleValue, setToggleValue] = useState(false);
  const [progressValue, setProgressValue] = useState(65);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white">
            Glassmorphism & Neumorphism Showcase
          </h1>
          <p className="text-xl text-white/80">
            Modern UI design patterns with frosted glass and soft tactile elements
          </p>
        </motion.div>

        {/* Glassmorphism Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-white text-center">
            Glassmorphism Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Glass Cards */}
            <GlassCard
              header={<h3 className="text-xl font-semibold text-white">Glass Card</h3>}
              intensity="medium"
              tint="neutral"
              hover={true}
            >
              <p className="text-white/90 mb-4">
                This is a glassmorphism card with frosted glass effect and subtle transparency.
              </p>
              <GlassButton variant="primary" size="sm">
                Learn More
              </GlassButton>
            </GlassCard>

            <GlassCard
              header={<h3 className="text-xl font-semibold text-brand-primary-200">Primary Tint</h3>}
              intensity="heavy"
              tint="primary"
              hover={true}
            >
              <p className="text-white/90 mb-4">
                Heavy blur intensity with primary color tinting for brand consistency.
              </p>
              <GlassButton variant="accent" size="sm" glow>
                Explore
              </GlassButton>
            </GlassCard>

            <GlassCard
              header={<h3 className="text-xl font-semibold text-brand-accent-200">Accent Tint</h3>}
              intensity="light"
              tint="accent"
              hover={true}
            >
              <p className="text-white/90 mb-4">
                Light blur with accent color tinting and glowing button effects.
              </p>
              <GlassButton 
                variant="secondary" 
                size="sm"
                onClick={() => setIsModalOpen(true)}
              >
                Open Modal
              </GlassButton>
            </GlassCard>
          </div>

          {/* Glass Form */}
          <GlassContainer
            intensity="medium"
            tint="neutral"
            className="max-w-md mx-auto p-8"
          >
            <h3 className="text-2xl font-semibold text-white mb-6">Glass Form</h3>
            <div className="space-y-4">
              <GlassInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <GlassInput
                label="Password"
                type="password"
                placeholder="Enter your password"
              />
              <GlassButton variant="primary" className="w-full">
                Sign In
              </GlassButton>
            </div>
          </GlassContainer>
        </section>

        {/* Neumorphism Section */}
        <section className="bg-gray-200 rounded-3xl p-8 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            Neumorphism Components
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Neomorphic Cards */}
            <NeumorphicCard
              header={<h3 className="text-xl font-semibold text-gray-800">Soft Card</h3>}
              hover={true}
              clickable={true}
              onClick={() => console.log('Card clicked')}
            >
              <p className="text-gray-600 mb-4">
                This neumorphic card has a soft, extruded appearance with tactile shadows.
              </p>
              <NeumorphicButton variant="primary" size="sm">
                Touch Me
              </NeumorphicButton>
            </NeumorphicCard>

            <NeumorphicCard
              header={<h3 className="text-xl font-semibold text-gray-800">Interactive Elements</h3>}
            >
              <div className="space-y-4">
                <NeumorphicToggle
                  checked={toggleValue}
                  onChange={setToggleValue}
                  label="Enable notifications"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progress: {progressValue}%
                  </label>
                  <NeumorphicProgress value={progressValue} color="primary" />
                </div>
                <div className="flex gap-2">
                  <NeumorphicButton 
                    size="sm" 
                    onClick={() => setProgressValue(Math.max(0, progressValue - 10))}
                  >
                    -
                  </NeumorphicButton>
                  <NeumorphicButton 
                    size="sm" 
                    onClick={() => setProgressValue(Math.min(100, progressValue + 10))}
                  >
                    +
                  </NeumorphicButton>
                </div>
              </div>
            </NeumorphicCard>

            <NeumorphicCard
              header={<h3 className="text-xl font-semibold text-gray-800">Button Variants</h3>}
            >
              <div className="space-y-3">
                <NeumorphicButton variant="primary" size="sm" className="w-full">
                  Primary
                </NeumorphicButton>
                <NeumorphicButton variant="secondary" size="sm" className="w-full">
                  Secondary
                </NeumorphicButton>
                <NeumorphicButton variant="accent" size="sm" className="w-full">
                  Accent
                </NeumorphicButton>
                <div className="flex gap-2 justify-center">
                  <NeumorphicButton shape="circle" size="sm">
                    ❤️
                  </NeumorphicButton>
                  <NeumorphicButton shape="circle" size="sm">
                    ⭐
                  </NeumorphicButton>
                  <NeumorphicButton shape="circle" size="sm">
                    🔥
                  </NeumorphicButton>
                </div>
              </div>
            </NeumorphicCard>
          </div>

          {/* Neomorphic Form */}
          <NeumorphicContainer
            variant="inset"
            intensity="medium"
            padding="lg"
            className="max-w-md mx-auto"
          >
            <h3 className="text-2xl font-semibold text-gray-800 mb-6">Soft Form</h3>
            <div className="space-y-4">
              <NeumorphicInput
                label="Full Name"
                placeholder="Enter your name"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              <NeumorphicInput
                label="Email"
                type="email"
                placeholder="Enter your email"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <NeumorphicButton variant="primary" size="md" className="w-full">
                Submit
              </NeumorphicButton>
            </div>
          </NeumorphicContainer>
        </section>

        {/* Mixed Design Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-white text-center">
            Mixed Design Patterns
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <GlassContainer
              intensity="heavy"
              tint="primary"
              className="space-y-4 p-8"
            >
              <h3 className="text-2xl font-semibold text-white">Glass Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">1,234</div>
                  <div className="text-white/70">Users</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">5,678</div>
                  <div className="text-white/70">Sales</div>
                </div>
              </div>
            </GlassContainer>

            <div className="bg-gray-200 rounded-3xl p-8">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">Soft Dashboard</h3>
              <div className="grid grid-cols-2 gap-4">
                <NeumorphicContainer variant="inset" padding="md" className="text-center">
                  <div className="text-2xl font-bold text-gray-800">9,876</div>
                  <div className="text-gray-600">Views</div>
                </NeumorphicContainer>
                <NeumorphicContainer variant="inset" padding="md" className="text-center">
                  <div className="text-2xl font-bold text-gray-800">3,210</div>
                  <div className="text-gray-600">Clicks</div>
                </NeumorphicContainer>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Glass Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Glass Modal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-white/90">
            This is a glassmorphism modal with frosted glass background and smooth animations.
          </p>
          <div className="flex gap-3 justify-end">
            <GlassButton 
              variant="secondary" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton 
              variant="primary"
              onClick={() => setIsModalOpen(false)}
            >
              Confirm
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
};

export default GlassNeumorphDemo;
