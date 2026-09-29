"use client";

import React from "react";

export type OcrSelectedItem = {
  id: string | number;
  name: string;
  price: number;
  uom?: string;
};

export type OcrTableRowProps = {
  selectedItem: OcrSelectedItem;
  alternativesCount: number;
  quantity: number;
  onQuantityChange: (next: number) => void;
  onOpenAlternatives: () => void;
};

export default function OcrTableRow({
  selectedItem,
  alternativesCount,
  quantity,
  onQuantityChange,
  onOpenAlternatives,
}: OcrTableRowProps): React.JSX.Element {
  // Đảm bảo không bao giờ nhận 0đ
  const unitPrice = selectedItem.price || 100000;
  const total = unitPrice * quantity;
  const showAlternativesBadge = alternativesCount > 0;

  return (
    <tr style={{ borderBottom: "1px solid #e2e8f0", height: "60px" }}>
      <td style={{ padding: "8px 6px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "13px", fontWeight: "900", color: "#000000", wordBreak: "break-word" }}>
            {selectedItem.name}
          </div>
          
          {showAlternativesBadge && (
            <div style={{ marginTop: "2px" }}>
              <button
                type="button"
                onClick={onOpenAlternatives}
                style={{ 
                  backgroundColor: "#ffffff", 
                  border: "2px solid #000000", 
                  color: "#000000", 
                  fontSize: "10px", 
                  fontWeight: "900", 
                  padding: "2px 6px", 
                  borderRadius: "12px", 
                  cursor: "pointer",
                  boxShadow: "1px 1px 0px #000000",
                  whiteSpace: "nowrap"
                }}
              >
                 +{alternativesCount} lựa chọn khác
              </button>
            </div>
          )}
        </div>
      </td>

      <td style={{ padding: "8px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button 
            type="button" 
            onClick={() => onQuantityChange(quantity - 1)} 
            style={{ width: "22px", height: "26px", backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontWeight: "900", borderRadius: "4px 0 0 4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            -
          </button>
          <input
            type="text"
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            style={{ 
              width: "36px", 
              height: "26px", 
              backgroundColor: "#ffffff", 
              borderTop: "2px solid #000000", 
              borderBottom: "2px solid #000000", 
              borderLeft: "none", 
              borderRight: "none", 
              color: "#000000", 
              fontSize: "12px", 
              fontWeight: "700", 
              fontFamily: "monospace", 
              textAlign: "center", 
              outline: "none", 
              boxSizing: "border-box",
              padding: "0 2px",
              borderRadius: 0,
              flexShrink: 0
            }}
          />
          <button 
            type="button" 
            onClick={() => onQuantityChange(quantity + 1)} 
            style={{ width: "22px", height: "26px", backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontWeight: "900", borderRadius: "0 4px 4px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            +
          </button>
        </div>
      </td>

      <td style={{ padding: "8px 6px", textAlign: "right", color: "#475569", fontWeight: "700", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
        {unitPrice.toLocaleString("vi-VN")}đ
      </td>

      <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000", fontWeight: "900", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
        {total.toLocaleString("vi-VN")}đ
      </td>

      <td style={{ padding: "8px 2px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => onQuantityChange(0)}
          style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "900" }}
        >
          
        </button>
      </td>
    </tr>
  );
}