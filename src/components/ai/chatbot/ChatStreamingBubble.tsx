"use client";

import React from "react";

interface ChatStreamingBubbleProps {
  role: "user" | "assistant";
  content: string;
  themeColor: string;
}

// Hàm tính toán nghịch tông màu chữ tuyệt đối dựa trên sắc độ nền
const getContrastTextColor = (hexColor: string): string => {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

export default function ChatStreamingBubble({ role, content, themeColor }: ChatStreamingBubbleProps): React.JSX.Element {
  const isUser = role === "user";

  const hexToRgbaSắcĐộNhạt = (hex: string, alpha: number = 0.15) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const nhạtSắcĐộColor = hexToRgbaSắcĐộNhạt(themeColor, 0.16);
  
  // Tính màu chữ nghịch tông cho User (đối màu) và Assistant (nền nhạt nên mặc định chữ đen)
  const userTextColor = getContrastTextColor(themeColor);
  const finalTextColor = isUser ? userTextColor : "#000000";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? "flex-end" : "flex-start", width: "100%" }}>
      <div
        style={{
          maxWidth: "85%",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          lineHeight: "1.5",
          fontWeight: "700",
          wordBreak: "break-all",
          border: "2px solid #000000",
          boxShadow: "none", // ĐÃ XÓA bóng đen thô xấu xí theo ý ông
          alignSelf: isUser ? "flex-end" : "flex-start",
          backgroundColor: isUser ? themeColor : nhạtSắcĐộColor,
          color: finalTextColor // Áp dụng màu chữ nghịch tông mượt mà
        }}
      >
        {content}
      </div>
    </div>
  );
}