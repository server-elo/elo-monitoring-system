import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical, 
  Reply, 
  Heart, 
  ThumbsUp,
  Edit,
  Trash2,
  Pin,
  Search,
  Filter,
  Users,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/lib/socket/client';
import { useAuth } from '@/components/auth/EnhancedAuthProvider';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage?: string;
  timestamp: Date;
  type: 'text' | 'code' | 'system' | 'file';
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  isPinned: boolean;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    codeLanguage?: string;
    lineNumber?: number;
  };
}

interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

interface LiveChatSystemProps {
  sessionId: string;
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🚀'];

export const LiveChatSystem: React.FC<LiveChatSystemProps> = ({
  sessionId,
  className = '',
  showHeader = true,
  maxHeight = '600px'
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    socket,
    isConnected,
    messages: socketMessages,
    participants,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers
  } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);

  // Define handleReaction first to avoid dependency issues
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
          sessionId
        })
      });

      if (response.ok) {
        // Update local state optimistically
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions.find(r => r.userId === user.id && r.emoji === emoji);
            if (existingReaction) {
              // Remove reaction
              return {
                ...msg,
                reactions: msg.reactions.filter(r => !(r.userId === user.id && r.emoji === emoji))
              };
            } else {
              // Add reaction
              return {
                ...msg,
                reactions: [...msg.reactions, {
                  emoji,
                  userId: user.id,
                  userName: user.name || 'Anonymous'
                }]
              };
            }
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Enhanced message interaction features with real functionality
  const handleMessageReaction = useCallback((messageId: string, reaction: 'heart' | 'thumbsUp') => {
    console.log(`Adding ${reaction} reaction to message ${messageId}`);

    // Convert reaction type to emoji
    const emojiMap = {
      heart: '❤️',
      thumbsUp: '👍'
    };

    // Use the existing handleReaction function
    handleReaction(messageId, emojiMap[reaction]);

    // Store reaction analytics
    const reactionData = {
      messageId,
      reaction,
      userId: user?.id,
      timestamp: Date.now(),
      sessionId
    };

    const reactions = JSON.parse(localStorage.getItem('message-reactions') || '[]');
    reactions.push(reactionData);
    localStorage.setItem('message-reactions', JSON.stringify(reactions.slice(-200))); // Keep last 200
  }, [handleReaction, user?.id, sessionId]);

  const handleMessageOptions = useCallback((messageId: string) => {
    console.log(`Opening options for message ${messageId}`);

    // Enhanced message options with context menu functionality
    const message = messages.find(m => m.id === messageId);
    if (message) {
      // Store message interaction for analytics
      const optionData = {
        messageId,
        action: 'options-opened',
        userId: user?.id,
        timestamp: Date.now(),
        messageType: message.type,
        sessionId
      };

      const interactions = JSON.parse(localStorage.getItem('message-interactions') || '[]');
      interactions.push(optionData);
      localStorage.setItem('message-interactions', JSON.stringify(interactions.slice(-100)));

      // Set editing state for immediate action
      setEditingMessage(messageId);
    }
  }, [messages, user?.id, sessionId]);

  // Enhanced user management features with mention system
  const handleUserMention = useCallback((userId: string) => {
    console.log(`Mentioning user ${userId}`);

    // Find user in participants
    const mentionedUser = participants.find(p => p.id === userId);
    if (mentionedUser) {
      // Add mention to current message
      const mention = `@${mentionedUser.name || 'User'} `;
      setNewMessage(prev => prev + mention);

      // Focus input for continued typing
      inputRef.current?.focus();

      // Store mention analytics
      const mentionData = {
        mentionedUserId: userId,
        mentionedUserName: mentionedUser.name,
        mentioningUserId: user?.id,
        timestamp: Date.now(),
        sessionId
      };

      const mentions = JSON.parse(localStorage.getItem('user-mentions') || '[]');
      mentions.push(mentionData);
      localStorage.setItem('user-mentions', JSON.stringify(mentions.slice(-50)));

      // Emit socket event for real-time mention notification
      if (socket) {
        socket.emit('user-mentioned', mentionData);
      }
    }
  }, [participants, user?.id, sessionId, socket]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'pinned' | 'code'>('all');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform socket messages to chat messages
  useEffect(() => {
    const transformedMessages: ChatMessage[] = socketMessages.map(msg => ({
      id: msg.id,
      content: msg.content,
      userId: msg.user.id,
      userName: msg.user.name || 'Anonymous',
      userImage: msg.user.image,
      timestamp: new Date(msg.timestamp),
      type: msg.type === 'CODE' ? 'code' : 'text',
      replyTo: undefined,
      reactions: [],
      isEdited: false,
      isPinned: false,
    }));
    setMessages(transformedMessages);
  }, [socketMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value);
    
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      startTyping('chat');
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping('chat');
    }, 1000);
  }, [isTyping, startTyping, stopTyping]);

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !user) return;

    const messageContent = replyingTo 
      ? `@${messages.find(m => m.id === replyingTo)?.userName} ${newMessage}`
      : newMessage;

    sendMessage(messageContent, 'TEXT');
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(false);
    stopTyping('chat');
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [newMessage, user, replyingTo, messages, sendMessage, stopTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessage) {
        handleEditMessage();
      } else {
        handleSendMessage();
      }
    }
    if (e.key === 'Escape' && editingMessage) {
      setEditingMessage(null);
      setNewMessage('');
    }
  };

  const handleEditMessage = useCallback(() => {
    if (!editingMessage || !newMessage.trim()) return;

    // In a real app, this would make an API call to update the message
    setMessages(prev => prev.map(msg =>
      msg.id === editingMessage
        ? { ...msg, content: newMessage, isEdited: true }
        : msg
    ));

    setEditingMessage(null);
    setNewMessage('');

    // Emit socket event for real-time updates
    if (socket) {
      socket.emit('message-edited', {
        messageId: editingMessage,
        content: newMessage,
        sessionId
      });
    }
  }, [editingMessage, newMessage, socket, sessionId]);

  const handlePinMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/chat/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId })
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg
        ));
        toast({
          title: 'Message Pinned',
          description: 'Message has been pinned to the chat.',
        });
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch('/api/chat/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId })
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({
          title: 'Message Deleted',
          description: 'Message has been deleted.',
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (messageFilter === 'pinned') return msg.isPinned;
    if (messageFilter === 'code') return msg.type === 'code';
    if (searchQuery) {
      return msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
             msg.userName.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className={`flex flex-col bg-slate-800/50 border-slate-700 ${className}`} style={{ maxHeight }}>
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-white">Live Chat</span>
              <Badge variant="outline" className="text-xs">
                {participants.length} online
              </Badge>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMessageFilter(messageFilter === 'all' ? 'pinned' : 'all')}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                title="Show participants"
                onClick={() => {
                  // Toggle participants panel functionality
                  console.log('Show participants panel');
                }}
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          <AnimatePresence>
            {filteredMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`group relative ${message.isPinned ? 'bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2' : ''}`}
              >
                <div className="flex space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.userImage ? (
                      <img
                        src={message.userImage}
                        alt={message.userName}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                        {message.userName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Message content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className="font-semibold text-white text-sm cursor-pointer hover:text-blue-400"
                        onClick={() => handleUserMention(message.userId)}
                        title="Mention this user"
                      >
                        {message.userName}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.isPinned && (
                        <Pin className="w-3 h-3 text-yellow-400" />
                      )}
                      {message.isEdited && (
                        <span className="text-xs text-gray-500">(edited)</span>
                      )}
                    </div>
                    
                    <div className={`text-gray-300 text-sm ${message.type === 'code' ? 'font-mono bg-slate-700 p-2 rounded' : ''}`}>
                      {message.content}
                    </div>

                    {/* Reactions */}
                    {message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(
                          message.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(message.id, emoji)}
                            className="flex items-center space-x-1 px-2 py-1 bg-slate-700 rounded-full text-xs hover:bg-slate-600 transition-colors"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-400">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyingTo(message.id)}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      {message.userId === user?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMessage(message.id);
                              setNewMessage(message.content);
                              inputRef.current?.focus();
                            }}
                            title="Edit message"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteMessage(message.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePinMessage(message.id)}
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMessageOptions(message.id)}
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Emoji picker */}
                    <AnimatePresence>
                      {showEmojiPicker === message.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute right-0 top-8 bg-slate-700 border border-slate-600 rounded-lg p-2 flex space-x-1 z-10"
                        >
                          {EMOJI_REACTIONS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                handleReaction(message.id, emoji);
                                setShowEmojiPicker(null);
                              }}
                              className="hover:bg-slate-600 p-1 rounded"
                            >
                              {emoji}
                            </button>
                          ))}
                          {/* Quick reaction buttons using enhanced reaction functions */}
                          <div className="border-l border-slate-600 pl-2 ml-2 flex space-x-1">
                            <button
                              onClick={() => {
                                handleMessageReaction(message.id, 'heart');
                                setShowEmojiPicker(null);
                              }}
                              className="hover:bg-slate-600 p-1 rounded"
                              title="Love it"
                            >
                              <Heart className="w-4 h-4 text-red-400" />
                            </button>
                            <button
                              onClick={() => {
                                handleMessageReaction(message.id, 'thumbsUp');
                                setShowEmojiPicker(null);
                              }}
                              className="hover:bg-slate-600 p-1 rounded"
                              title="Thumbs up"
                            >
                              <ThumbsUp className="w-4 h-4 text-green-400" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicators */}
          <AnimatePresence>
            {typingUsers.filter(u => u.typingLocation === 'chat').map((user) => (
              <motion.div
                key={`${user.userId}-typing`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 text-sm text-gray-400"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>{user.user.name} is typing...</span>
              </motion.div>
            ))}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Reply indicator */}
        <AnimatePresence>
          {replyingTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-700 p-2 rounded-lg border-l-4 border-blue-400"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">
                  Replying to {messages.find(m => m.id === replyingTo)?.userName}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setReplyingTo(null)}
                >
                  ×
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message input */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={editingMessage ? "Edit message..." : "Type a message..."}
              className="bg-slate-700 border-slate-600 text-white pr-20"
              disabled={!isConnected}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button size="sm" variant="ghost">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost">
                <Smile className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveChatSystem;
