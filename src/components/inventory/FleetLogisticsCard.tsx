"use client";

import React, { useState } from "react";


interface Vehicle {
  id: string;
  title: string;
}

export default function FleetLogisticsCard(): React.JSX.Element | null {
  // Gán thẳng danh sách xe cố định luôn không qua API nữa cho đỡ lỗi
  const [fleet] = useState<Vehicle[]>([
    { id: "1", title: "Xe TAILORA 1" },
    { id: "2", title: "Xe TAILORA 2" },
    { id: "3", title: "Xe TAILORA 3" },
  ]);
  
  const [selectedId, setSelectedId] = useState<string>("1");
  const dynamicColor = "var(--theme-color)"; // Đồng bộ màu primary_color của bến TAILORA

  if (fleet.length === 0) return null;

  const currentVehicle = fleet.find((v) => v.id === selectedId) || fleet[0];

  return (
    <div style={{ width: "100%", backgroundColor: "#ffffff", border: "4px solid #000000", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px", boxSizing: "border-box", marginTop: "20px" }}>
      
      <div style={{ borderBottom: "2px solid rgba(0, 0, 0, 0.15)", paddingBottom: "12px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "900", color: dynamicColor, margin: 0, textTransform: "uppercase", letterSpacing: "1.2px" }}>
          ĐIỀU PHỐI VẬN CHUYỂN BẾN BÃI
        </h3>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", width: "100%" }}>
        
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "450px", overflowY: "auto", paddingRight: "4px" }}>
          {fleet.map((v) => {
            const isSelected = selectedId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: isSelected ? `2px solid ${dynamicColor}` : "2px solid #000000",
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box",
                  backgroundColor: isSelected ? 'var(--theme-color-15)' : "#ffffff",
                  boxShadow: isSelected ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "none",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: "900", fontFamily: "monospace", color: isSelected ? "var(--theme-color-dark)" : "#000000" }}>
                  {v.title}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ flex: "2 1 420px", display: "flex", flexDirection: "column", gap: "16px", border: "2px solid rgba(0, 0, 0, 0.1)", padding: "20px", borderRadius: "12px", backgroundColor: "rgba(0, 0, 0, 0.01)", boxSizing: "border-box" }}>
          
          <div style={{ height: "360px", width: "100%", borderRadius: "8px", overflow: "hidden", backgroundColor: "#ffffff", border: "2px solid rgba(0, 0, 0, 0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Hình ảnh phương tiện đang cập nhật</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}