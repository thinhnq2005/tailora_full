"use client";

import React, { useState, useEffect } from "react";

interface TenantContact {
  hotline: string;
  zaloPhone: string;
}

export default function HotlineZaloSticky(): React.JSX.Element {
  const [contact, setContact] = useState<TenantContact | null>(null);
  const [showPhonePopup, setShowPhonePopup] = useState<boolean>(false);

  useEffect(() => {
    async function fetchContact() {
      try {
        const res = await fetch("/api/tenant/config/active");
        if (!res.ok) {
          setContact({ hotline: "0949734567 - 02923912699", zaloPhone: "0949734567" });
          return;
        }
        const data = await res.json();
        setContact({
          hotline: data.hotline || "0949734567 - 02923912699",
          zaloPhone: data.zaloPhone || "0949734567"
        });
      } catch {
        setContact({ hotline: "0949734567 - 02923912699", zaloPhone: "0949734567" });
      }
    }
    fetchContact();
  }, []);

  const zaloPhoneStr = contact?.zaloPhone || "0949734567";

  return (
    <div style={{ backgroundColor: "#ffffff", borderTop: "2px solid #000000", padding: "8px 12px", display: "flex", gap: "8px", boxSizing: "border-box", position: "relative" }}>
      
      {/* NÚT HOTLINE: Bấm vào kích hoạt bật tắt popup lựa chọn quay số */}
      <button
        type="button"
        onClick={() => setShowPhonePopup(!showPhonePopup)}
        style={{ 
          flex: 1, 
          height: '40px',
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "6px", 
          backgroundColor: "#ffffff", 
          color: "#000000", 
          border: "2px solid #000000", 
          borderRadius: "6px", 
          fontSize: "11px", 
          fontWeight: "900", 
          textTransform: "uppercase", 
          boxShadow: "2px 2px 0px #000000",
          cursor: "pointer",
          padding: 0
        }}
      >
        <span> Hotline</span>
      </button>

      {/* NÚT ZALO ĐỘNG: Co dãn nằm gọn trên cùng 1 hàng phẳng */}
      <a
        href={`https://zalo.me/${zaloPhoneStr}`}
        target="_blank"
        rel="noreferrer"
        style={{ 
          flex: 1, 
          height: '40px',
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "6px", 
          backgroundColor: "#ffffff", 
          color: "#000000", 
          border: "2px solid #000000", 
          borderRadius: "6px", 
          fontSize: "11px", 
          fontWeight: "900", 
          textTransform: "uppercase", 
          textDecoration: "none", 
          boxShadow: "2px 2px 0px #000000",
          boxSizing: 'border-box'
        }}
      >
        <img 
          src="/zalo_icon.png" 
          alt="Zalo" 
          style={{ width: "16px", height: "16px", objectFit: "contain", display: "block" }} 
        />
        <span>Zalo</span>
      </a>

      {/* POPUP PHẲNG LỰA CHỌN QUAY SỐ: Tự bật lên ngay phía trên thanh liên hệ */}
      {showPhonePopup && (
        <div style={{ position: "absolute", bottom: "52px", left: "12px", right: "12px", backgroundColor: "#ffffff", border: "2px solid #000000", borderRadius: "8px", boxShadow: "4px 4px 0px #000000", padding: "8px", display: "flex", flexDirection: "column", gap: "6px", zIndex: 210 }}>
          <a 
            href="tel:0949734567" 
            onClick={() => setShowPhonePopup(false)}
            style={{ display: "block", textAlign: "center", padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "4px", textDecoration: "none", color: "#000000", fontSize: "13px", fontWeight: "900", fontFamily: "monospace", border: "1px solid #cbd5e1" }}
          >
            Số máy 1: 0949.734.567
          </a>
          <a 
            href="tel:02923912699" 
            onClick={() => setShowPhonePopup(false)}
            style={{ display: "block", textAlign: "center", padding: "10px", backgroundColor: "#f1f5f9", borderRadius: "4px", textDecoration: "none", color: "#000000", fontSize: "13px", fontWeight: "900", fontFamily: "monospace", border: "1px solid #cbd5e1" }}
          >
            Số máy 2: 02923.912.699
          </a>
          <button 
            type="button" 
            onClick={() => setShowPhonePopup(false)}
            style={{ width: "100%", padding: "6px", backgroundColor: "#000000", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer", marginTop: 0 }}
          >
            Đóng bảng chọn
          </button>
        </div>
      )}

    </div>
  );
}