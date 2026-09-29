"use client";

import React from "react";

type MetalButtonVariant = "primary" | "ghost" | "danger";

export type MetalButtonProps = {
  variant?: MetalButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  children?: React.ReactNode;
  ariaLabel?: string;
};

function SpinnerSvg({ size = 16 }: { size?: number }): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className="animate-spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--theme-color-15)"
        strokeWidth="3"
      />
      <path
        d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12"
        stroke="var(--theme-color)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MetalButton({
  variant = "primary",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onClick,
  className = "",
  type = "button",
  children,
  ariaLabel,
}: MetalButtonProps): React.ReactElement {
  const isDisabled = disabled || loading;

  const variantStyles: Record<MetalButtonVariant, string> = {
    primary: "bg-[#141534] text-[#f6f2e8] border border-[#2c2d59] hover:border-[var(--theme-color)] hover:shadow-[0_0_12px_var(--theme-color-15)]",
    ghost: "bg-transparent text-[#f6f2e8] border border-[#2c2d59] hover:border-[var(--theme-color)]",
    danger: "bg-[#141534] text-[#ffd7d7] border border-[#2c2d59] hover:border-[#ff4d4d] hover:shadow-[0_0_12px_rgba(255,77,77,0.15)]",
  };

  const base = "group relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider select-none transition-all duration-200 ease-out outline-none";
  const metalShine = "before:absolute before:inset-0 before:rounded-xl before:opacity-0 before:transition-opacity before:duration-200 before:pointer-events-none before:bg-[radial-gradient(60%_120%_at_50%_0%,var(--theme-color-15),transparent_60%)] hover:before:opacity-100";
  const statusStyles = "disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]";

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`${base} ${metalShine} ${variantStyles[variant]} ${statusStyles} ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <SpinnerSvg size={14} />
          <span className="font-mono text-[10px] tracking-normal lowercase text-white/50">syncing...</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
          <span className="inline-flex items-center">{children}</span>
          {rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}