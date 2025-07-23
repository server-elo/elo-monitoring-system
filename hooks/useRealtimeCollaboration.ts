import { useState, useEffect } from 'react';

export interface RealtimeState {
  isConnected: boolean;
  participants: Array<{
    id: string;
    name: string;
    cursor?: { x: number; y: number };
    selection?: { start: number; end: number };
  }>;
  messages: Array<{
    id: string;
    userId: string;
    content: string;
    timestamp: Date;
  }>;
}

export const useRealtimeCollaboration = (sessionId?: string) => {
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    participants: [],
    messages: [],
  });

  useEffect(() => {
    if (!sessionId) return;

    // Simulate connection
    setState(prev => ({
      ...prev,
      isConnected: true,
    }));

    return () => {
      setState(prev => ({
        ...prev,
        isConnected: false,
      }));
    };
  }, [sessionId]);

  const sendMessage = (content: string): void => {
    const message = {
      id: Date.now().toString(),
      userId: 'current-user',
      content,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const updateCursor = (x: number, y: number): void => {
    // Placeholder for cursor updates
    console.log('Cursor updated:', { x, y });
  };

  return {
    ...state,
    sendMessage,
    updateCursor,
  };
};