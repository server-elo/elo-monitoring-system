import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessageRole } from '../types';
import SendIcon from './icons/SendIcon';
import UserIcon from './icons/UserIcon';
import BotIcon from './icons/BotIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface GeminiChatProps {
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
  currentModuleTitle: string | null;
}

const GeminiChat: React.FC<GeminiChatProps> = ({ chatMessages, onSendMessage, isLoading, currentModuleTitle }) => {
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput.trim());
      setUserInput('');
    }
  };

  const getFormattedTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-brand-surface-2 rounded-lg shadow-lg overflow-hidden">
      <header className="p-4 border-b border-brand-bg-light/50 bg-brand-surface-1">
        <h2 className="text-lg font-semibold text-brand-accent">
          AI Learning Assistant
        </h2>
        {currentModuleTitle && (
          <p className="text-xs text-brand-text-muted">Focusing on: {currentModuleTitle}</p>
        )}
      </header>

      <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto bg-brand-surface-1/50">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === ChatMessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl break-words ${msg.role === ChatMessageRole.USER ? 'flex-row-reverse' : ''}`}>
              <div className={`p-2 rounded-full text-white self-start mx-2 shrink-0 ${msg.role === ChatMessageRole.USER ? 'bg-brand-secondary' : 'bg-brand-accent'}`}>
                 {msg.role === ChatMessageRole.USER ? <UserIcon className="w-5 h-5" /> : <BotIcon className="w-5 h-5" />}
              </div>
              <div
                className={`px-4 py-3 rounded-lg shadow ${
                  msg.role === ChatMessageRole.USER 
                    ? 'bg-brand-secondary text-white rounded-br-none' 
                    : msg.role === ChatMessageRole.ERROR 
                      ? 'bg-red-600 text-white rounded-bl-none'
                      : 'bg-brand-bg-light text-brand-text-primary rounded-bl-none'
                }`}
              >
                {msg.text.split(/(\`\`\`[\w\s]*\n[\s\S]*?\n\`\`\`)/g).map((part, index) => {
                  if (part.startsWith('```')) {
                    const codeContent = part.replace(/```[\w\s]*\n?/, '').replace(/\n?```$/, '');
                    return (
                      <pre key={index} className="bg-brand-bg-dark text-brand-text-secondary p-3 my-2 rounded-md text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                        {codeContent}
                      </pre>
                    );
                  }
                  return <span key={index} className="whitespace-pre-wrap">{part}</span>;
                })}

                <p className={`text-xs mt-2 ${msg.role === ChatMessageRole.USER ? 'text-violet-200 text-right' : 'text-indigo-200 text-left'}`}>
                  {getFormattedTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-start max-w-xs">
                <div className="p-2 rounded-full bg-brand-accent text-white self-start mx-2 shrink-0">
                    <BotIcon className="w-5 h-5" />
                </div>
                <div className="px-4 py-3 rounded-lg shadow bg-brand-bg-light text-brand-text-primary rounded-bl-none">
                    <SpinnerIcon className="w-5 h-5 text-brand-accent" />
                </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-brand-bg-light/50 bg-brand-surface-1">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={isLoading ? "Assistant is typing..." : (currentModuleTitle ? `Ask about ${currentModuleTitle}...` : "Ask anything...")}
            className="flex-grow p-3 bg-brand-bg-medium border border-brand-bg-light text-brand-text-primary placeholder-brand-text-muted rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-shadow"
            disabled={isLoading}
            aria-label="Chat message input"
          />
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="p-3 bg-brand-primary text-white rounded-lg hover:bg-violet-800 focus:ring-2 focus:ring-brand-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            aria-label="Send message"
          >
            {isLoading ? <SpinnerIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeminiChat;