"use client";

import React, { useState } from "react";

interface ProductItem {
  id: string | number;
  product_id?: string | number;
  name: string;
  price: number;
  stock: string;
  uom?: string;
}

interface ProductCardBubbleProps {
  product: ProductItem;
}

export default function ProductCardBubble({ product }: ProductCardBubbleProps): React.JSX.Element {
  const [actionStatus, setActionStatus] = useState<"idle" | "adding" | "success">("idle");

  const handleInlineAddToCart = async () => {
    if (actionStatus !== "idle") return;
    setActionStatus("adding");

    try {
      const finalProductId = product.product_id || product.id;

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: finalProductId,
          quantity: 1,
        }),
      });

      if (res.ok) {
        setActionStatus("success");
        setTimeout(() => setActionStatus("idle"), 2000);
      } else {
        setActionStatus("idle");
      }
    } catch {
      setActionStatus("idle");
    }
  };

  return (
    <div style={{ backgroundColor: "#141534", border: "1px solid var(--theme-color-15)", borderRadius: "8px", padding: "12px", marginTop: "8px", width: "100%", maxWidth: "300px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", lineHeight: "1.4" }}>
        {product.name}
      </div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
        <span style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          Trạng thái: <span style={{ color: product.stock.includes("Hết") ? "#ef4444" : "#4ade80", fontWeight: "bold" }}>{product.stock}</span>
        </span>
        <span style={{ color: "var(--theme-color)", fontWeight: "bold", fontFamily: "monospace" }}>
          {product.price.toLocaleString("vi-VN")}đ{product.uom ? ` / ${product.uom}` : ""}
        </span>
      </div>

      <button
        type="button"
        disabled={actionStatus !== "idle" || product.stock.includes("Hết")}
        onClick={handleInlineAddToCart}
        style={{ width: "100%", padding: "6px 0", backgroundColor: actionStatus === "success" ? "#4ade80" : "var(--theme-color)", color: "#0f1026", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "bold", cursor: (actionStatus !== "idle" || product.stock.includes("Hết")) ? "not-allowed" : "pointer", transition: "background-color 0.2s", textTransform: "uppercase" }}
      >
        {actionStatus === "adding" ? "ĐANG ĐỒNG BỘ..." : actionStatus === "success" ? "ĐÃ THÊM GIỎ HÀNG" : "THÊM VÀO GIỎ HÀNG"}
      </button>
    </div>
  );
}