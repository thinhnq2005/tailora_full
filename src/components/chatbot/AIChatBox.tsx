// src/components/chatbot/AIChatBox.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, X, RotateCcw } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import QuickActions from './QuickActions';

interface AIChatBoxProps {
  tenant?: any;
  products?: any[];
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export default function AIChatBox({
  tenant,
  products,
  isOpen: controlledIsOpen,
  onToggleOpen,
}: AIChatBoxProps): React.JSX.Element {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (nextState: boolean) => {
    if (onToggleOpen) {
      onToggleOpen(nextState);
    } else {
      setInternalIsOpen(nextState);
    }
  };

  const themeColor = tenant?.primary_color || 'var(--theme-color)';
  const { messages, input, setInput, isLoading, sendMessage, clearHistory } = useChat(tenant, products);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus textarea khi mở chat
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Enter gửi, Shift+Enter xuống dòng
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        sendMessage();
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && input.trim()) {
      sendMessage();
    }
  };

  return (
    <>
      {/* ════════════════════════════════════════
          FLOATING BUTTON GÓC PHẢI DƯỚI
          - Dùng ảnh chatbox_icon.png từ public/
          - z-index: 40 (dưới Header z-index: 50)
      ════════════════════════════════════════ */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở Trợ lý AI TAILORA"
        className="ai-chat-floating-btn"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '58px',
          height: '58px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
          zIndex: 40,
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.32)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.22)';
        }}
      >
        {isOpen ? (
          /* Khi mở: hiển thị icon X nền tối */
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${themeColor}`,
            }}
          >
            <X size={22} color="#ffffff" />
          </div>
        ) : (
          /* Khi đóng: hiển thị chatbox_icon.png từ public/ */
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              src="/chatbox_icon.png"
              alt="Trợ lý AI TAILORA"
              fill
              style={{ objectFit: 'cover', borderRadius: '50%' }}
              priority
              sizes="58px"
            />
            {/* Chấm online xanh */}
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                backgroundColor: '#22c55e',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                zIndex: 1,
              }}
            />
          </div>
        )}
      </button>

      {/* ════════════════════════════════════════
          PANEL CHAT
          - width: 400px desktop, calc(100vw-32px) mobile
          - height: 600px
          - z-index: 40 (không đè Header z-index:50)
      ════════════════════════════════════════ */}
      {isOpen && (
        <div
          className="ai-chat-panel"
          style={{
            position: 'fixed',
            bottom: '88px',
            right: '20px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '600px',
            maxHeight: 'calc(100vh - 100px)',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* ── HEADER ─────────────────────────────── */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '3px solid var(--theme-color)',
              flexShrink: 0,
            }}
          >
            {/* Logo + Tên */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '1.5px solid var(--theme-color)',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <Image
                  src="/chatbox_icon.png"
                  alt="AI Bot"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="36px"
                />
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '13.5px',
                    fontWeight: '800',
                    margin: 0,
                    color: 'var(--theme-color)',
                    letterSpacing: '0.2px',
                  }}
                >
                  Trợ lý AI TAILORA
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '1px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '7px',
                      height: '7px',
                      backgroundColor: '#22c55e',
                      borderRadius: '50%',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                    Đang online
                  </span>
                </div>
              </div>
            </div>

            {/* Actions: Xóa lịch sử + Đóng */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <button
                type="button"
                onClick={clearHistory}
                title="Xóa lịch sử chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
              >
                <RotateCcw size={15} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Đóng chatbox"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── KHUNG MESSAGES ────────────────────── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '14px 14px 8px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f8fafc',
              gap: '2px',
              scrollBehavior: 'smooth',
            }}
          >
            {messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} themeColor={themeColor} />
            ))}

            {isLoading && <ChatMessage isLoading themeColor={themeColor} />}

            <div ref={messagesEndRef} style={{ height: '4px' }} />
          </div>

          {/* ── QUICK ACTIONS ─────────────────────── */}
          <QuickActions
            onSelectAction={(query) => sendMessage(query)}
            disabled={isLoading}
          />

          {/* ── INPUT FORM ────────────────────────── */}
          <form
            onSubmit={handleFormSubmit}
            style={{
              padding: '10px 12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              boxSizing: 'border-box',
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi tồn kho, đơn hàng, công nợ, sản phẩm..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: '#f8fafc',
                resize: 'none',
                minHeight: '38px',
                maxHeight: '80px',
                lineHeight: '1.5',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = themeColor; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Gửi tin nhắn"
              style={{
                backgroundColor: input.trim() && !isLoading ? 'var(--theme-color)' : '#e2e8f0',
                color: input.trim() && !isLoading ? '#111827' : '#94a3b8',
                border: 'none',
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease',
                boxShadow: input.trim() && !isLoading ? '0 2px 8px var(--theme-color-15)' : 'none',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <style jsx global>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.6; }
        }
        @media (max-width: 480px) {
          .ai-chat-panel {
            right: 8px !important;
            bottom: 80px !important;
            width: calc(100vw - 16px) !important;
            height: calc(100vh - 100px) !important;
            max-height: calc(100vh - 100px) !important;
          }
          .ai-chat-floating-btn {
            right: 12px !important;
            bottom: 12px !important;
          }
        }
      `}</style>
    </>
  );
}
