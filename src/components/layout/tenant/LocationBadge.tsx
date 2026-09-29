"use client";

import React, { useState, useEffect } from "react";

interface TenantConfig {
  province: string;
  district: string;
}

export default function LocationBadge(): React.JSX.Element {
  const [location, setLocation] = useState<string>("Cần Thơ");

  useEffect(() => {
    async function fetchLocationData() {
      try {
        const res = await fetch("/api/tenant/config/active");
        if (res.ok) {
          const data: TenantConfig = await res.json();
          if (data && data.province) {
            setLocation(`${data.district ? data.district + ", " : ""}${data.province}`);
          }
        }
      } catch {
        setLocation("Cần Thơ");
      }
    }
    fetchLocationData();
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "var(--theme-color-15)", border: "1px solid var(--theme-color-15)", padding: "4px 10px", borderRadius: "16px", fontSize: "11px", color: "var(--theme-color)", fontWeight: "bold", fontFamily: "sans-serif" }}>
      <span> Vị trí kho:</span>
      <span style={{ color: "#fff" }}>{location}</span>
    </div>
  );
}