"use client";

import React, { useState, useEffect } from "react";
import { useTenant } from "@/app/context/TenantContext";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "B2B" | "B2C";
}

export default function GoogleAuthModal({ isOpen, onClose, type }: GoogleAuthModalProps): React.JSX.Element | null {
  const { tenant } = useTenant() as { tenant: any };
  const [googleEmail, setGoogleEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authState, setAuthState] = useState<"idle" | "processing" | "error" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const handleGoogleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.source === "google-oauth-success") {
        const receivedEmail = event.data.email;
        if (receivedEmail) {
          setGoogleEmail(receivedEmail);
          setErrorMessage("");
          setAuthState("idle");
        }
      }

      if (event.data.source === "google-oauth-error") {
        setErrorMessage(event.data.error || "Lỗi xác thực thông tin từ Google Auth");
        setAuthState("error");
      }
    };

    window.addEventListener("message", handleGoogleMessage);
    return () => {
      window.removeEventListener("message", handleGoogleMessage);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setPassword("");
      setConfirmPassword("");
      
      if (typeof window !== "undefined") {
        const savedProfile = localStorage.getItem("user_profile");
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed?.email) {
              setGoogleEmail(parsed.email);
              return;
            }
          } catch {}
        }
        setGoogleEmail("");
      }
    }
  }, [isOpen, isRegisterMode]);

  if (!isOpen) return null;

  const themeColor = tenant?.primary_color || "var(--theme-color)";

  const getContrastColor = (hexColor: string) => {
    const cleanHex = hexColor.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  const buttonTextColor = getContrastColor(themeColor);

  const handleTriggerGooglePopup = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "952749144152-7ibsjm2f0ke0o1nlvoe74qba9mkm5os2.apps.googleusercontent.com";
    const redirectUri = `${window.location.origin}/api/auth/google/callback`;
    const scope = encodeURIComponent("openid email profile");
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&prompt=select_account`;

    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      googleAuthUrl,
      "Google OAuth 2.0 Authentication",
      `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,status=no`
    );
  };

  const handleSystemAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!googleEmail) {
      setErrorMessage("Vui lòng kích hoạt Popup để chọn tài khoản Gmail xác thực");
      setAuthState("error");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng cấu hình mật khẩu truy cập hệ thống");
      setAuthState("error");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu hệ thống phải có độ dài từ 6 ký tự trở lên");
      setAuthState("error");
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không trùng khớp");
      setAuthState("error");
      return;
    }

    setAuthState("processing");

    try {
      const targetEndpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";

      const response = await fetch(targetEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          login: googleEmail.trim(), 
          password: password, 
          type: type 
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error || "Xác thực tài khoản bến bãi thất bại");
        setAuthState("error");
        return;
      }

      const userData = await response.json();
      if (typeof window !== "undefined" && userData.session_id) {
        localStorage.setItem("odoo_session_id", userData.session_id);
      }

      setAuthState("success");
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch {
      setErrorMessage("Lỗi kết nối cổng hệ thống bến bãi");
      setAuthState("error");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px", boxSizing: "border-box" }}>
      <div style={{ position: "fixed", inset: 0 }} onClick={onClose} />
      
      <div className="glass-modal-container" style={{ position: "relative", width: "100%", maxWidth: "420px", backgroundColor: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "24px", padding: "36px", boxSizing: "border-box", boxShadow: "0 30px 70px rgba(0, 0, 0, 0.15), inset 0 1px 0 #ffffff", display: "flex", flexDirection: "column", gap: "20px", zIndex: 10 }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", textAlign: "center" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#000000", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {isRegisterMode ? "ĐĂNG KÝ HỆ THỐNG" : "ĐĂNG NHẬP HỆ THỐNG"}
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, fontWeight: "600" }}>
            Cổng quyền hạn: {type === "B2B" ? "Nhà thầu Sỉ" : "Khách mua lẻ B2C"}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569" }}>XÁC THỰC TÀI KHOẢN GOOGLE</label>
          <button
            type="button"
            onClick={handleTriggerGooglePopup}
            style={{ width: "100%", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#ffffff", cursor: "pointer", transition: "all 0.2s ease", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.44 0-6.228-2.788-6.228-6.228 0-3.44 2.788-6.228 6.228-6.228 1.54 0 2.94.557 4.03 1.493l3.215-3.214C19.232 1.946 15.96 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.94 0 12.24-4.873 12.24-12.24 0-.83-.075-1.636-.214-2.413H12.24z"/>
            </svg>
            {googleEmail ? `Gmail: ${googleEmail}` : "Bấm chọn tài khoản Gmail..."}
          </button>
        </div>

        <form onSubmit={handleSystemAuth} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569" }}>MẬT KHẨU TRUY CẬP HỆ THỐNG</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
              style={{ width: "100%", height: "44px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 14px", fontSize: "13px", color: "#000000", backgroundColor: "#f8fafc", boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {isRegisterMode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "11px", fontWeight: "800", color: "#475569" }}>NHẬP LẠI MẬT KHẨU BẢO MẬT</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận chính xác mật khẩu..."
                style={{ width: "100%", height: "44px", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0 14px", fontSize: "13px", color: "#000000", backgroundColor: "#f8fafc", boxSizing: "border-box", outline: "none" }}
              />
            </div>
          )}

          {errorMessage && (
            <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "700", textAlign: "center", backgroundColor: "#fef2f2", padding: "8px", borderRadius: "6px" }}>
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={authState === "processing" || authState === "success"}
            style={{ width: "100%", height: "46px", backgroundColor: authState === "success" ? "#10b981" : themeColor, color: authState === "success" ? "#ffffff" : buttonTextColor, border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px", cursor: (authState === "processing" || authState === "success") ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transition: "all 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {authState === "processing" ? "Đang xử lý dữ liệu..." : authState === "success" ? "Thành công!" : isRegisterMode ? "Xác nhận Đăng ký" : "Xác nhận Đăng nhập"}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <span 
            onClick={() => { setIsRegisterMode(!isRegisterMode); setErrorMessage(""); }} 
            style={{ fontSize: "12px", color: "#475569", fontWeight: "bold", textDecoration: "underline", cursor: "pointer" }}
          >
            {isRegisterMode ? "Tôi đã có tài khoản, quay lại Đăng nhập" : "Chưa có tài khoản? Bấm để chuyển sang Đăng ký"}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "#64748b", fontSize: "16px", cursor: "pointer", padding: "4px", fontWeight: "bold" }}
        >
          
        </button>

      </div>
    </div>
  );
}