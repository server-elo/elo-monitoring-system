'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  LightBulbIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { TutorialStep } from './OnboardingFlow';

interface InteractiveTutorialProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  title: string;
}

export const InteractiveTutorial: React.FC<InteractiveTutorialProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  title: _title,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
    if (targetElement) {
      setHighlightedElement(targetElement);
      calculateTooltipPosition(targetElement);
      
      // Scroll element into view
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center'
      });

      // Add highlight class
      targetElement.classList.add('tutorial-highlight');
      
      // Announce to screen readers
      announceStep();
    }

    return () => {
      if (targetElement) {
        targetElement.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStep, isActive, currentStepData]);

  const calculateTooltipPosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let x = 0;
    let y = 0;

    switch (currentStepData.position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 20;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 20;
        break;
      case 'left':
        x = rect.left - 20;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 20;
        y = rect.top + rect.height / 2;
        break;
    }

    // Adjust for viewport boundaries
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    if (x - tooltipWidth / 2 < 20) x = tooltipWidth / 2 + 20;
    if (x + tooltipWidth / 2 > viewport.width - 20) x = viewport.width - tooltipWidth / 2 - 20;
    if (y - tooltipHeight < 20) y = tooltipHeight + 20;
    if (y + tooltipHeight > viewport.height - 20) y = viewport.height - tooltipHeight - 20;

    setTooltipPosition({ x, y });
  };

  const announceStep = () => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = `Tutorial step ${currentStep + 1} of ${steps.length}: ${currentStepData.title}. ${currentStepData.description}`;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Element click handling is done inline in the overlay
  // const _handleElementClick = () => {
  //   if (currentStepData.action === 'click') {
  //     // Simulate the expected action
  //     setTimeout(handleNext, 500);
  //   }
  // };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onSkip();
    } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
      handleNext();
    } else if (event.key === 'ArrowLeft') {
      handlePrevious();
    }
  };

  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      />

      {/* Spotlight effect */}
      {highlightedElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: highlightedElement.getBoundingClientRect().left - 8,
            top: highlightedElement.getBoundingClientRect().top - 8,
            width: highlightedElement.getBoundingClientRect().width + 16,
            height: highlightedElement.getBoundingClientRect().height + 16,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)',
            borderRadius: '8px',
          }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-50 w-80"
        style={{
          left: tooltipPosition.x - 160,
          top: tooltipPosition.y,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <div className="glass border border-blue-500/30 bg-blue-500/10 rounded-xl p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <LightBulbIcon className="w-6 h-6 text-blue-400" />
              <h3 id="tutorial-title" className="font-semibold text-white">
                {currentStepData.title}
              </h3>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Skip tutorial"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {currentStepData.content}
          </p>

          {/* Action hint */}
          {currentStepData.action && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-xs">
                {currentStepData.action === 'click' && '👆 Click the highlighted element to continue'}
                {currentStepData.action === 'type' && '⌨️ Try typing in the highlighted area'}
                {currentStepData.action === 'hover' && '🖱️ Hover over the highlighted element'}
              </p>
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-1">
              <motion.div
                className="bg-blue-500 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-1 px-3 py-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={onSkip}
                className="px-3 py-1 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleNext}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span>{isLastStep ? 'Finish' : 'Next'}</span>
                {isLastStep ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointing to target */}
        <div
          className={cn(
            'absolute w-3 h-3 bg-blue-500 border border-blue-500/30 rotate-45',
            currentStepData.position === 'top' && 'bottom-[-7px] left-1/2 transform -translate-x-1/2',
            currentStepData.position === 'bottom' && 'top-[-7px] left-1/2 transform -translate-x-1/2',
            currentStepData.position === 'left' && 'right-[-7px] top-1/2 transform -translate-y-1/2',
            currentStepData.position === 'right' && 'left-[-7px] top-1/2 transform -translate-y-1/2'
          )}
        />
      </motion.div>

      {/* Global styles for highlighting */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 51 !important;
          pointer-events: auto !important;
        }
        
        .tutorial-highlight::before {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid rgb(59, 130, 246);
          border-radius: 8px;
          pointer-events: none;
          animation: tutorial-pulse 2s infinite;
        }
        
        @keyframes tutorial-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;
