"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";

export type RfqStatus = "Draft" | "admin Confirmed" | "customer Confirmed" | "saled" | "cancle";
export type DiscountStatus = "Chưa duyệt" | "Giá gốc" | "Đã chiết khấu";

export interface RfqItem {
  id: string;
  rfq_id: string;
  created_at: string;
  valid_until: string;
  pre_discount: number;
  final_price: number;
  discount_status: DiscountStatus;
  status: RfqStatus;
}

export default function PortalRfqPage(): React.JSX.Element {
  const [rfqs, setRfqs] = useState<RfqItem[]>([]);
  const [status, setStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRfq, setSelectedRfq] = useState<RfqItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRfqs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rfq/list");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRfqs(data);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatus(errData.error || "Không thể tải danh sách phiếu dự toán từ hệ thống.");
      }
    } catch {
      setStatus("Không tìm thấy thông tin phiếu dự toán thầu từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleViewDetail = (rfq: RfqItem) => {
    setSelectedRfq(rfq);
  };

  const handleAcceptRfqPrice = async (rfq: RfqItem) => {
    try {
      setStatus(`Đang xử lý xác nhận phiếu ${rfq.rfq_id}...`);
      
      const response = await fetch(`/api/rfq/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rfq.id, rfq_id: rfq.rfq_id }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Lỗi cập nhật trạng thái lên Odoo");
      }

      setStatus(`Xác nhận chấp thuận mức chiết khấu cho phiếu ${rfq.rfq_id} thành công!`);
      
      setRfqs(prev => prev.map(item => item.id === rfq.id ? { ...item, status: "customer Confirmed" } : item));
      setSelectedRfq(prev => prev ? { ...prev, status: "customer Confirmed" } : null);
      
    } catch (err: any) {
      setStatus(err.message || "Đã xảy ra lỗi khi xác nhận giá sỉ.");
    } finally {
      setTimeout(() => setStatus(""), 4000);
    }
  };

  const renderStatusBadge = (status: RfqStatus) => {
    switch (status) {
      case "Draft":
        return <span style={{ backgroundColor: "#475569", color: "#f8fafc", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" }}>Đang soạn thảo</span>;
      case "admin Confirmed":
        return <span style={{ backgroundColor: "var(--theme-color-15)", border: "1px solid var(--theme-color)", color: "var(--theme-color)", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" }}>Chờ duyệt giá</span>;
      case "customer Confirmed":
        return <span style={{ backgroundColor: "rgba(59, 130, 246, 0.15)", border: "1px solid #3b82f6", color: "#60a5fa", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" }}>Khách đã đồng ý</span>;
      case "saled":
        return <span style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid #10b981", color: "#34d399", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" }}>Đã lên đơn hàng</span>;
      case "cancle":
        return <span style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", color: "#f87171", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", display: "inline-block", whiteSpace: "nowrap" }}>Đã hủy</span>;
      default:
        return null;
    }
  };

  const renderDiscountBadge = (status: DiscountStatus) => {
    switch (status) {
      case "Chưa duyệt":
        return <span style={{ color: "#94a3b8", fontSize: "11px", fontStyle: "italic", fontWeight: "500" }}>{status}</span>;
      case "Giá gốc":
        return <span style={{ color: "#93c5fd", fontSize: "11px", fontWeight: "700" }}>{status}</span>;
      case "Đã chiết khấu":
        return <span style={{ color: "var(--theme-color)", fontSize: "11px", fontWeight: "900", display: "inline-flex", alignItems: "center", gap: "4px" }}>{status}</span>;
      default:
        return null;
    }
  };

  const filteredRfqs = rfqs.filter(order =>
    order.rfq_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#060713', color: '#f6f2e8', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <Navbar onCartClick={() => {}} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '110px 16px 40px 16px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--theme-color)', marginBottom: '24px', paddingLeft: '8px' }}>
          DANH SÁCH PHIẾU YÊU CẦU BÁO GIÁ THẦU B2B
        </h1>

        {status && (
          <div style={{ marginBottom: '16px', fontSize: '13px', padding: '12px 16px', backgroundColor: '#141534', border: '1px solid var(--theme-color-15)', color: 'var(--theme-color)', borderRadius: '8px', fontWeight: '600', margin: '0 8px 16px 8px' }}>
            {status}
          </div>
        )}

        <div className="rfq-workspace">
          
          <div className="rfq-table-container" style={{ backgroundColor: 'rgba(15, 17, 39, 0.7)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '12px', boxSizing: 'border-box', backdropFilter: 'blur(10px)' }}>
            
            {isLoading ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: "13px" }}>
                Đang kết nối cổng đối soát bến bãi...
              </div>
            ) : filteredRfqs.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: "13px" }}>
                Không có dữ liệu đơn khảo sát giá hợp lệ trên phân hệ đối soát.
              </div>
            ) : (
              <>
                <div className="mobile-cards-view">
                  {filteredRfqs.map((rfq) => (
                    <div 
                      key={rfq.id} 
                      className={`rfq-card ${selectedRfq?.id === rfq.id ? 'active-card' : ''}`}
                      onClick={() => handleViewDetail(rfq)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <span style={{ fontWeight: "700", color: "#fff", fontSize: "14px", wordBreak: "break-all" }}>{rfq.rfq_id}</span>
                        {renderStatusBadge(rfq.status)}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "#cbd5e1" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#94a3b8" }}>Khởi tạo:</span>
                          <span>{rfq.created_at}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "#94a3b8" }}>Giá gốc:</span>
                          <span style={{ textDecoration: rfq.discount_status === "Đã chiết khấu" ? "line-through" : "none", color: "#94a3b8" }}>
                            {rfq.pre_discount > 0 ? `${rfq.pre_discount.toLocaleString("vi-VN")}đ` : "---"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#94a3b8" }}>Giá chốt sỉ:</span>
                          <span style={{ color: "var(--theme-color)", fontWeight: "900" }}>
                            {rfq.final_price > 0 ? `${rfq.final_price.toLocaleString("vi-VN")}đ` : "Chờ tính sỉ"}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {renderDiscountBadge(rfq.discount_status)}
                        <span style={{ color: "var(--theme-color)", fontSize: "12px", fontWeight: "700" }}>Xem chi tiết →</span>
                      </div>
                    </div>
                  ))}
                </div>

                <table className="desktop-table-view" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", color: "var(--theme-color)", fontSize: "11px", textTransform: "uppercase" }}>
                      <th style={{ padding: "12px 16px", fontWeight: "900" }}>Mã phiếu dự toán</th>
                      <th style={{ padding: "12px 16px", fontWeight: "900" }}>Ngày tạo & Hiệu lực</th>
                      <th style={{ padding: "12px 16px", fontWeight: "900", textAlign: "right" }}>Giá trị gốc</th>
                      <th style={{ padding: "12px 16px", fontWeight: "900", textAlign: "right" }}>Giá trị chốt</th>
                      <th style={{ padding: "12px 16px", fontWeight: "900", textAlign: "center" }}>Trạng thái</th>
                      <th style={{ padding: "12px 16px", fontWeight: "900", textAlign: "center" }}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: "13px", color: "#cbd5e1" }}>
                    {filteredRfqs.map((rfq) => (
                      <tr 
                        key={rfq.id} 
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background-color 0.2s", backgroundColor: selectedRfq?.id === rfq.id ? "var(--theme-color-15)" : "transparent" }}
                      >
                        <td style={{ padding: "16px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>{rfq.rfq_id}</td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <span>Tạo: {rfq.created_at}</span>
                            <span style={{ color: "#94a3b8", fontSize: "11px" }}>Hạn: <span style={{ color: "#ef4444", fontWeight: "600" }}>{rfq.valid_until}</span></span>
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right", fontFamily: "monospace", color: "#94a3b8", textDecoration: rfq.discount_status === "Đã chiết khấu" ? "line-through" : "none" }}>
                          {rfq.pre_discount > 0 ? `${rfq.pre_discount.toLocaleString("vi-VN")}đ` : "---"}
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <span style={{ color: "var(--theme-color)", fontWeight: "900", fontSize: "14px", fontFamily: "monospace" }}>
                              {rfq.final_price > 0 ? `${rfq.final_price.toLocaleString("vi-VN")}đ` : "Chờ tính sỉ"}
                            </span>
                            {renderDiscountBadge(rfq.discount_status)}
                          </div>
                        </td>
                        <td style={{ padding: "16px", textAlign: "center" }}>{renderStatusBadge(rfq.status)}</td>
                        <td style={{ padding: "16px", textAlign: "center" }}>
                          <button 
                            type="button"
                            onClick={() => handleViewDetail(rfq)}
                            style={{ backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "6px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s", outline: "none" }}
                            onMouseOver={(e) => { e.currentTarget.style.border = "1px solid var(--theme-color)"; e.currentTarget.style.color = "var(--theme-color)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#fff"; }}
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>

          {selectedRfq && (
            <div className="rfq-side-panel" style={{ 
              backgroundColor: "rgba(20, 21, 52, 0.95)", 
              border: "1px solid var(--theme-color)", 
              borderRadius: "16px", 
              padding: "24px", 
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "900", color: "var(--theme-color)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  BỐ CỤC ĐỐI SOÁT CHI TIẾT
                </h3>
                <button 
                  type="button"
                  onClick={() => setSelectedRfq(null)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", cursor: "pointer", outline: "none" }}
                >
                  
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <span style={{ color: "#94a3b8", flexShrink: 0 }}>Mã định danh thầu:</span>
                  <strong style={{ color: "#fff", fontFamily: "monospace", wordBreak: "break-all", textAlign: "right" }}>{selectedRfq.rfq_id}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Ngày khởi tạo dữ liệu:</span>
                  <span style={{ color: "#fff" }}>{selectedRfq.created_at}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Thời hạn hiệu lực giá:</span>
                  <span style={{ color: "#ef4444", fontWeight: "700" }}>{selectedRfq.valid_until}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Giá trị dự toán gốc:</span>
                  <span style={{ color: "#fff", fontFamily: "monospace" }}>{selectedRfq.pre_discount.toLocaleString("vi-VN")}đ</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#94a3b8" }}>Giá trị chốt thầu:</span>
                  <strong style={{ color: "var(--theme-color)", fontFamily: "monospace", fontSize: "15px" }}>
                    {selectedRfq.final_price > 0 ? `${selectedRfq.final_price.toLocaleString("vi-VN")}đ` : "Sales chưa duyệt định mức"}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8" }}>Phân cấp chiết khấu:</span>
                  {renderDiscountBadge(selectedRfq.discount_status)}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#94a3b8" }}>Trạng thái Workflow:</span>
                  {renderStatusBadge(selectedRfq.status)}
                </div>
              </div>

              {selectedRfq.status === "admin Confirmed" && (
                <button 
                  type="button"
                  onClick={() => handleAcceptRfqPrice(selectedRfq)}
                  style={{ width: "100%", height: "42px", backgroundColor: "var(--theme-color)", border: "none", color: "#060713", borderRadius: "6px", fontSize: "12px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "10px" }}
                >
                  XÁC NHẬN ĐỒNG Ý GIÁ SỈ
                </button>
              )}
            </div>
          )}

        </div>
      </main>

      <style jsx global>{`
        .rfq-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        .desktop-table-view {
          display: none;
        }
        .mobile-cards-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .rfq-card {
          background-color: rgba(6, 7, 19, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .rfq-card:hover, .active-card {
          border-color: var(--theme-color);
          background-color: var(--theme-color-15);
        }
        .rfq-side-panel {
          animation: slideInVertical 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes slideInVertical {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (min-width: 992px) {
          .rfq-workspace {
            grid-template-columns: ${selectedRfq ? "1.4fr 1fr" : "1fr"};
          }
          .desktop-table-view {
            display: table;
          }
          .mobile-cards-view {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}