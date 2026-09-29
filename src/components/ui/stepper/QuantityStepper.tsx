"use client";

import React from "react";

interface QuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityStepper({ value, onChange, min = 0, max = 999999 }: QuantityStepperProps): React.JSX.Element {
  const handleManualInput = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (valStr === "" || isNaN(parsed)) {
      onChange(0);
      return;
    }
    onChange(Math.min(max, Math.max(min, parsed)));
  };

  const handleBlurInput = () => {
    if (value <= min) {
      onChange(Math.max(1, min));
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width: "28px", height: "28px", backgroundColor: "#0f1026", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "4px 0 0 4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", outline: "none" }}
      >
        -
      </button>
      <input
        type="text"
        value={value === 0 ? "" : value}
        onChange={(e) => handleManualInput(e.target.value)}
        onBlur={handleBlurInput}
        style={{ width: "45px", height: "26px", backgroundColor: "#0f1026", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", borderLeft: "none", borderRight: "none", color: "#fff", fontSize: "13px", textAlign: "center", outline: "none", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" }}
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width: "28px", height: "28px", backgroundColor: "#0f1026", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: "0 4px 4px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", outline: "none" }}
      >
        +
      </button>
    </div>
  );
}