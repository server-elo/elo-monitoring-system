import type { Meta, StoryObj } from '@storybook/react';
import { GlassContainer as GlassCard } from './Glassmorphism';
import { Star, Trophy, Zap } from 'lucide-react';

/**
 * GlassCard component provides a glassmorphism design pattern with customizable
 * blur effects, opacity levels, and hover states. Perfect for modern UI designs
 * requiring depth and visual hierarchy.
 * 
 * ## Accessibility Features
 * - Proper contrast ratios maintained across all variants
 * - Keyboard navigation support
 * - Screen reader compatible
 * - High contrast mode support
 * 
 * ## Performance Considerations
 * - Uses CSS backdrop-filter for optimal performance
 * - Fallback styles for unsupported browsers
 * - Optimized for 60fps animations
 */
const meta: Meta<typeof GlassCard> = {
  title: 'UI Components/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The GlassCard component implements the glassmorphism design pattern with customizable blur effects and opacity levels.
It provides a modern, depth-aware interface element perfect for overlays, modals, and content containers.

### Key Features
- **Customizable Blur**: Control backdrop blur intensity (sm, md, lg, xl)
- **Opacity Control**: Adjust background opacity (low, medium, high)
- **Hover Effects**: Optional hover state animations
- **Glow Effects**: Color-coded glow effects for emphasis
- **Accessibility**: WCAG 2.1 AA compliant with proper contrast ratios
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    blur: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Controls the backdrop blur intensity',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    opacity: {
      control: 'select',
      options: ['low', 'medium', 'high'],
      description: 'Controls the background opacity level',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
      },
    },
    hover: {
      control: 'boolean',
      description: 'Enables hover state animations',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    glow: {
      control: 'select',
      options: ['none', 'blue', 'purple', 'green', 'red', 'yellow'],
      description: 'Adds a colored glow effect',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'none' },
      },
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    children: {
      control: 'text',
      description: 'Content to display inside the card',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default GlassCard with medium blur and opacity
 */
export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Default Glass Card</h3>
        <p className="text-gray-300">
          This is a basic glass card with default settings. It provides a subtle
          glassmorphism effect perfect for most use cases.
        </p>
      </div>
    ),
  },
};

/**
 * High blur intensity for strong glassmorphism effect
 */
export const HighBlur: Story = {
  args: {
    blur: 'xl',
    opacity: 'high',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">High Blur Effect</h3>
        <p className="text-gray-300">
          Maximum blur intensity creates a strong glassmorphism effect,
          perfect for overlays and modal dialogs.
        </p>
      </div>
    ),
  },
};

/**
 * Subtle effect with low blur and opacity
 */
export const Subtle: Story = {
  args: {
    blur: 'sm',
    opacity: 'low',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Subtle Effect</h3>
        <p className="text-gray-300">
          Minimal blur and opacity for a subtle glass effect that doesn't
          overpower the content.
        </p>
      </div>
    ),
  },
};

/**
 * Interactive card with hover effects
 */
export const Interactive: Story = {
  args: {
    hover: true,
    glow: 'blue',
    children: (
      <div className="p-6 cursor-pointer">
        <div className="flex items-center space-x-3 mb-3">
          <Star className="w-6 h-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Interactive Card</h3>
        </div>
        <p className="text-gray-300">
          Hover over this card to see the interactive effects. Perfect for
          clickable elements and call-to-action components.
        </p>
      </div>
    ),
  },
};

/**
 * Achievement card with glow effect
 */
export const Achievement: Story = {
  args: {
    glow: 'yellow',
    hover: true,
    children: (
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Trophy className="w-8 h-8 text-yellow-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Achievement Unlocked!</h3>
            <p className="text-yellow-400 text-sm">First Contract Deployed</p>
          </div>
        </div>
        <p className="text-gray-300">
          You successfully deployed your first smart contract to the blockchain.
          Keep up the great work!
        </p>
      </div>
    ),
  },
};

/**
 * Notification card with purple glow
 */
export const Notification: Story = {
  args: {
    glow: 'purple',
    opacity: 'high',
    children: (
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-purple-400" />
          <div>
            <h4 className="font-semibold text-white">New Feature Available</h4>
            <p className="text-gray-300 text-sm">
              Real-time collaboration is now live!
            </p>
          </div>
        </div>
      </div>
    ),
  },
};

/**
 * Accessibility demonstration with high contrast
 */
export const HighContrast: Story = {
  args: {
    className: 'border-2 border-white',
    children: (
      <div className="p-6">
        <h3 className="text-lg font-bold text-white mb-2">High Contrast Mode</h3>
        <p className="text-white">
          This card demonstrates high contrast accessibility features.
          All text maintains proper contrast ratios for screen readers.
        </p>
        <button className="mt-3 px-4 py-2 bg-white text-black font-semibold rounded focus:outline-none focus:ring-2 focus:ring-white">
          Accessible Button
        </button>
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'dark' },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Mobile-optimized card layout
 */
export const Mobile: Story = {
  args: {
    className: 'w-full max-w-sm',
    children: (
      <div className="p-4">
        <h3 className="text-base font-semibold text-white mb-2">Mobile Layout</h3>
        <p className="text-gray-300 text-sm">
          Optimized for mobile devices with appropriate spacing and touch targets.
        </p>
        <button className="mt-3 w-full py-3 bg-blue-600 text-white rounded-lg font-medium">
          Mobile Action
        </button>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};
