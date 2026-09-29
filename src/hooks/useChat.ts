// src/hooks/useChat.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { geminiChatService, ChatHistoryItem } from '@/services/geminiChat';
import { getStoredProducts, getStoredOrders } from '@/lib/vlxdStorage';
import { b2bDebtService } from '@/services/b2bDebtService';

const STORAGE_KEY = 'vlxd_chat_history';

function formatCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

const INITIAL_GREETING: ChatHistoryItem = {
  role: 'assistant',
  content:
    'Dạ em chào Anh/Chị! Em là Trợ lý AI TAILORA \n\nEm có thể hỗ trợ:\n• Kiểm tra tồn kho bến bãi\n• Tra cứu tiến độ đơn hàng & khối lượng niêm phong\n• Đối soát công nợ B2B\n• Tư vấn thông số kỹ thuật vật tư\n\nAnh/Chị cần em hỗ trợ gì ạ?',
  timestamp: 'Vừa xong',
};

export function useChat(tenant?: any, productsList?: any[]) {
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isLoadedRef = useRef(false);

  // ---- Load lịch sử từ localStorage khi mount ----
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          isLoadedRef.current = true;
          return;
        }
      }
    } catch (e) {
      console.error('[useChat] Failed to load chat history:', e);
    }

    setMessages([{ ...INITIAL_GREETING, timestamp: formatCurrentTime() }]);
    isLoadedRef.current = true;
  }, []);

  // ---- Lưu lịch sử vào localStorage khi messages thay đổi ----
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.error('[useChat] Failed to persist chat history:', e);
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (overrideMessage?: string) => {
      const messageToSend = (overrideMessage !== undefined ? overrideMessage : input).trim();
      if (!messageToSend || isLoading) return;

      setInput('');

      // ① Snapshot lịch sử TRƯỚC khi thêm user message mới
      //    — đây là context gửi lên API (không bao gồm tin hiện tại)
      const historyBeforeSend: ChatHistoryItem[] = [...messages];

      // ② Hiển thị user message lên UI ngay lập tức
      const userMsg: ChatHistoryItem = {
        role: 'user',
        content: messageToSend,
        timestamp: formatCurrentTime(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const activeProducts = productsList && productsList.length > 0 ? productsList : getStoredProducts();
        const activeOrders = getStoredOrders();
        const debtMetrics = b2bDebtService.getMetrics();

        // ③ Gửi history KHÔNG bao gồm user message hiện tại
        //    (API route sẽ tự append message vào cuối contents)
        const response = await geminiChatService.sendMessage({
          message: messageToSend,
          history: historyBeforeSend,   // ← FIX: chỉ history cũ
          tenant,
          products: activeProducts,
          orders: activeOrders,
          debtMetrics,
        });

        const assistantMsg: ChatHistoryItem = {
          role: 'assistant',
          content: response.content,
          timestamp: formatCurrentTime(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: ` Lỗi kết nối: ${err?.message || 'Vui lòng thử lại.'}`,
            timestamp: formatCurrentTime(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLoading, messages, tenant, productsList]
  );

  const clearHistory = useCallback(() => {
    const fresh = [{ ...INITIAL_GREETING, timestamp: formatCurrentTime() }];
    setMessages(fresh);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    sendMessage,
    clearHistory,
  };
}
