import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  MessageCircle, 
  Users, 
  Settings, 
  Maximize2, 
  Minimize2,
  Grid,
  Sidebar,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MonacoCollaborativeEditor from './MonacoCollaborativeEditor';
import LiveChatSystem from './LiveChatSystem';
import AdvancedUserPresence from './AdvancedUserPresence';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

interface ComprehensiveCollaborationDashboardProps {
  sessionId: string;
  initialCode?: string;
  language?: string;
  onCodeChange?: (_code: string) => void;
  onSave?: (_code: string) => void;
}

type LayoutMode = 'split' | 'editor-focus' | 'chat-focus' | 'grid';

export const ComprehensiveCollaborationDashboard: React.FC<ComprehensiveCollaborationDashboardProps> = ({
  sessionId,
  initialCode = '',
  language = 'solidity',
  onCodeChange,
  onSave
}) => {
  const { user } = useAuth(_);
  const { toast } = useToast(_);
  const { 
    isConnected, 
    session, 
    participants,
    leaveSession 
  } = useSocket(_);

  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(_false);
  const [showSettings, setShowSettings] = useState(_false);
  const [activeTab, setActiveTab] = useState('editor');
  const [isAudioEnabled, setIsAudioEnabled] = useState(_false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(_false);
  const [isScreenSharing, setIsScreenSharing] = useState(_false);
  const [selectedUser, setSelectedUser] = useState<string | null>(_null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (_e: KeyboardEvent) => {
      if (_e.ctrlKey || e.metaKey) {
        switch (_e.key) {
          case 's':
            e.preventDefault(_);
            // Trigger save
            break;
          case 'Enter':
            if (_e.shiftKey) {
              e.preventDefault(_);
              // Toggle fullscreen
              setIsFullscreen(!isFullscreen);
            }
            break;
          case '1':
            e.preventDefault(_);
            setLayoutMode('editor-focus');
            break;
          case '2':
            e.preventDefault(_);
            setLayoutMode('chat-focus');
            break;
          case '3':
            e.preventDefault(_);
            setLayoutMode('split');
            break;
          case '4':
            e.preventDefault(_);
            setLayoutMode('grid');
            break;
        }
      }
    };

    window.addEventListener( 'keydown', handleKeyDown);
    return (_) => window.removeEventListener( 'keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleUserClick = (_userId: string) => {
    setSelectedUser(_userId);
    // Could open user profile or start direct message
    toast({
      title: 'User Selected',
      description: `Selected user: ${participants.find(p => p.id === userId)?.name}`,
    });
  };

  const toggleAudio = async () => {
    try {
      if (isAudioEnabled) {
        // Disable audio
        setIsAudioEnabled(_false);
        toast({
          title: 'Audio Disabled',
          description: 'Your microphone has been muted.',
        });
      } else {
        // Enable audio with stream processing
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true  });

        // Process audio stream for collaboration features
        const audioContext = new AudioContext(_);
        const source = audioContext.createMediaStreamSource(_stream);
        const analyser = audioContext.createAnalyser(_);
        source.connect(_analyser);

        // Store stream for real-time audio analysis
        localStorage.setItem(`audio_stream_${sessionId}`, JSON.stringify({
          enabled: true,
          timestamp: Date.now(_),
          sampleRate: audioContext.sampleRate
        }));

        setIsAudioEnabled(_true);
        toast({
          title: 'Audio Enabled',
          description: 'Your microphone is now active with real-time processing.',
        });
      }
    } catch (error) {
      toast({
        title: 'Audio Error',
        description: 'Failed to access microphone.',
        variant: 'destructive'
      });
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Disable video
        setIsVideoEnabled(_false);
        toast({
          title: 'Video Disabled',
          description: 'Your camera has been turned off.',
        });
      } else {
        // Enable video with stream processing
        const stream = await navigator.mediaDevices.getUserMedia({ video: true  });

        // Process video stream for collaboration features
        const videoTrack = stream.getVideoTracks(_)[0];
        const videoSettings = videoTrack.getSettings(_);

        // Store video stream metadata for collaboration
        localStorage.setItem(`video_stream_${sessionId}`, JSON.stringify({
          enabled: true,
          timestamp: Date.now(_),
          resolution: `${videoSettings.width}x${videoSettings.height}`,
          frameRate: videoSettings.frameRate
        }));

        setIsVideoEnabled(_true);
        toast({
          title: 'Video Enabled',
          description: 'Your camera is now active with stream processing.',
        });
      }
    } catch (error) {
      toast({
        title: 'Video Error',
        description: 'Failed to access camera.',
        variant: 'destructive'
      });
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        setIsScreenSharing(_false);
        toast({
          title: 'Screen Share Stopped',
          description: 'You stopped sharing your screen.',
        });
      } else {
        // Start screen sharing with stream processing
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true  });

        // Process screen share stream for collaboration features
        const videoTrack = stream.getVideoTracks(_)[0];
        const screenSettings = videoTrack.getSettings(_);

        // Store screen share metadata for collaboration
        localStorage.setItem(`screen_stream_${sessionId}`, JSON.stringify({
          enabled: true,
          timestamp: Date.now(_),
          displaySurface: screenSettings.displaySurface,
          resolution: `${screenSettings.width}x${screenSettings.height}`
        }));

        // Handle stream end event
        videoTrack.onended = (_) => {
          setIsScreenSharing(_false);
          localStorage.removeItem(_`screen_stream_${sessionId}`);
        };

        setIsScreenSharing(_true);
        toast({
          title: 'Screen Share Started',
          description: 'You are now sharing your screen with stream processing.',
        });
      }
    } catch (error) {
      toast({
        title: 'Screen Share Error',
        description: 'Failed to start screen sharing.',
        variant: 'destructive'
      });
    }
  };

  const exportSession = (_) => {
    const sessionData = {
      sessionId,
      participants: participants.map( p => ({ id: p.id, name: p.name })),
      code: initialCode,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob( [JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(_blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaboration-session-${sessionId}-${Date.now(_)}.json`;
    a.click(_);
    URL.revokeObjectURL(_url);

    toast({
      title: 'Session Exported',
      description: 'Session data has been downloaded.',
    });
  };

  const renderLayout = (_) => {
    const editorComponent = (
      <MonacoCollaborativeEditor
        sessionId={sessionId}
        initialCode={initialCode}
        language={language}
        onCodeChange={onCodeChange}
        onSave={onSave}
      />
    );

    const chatComponent = (
      <LiveChatSystem
        sessionId={sessionId}
        showHeader={layoutMode !== 'grid'}
        maxHeight={layoutMode === 'chat-focus' ? '80vh' : '600px'}
      />
    );

    const presenceComponent = (
      <AdvancedUserPresence
        sessionId={sessionId}
        showDetails={true}
        onUserClick={handleUserClick}
      />
    );

    switch (_layoutMode) {
      case 'editor-focus':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            <div className="lg:col-span-3 h-full">
              {editorComponent}
            </div>
            <div className="lg:col-span-1 space-y-4">
              {presenceComponent}
              <div className="h-64">
                {chatComponent}
              </div>
            </div>
          </div>
        );

      case 'chat-focus':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
            <div className="lg:col-span-1 space-y-4">
              {presenceComponent}
              <div className="h-64">
                {editorComponent}
              </div>
            </div>
            <div className="lg:col-span-3 h-full">
              {chatComponent}
            </div>
          </div>
        );

      case 'grid':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            <div className="space-y-4">
              <div className="h-96">
                {editorComponent}
              </div>
              {presenceComponent}
            </div>
            <div className="h-full">
              {chatComponent}
            </div>
          </div>
        );

      case 'split':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <div className="lg:col-span-2 h-full">
              {editorComponent}
            </div>
            <div className="lg:col-span-1 space-y-4">
              {presenceComponent}
              <div className="flex-1">
                {chatComponent}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">
            Collaboration Session
          </h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {session?.title || 'Untitled Session'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Layout controls */}
          <div className="flex items-center space-x-1 bg-slate-700 rounded-lg p-1">
            <Button
              size="sm"
              variant={layoutMode === 'editor-focus' ? 'default' : 'ghost'}
              onClick={(_) => setLayoutMode('editor-focus')}
              title="Editor Focus (_Ctrl+1)"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === 'chat-focus' ? 'default' : 'ghost'}
              onClick={(_) => setLayoutMode('chat-focus')}
              title="Chat Focus (_Ctrl+2)"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === 'split' ? 'default' : 'ghost'}
              onClick={(_) => setLayoutMode('split')}
              title="Split View (_Ctrl+3)"
            >
              <Sidebar className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={layoutMode === 'grid' ? 'default' : 'ghost'}
              onClick={(_) => setLayoutMode('grid')}
              title="Grid View (_Ctrl+4)"
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>

          {/* Media controls */}
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant={isAudioEnabled ? 'default' : 'outline'}
              onClick={toggleAudio}
            >
              {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant={isVideoEnabled ? 'default' : 'outline'}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant={isScreenSharing ? 'default' : 'outline'}
              onClick={toggleScreenShare}
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>

          {/* Session controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={(_) => setSelectedUser(_selectedUser ? null : participants[0]?.id || null)}
            title="Manage participants"
          >
            <Users className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(_) => {
              // File upload functionality
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.sol,.js,.ts,.json';
              input.onchange = (_e) => {
                const file = (_e.target as HTMLInputElement).files?.[0];
                if (file) {
                  toast({
                    title: 'File Upload',
                    description: `Uploading ${file.name}...`,
                  });
                  // In real app, would upload file and share with participants
                }
              };
              input.click(_);
            }}
            title="Upload file"
          >
            <Upload className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={exportSession}>
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={(_) => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(_) => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen (_Ctrl+Shift+Enter)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-4 overflow-hidden">
        {renderLayout(_)}
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-slate-800 border-l border-slate-700 p-4 z-40"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Session Settings</h3>
              <Button size="sm" variant="ghost" onClick={(_) => setShowSettings(_false)}>
                ×
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="participants">Participants</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="session" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div>
                      <label className="text-sm text-gray-400">Session ID</label>
                      <div className="text-white font-mono text-sm bg-slate-700 p-2 rounded">
                        {sessionId}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="participants" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div>
                      <label className="text-sm text-gray-400">Participants ({ participants.length })</label>
                      <div className="space-y-2 mt-2">
                        {participants.map(participant => (
                          <div key={participant.id} className="flex items-center space-x-2 text-sm text-white">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs">
                              {participant.name?.charAt(0) || 'A'}
                            </div>
                            <span>{participant.name}</span>
                            {participant.id === user?.id && <span className="text-gray-400">(_You)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="pt-4 border-t border-slate-700">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={(_) => {
                          leaveSession(_);
                          toast({
                            title: 'Left Session',
                            description: 'You have left the collaboration session.',
                          });
                        }}
                      >
                        Leave Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComprehensiveCollaborationDashboard;
