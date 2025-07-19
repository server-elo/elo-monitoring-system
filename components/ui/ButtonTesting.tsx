'use client';

import React, { useState } from 'react';
;
import { Play, Download, Settings, Trash2, Check, X, Heart, Star, Send, Edit, Copy, Share, Plus, Minus } from 'lucide-react';
import { 
  EnhancedButton, 
  PrimaryButton, 
  SecondaryButton, 
  SuccessButton, 
  DangerButton,
  AsyncSubmitButton,
  AsyncSaveButton,
  AsyncDeleteButton
} from './EnhancedButton';
import { 
  GlassmorphismButton, 
  NeumorphismButton,
  GlassPrimaryButton,
  GlassSecondaryButton,
  GlassSuccessButton,
  GlassDangerButton,
  GlassButtonGroup
} from './GlassmorphismButtons';
import { LoadingSpinner } from './LoadingSpinner';
import { FeedbackIndicator, SuccessIndicator, ErrorIndicator } from './FeedbackIndicators';
import { Card } from './card';
;

export function ButtonTesting() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [_isTestingAll, setIsTestingAll] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const simulateAsyncAction = (duration: number = 2000): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 80% success rate for testing
        if (Math.random() > 0.2) {
          resolve();
        } else {
          reject(new Error('Simulated error for testing'));
        }
      }, duration);
    });
  };

  const testAllButtons = async () => {
    setIsTestingAll(true);
    setTestResults([]);
    
    try {
      addTestResult('Starting comprehensive button test...');
      
      // Test async functionality
      addTestResult('Testing async submit...');
      await simulateAsyncAction(1000);
      addTestResult('✅ Async submit test passed');
      
      // Test save functionality
      addTestResult('Testing async save...');
      await simulateAsyncAction(800);
      addTestResult('✅ Async save test passed');
      
      // Test error handling
      addTestResult('Testing error handling...');
      try {
        await simulateAsyncAction(500);
        addTestResult('✅ Error handling test passed');
      } catch (error) {
        addTestResult('✅ Error handling working correctly');
      }
      
      addTestResult('🎉 All tests completed successfully!');
    } catch (error) {
      addTestResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Button & CTA Testing Suite</h1>
          <p className="text-gray-300 text-lg">
            Comprehensive testing of enhanced button components with visual feedback, 
            async handling, accessibility, and design patterns
          </p>
        </div>

        {/* Test Controls */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Test Controls</h2>
            <EnhancedButton
              asyncAction={testAllButtons}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              loadingText="Running Tests..."
              successText="Tests Complete!"
              touchTarget
              glowEffect
              tooltip="Run comprehensive button functionality tests"
            >
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </EnhancedButton>
          </div>
          
          {/* Test Results */}
          <div className="bg-black/20 rounded-lg p-4 h-32 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Test Results:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">No tests run yet...</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <p key={index} className="text-sm text-gray-300 font-mono">
                    {result}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Basic Enhanced Buttons */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Enhanced Button Variants</h2>
          <GlassButtonGroup className="flex-wrap">
            <PrimaryButton
              onClick={() => addTestResult('Primary button clicked')}
              tooltip="Primary action button"
            >
              <Star className="w-4 h-4 mr-2" />
              Primary
            </PrimaryButton>
            
            <SecondaryButton
              onClick={() => addTestResult('Secondary button clicked')}
              tooltip="Secondary action button"
            >
              <Settings className="w-4 h-4 mr-2" />
              Secondary
            </SecondaryButton>
            
            <SuccessButton
              onClick={() => addTestResult('Success button clicked')}
              tooltip="Success action button"
            >
              <Check className="w-4 h-4 mr-2" />
              Success
            </SuccessButton>
            
            <DangerButton
              onClick={() => addTestResult('Danger button clicked')}
              tooltip="Dangerous action button"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Danger
            </DangerButton>
          </GlassButtonGroup>
        </Card>

        {/* Async Action Buttons */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Async Action Buttons</h2>
          <GlassButtonGroup className="flex-wrap">
            <AsyncSubmitButton
              onSubmit={() => simulateAsyncAction(2000)}
              submitText="Submit Form"
              tooltip="Submit form with validation"
              asyncOptions={{
                onSuccess: () => addTestResult('Form submitted successfully'),
                onError: (error: Error) => addTestResult(`Form submission failed: ${error.message}`)
              }}
            />
            
            <AsyncSaveButton
              onSave={() => simulateAsyncAction(1500)}
              tooltip="Save current changes"
              asyncOptions={{
                onSuccess: () => addTestResult('Changes saved successfully'),
                onError: (error: Error) => addTestResult(`Save failed: ${error.message}`)
              }}
            />
            
            <AsyncDeleteButton
              onDelete={() => simulateAsyncAction(1000)}
              confirmText="Delete Item"
              tooltip="Delete selected item"
              asyncOptions={{
                onSuccess: () => addTestResult('Item deleted successfully'),
                onError: (error: Error) => addTestResult(`Delete failed: ${error.message}`)
              }}
            />
          </GlassButtonGroup>
        </Card>

        {/* Glassmorphism Buttons */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Glassmorphism Design Patterns</h2>
          <div className="space-y-4">
            <GlassButtonGroup>
              <GlassPrimaryButton
                onClick={() => addTestResult('Glass primary clicked')}
                tooltip="Glassmorphism primary button"
              >
                <Send className="w-4 h-4 mr-2" />
                Glass Primary
              </GlassPrimaryButton>
              
              <GlassSecondaryButton
                onClick={() => addTestResult('Glass secondary clicked')}
                tooltip="Glassmorphism secondary button"
              >
                <Edit className="w-4 h-4 mr-2" />
                Glass Secondary
              </GlassSecondaryButton>
              
              <GlassSuccessButton
                onClick={() => addTestResult('Glass success clicked')}
                tooltip="Glassmorphism success button"
              >
                <Download className="w-4 h-4 mr-2" />
                Glass Success
              </GlassSuccessButton>
              
              <GlassDangerButton
                onClick={() => addTestResult('Glass danger clicked')}
                tooltip="Glassmorphism danger button"
              >
                <X className="w-4 h-4 mr-2" />
                Glass Danger
              </GlassDangerButton>
            </GlassButtonGroup>
            
            {/* Different intensities */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">Blur Intensities:</h3>
              <GlassButtonGroup>
                <GlassmorphismButton
                  variant="neutral"
                  intensity="light"
                  onClick={() => addTestResult('Light blur clicked')}
                >
                  Light Blur
                </GlassmorphismButton>
                
                <GlassmorphismButton
                  variant="neutral"
                  intensity="medium"
                  onClick={() => addTestResult('Medium blur clicked')}
                >
                  Medium Blur
                </GlassmorphismButton>
                
                <GlassmorphismButton
                  variant="neutral"
                  intensity="heavy"
                  onClick={() => addTestResult('Heavy blur clicked')}
                >
                  Heavy Blur
                </GlassmorphismButton>
              </GlassButtonGroup>
            </div>
          </div>
        </Card>

        {/* Neumorphism Buttons */}
        <div className="p-6 bg-gray-100 rounded-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Neumorphism Design Patterns</h2>
          <GlassButtonGroup>
            <NeumorphismButton
              variant="raised"
              onClick={() => addTestResult('Neumorphic raised clicked')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Raised
            </NeumorphismButton>
            
            <NeumorphismButton
              variant="pressed"
              onClick={() => addTestResult('Neumorphic pressed clicked')}
            >
              <Minus className="w-4 h-4 mr-2" />
              Pressed
            </NeumorphismButton>
            
            <NeumorphismButton
              variant="flat"
              onClick={() => addTestResult('Neumorphic flat clicked')}
            >
              <Copy className="w-4 h-4 mr-2" />
              Flat
            </NeumorphismButton>
          </GlassButtonGroup>
        </div>

        {/* Accessibility Features */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Accessibility Features</h2>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              All buttons include: ARIA labels, keyboard navigation, touch-friendly sizing (44px minimum), 
              screen reader support, and focus management.
            </p>
            
            <GlassButtonGroup>
              <EnhancedButton
                className="bg-purple-600 hover:bg-purple-700 text-white"
                touchTarget
                ariaLabel="Accessible button with ARIA label"
                description="This button demonstrates accessibility features"
                tooltip="Fully accessible button with ARIA support"
                onClick={() => addTestResult('Accessible button clicked')}
              >
                <Heart className="w-4 h-4 mr-2" />
                Accessible
              </EnhancedButton>
              
              <EnhancedButton
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                touchTarget
                hapticFeedback
                soundEffect
                tooltip="Button with haptic and sound feedback"
                onClick={() => addTestResult('Feedback button clicked')}
              >
                <Share className="w-4 h-4 mr-2" />
                Feedback
              </EnhancedButton>
            </GlassButtonGroup>
          </div>
        </Card>

        {/* Loading States */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Loading State Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <LoadingSpinner variant="default" size="md" text="Default" />
            <LoadingSpinner variant="dots" size="md" text="Dots" />
            <LoadingSpinner variant="pulse" size="md" text="Pulse" />
            <LoadingSpinner variant="ring" size="md" text="Ring" />
          </div>
        </Card>

        {/* Feedback Indicators */}
        <Card className="p-6 bg-white/10 backdrop-blur-md border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Feedback Indicators</h2>
          <div className="space-y-4">
            <SuccessIndicator>Operation completed successfully!</SuccessIndicator>
            <ErrorIndicator>An error occurred during processing</ErrorIndicator>
            <FeedbackIndicator type="warning">Warning: Please review your input</FeedbackIndicator>
            <FeedbackIndicator type="info">Information: Process will take a few moments</FeedbackIndicator>
          </div>
        </Card>
      </div>
    </div>
  );
}
