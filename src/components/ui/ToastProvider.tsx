'use client';
import React, { useEffect, useState } from 'react';

export default function ToastProvider() {
  const [toasts, setToasts] = useState<{id: string, message: string}[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '24px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {toasts.map(toast => (
        <div key={toast.id} style={{
          backgroundColor: 'var(--panel-bg, #ffffff)',
          color: 'var(--text-main, #111827)',
          borderLeft: '4px solid var(--theme-color)',
          padding: '16px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          fontFamily: 'inherit',
          fontWeight: 600,
          fontSize: '14px',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          <svg style={{width: '20px', height: '20px', color: 'var(--theme-color)', flexShrink: 0, marginTop: '2px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span style={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{toast.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
