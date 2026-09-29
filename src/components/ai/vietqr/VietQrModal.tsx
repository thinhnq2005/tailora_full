"use client";

import React, { useState, useEffect } from "react";
import QrCodeRenderer from "./QrCodeRenderer";
import { useTenant } from "@/app/context/TenantContext";
import { useRouter } from "next/navigation";

export interface VietQrPaymentData {
  accountNo: string;
  bankId: string;
  amount: number;
  accountName: string;
  description: string;
  orderId?: string;
}

interface VietQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutPayload: {
    address: string;
    items: any[];
    totalAmount: number;
    coordinates: { lat: number; lng: number };
  };
}

type OrderStatus = "prepare" | "submitting" | "paying";

function getContrastTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace("#", "");
  let r = 0, g = 0, b = 0;
  
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex.substring(0, 1), 16) * 17;
    g = parseInt(cleanHex.substring(1, 2), 16) * 17;
    b = parseInt(cleanHex.substring(2, 3), 16) * 17;
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return "#ffffff";
  }
  
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#1e293b" : "#ffffff";
}

export default function VietQrModal({ 
  isOpen, 
  onClose,
  checkoutPayload
}: VietQrModalProps): React.JSX.Element | null {
  const { tenant } = useTenant();
  const router = useRouter();
  
  const [qrConfig, setQrConfig] = useState<VietQrPaymentData | null>(null);
  const [errorState, setErrorState] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("prepare");
  const [countdown, setCountdown] = useState<number>(300);

  const themeColor = tenant?.primary_color || "var(--theme-color)";
  const textColorForTheme = getContrastTextColor(themeColor);

  const rawHotline = tenant?.hotline_support || tenant?.phone || "";
  const cleanHotline = rawHotline.trim();

  useEffect(() => {
    if (!isOpen) return;
    setCurrentStatus("prepare");
    setErrorState(false);
    setErrorMessage("");
    setQrConfig(null);
    setCountdown(300);
  }, [isOpen]);

  useEffect(() => {
    if (currentStatus !== "paying" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStatus, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleGoHome = () => {
    onClose();
    router.push("/");
  };

  const handleConfirmAndSubmitOrder = async () => {
    setCurrentStatus("submitting");
    setErrorMessage("");
    
    const fallbackOrderId = `ORD${Date.now().toString().slice(-4)}`;
    
    try {
      const getCookieValue = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
        return null;
      };

      const clientPartnerId = getCookieValue("partner_id");

      const res = await fetch("/api/checkout/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: checkoutPayload.address,
          items: checkoutPayload.items,
          total_amount: checkoutPayload.totalAmount,
          payment_method: "vietqr",
          coordinates: checkoutPayload.coordinates,
          partner_id: clientPartnerId ? parseInt(clientPartnerId) : null
        })
      });

      const orderPayload = await res.json();

      if (res.ok && orderPayload && orderPayload.success !== false && orderPayload.accountNo && orderPayload.bankId) {
        setQrConfig({
          accountNo: orderPayload.accountNo,
          bankId: orderPayload.bankId,
          amount: orderPayload.amount || checkoutPayload.totalAmount,
          accountName: orderPayload.accountName || tenant?.payment_bank_info?.account_holder || "CONG TY VLXD",
          description: orderPayload.orderId || fallbackOrderId,
          orderId: orderPayload.orderId || fallbackOrderId
        });
        setCurrentStatus("paying");
        setErrorState(false);
        return;
      }

      if (tenant?.payment_bank_info?.bank_name && tenant?.payment_bank_info?.account_number) {
        setQrConfig({
          accountNo: tenant.payment_bank_info.account_number,
          bankId: tenant.payment_bank_info.bank_name,
          amount: checkoutPayload.totalAmount,
          accountName: tenant.payment_bank_info.account_holder || tenant.brand_name || "CONG TY VLXD",
          description: orderPayload?.orderId || fallbackOrderId,
          orderId: orderPayload?.orderId || fallbackOrderId
        });
        setCurrentStatus("paying");
        setErrorState(false);
        return;
      }

      throw new Error(orderPayload?.error || "Không thể khởi tạo cổng kết nối Odoo.");

    } catch (err: any) {
      if (tenant?.payment_bank_info?.bank_name && tenant?.payment_bank_info?.account_number) {
        setQrConfig({
          accountNo: tenant.payment_bank_info.account_number,
          bankId: tenant.payment_bank_info.bank_name,
          amount: checkoutPayload.totalAmount,
          accountName: tenant.payment_bank_info.account_holder || tenant.brand_name || "CONG TY VLXD",
          description: fallbackOrderId,
          orderId: fallbackOrderId
        });
        setCurrentStatus("paying");
        setErrorState(false);
      } else {
        setErrorState(true);
        setErrorMessage(err.message || "Hệ thống bến bãi đang bận, vui lòng thử lại sau.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "12px", boxSizing: "border-box" }}>
      <div style={{ position: "fixed", inset: 0 }} onClick={onClose} />
      
      <div style={{ position: "relative", width: "100%", maxWidth: "420px", maxHeight: "94vh", backgroundColor: "#ffffff", borderRadius: "14px", boxSizing: "border-box", boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)", display: "flex", flexDirection: "column", zIndex: 10, overflow: "hidden" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", padding: "14px 18px"}}>
          <h2 style={{ fontSize: "13px", fontWeight: "800", color: "#1e293b", margin: 0, textTransform: "uppercase", letterSpacing: "0.3px" }}>CỔNG KẾT TOÁN VẬT TƯ BẾN BÃI</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer", outline: "none", padding: "4px" }}></button>
        </div>

        <div style={{ padding: "16px 18px", overflowY: "auto", flex: 1 }}>
          {errorState ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#fef2f2", border: "2px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "900", color: "#ef4444" }}>!</div>
              <p style={{ fontSize: "13px", color: "#334155", fontWeight: "600", margin: 0, lineHeight: "1.5" }}>{errorMessage}</p>
              <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
                {cleanHotline && (
                  <a href={`https://zalo.me/${cleanHotline}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, height: "38px", backgroundColor: "#0068ff", color: "#fff", borderRadius: "6px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>CHAT ZALO</a>
                )}
                <button type="button" onClick={onClose} style={{ flex: 1, height: "38px", backgroundColor: "#f1f5f9", border: "none", color: "#475569", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>ĐÓNG</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {currentStatus === "prepare" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ fontSize: "13px", color: "#475569", margin: 0, lineHeight: "1.5", textAlign: "center" }}>
                    Bạn đang thực hiện đặt đơn và thanh toán cho vật tư trị giá <strong style={{ color: themeColor }}>{checkoutPayload.totalAmount.toLocaleString("vi-VN")}đ</strong> gửi đến địa chỉ công trình đã chọn.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", fontWeight: "600" }}> Địa chỉ nhận hàng:</span>
                    <span style={{ color: "#1e293b", fontWeight: "500" }}>{checkoutPayload.address}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmAndSubmitOrder}
                    style={{ width: "100%", height: "42px", backgroundColor: themeColor, color: textColorForTheme, border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer", textTransform: "uppercase" }}
                  >
                    XÁC NHẬN ĐẶT ĐƠN & QUÉT QR
                  </button>
                </div>
              )}

              {currentStatus === "submitting" && (
                <div style={{ textAlign: "center", padding: "30px 0", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "26px", height: "26px", border: "3px solid #e2e8f0", borderTopColor: themeColor, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: "12.5px", color: "#64748b", margin: 0 }}>Đang khởi tạo thông tin giao dịch...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {currentStatus === "paying" && qrConfig && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", backgroundColor: themeColor, padding: "14px", borderRadius: "8px", fontSize: "12.5px", color: textColorForTheme }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${textColorForTheme}20`, paddingBottom: "5px" }}>
                      <span>Ngân hàng thụ hưởng:</span><strong style={{ color: textColorForTheme }}>{qrConfig.bankId}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${textColorForTheme}20`, paddingBottom: "5px" }}>
                      <span>Số tài khoản:</span><strong style={{ color: textColorForTheme, fontFamily: "monospace", fontSize: "13px" }}>{qrConfig.accountNo}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${textColorForTheme}20`, paddingBottom: "5px" }}>
                      <span>Chủ tài khoản:</span><strong style={{ color: textColorForTheme }}>{qrConfig.accountName}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${textColorForTheme}20`, paddingBottom: "5px" }}>
                      <span>Số tiền thanh toán:</span><strong style={{ color: textColorForTheme, fontSize: "13.5px" }}>{qrConfig.amount.toLocaleString("vi-VN")}đ</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Nội dung chuyển khoản:</span><strong style={{ color: textColorForTheme, fontFamily: "monospace" }}>{qrConfig.description}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                    <QrCodeRenderer url={`https://api.vietqr.io/image/${qrConfig.bankId}-${qrConfig.accountNo}-dark.png?amount=${qrConfig.amount}&addInfo=${encodeURIComponent(qrConfig.description)}&accountName=${encodeURIComponent(qrConfig.accountName)}`} loading={false} />
                  </div>

                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Quét mã và đợi duyệt.</p>
                    <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8" }}>Mã QR tự động làm mới sau: {formatTime(countdown)}</p>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button 
                      type="button" 
                      onClick={onClose} 
                      style={{ flex: 1, height: "40px", backgroundColor: "transparent", border: "1px solid #cbd5e1", color: "#64748b", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                    >
                      HỦY
                    </button>
                    <button 
                      type="button" 
                      onClick={handleGoHome} 
                      style={{ flex: 1, height: "40px", backgroundColor: themeColor, border: "none", color: textColorForTheme, borderRadius: "6px", fontSize: "12px", fontWeight: "800", cursor: "pointer", textTransform: "uppercase" }}
                    >
                      XÁC NHẬN ĐÃ CHUYỂN
                    </button>
                  </div>
                </>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}