'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChatMessage, ChatMessageRole } from '../types'
import SendIcon from './icons/SendIcon'
import UserIcon from './icons/UserIcon'
import BotIcon from './icons/BotIcon'
import SpinnerIcon from './icons/SpinnerIcon'
interface GeminiChatProps {
  chatMessages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  isLoading: boolean
  currentModuleTitle: string | null
}
const GeminiChat: React.FC<GeminiChatProps> = ({
  chatMessages,
  onSendMessage,
  isLoading,
  currentModuleTitle,
}) => {
  const [userInput, setUserInput] = useState('')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput.trim())
      setUserInput('')
    }
  }
  const getFormattedTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  return (
    <div className="flex flex-col h-full bg-brand-surface-1 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-brand-border">
        <h3 className="text-lg font-semibold text-brand-text-primary">
          AI Learning Assistant
        </h3>
        {currentModuleTitle && (
          <p className="text-sm text-brand-text-secondary">
            Module: {currentModuleTitle}
          </p>
        )}
      </div>
      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-brand-text-secondary py-8">
            <BotIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ask me anything about Solidity!</p>
            <p className="text-sm mt-2">I'm here to help you learn.</p>
          </div>
        ) : (
          chatMessages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === ChatMessageRole.User
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              <div
                className={`flex max-w-[80%] ${
                  message.role === ChatMessageRole.User
                    ? 'flex-row-reverse'
                    : 'flex-row'
                } gap-3`}
              >
                <div className="flex-shrink-0">
                  {message.role === ChatMessageRole.User ? (
                    <UserIcon className="w-8 h-8 text-brand-accent" />
                  ) : (
                    <BotIcon className="w-8 h-8 text-brand-primary" />
                  )}
                </div>
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.role === ChatMessageRole.User
                      ? 'bg-brand-accent text-white'
                      : 'bg-brand-surface-2 text-brand-text-primary'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {getFormattedTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <BotIcon className="w-8 h-8 text-brand-primary" />
              <div className="px-4 py-3 rounded-lg bg-brand-surface-2">
                <SpinnerIcon className="w-5 h-5 animate-spin text-brand-primary" />
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-brand-border"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e: unknown) => setUserInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 bg-brand-surface-2 text-brand-text-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!userInput.trim() || isLoading}
            className="px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-brand-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}
export default GeminiChat
