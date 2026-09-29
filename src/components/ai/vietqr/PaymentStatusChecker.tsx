"use client";

import React, { useEffect, useState } from "react";

export type PaymentStatusCheckerProps = {
  orderId: string;
  onSuccess: () => void;
  intervalMs?: number;
};

export default function PaymentStatusChecker({
  orderId,
  onSuccess,
  intervalMs = 5000,
}: PaymentStatusCheckerProps): React.ReactElement {
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [isExpired, setIsQrExpired] = useState<boolean>(false);

  useEffect(() => {
    if (!orderId) return;

    let checkTimerId: NodeJS.Timeout;
    let countdownTimerId: NodeJS.Timeout;

    setTimeLeft(300);
    setIsQrExpired(false);

    async function checkStatus() {
      if (isExpired) return;
      try {
        const res = await fetch(`/api/ledger/vietqr/status?order_id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.status === "paid") {
            onSuccess();
            return;
          }
        }
      } catch {}

      checkTimerId = setTimeout(checkStatus, intervalMs);
    }

    checkTimerId = setTimeout(checkStatus, intervalMs);

    countdownTimerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerId);
          setIsQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(checkTimerId);
      clearInterval(countdownTimerId);
    };
  }, [orderId, intervalMs, onSuccess, isExpired]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
      <div className="flex items-center gap-2 p-3 rounded-xl border border-[#2c2d59]/50 bg-[#0f1026]/20 font-mono text-[11px] text-white/50">
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isExpired ? "#ef4444" : "var(--theme-color)" }} className={isExpired ? "" : "animate-ping"} />
        <span>
          {isExpired 
            ? "Mã thanh toán đã hết hạn, vui lòng tạo lại giao dịch mới." 
            : `Mã QR động tự động làm mới sau: ${formatTime(timeLeft)}`}
        </span>
      </div>
    </div>
  );
}