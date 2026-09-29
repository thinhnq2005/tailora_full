"use client";

import React, { useState, useEffect } from "react";

interface CategoryNode {
  id: string;
  name: string;
  child_ids?: Array<{ id: string; name: string }>;
}

interface NavbarProps {
  onCartClick: () => void;
}

export default function CategoryTreeMenu({ onCartClick }: NavbarProps): React.JSX.Element {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    async function fetchTreeData() {
      try {
        const res = await fetch("/api/products/categories/tree");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setTree(data);
        } else {
          setTree([]); // Trả về trống khi kết nối lỗi hoặc không có dữ liệu thực tế
        }
      } catch {
        setTree([]); // Gọt sạch dữ liệu mockup cũ
      }
    }

    async function fetchCartCount() {
      try {
        const res = await fetch("/api/cart/items");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCartCount(data.reduce((sum, item) => sum + (item.quantity || 0), 0));
          }
        }
      } catch {
        setCartCount(0);
      }
    }

    fetchTreeData();
    fetchCartCount();
    const interval = setInterval(fetchCartCount, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: "70px", backgroundColor: "#0f1026", borderBottom: "4px solid var(--theme-color)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 24px", zIndex: 100, boxSizing: "border-box" }}>
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", position: "relative", boxSizing: "border-box" }}>
        
        <div style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px", color: "#fff" }}>
          TAILORA <span style={{ color: "var(--theme-color)" }}>GATEWAY</span>
        </div>

        <div style={{ display: "flex", gap: "32px", fontSize: "14px", alignItems: "center" }}>
          <div 
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            style={{ color: "#cbd5e1", cursor: "pointer", position: "relative", padding: "10px 0" }}
          >
            DANH MỤC VẬT TƯ
            
            {isOpen && tree.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, width: "240px", backgroundColor: "#141534", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", gap: "12px", boxSizing: "border-box" }}>
                {tree.map((root) => (
                  <div key={root.id} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "900", color: "var(--theme-color)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {root.name}
                    </div>
                    {root.child_ids?.map((child) => (
                      <span 
                        key={child.id} 
                        style={{ fontSize: "12px", color: "#cbd5e1", padding: "2px 0 2px 8px", cursor: "pointer" }}
                      >
                        {child.name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <a href="/portal" style={{ color: "#cbd5e1", textDecoration: "none" }}>THEO DÕI LỘ TRÌNH</a>
        </div>

        <a href="/cart" style={{ textDecoration: "none" }}>
          <button 
            type="button"
            style={{ backgroundColor: "var(--theme-color)", color: "#0f1026", border: "none", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold", cursor: "pointer" }}
          >
            XEM GIỎ HÀNG ({cartCount})
          </button>
        </a>
      </div>
    </header>
  );
}