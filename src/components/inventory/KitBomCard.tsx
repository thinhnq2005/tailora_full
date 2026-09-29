"use client";

import React, { useState, useEffect } from "react";
import MetalButton from "../ui/button/MetalButton";

interface BomLine {
  product_name: string;
  quantity: number;
  uom: string;
}

interface KitStructure {
  id: string;
  name: string;
  lines: BomLine[];
}

export default function KitBomCard(): React.JSX.Element | null {
  const [kit, setKit] = useState<KitStructure | null>(null);
  const [sync, setSync] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    async function loadActiveKit() {
      try {
        const res = await fetch("/api/inventory/kit-bom/active");
        if (!res.ok) return;
        const data = await res.json();
        setKit(data);
      } catch {}
    }
    loadActiveKit();
  }, []);

  const handleExplodeKit = async () => {
    if (!kit || sync) return;
    setSync(true);
    setMsg("");
    try {
      const res = await fetch("/api/inventory/kit-bom/explode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kit_id: kit.id })
      });
      if (!res.ok) {
        setMsg("Hệ thống đang xử lý định mức tự động, vui lòng đợi...");
        return;
      }
      setMsg("Đã hoàn tất bóc tách cấu phần kho con thành công.");
    } catch {
      setMsg("Trục trặc đường truyền đồng bộ lệnh, hãy thử lại.");
    } finally {
      setSync(false);
    }
  };

  if (!kit) return null;

  return (
    <div className="w-full bg-white text-black border border-black rounded-xl p-5 shadow-xl space-y-4">
      <div className="border-b border-black/10 pb-2 flex flex-col gap-1">
        <div>
          <span 
            className="text-[10px] font-black px-2 py-0.5 rounded uppercase font-mono border"
            style={{ 
              backgroundColor: "var(--company-color)",
              borderColor: "var(--company-color)",
              color: "all-colors",
              mixBlendMode: "difference"
            }}
          >
            BOM Auto Splitting
          </span>
        </div>
        <h3 className="text-black text-xs font-black mt-1.5 uppercase tracking-wide font-mono">{kit.name}</h3>
      </div>

      <div className="bg-black/5 rounded-lg border border-black/10 p-3">
        <div className="text-[10px] uppercase font-black tracking-wider text-black/40 mb-2">Định mức bóc tách tự động:</div>
        <ul className="space-y-2 text-xs font-medium text-black">
          {kit.lines.map((l, i) => (
            <li key={i} className="flex justify-between items-center border-b border-black/5 pb-1.5 last:border-none last:pb-0">
              <span className="truncate pr-2">{l.product_name}</span>
              <span className="font-mono shrink-0 font-bold" style={{ color: "var(--company-color)" }}>{l.quantity} {l.uom}</span>
            </li>
          ))}
        </ul>
      </div>

      {msg && (
        <div className="text-[11px] font-mono text-black bg-black/5 px-2.5 py-1.5 rounded border border-black/10">
          {msg}
        </div>
      )}

      <MetalButton
        type="button"
        variant="primary"
        onClick={handleExplodeKit}
        disabled={sync}
        loading={sync}
        className="w-full rounded-xl py-2.5 text-xs font-black uppercase tracking-wider border border-black bg-black text-white hover:bg-white hover:text-black transition-all"
      >
        Kích hoạt định mức &amp; bóc tách kho
      </MetalButton>
    </div>
  );
}