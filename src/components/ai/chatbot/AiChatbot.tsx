// src/components/ai/chatbot/AiChatbot.tsx
'use client';

import React from 'react';
import AIChatBox from '@/components/chatbot/AIChatBox';

interface AiChatbotProps {
  isOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  tenant?: any;
  products?: any[];
}

export default function AiChatbot({ isOpen, setIsChatOpen, tenant, products }: AiChatbotProps): React.JSX.Element {
  return (
    <AIChatBox
      isOpen={isOpen}
      onToggleOpen={setIsChatOpen}
      tenant={tenant}
      products={products}
    />
  );
}