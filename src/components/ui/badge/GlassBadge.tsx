"use client";

import React from "react";

export type GlassBadgeTone = "neutral" | "success" | "warning" | "danger";

export type GlassBadgeProps = {
  tone?: GlassBadgeTone;
  label?: string;
  value?: number;
  className?: string;
};

function toneStyles(tone: GlassBadgeTone): { border: string; bg: string; text: string } {
  switch (tone) {
    case "success":
      return {
        border: "rgba(90, 255, 180, 0.35)",
        bg: "rgba(20, 215, 120, 0.10)",
        text: "#b7ffd6",
      };
    case "warning":
      return {
        border: "var(--theme-color-15)",
        bg: "var(--theme-color-15)",
        text: "#ffd88a",
      };
    case "danger":
      return {
        border: "rgba(255, 77, 77, 0.40)",
        bg: "rgba(255, 77, 77, 0.10)",
        text: "#ffd0d0",
      };
    case "neutral":
    default:
      return {
        border: "rgba(44, 45, 89, 0.80)",
        bg: "rgba(20, 21, 52, 0.55)",
        text: "#e7e8ff",
      };
  }
}

export default function GlassBadge({
  tone = "neutral",
  label,
  value,
  className = "",
}: GlassBadgeProps): React.ReactElement {
  const styles = toneStyles(tone);

  const content = (() => {
    if (typeof value === "number" && typeof label === "string" && label.length > 0) {
      return (
        <>
          <span className="font-bold uppercase tracking-wider text-[10px] opacity-60">{label}</span>
          <span className="text-white/40 font-mono mx-1">/</span>
          <span className="font-mono font-black" style={{ color: styles.text }}>
            {value.toLocaleString("vi-VN")}
          </span>
        </>
      );
    }

    if (typeof value === "number") {
      return (
        <span className="font-mono font-black" style={{ color: styles.text }}>
          {value.toLocaleString("vi-VN")}
        </span>
      );
    }

    if (typeof label === "string" && label.length > 0) {
      return (
        <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: styles.text }}>
          {label}
        </span>
      );
    }

    return null;
  })();

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-bold backdrop-blur-md transition-all select-none ${className}`}
      style={{ borderColor: styles.border, background: styles.bg, color: styles.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse"
        style={{ backgroundColor: styles.text }}
      />
      <span className="min-w-0 truncate flex items-center">{content}</span>
    </span>
  );
}