'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Paperclip, Smile, Download, Eye, EyeOff, Volume2, VolumeX, Search, X, FileText, CheckCheck, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userColor: string;
  content: string;
  type: 'text' | 'code' | 'file' | 'system';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: string;
  readBy?: string[];
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    codeLanguage?: string;
  };
}

interface CollaborationChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  isConnected: boolean;
  onSendMessage: (content: string, type?: 'text' | 'code' | 'file') => void;
  onFileUpload?: (file: File) => Promise<string>;
  onReaction?: (messageId: string, emoji: string) => void;
  onMarkAsRead?: (messageId: string) => void;
  className?: string;
  compact?: boolean;
  enableNotifications?: boolean;
}

const EMOJI_LIST = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥'];

export function CollaborationChat({
  messages,
  currentUserId,
  currentUserName: _currentUserName,
  isConnected,
  onSendMessage,
  onFileUpload,
  onReaction,
  onMarkAsRead,
  className,
  compact = false,
  enableNotifications = true
}: CollaborationChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [messages, searchQuery]);

  // Count unread messages
  useEffect(() => {
    const unread = messages.filter(msg => 
      msg.userId !== currentUserId && 
      (!msg.readBy || !msg.readBy.includes(currentUserId))
    ).length;
    setUnreadCount(unread);
  }, [messages, currentUserId]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const unreadMessages = messages.filter(msg => 
      msg.userId !== currentUserId && 
      (!msg.readBy || !msg.readBy.includes(currentUserId))
    );

    unreadMessages.forEach(msg => {
      onMarkAsRead?.(msg.id);
    });
  }, [messages, currentUserId, onMarkAsRead]);

  // Play notification sound for new messages
  useEffect(() => {
    if (soundEnabled && enableNotifications && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.userId !== currentUserId) {
        // Play notification sound (would be implemented with actual audio)
        console.log('🔔 New message notification');
      }
    }
  }, [messages, currentUserId, soundEnabled, enableNotifications]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    const messageType = newMessage.startsWith('```') ? 'code' : 'text';
    onSendMessage(newMessage.trim(), messageType);
    setNewMessage('');
    setReplyingTo(null);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onFileUpload) return;

    try {
      await onFileUpload(file);
      onSendMessage(`📎 ${file.name}`, 'file');
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onReaction?.(messageId, emoji);
    setShowEmojiPicker(null);
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.userId === currentUserId;
    const isSystem = message.type === 'system';

    if (isSystem) {
      return (
        <div key={message.id} className="flex justify-center my-2">
          <div className="px-3 py-1 rounded-full bg-gray-500/20 text-xs text-gray-400">
            {message.content}
          </div>
        </div>
      );
    }

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex mb-4',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <div className={cn('flex max-w-[80%]', isOwn ? 'flex-row-reverse' : 'flex-row')}>
          {/* Avatar */}
          {!isOwn && (
            <div className="flex-shrink-0 mr-2">
              {message.userAvatar ? (
                <img
                  src={message.userAvatar}
                  alt={message.userName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: message.userColor }}
                >
                  {message.userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Message content */}
          <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
            {/* User name and timestamp */}
            {!isOwn && (
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-white">{message.userName}</span>
                <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
              </div>
            )}

            {/* Message bubble */}
            <div
              className={cn(
                'relative px-4 py-2 rounded-lg max-w-full',
                isOwn
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white border border-white/20'
              )}
            >
              {/* Reply indicator */}
              {message.replyTo && (
                <div className="text-xs opacity-70 mb-1 border-l-2 border-current pl-2">
                  Replying to message...
                </div>
              )}

              {/* Message content */}
              {message.type === 'code' ? (
                <div className="bg-black/20 rounded p-2 font-mono text-sm overflow-x-auto">
                  <pre>{message.content}</pre>
                </div>
              ) : message.type === 'file' ? (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{message.content}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}

              {/* Edited indicator */}
              {message.edited && (
                <div className="text-xs opacity-50 mt-1">
                  edited {message.editedAt && formatTimestamp(message.editedAt)}
                </div>
              )}

              {/* Read receipts */}
              {isOwn && message.readBy && (
                <div className="flex justify-end mt-1">
                  {message.readBy.length > 1 ? (
                    <CheckCheck className="w-3 h-3 text-blue-300" />
                  ) : (
                    <Check className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              )}
            </div>

            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {message.reactions.map((reaction, index) => (
                  <button
                    key={index}
                    onClick={() => handleReaction(message.id, reaction.emoji)}
                    className={cn(
                      'flex items-center space-x-1 px-2 py-1 rounded-full text-xs',
                      'bg-white/10 hover:bg-white/20 transition-colors',
                      reaction.users.includes(currentUserId) && 'bg-blue-500/30'
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    <span>{reaction.users.length}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Message actions */}
            <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                onClick={() => setShowEmojiPicker(message.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Smile className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => setReplyingTo(message.id)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <MessageCircle className="w-3 h-3" />
              </Button>
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojiPicker === message.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute z-10 mt-2 p-2 bg-gray-800 rounded-lg border border-white/20 shadow-lg"
                >
                  <div className="flex space-x-1">
                    {EMOJI_LIST.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timestamp for own messages */}
            {isOwn && (
              <div className="text-xs text-gray-400 mt-1">
                {formatTimestamp(message.timestamp)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (compact) {
    return (
      <Card className={cn('p-3 bg-white/10 backdrop-blur-md border border-white/20', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Chat</span>
            {unreadCount > 0 && (
              <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white">{unreadCount}</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col h-96 bg-white/10 backdrop-blur-md border border-white/20', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Chat</h3>
          {unreadCount > 0 && (
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">{unreadCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <Button
            onClick={() => setShowSearch(!showSearch)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <Search className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </Button>
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {isMinimized ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Search bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 border-b border-white/10"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredMessages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply indicator */}
          <AnimatePresence>
            {replyingTo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-2 bg-blue-500/10 border-t border-blue-400/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-400">Replying to message</span>
                  <button onClick={() => setReplyingTo(null)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                placeholder={isConnected ? "Type a message..." : "Disconnected"}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={!isConnected}
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".sol,.js,.ts,.json,.md,.txt"
              />

              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={!isConnected}
              >
                <Paperclip className="w-4 h-4" />
              </Button>

              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// Hook for managing chat messages with persistence
export function useChatMessages(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from localStorage on mount
  useEffect(() => {
    const loadMessages = () => {
      try {
        const saved = localStorage.getItem(`chat_messages_${sessionId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            editedAt: msg.editedAt ? new Date(msg.editedAt) : undefined
          }));
          setMessages(messagesWithDates);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      try {
        localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
      } catch (error) {
        console.error('Failed to save chat messages:', error);
      }
    }
  }, [messages, sessionId, isLoading]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, ...updates, edited: true, editedAt: new Date() }
        : msg
    ));
  };

  const addReaction = (messageId: string, emoji: string, userId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const reactions = msg.reactions || [];
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        if (existingReaction.users.includes(userId)) {
          // Remove user from reaction
          existingReaction.users = existingReaction.users.filter(id => id !== userId);
          if (existingReaction.users.length === 0) {
            return { ...msg, reactions: reactions.filter(r => r.emoji !== emoji) };
          }
        } else {
          // Add user to reaction
          existingReaction.users.push(userId);
        }
      } else {
        // Add new reaction
        reactions.push({ emoji, users: [userId] });
      }

      return { ...msg, reactions };
    }));
  };

  const markAsRead = (messageId: string, userId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg;

      const readBy = msg.readBy || [];
      if (!readBy.includes(userId)) {
        return { ...msg, readBy: [...readBy, userId] };
      }
      return msg;
    }));
  };

  const clearMessages = () => {
    setMessages([]);
    localStorage.removeItem(`chat_messages_${sessionId}`);
  };

  return {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    addReaction,
    markAsRead,
    clearMessages
  };
}
