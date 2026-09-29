"use client";

import React from "react";

export type QrCodeRendererProps = {
  url: string;
  loading?: boolean;
};

export default function QrCodeRenderer({ url, loading = false }: QrCodeRendererProps): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-[#2c2d59] bg-[#0f1026]/40">
      <div className="relative w-44 h-44 rounded-xl overflow-hidden bg-white p-2 flex items-center justify-center shadow-inner">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0f1026]/90 z-10">
            <span className="w-5 h-5 border-2 border-[var(--theme-color)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : null}
        
        {url ? (
          <img
            src={url}
            alt="Mã QR thanh toán hệ thống bến bãi"
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-[10px] font-mono text-gray-500 text-center">
            Đang tạo giao dịch ngân hàng...
          </span>
        )}
      </div>
      <p style={{ 
        marginTop: "8px", 
        fontSize: "15px", 
        color: "rgba(255, 255, 255, 0.4)", 
        textAlign: "center", 
        maxWidth: "200px", 
        fontWeight: "500", 
        lineHeight: "normal",
        margin: "8px auto 0 auto" 
      }}>
        Quét mã và đợi duyệt.
      </p>
    </div>
  );
}