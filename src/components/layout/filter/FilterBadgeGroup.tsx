"use client";

import React from "react";

export type FilterBadgeGroupProps = {
  tags: string[];
};

export default function FilterBadgeGroup({ tags }: FilterBadgeGroupProps): React.JSX.Element {
  if (!tags || tags.length === 0) {
    return (
      <div className="text-[10px] font-mono text-white/40 italic">
        Hệ thống đang cập nhật bộ lọc...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 select-none">
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="text-[10px] font-black uppercase tracking-wider bg-[#0f1026] border border-[#2c2d59] text-[var(--theme-color)] px-2.5 py-0.5 rounded-md"
        >
          {t}
        </span>
      ))}
    </div>
  );
}