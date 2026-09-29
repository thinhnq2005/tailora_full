"use client";

import { useEffect } from "react";

export default function UnbuildScrapSection(): null {
  useEffect(() => {
    async function autoSyncUnbuildStatus() {
      try {
        const res = await fetch("/api/inventory/unbuild/active");
        if (!res.ok) return;
        const order = await res.json();
        
        if (order && order.id) {
          await fetch("/api/inventory/unbuild/scrap/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order_id: order.id })
          });
        }
      } catch {
        // Suppress background errors
      }
    }
    autoSyncUnbuildStatus();
  }, []);

  return null;
}