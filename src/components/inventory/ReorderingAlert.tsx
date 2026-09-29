"use client";

import { useEffect } from "react";

export default function ReorderingAlert(): null {
  useEffect(() => {
    let active = true;
    async function trackReorderingMetrics() {
      try {
        const res = await fetch("/api/inventory/reordering/rules");
        if (!res.ok) return;
        const data = await res.json();
        
        if (active && Array.isArray(data) && data.length > 0) {
          // Logic xử lý ngầm hoặc gửi event tracking nếu cần thiết
        }
      } catch {
        // Suppress background errors
      }
    }
    trackReorderingMetrics();
    return () => { active = false; };
  }, []);

  return null;
}