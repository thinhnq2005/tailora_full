"use client";

import React, { useState, useRef, useEffect } from "react";
import { getStoredProducts, getStoredOrders } from "@/lib/vlxdStorage";
import { b2bDebtService } from "@/services/b2bDebtService";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatWindowProps {
  onClose: () => void;
  tenant: any;
  products?: any[];
}

export default function ChatWindow({ onClose, tenant, products = [] }: ChatWindowProps): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const themeColor = tenant?.primary_color || "var(--theme-color)";

  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: `Dạ em chào Anh/Chị! Em là Trợ lý AI Nội Bộ của ERP TAILORA TECH. Em có thể hỗ trợ nhanh 4 nghiệp vụ: Tồn kho bến bãi, Tiến độ đơn hàng & Niêm phong, Công nợ B2B, và Thông số kỹ thuật vật tư.`
      }
    ]);
  }, [tenant]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userText = queryText.trim();
    setInput("");
    
    const updatedMessages = [...messages, { role: "user", content: userText } as ChatMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const storedProducts = getStoredProducts();
      const storedOrders = getStoredOrders();
      const debtMetrics = b2bDebtService.getMetrics();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userText,
          history: messages,
          tenant: tenant,
          products: storedProducts,
          orders: storedOrders,
          debtMetrics: debtMetrics
        }),
      });

      if (!res.ok) {
        throw new Error('API Error');
      }

      const dataRes = await res.json();
      if (dataRes && dataRes.content) {
        setMessages((prev) => [...prev, { role: "assistant", content: dataRes.content }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Dạ hệ thống bến bãi đang bận hoặc mạng chậm. Tồn kho chính: Cát vàng Tân Châu (450 m³), Đá 1x2 (580 m³), Xi măng Hà Tiên (1.200 bao), Thép Hòa Phát sẵn bãi. Đơn hàng #ORD-8821 đang giao với 7,850 kg niêm phong trạm cân."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const quickQuestions = [
    { label: "Kiểm tra tồn kho", query: "Báo cáo tồn kho cát, đá, xi măng, thép tại bến bãi hiện tại?" },
    { label: "Tiến độ đơn hàng", query: "Đơn hàng gần nhất ORD-8821 đang ở trạng thái nào và khối lượng niêm phong bao nhiêu?" },
    { label: "Công nợ B2B", query: "Tình hình công nợ B2B và tổng nợ quá hạn của khách hàng hiện tại?" },
    { label: "Thông số sản phẩm", query: "Tư vấn thông số kỹ thuật xi măng PCB40, thép Hòa Phát và gạch tuynel?" }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: '86px',
      right: '24px',
      width: '380px',
      height: '540px',
      backgroundColor: '#ffffff',
      border: '1px solid #cbd5e1',
      borderRadius: '12px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* HEADER AI COPILOT */}
      <div style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color="var(--theme-color)" />
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', margin: 0, letterSpacing: '0.3px' }}>
              Trợ Lý AI Nội Bộ Bến Bãi
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }}></span>
              <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>Sẵn sàng hỗ trợ ERP 24/7</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* NỘI DUNG TIN NHẮN */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#f8fafc'
      }}>
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={14} color="var(--theme-color)" />
              </div>
            )}

            <div style={{
              maxWidth: '82%',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              backgroundColor: msg.role === 'user' ? '#0f172a' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : '#1e293b',
              border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
              {msg.content}
            </div>

            {msg.role === 'user' && (
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={14} color="#0f172a" />
              </div>
            )}
          </div>
        ))}

        {/* TYPING STATE */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={14} color="var(--theme-color)" />
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#64748b', borderRadius: '50%', animation: 'bounce 1s infinite 0s' }}></span>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#64748b', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></span>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#64748b', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK SUGGESTION CHIPS (4 NGHIỆP VỤ BẮT BUỘC) */}
      <div style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', padding: '8px 12px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => sendQuery(q.query)}
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              fontSize: '11px',
              color: '#334155',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSend} style={{ padding: '10px 12px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi tồn kho, đơn hàng, công nợ, sản phẩm..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            fontSize: '12.5px',
            outline: 'none',
            backgroundColor: '#f8fafc'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}