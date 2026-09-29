// src/components/chatbot/ChatMessage.tsx
'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { ChatHistoryItem } from '@/services/geminiChat';

interface ChatMessageProps {
  message?: ChatHistoryItem;
  isLoading?: boolean;
  themeColor?: string;
}

export default function ChatMessage({ message, isLoading = false, themeColor = 'var(--theme-color)' }: ChatMessageProps): React.JSX.Element {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', margin: '4px 0' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${themeColor}`
          }}
        >
          <Bot size={15} color={themeColor} />
        </div>
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px 12px 12px 2px',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '700' }}>
              Đang suy nghĩ...
            </span>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span className="dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: themeColor, borderRadius: '50%', animation: 'bounce 1s infinite 0s' }} />
              <span className="dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: themeColor, borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }} />
              <span className="dot-pulse" style={{ width: '5px', height: '5px', backgroundColor: themeColor, borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!message) return <></>;

  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-end',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        margin: '6px 0'
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${themeColor}`
          }}
        >
          <Bot size={15} color={themeColor} />
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          maxWidth: '82%'
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
            fontSize: '13px',
            lineHeight: '1.5',
            whiteSpace: 'pre-line',
            backgroundColor: isUser ? '#0f172a' : '#ffffff',
            color: isUser ? '#ffffff' : '#1e293b',
            border: isUser ? 'none' : '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            wordBreak: 'break-word'
          }}
        >
          {message.content}
        </div>

        {message.timestamp && (
          <span
            style={{
              fontSize: '10.5px',
              color: '#94a3b8',
              marginTop: '3px',
              padding: '0 4px',
              fontWeight: '500'
            }}
          >
            {message.timestamp}
          </span>
        )}
      </div>

      {isUser && (
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            backgroundColor: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <User size={14} color="#0f172a" />
        </div>
      )}
    </div>
  );
}
