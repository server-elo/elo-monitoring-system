import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Eye, 
  MessageCircle, 
  Send, 
  Code, 
  Play, 
  Save,
  Copy,
  Download,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

interface RealTimeCodeEditorProps {
  sessionId: string;
  initialCode?: string;
  language?: string;
  readOnly?: boolean;
}

interface CursorPosition {
  line: number;
  column: number;
  userId: string;
  userName: string;
  color: string;
}

const CURSOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export const RealTimeCodeEditor: React.FC<RealTimeCodeEditorProps> = ({
  sessionId, // Used for session-specific tracking and analytics
  initialCode = '// Welcome to collaborative coding!\n// Start typing to see real-time collaboration in action\n\npragma solidity ^0.8.0;\n\ncontract HelloWorld {\n    string public message;\n    \n    constructor() {\n        message = "Hello, World!";\n    }\n    \n    function setMessage(string memory _newMessage) public {\n        message = _newMessage;\n    }\n}',
  language = 'solidity',
  readOnly = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    socket, // Used for real-time communication and event tracking
    isConnected,
    session,
    presence,
    participants,
    typingUsers,
    updateCode,
    updateCursor,
    updateSelection,
    startTyping,
    stopTyping,
    sendMessage,
    messages
  } = useSocket();

  const [code, setCode] = useState(initialCode);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Session analytics and tracking using sessionId and socket
  const trackSessionEvent = useCallback((event: string, data?: Record<string, unknown>) => {
    const eventData = {
      sessionId,
      event,
      userId: user?.id,
      timestamp: Date.now(),
      socketConnected: isConnected,
      participantCount: participants.length,
      codeLength: code.length,
      ...data
    };

    // Store in localStorage for analytics
    const events = JSON.parse(localStorage.getItem(`session_${sessionId}_events`) || '[]');
    events.push(eventData);
    localStorage.setItem(`session_${sessionId}_events`, JSON.stringify(events.slice(-200)));

    // Emit to socket for real-time analytics
    if (socket && isConnected) {
      socket.emit('session-analytics', eventData);
    }

    console.log('Session event tracked:', eventData);
  }, [sessionId, user?.id, isConnected, participants.length, code.length, socket]);

  // Enhanced socket connection monitoring
  useEffect(() => {
    if (socket) {
      const handleConnect = () => {
        trackSessionEvent('socket_connected');
      };

      const handleDisconnect = () => {
        trackSessionEvent('socket_disconnected');
      };

      const handleReconnect = () => {
        trackSessionEvent('socket_reconnected');
      };

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('reconnect', handleReconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.off('reconnect', handleReconnect);
      };
    }
  }, [socket, trackSessionEvent]);

  // Handle code changes with real-time sync and analytics
  const handleCodeChange = useCallback((newCode: string) => {
    if (readOnly) return;

    const oldLength = code.length;
    const newLength = newCode.length;
    const changeType = newLength > oldLength ? 'addition' : newLength < oldLength ? 'deletion' : 'modification';

    setCode(newCode);
    updateCode(newCode);

    // Track code change event
    trackSessionEvent('code_changed', {
      changeType,
      oldLength,
      newLength,
      deltaLength: newLength - oldLength,
      language
    });

    // Start typing indicator
    if (!isTyping) {
      setIsTyping(true);
      startTyping('code');
      trackSessionEvent('typing_started', { location: 'code' });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping('code');
      trackSessionEvent('typing_stopped', { location: 'code' });
    }, 1000);
  }, [readOnly, updateCode, isTyping, startTyping, stopTyping, code.length, trackSessionEvent, language]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current || readOnly) return;
    
    const textarea = editorRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = code.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    updateCursor(line, column);
  }, [code, updateCursor, readOnly]);

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current || readOnly) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    if (start !== end) {
      const textBeforeStart = code.substring(0, start);
      const textBeforeEnd = code.substring(0, end);
      
      const startLines = textBeforeStart.split('\n');
      const endLines = textBeforeEnd.split('\n');
      
      const startLine = startLines.length;
      const startColumn = startLines[startLines.length - 1].length + 1;
      const endLine = endLines.length;
      const endColumn = endLines[endLines.length - 1].length + 1;
      
      updateSelection(startLine, startColumn, endLine, endColumn);
    }
  }, [code, updateSelection, readOnly]);

  // Update cursors from presence data
  useEffect(() => {
    const newCursors: CursorPosition[] = presence
      .filter(p => p.cursor && p.userId !== user?.id)
      .map((p, index) => ({
        line: p.cursor!.line,
        column: p.cursor!.column,
        userId: p.userId,
        userName: p.user.name || 'Anonymous',
        color: CURSOR_COLORS[index % CURSOR_COLORS.length]
      }));
    
    setCursors(newCursors);
  }, [presence, user?.id]);

  // Sync code from session
  useEffect(() => {
    if (session?.code && session.code !== code) {
      setCode(session.code);
    }
  }, [session?.code]);

  // Handle chat message send
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessage(chatMessage, 'TEXT');
      setChatMessage('');
    }
  };

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCompile = async () => {
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Compilation Successful',
          description: 'Your code compiled without errors!',
        });
      } else {
        toast({
          title: 'Compilation Failed',
          description: result.error || 'Unknown compilation error',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Compilation Error',
        description: 'Failed to compile code',
        variant: 'destructive'
      });
    }
  };

  const handleSaveCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${Date.now()}.sol`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Code Saved',
      description: 'Your code has been downloaded successfully!',
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code Copied',
      description: 'Code copied to clipboard!',
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">Collaborative Editor</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Participants */}
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">{participants.length}</span>
            <div className="flex -space-x-2">
              {participants.slice(0, 3).map((participant) => (
                <div
                  key={participant.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-800"
                  title={participant.name}
                >
                  {participant.name?.charAt(0) || 'A'}
                </div>
              ))}
              {participants.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-slate-800">
                  +{participants.length - 3}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <Button size="sm" onClick={handleCompile} className="bg-green-600 hover:bg-green-700">
            <Play className="w-4 h-4 mr-1" />
            Compile
          </Button>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleSaveCode}>
            <Download className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowChat(!showChat)}
            className={showChat ? 'bg-blue-600 text-white' : ''}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Code Editor */}
        <div className="flex-1 relative">
          <textarea
            ref={editorRef}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onSelect={handleSelectionChange}
            onMouseUp={handleCursorChange}
            onKeyUp={handleCursorChange}
            className="w-full h-full p-4 bg-slate-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
            placeholder="Start coding..."
            readOnly={readOnly}
            spellCheck={false}
          />
          
          {/* Typing indicators */}
          <AnimatePresence>
            {typingUsers.filter(u => u.typingLocation === 'code').map((user) => (
              <motion.div
                key={`${user.userId}-typing`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs"
              >
                {user.user.name} is typing...
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Cursor indicators */}
          {cursors.map((cursor) => (
            <div
              key={cursor.userId}
              className="absolute pointer-events-none"
              style={{
                // This is a simplified cursor position - in a real implementation,
                // you'd need to calculate the exact pixel position based on line/column
                top: `${cursor.line * 20}px`,
                left: `${cursor.column * 8}px`,
              }}
            >
              <div
                className="w-0.5 h-5 animate-pulse"
                style={{ backgroundColor: cursor.color }}
              />
              <div
                className="absolute -top-6 left-0 px-1 py-0.5 rounded text-xs text-white whitespace-nowrap"
                style={{ backgroundColor: cursor.color }}
              >
                {cursor.userName}
              </div>
            </div>
          ))}
        </div>

        {/* Status Panel */}
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          <Card className="m-2 bg-slate-700 border-slate-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Session Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Participants:</span>
                <Badge variant="secondary">{participants.length}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Code Lines:</span>
                <span className="text-white">{code.split('\n').length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Language:</span>
                <Badge variant="outline">{language}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="m-2 bg-slate-700 border-slate-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={handleSaveCode}
              >
                <Save className="w-3 h-3 mr-2" />
                Save Code
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // Settings functionality
                  console.log('Open settings');
                }}
              >
                <Settings className="w-3 h-3 mr-2" />
                Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-slate-800 border-l border-slate-700 flex flex-col"
            >
              <div className="p-3 border-b border-slate-700">
                <h4 className="text-sm font-semibold text-white">Chat</h4>
              </div>
              
              <div ref={chatRef} className="flex-1 p-3 overflow-y-auto space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className="text-sm">
                    <div className="font-semibold text-blue-400">
                      {message.user.name}
                    </div>
                    <div className="text-gray-300">{message.content}</div>
                  </div>
                ))}
                
                {/* Chat typing indicators */}
                {typingUsers.filter(u => u.typingLocation === 'chat').map((user) => (
                  <motion.div
                    key={`${user.userId}-chat-typing`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-gray-500 italic"
                  >
                    {user.user.name} is typing...
                  </motion.div>
                ))}
              </div>
              
              <div className="p-3 border-t border-slate-700">
                <div className="flex space-x-2">
                  <Input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    onFocus={() => startTyping('chat')}
                    onBlur={() => stopTyping('chat')}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white"
                  />
                  <Button size="sm" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RealTimeCodeEditor;
