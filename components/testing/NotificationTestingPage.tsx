'use client';

import React, { useState } from 'react';
;
import { Bell, CheckCircle, AlertCircle, Info, Trophy, Star, Zap, Users, Settings, Play, Pause, Volume2, VolumeX, History, TestTube } from 'lucide-react';
import { GlassContainer } from '@/components/ui/Glassmorphism';
import { useNotifications } from '@/components/ui/NotificationSystem';
import { useManualNotificationTriggers } from '@/components/notifications/NotificationIntegrations';
import { useNotificationSocket } from '@/lib/hooks/useNotificationSocket';
import { cn } from '@/lib/utils';

/**
 * Comprehensive testing page for the notification system
 * This page allows testing all notification features and integrations
 */
export function NotificationTestingPage() {
  const {
    notifications,
    unreadCount,
    isPaused,
    togglePause,
    toggleHistory,
    togglePreferences,
    preferences,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showAchievement,
    showXPGain,
    showLevelUp,
    showCollaboration,
    showBanner
  } = useNotifications();

  const manualTriggers = useManualNotificationTriggers();
  const { connectionStatus, sendNotificationToRoom, joinRoom, leaveRoom } = useNotificationSocket();

  const [testRoom, setTestRoom] = useState('test-room-123');
  const [isInRoom, setIsInRoom] = useState(false);

  // Basic notification tests
  const basicTests = [
    {
      name: 'Success Notification',
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      action: () => showSuccess('Success!', 'This is a success notification with auto-dismiss'),
    },
    {
      name: 'Error Notification',
      icon: <AlertCircle className="w-4 h-4 text-red-400" />,
      action: () => showError('Error!', 'This is an error notification', {
        persistent: true,
        action: {
          label: 'Retry',
          onClick: () => showInfo('Retry', 'Retry action triggered!')
        }
      }),
    },
    {
      name: 'Warning Notification',
      icon: <AlertCircle className="w-4 h-4 text-yellow-400" />,
      action: () => showWarning('Warning!', 'This is a warning notification'),
    },
    {
      name: 'Info Notification',
      icon: <Info className="w-4 h-4 text-blue-400" />,
      action: () => showInfo('Information', 'This is an informational notification'),
    },
    {
      name: 'Banner Notification',
      icon: <Bell className="w-4 h-4 text-purple-400" />,
      action: () => showBanner('System Notice', 'This is a banner notification that appears at the top', 'info'),
    },
  ];

  // Gamification tests
  const gamificationTests = [
    {
      name: 'XP Gain',
      icon: <Zap className="w-4 h-4 text-blue-400" />,
      action: () => showXPGain(50, 'Completed a lesson!'),
    },
    {
      name: 'Level Up',
      icon: <Star className="w-4 h-4 text-yellow-400" />,
      action: () => showLevelUp(5, 'Congratulations on reaching level 5!'),
    },
    {
      name: 'Achievement',
      icon: <Trophy className="w-4 h-4 text-yellow-400" />,
      action: () => showAchievement('First Contract!', 'You deployed your first smart contract!', {
        achievement: 'first-contract',
        category: 'milestone',
        priority: 'high'
      }),
    },
    {
      name: 'Collaboration',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      action: () => showCollaboration('Alice joined your coding session', 'Alice'),
    },
  ];

  // Integration tests
  const integrationTests = [
    {
      name: 'Trigger XP Gain',
      action: () => manualTriggers.triggerXPGain(25, 'Testing'),
    },
    {
      name: 'Trigger Level Up',
      action: () => manualTriggers.triggerLevelUp(3, 2),
    },
    {
      name: 'Trigger Achievement',
      action: () => manualTriggers.triggerAchievement('Test Achievement', 'This is a test achievement'),
    },
    {
      name: 'Trigger User Joined',
      action: () => manualTriggers.triggerUserJoined('TestUser', 'Test Room'),
    },
    {
      name: 'Trigger Code Change',
      action: () => manualTriggers.triggerCodeChange('TestUser', 'contract.sol'),
    },
  ];

  // Stress tests
  const stressTests = [
    {
      name: 'Spam Notifications (5)',
      action: () => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            showInfo(`Spam ${i + 1}`, `This is spam notification ${i + 1}`);
          }, i * 100);
        }
      },
    },
    {
      name: 'Mixed Type Spam',
      action: () => {
        const types = ['success', 'error', 'warning', 'info'];
        types.forEach((type, i) => {
          setTimeout(() => {
            switch (type) {
              case 'success':
                showSuccess(`Success ${i + 1}`, 'Success message');
                break;
              case 'error':
                showError(`Error ${i + 1}`, 'Error message');
                break;
              case 'warning':
                showWarning(`Warning ${i + 1}`, 'Warning message');
                break;
              case 'info':
                showInfo(`Info ${i + 1}`, 'Info message');
                break;
            }
          }, i * 200);
        });
      },
    },
    {
      name: 'Long Message Test',
      action: () => showInfo(
        'Very Long Notification Title That Should Be Handled Properly',
        'This is a very long notification message that should test how the notification system handles lengthy content. It should wrap properly and maintain readability while not breaking the layout or causing any visual issues.'
      ),
    },
  ];

  // Socket tests
  const handleJoinRoom = () => {
    joinRoom(testRoom);
    setIsInRoom(true);
    showSuccess('Joined Room', `Joined room: ${testRoom}`);
  };

  const handleLeaveRoom = () => {
    leaveRoom(testRoom);
    setIsInRoom(false);
    showInfo('Left Room', `Left room: ${testRoom}`);
  };

  const handleSendToRoom = () => {
    sendNotificationToRoom(testRoom, {
      type: 'info',
      title: 'Room Notification',
      message: `Test notification sent to room ${testRoom}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <GlassContainer
          intensity="medium"
          tint="neutral"
          border
          shadow="lg"
          rounded="lg"
          className="p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TestTube className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Notification System Testing
                </h1>
                <p className="text-gray-400">
                  Comprehensive testing interface for all notification features
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Active Notifications</div>
                <div className="text-xl font-bold text-white">{notifications.length}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Unread Count</div>
                <div className="text-xl font-bold text-blue-400">{unreadCount}</div>
              </div>
            </div>
          </div>
        </GlassContainer>

        {/* System Status */}
        <GlassContainer
          intensity="medium"
          tint="neutral"
          border
          shadow="lg"
          rounded="lg"
          className="p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              {isPaused ? (
                <Pause className="w-5 h-5 text-yellow-400" />
              ) : (
                <Play className="w-5 h-5 text-green-400" />
              )}
              <span className="text-white">
                {isPaused ? 'Paused' : 'Active'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              {preferences.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-green-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-white">
                Sound {preferences.soundEnabled ? 'On' : 'Off'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                connectionStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
              )} />
              <span className="text-white">
                Socket {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-blue-400" />
              <span className="text-white">
                Max Visible: {preferences.maxVisible}
              </span>
            </div>
          </div>
        </GlassContainer>

        {/* Control Panel */}
        <GlassContainer
          intensity="medium"
          tint="neutral"
          border
          shadow="lg"
          rounded="lg"
          className="p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={togglePause}
              className={cn(
                'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                isPaused
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-yellow-600 hover:bg-yellow-700 text-white'
              )}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            <button
              onClick={toggleHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            
            <button
              onClick={togglePreferences}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Preferences</span>
            </button>
            
            <button
              onClick={clearAll}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </GlassContainer>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Tests */}
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Basic Notifications</h2>
            <div className="space-y-3">
              {basicTests.map((test, index) => (
                <button
                  key={index}
                  onClick={test.action}
                  className="w-full flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  {test.icon}
                  <span className="text-white">{test.name}</span>
                </button>
              ))}
            </div>
          </GlassContainer>

          {/* Gamification Tests */}
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Gamification</h2>
            <div className="space-y-3">
              {gamificationTests.map((test, index) => (
                <button
                  key={index}
                  onClick={test.action}
                  className="w-full flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  {test.icon}
                  <span className="text-white">{test.name}</span>
                </button>
              ))}
            </div>
          </GlassContainer>

          {/* Integration Tests */}
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Integration Tests</h2>
            <div className="space-y-3">
              {integrationTests.map((test, index) => (
                <button
                  key={index}
                  onClick={test.action}
                  className="w-full flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                >
                  <TestTube className="w-4 h-4 text-green-400" />
                  <span className="text-white">{test.name}</span>
                </button>
              ))}
            </div>
          </GlassContainer>

          {/* Socket Tests */}
          <GlassContainer
            intensity="medium"
            tint="neutral"
            border
            shadow="lg"
            rounded="lg"
            className="p-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Socket.io Tests</h2>
            <div className="space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={testRoom}
                  onChange={(e) => setTestRoom(e.target.value)}
                  placeholder="Room ID"
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400"
                />
                <button
                  onClick={isInRoom ? handleLeaveRoom : handleJoinRoom}
                  className={cn(
                    'px-4 py-2 rounded transition-colors',
                    isInRoom
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  )}
                >
                  {isInRoom ? 'Leave' : 'Join'}
                </button>
              </div>
              
              <button
                onClick={handleSendToRoom}
                disabled={!isInRoom}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Send to Room
              </button>
            </div>
          </GlassContainer>
        </div>

        {/* Stress Tests */}
        <GlassContainer
          intensity="medium"
          tint="neutral"
          border
          shadow="lg"
          rounded="lg"
          className="p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Stress Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stressTests.map((test, index) => (
              <button
                key={index}
                onClick={test.action}
                className="flex items-center space-x-3 p-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg transition-colors text-left"
              >
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-white">{test.name}</span>
              </button>
            ))}
          </div>
        </GlassContainer>
      </div>
    </div>
  );
}
