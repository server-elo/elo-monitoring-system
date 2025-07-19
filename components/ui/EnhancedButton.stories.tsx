import type { Meta, StoryObj } from '@storybook/react';
import { EnhancedButton } from './EnhancedButton';
import { Play, Download, Settings, Heart, Share, Plus } from 'lucide-react';
import { fn } from '@storybook/test';

/**
 * EnhancedButton component provides a comprehensive button implementation with
 * multiple variants, sizes, states, and accessibility features. Built for the
 * Solidity Learning Platform with glassmorphism design patterns.
 * 
 * ## Accessibility Features
 * - WCAG 2.1 AA compliant
 * - Keyboard navigation support (Enter, Space)
 * - Screen reader compatible with proper ARIA labels
 * - 44px minimum touch targets for mobile
 * - Focus indicators and states
 * 
 * ## Performance Features
 * - Optimized animations with 60fps performance
 * - Debounced click handling for async operations
 * - Efficient ripple effects
 * - Minimal re-renders
 */
const meta: Meta<typeof EnhancedButton> = {
  title: 'UI Components/EnhancedButton',
  component: EnhancedButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The EnhancedButton component is a feature-rich button implementation designed for modern web applications.
It supports multiple variants, sizes, loading states, and accessibility features out of the box.

### Key Features
- **Multiple Variants**: Primary, secondary, ghost, outline, and destructive styles
- **Flexible Sizing**: Small, medium, large, and icon-only sizes
- **Loading States**: Built-in loading indicators with customizable text
- **Touch Optimization**: 44px minimum touch targets for mobile devices
- **Ripple Effects**: Optional material design ripple animations
- **Icon Support**: Leading and trailing icon placement
- **Accessibility**: Full keyboard navigation and screen reader support
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'destructive'],
      description: 'Visual style variant of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: 'Size of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state with spinner',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    touchTarget: {
      control: 'boolean',
      description: 'Ensures 44px minimum touch target for mobile',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    ripple: {
      control: 'boolean',
      description: 'Enables ripple effect on click',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: 'Makes button take full width of container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler',
    },
  },
  args: {
    onClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary button
 */
export const Default: Story = {
  args: {
    children: 'Primary Button',
  },
};

/**
 * All button variants showcase
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <EnhancedButton variant="default">Primary</EnhancedButton>
      <EnhancedButton variant="secondary">Secondary</EnhancedButton>
      <EnhancedButton variant="ghost">Ghost</EnhancedButton>
      <EnhancedButton variant="outline">Outline</EnhancedButton>
      <EnhancedButton variant="destructive">Destructive</EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available button variants with their distinct visual styles.',
      },
    },
  },
};

/**
 * Different button sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <EnhancedButton size="sm">Small</EnhancedButton>
      <EnhancedButton size="default">Medium</EnhancedButton>
      <EnhancedButton size="lg">Large</EnhancedButton>
      <EnhancedButton size="icon">
        <Settings className="w-4 h-4" />
      </EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Available button sizes from small to large, plus icon-only variant.',
      },
    },
  },
};

/**
 * Buttons with icons
 */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <EnhancedButton>
        <Play className="w-4 h-4 mr-2" />
        Play Lesson
      </EnhancedButton>
      <EnhancedButton variant="secondary">
        <Download className="w-4 h-4 mr-2" />
        Download
      </EnhancedButton>
      <EnhancedButton variant="ghost">
        <Share className="w-4 h-4 mr-2" />
        Share
      </EnhancedButton>
      <EnhancedButton variant="outline">
        <Heart className="w-4 h-4 mr-2" />
        Favorite
      </EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Buttons with leading icons for enhanced visual communication.',
      },
    },
  },
};

/**
 * Loading states
 */
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <EnhancedButton loading>Loading...</EnhancedButton>
      <EnhancedButton variant="secondary" loading>
        Saving
      </EnhancedButton>
      <EnhancedButton variant="outline" loading>
        Processing
      </EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading states with spinner indicators and disabled interaction.',
      },
    },
  },
};

/**
 * Disabled states
 */
export const DisabledStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <EnhancedButton disabled>Disabled Primary</EnhancedButton>
      <EnhancedButton variant="secondary" disabled>
        Disabled Secondary
      </EnhancedButton>
      <EnhancedButton variant="outline" disabled>
        Disabled Outline
      </EnhancedButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Disabled button states with reduced opacity and no interaction.',
      },
    },
  },
};

/**
 * Mobile-optimized buttons with touch targets
 */
export const MobileOptimized: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <EnhancedButton touchTarget className="w-full">
        Full Width Touch Button
      </EnhancedButton>
      <EnhancedButton variant="secondary" touchTarget className="w-full">
        Secondary Touch Button
      </EnhancedButton>
      <div className="flex gap-2">
        <EnhancedButton touchTarget size="icon">
          <Plus className="w-5 h-5" />
        </EnhancedButton>
        <EnhancedButton touchTarget size="icon" variant="outline">
          <Heart className="w-5 h-5" />
        </EnhancedButton>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: 'Mobile-optimized buttons with 44px minimum touch targets and full-width layouts.',
      },
    },
  },
};

/**
 * Interactive button with ripple effect
 */
export const WithRipple: Story = {
  args: {
    ripple: true,
    children: 'Click for Ripple Effect',
  },
  parameters: {
    docs: {
      description: {
        story: 'Button with material design ripple effect on click.',
      },
    },
  },
};

/**
 * Accessibility demonstration
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-white mb-4">
        <h3 className="font-semibold mb-2">Keyboard Navigation Test</h3>
        <p className="text-sm text-gray-300">
          Use Tab to navigate, Enter or Space to activate
        </p>
      </div>
      <div className="flex flex-wrap gap-4">
        <EnhancedButton aria-label="Primary action button">
          Primary Action
        </EnhancedButton>
        <EnhancedButton 
          variant="secondary" 
          aria-describedby="help-text"
        >
          Secondary Action
        </EnhancedButton>
        <EnhancedButton 
          variant="outline"
          role="button"
          tabIndex={0}
        >
          Outline Action
        </EnhancedButton>
      </div>
      <p id="help-text" className="text-xs text-gray-400">
        This button performs a secondary action
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'keyboard',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: 'Accessibility features including proper ARIA labels, keyboard navigation, and focus management.',
      },
    },
  },
};

/**
 * Real-world usage examples
 */
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Call to Action */}
      <div className="text-center">
        <h3 className="text-white font-semibold mb-2">Call to Action</h3>
        <EnhancedButton size="lg" rippleEffect>
          Start Learning Solidity
        </EnhancedButton>
      </div>

      {/* Form Actions */}
      <div>
        <h3 className="text-white font-semibold mb-2">Form Actions</h3>
        <div className="flex gap-3">
          <EnhancedButton variant="outline">Cancel</EnhancedButton>
          <EnhancedButton>Save Changes</EnhancedButton>
        </div>
      </div>

      {/* Toolbar Actions */}
      <div>
        <h3 className="text-white font-semibold mb-2">Toolbar Actions</h3>
        <div className="flex gap-2">
          <EnhancedButton size="icon" variant="ghost">
            <Play className="w-4 h-4" />
          </EnhancedButton>
          <EnhancedButton size="icon" variant="ghost">
            <Download className="w-4 h-4" />
          </EnhancedButton>
          <EnhancedButton size="icon" variant="ghost">
            <Share className="w-4 h-4" />
          </EnhancedButton>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Real-world usage examples showing common button patterns and layouts.',
      },
    },
  },
};
