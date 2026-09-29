"use client";

import React, { useState } from "react";

interface DropdownPopoverProps {
  triggerLabel: string;
  items: string[];
  onSelect: (item: string) => void;
}

export default function DropdownPopover({ triggerLabel, items, onSelect }: DropdownPopoverProps): React.JSX.Element {
  const [show, setShow] = useState<boolean>(false);

  return (
    <div className="relative inline-block text-left">
      <button 
        type="button" 
        onClick={() => setShow(!show)} 
        className="bg-[#141534] border border-[#2c2d59] text-white font-black text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-xl hover:border-[var(--theme-color)] transition-all cursor-pointer select-none"
      >
        {triggerLabel} ▾
      </button>
      {show && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShow(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-[#141534] border border-[#2c2d59] rounded-xl shadow-2xl z-40 py-1 overflow-hidden divide-y divide-[#2c2d59]/30 animate-in fade-in slide-in-from-top-1 duration-100">
            {items.length === 0 ? (
              <div className="px-3 py-2 text-[11px] font-mono text-white/40">
                Hệ thống đang tải dữ liệu...
              </div>
            ) : (
              items.map((item, i) => (
                <button 
                  key={`${item}-${i}`} 
                  type="button" 
                  onClick={() => { 
                    onSelect(item); 
                    setShow(false); 
                  }} 
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-300 hover:bg-[#0f1026] hover:text-white transition-colors cursor-pointer select-none"
                >
                  {item}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}