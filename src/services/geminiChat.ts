// src/services/geminiChat.ts

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface SendChatMessageParams {
  message: string;
  history: ChatHistoryItem[];
  tenant?: any;
  products?: any[];
  orders?: any[];
  debtMetrics?: any;
}

export interface ChatResponse {
  content: string;
  error?: boolean;
}

const DEFAULT_BUSY_MESSAGE = 'Dạ hệ thống AI đang bận, Anh/Chị vui lòng thử lại sau.';

export const geminiChatService = {
  async sendMessage(params: SendChatMessageParams): Promise<ChatResponse> {
    try {
      const cleanHistory = (params.history || []).map((h) => ({
        role: h.role,
        content: h.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: params.message,
          history: cleanHistory,
          tenant: params.tenant,
          products: params.products || [],
          orders: params.orders || [],
          debtMetrics: params.debtMetrics,
        }),
      });

      if (!res.ok) {
        let errorData: any = {};
        try { errorData = await res.json(); } catch (e) {}
        return { content: ` Lỗi API: ${errorData.error || res.status}`, error: true };
      }

      const data = await res.json();
      if (data && typeof data.content === 'string' && data.content.trim()) {
        return {
          content: data.content,
        };
      }

      return {
        content: DEFAULT_BUSY_MESSAGE,
        error: true,
      };
    } catch (err: any) {
      console.error(" [LỖI CHATBOT TỪ SERVER]:", err.message || err);
      return { content: ` Lỗi Server: ${err.message}`, error: true };
    }
  },
};
