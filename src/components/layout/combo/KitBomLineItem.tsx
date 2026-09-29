"use client";

import React from "react";

export type KitBomLineItemProps = {
  name: string;
  qty: string | number;
};

export default function KitBomLineItem({ name, qty }: KitBomLineItemProps): React.JSX.Element {
  const formattedQty = typeof qty === "number" ? qty.toLocaleString("vi-VN") : qty;

  return (
    <div className="flex justify-between items-center text-xs py-2 border-b border-[#2c2d59]/20 last:border-none last:pb-0">
      <span className="text-gray-300 font-bold">{name}</span>
      <span className="font-mono text-[var(--theme-color)] font-black tracking-wide">
        {formattedQty || "Hệ thống đang tính..."}
      </span>
    </div>
  );
}