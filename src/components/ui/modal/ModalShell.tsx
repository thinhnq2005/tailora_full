"use client";

import React from "react";

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function ModalShell({ open, onClose, title, children }: ModalShellProps): React.JSX.Element | null {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="w-full max-w-lg rounded-2xl border border-[#2c2d59] bg-[#141534] p-5 shadow-2xl relative z-10 animate-scale-in">
        <div className="flex items-center justify-between border-b border-[#2c2d59]/50 pb-2.5">
          <h3 className="text-xs font-black uppercase text-white tracking-wider font-mono">{title}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-white/40 hover:text-white text-xs cursor-pointer p-1 transition-colors select-none"
          >
            
          </button>
        </div>
        <div className="mt-4 text-xs font-medium text-[#f6f2e8]">{children}</div>
      </div>
    </div>
  );
}