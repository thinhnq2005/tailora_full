"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { useTenant } from "@/app/context/TenantContext";
import { useB2bDebt } from "@/hooks/useB2bDebt";
import { B2bCustomer, B2bVoucher, DebtStatus } from "@/types/debt.types";
import { getStoredProducts, VlxdProduct } from "@/lib/vlxdStorage";
import { Search, Building2, AlertTriangle, CheckCircle, CreditCard, FileText, Package } from "lucide-react";

// ─── B2B Wholesale + Quote types ────────────────────────────────────────────
interface B2bQuoteLine { product_id: string; name: string; price: number; quantity: number; uom: string; }
interface B2bDealPhase { label: string; quantity: number; deliveryDate: string; }
interface B2bDeal {
  id: string;
  type: 'wholesale' | 'quote';
  createdAt: string;
  customerName: string;
  customerPhone: string;
  companyName: string;
  note: string;
  lines: B2bQuoteLine[];
  totalAmount: number;
  phases: B2bDealPhase[];
  status: 'pending' | 'negotiating' | 'confirmed' | 'cancelled';
}

const B2B_DEALS_KEY = 'vlxd_b2b_deals';
function getStoredDeals(): B2bDeal[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(B2B_DEALS_KEY) || '[]'); } catch { return []; }
}
function saveDeal(deal: B2bDeal) {
  const all = getStoredDeals();
  const idx = all.findIndex((d) => d.id === deal.id);
  if (idx >= 0) all[idx] = deal; else all.unshift(deal);
  localStorage.setItem(B2B_DEALS_KEY, JSON.stringify(all));
  window.dispatchEvent(new Event('vlxd-b2b-deals-updated'));
}

// ─── Modal Đặt Hàng / Báo Giá B2B ──────────────────────────────────────────
function B2bDealModal({
  type, products, onClose, themeColor,
}: {
  type: 'wholesale' | 'quote';
  products: VlxdProduct[];
  onClose: () => void;
  themeColor: string;
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<B2bQuoteLine[]>([]);
  const [phases, setPhases] = useState<B2bDealPhase[]>([{ label: 'Đợt 1', quantity: 0, deliveryDate: '' }]);

  const addProduct = (p: VlxdProduct) => {
    if (lines.find((l) => l.product_id === p.id)) return;
    setLines((prev) => [...prev, { product_id: p.id, name: p.name, price: p.price, quantity: 1, uom: p.uom }]);
  };
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setLines((prev) => prev.filter((l) => l.product_id !== id)); return; }
    setLines((prev) => prev.map((l) => l.product_id === id ? { ...l, quantity: qty } : l));
  };
  const updatePrice = (id: string, price: number) => {
    setLines((prev) => prev.map((l) => l.product_id === id ? { ...l, price } : l));
  };
  const addPhase = () => setPhases((prev) => [...prev, { label: `Đợt ${prev.length + 1}`, quantity: 0, deliveryDate: '' }]);
  const removePhase = (i: number) => setPhases((prev) => prev.filter((_, idx) => idx !== i));
  const updatePhase = (i: number, field: keyof B2bDealPhase, val: string | number) =>
    setPhases((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

  const total = lines.reduce((s, l) => s + l.price * l.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || lines.length === 0) { alert('Vui lòng nhập tên và chọn ít nhất 1 vật tư!'); return; }
    const deal: B2bDeal = {
      id: `B2B-${type === 'wholesale' ? 'WS' : 'QT'}-${Date.now()}`,
      type, createdAt: new Date().toISOString(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      companyName: companyName.trim(),
      note: note.trim(), lines, totalAmount: total, phases,
      status: 'pending',
    };
    saveDeal(deal);
    alert(`Đã gửi ${type === 'wholesale' ? 'đơn đặt hàng sỉ' : 'báo giá'} thành công!\nMã: ${deal.id}\nTổng: ${total.toLocaleString('vi-VN')}đ\nGiao ${phases.length} đợt.\nNhân viên kinh doanh sẽ liên hệ để kì kèo và chốt giá.`);
    onClose();
  };

  const isWholesale = type === 'wholesale';
  const title = isWholesale ? 'Đặt Hàng Sỉ — Gửi Vào B2B Công Nợ' : 'Gửi Báo Giá — Yêu Cầu Kì Kèo Giá';

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '700px', backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ background: '#0F172A', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: 'var(--theme-color)', textTransform: 'uppercase' }}>{title}</h3>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#FEF08A' }}>Hỗ trợ giao nhiều đợt — phù hợp công trình lớn</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}></button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Thông tin công ty */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Thông Tin Doanh Nghiệp</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Người liên hệ *</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required /></div>
              <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Số điện thoại</label><input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09xx..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} /></div>
              <div><label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên công ty / nhà thầu</label><input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="CTy TNHH XD..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} /></div>
            </div>
          </div>

          {/* Chọn vật tư */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>Danh Sách Vật Tư {isWholesale ? '(Mua Sỉ)' : '(Yêu Cầu Báo Giá)'} — {lines.length} mặt hàng</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              {products.map((p) => {
                const line = lines.find((l) => l.product_id === p.id);
                return (
                  <div key={p.id} onClick={() => !line && addProduct(p)} style={{ padding: '9px 12px', borderRadius: '8px', border: line ? `2px solid ${themeColor}` : '1px solid #e2e8f0', backgroundColor: line ? 'var(--theme-color-15)' : '#f8fafc', cursor: line ? 'default' : 'pointer', fontSize: '12px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ color: '#64748b' }}>{p.price.toLocaleString('vi-VN')}đ/{p.uom}</div>
                    {line && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                          <button type="button" onClick={() => updateQty(p.id, line.quantity - 1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>−</button>
                          <span style={{ fontWeight: '800', fontFamily: 'monospace', minWidth: '22px', textAlign: 'center', fontSize: '13px' }}>{line.quantity}</span>
                          <button type="button" onClick={() => updateQty(p.id, line.quantity + 1)} style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>+</button>
                          <span style={{ color: '#64748b' }}>{p.uom}</span>
                        </div>
                        {!isWholesale && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>Giá đề xuất:</span>
                            <input type="number" value={line.price} onChange={(e) => updatePrice(p.id, Number(e.target.value))} onClick={(e) => e.stopPropagation()} style={{ width: '90px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Giao theo đợt */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Kế Hoạch Giao Hàng Theo Đợt ({phases.length} đợt)</div>
              <button type="button" onClick={addPhase} style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${themeColor}`, backgroundColor: '#fff', color: '#0f172a', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>+ Thêm đợt</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {phases.map((ph, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', minWidth: '50px' }}>{ph.label}</span>
                  <input type="number" placeholder="Số lượng" value={ph.quantity || ''} onChange={(e) => updatePhase(i, 'quantity', Number(e.target.value))} style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '90px' }} />
                  <input type="date" value={ph.deliveryDate} onChange={(e) => updatePhase(i, 'deliveryDate', e.target.value)} style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', flex: 1, minWidth: '140px' }} />
                  {phases.length > 1 && (
                    <button type="button" onClick={() => removePhase(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}></button>
                  )}
                </div>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
               Hỗ trợ chia đợt giao hàng cho công trình lớn — mỗi đợt xuất 1 lượng nhỏ và nhận tiền theo đợt.
            </p>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Yêu cầu / Ghi chú kì kèo giá</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={isWholesale ? 'Yêu cầu giá sỉ, số lượng lớn, điều kiện thanh toán...' : 'Mức giá kỳ vọng, điều kiện để chốt đơn...'} rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* Total & Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TỔNG GIÁ TRỊ ĐỀ XUẤT</div>
              <div style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>{total.toLocaleString('vi-VN')}đ</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Giao {phases.length} đợt • Chờ xác nhận & kì kèo</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} style={{ padding: '11px 20px', borderRadius: '8px', border: '1.5px solid var(--theme-color)', background: 'transparent', color: 'var(--theme-color-dark, #b45309)', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" disabled={lines.length === 0} style={{ padding: '11px 22px', borderRadius: '8px', background: lines.length > 0 ? 'var(--theme-color)' : '#e2e8f0', color: lines.length > 0 ? '#111827' : '#94a3b8', border: 'none', fontSize: '13px', fontWeight: '900', cursor: lines.length > 0 ? 'pointer' : 'not-allowed', textTransform: 'uppercase', boxShadow: lines.length > 0 ? '0 4px 12px var(--theme-color-15)' : 'none' }}>
                {isWholesale ? 'Gửi Đơn Sỉ Vào B2B' : 'Gửi Yêu Cầu Báo Giá'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function B2bDebtLedgerPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || "var(--theme-color)";

  const {
    customers,
    vouchers,
    metrics,
    customerSearch,
    setCustomerSearch,
    customerStatus,
    setCustomerStatus,
    voucherSearch,
    setVoucherSearch,
    voucherStatus,
    setVoucherStatus,
    voucherCustomerFilter,
    setVoucherCustomerFilter,
    payVoucher
  } = useB2bDebt();

  const [activeTab, setActiveTab] = useState<'customers' | 'vouchers' | 'deals'>('customers');
  const [products, setProducts] = useState<VlxdProduct[]>([]);
  const [deals, setDeals] = useState<B2bDeal[]>([]);
  const [dealModalType, setDealModalType] = useState<'wholesale' | 'quote' | null>(null);

  useEffect(() => {
    const loadProducts = () => setProducts(getStoredProducts());
    const loadDeals = () => setDeals(getStoredDeals());
    loadProducts();
    loadDeals();
    window.addEventListener('vlxd-products-updated', loadProducts);
    window.addEventListener('vlxd-b2b-deals-updated', loadDeals);
    return () => {
      window.removeEventListener('vlxd-products-updated', loadProducts);
      window.removeEventListener('vlxd-b2b-deals-updated', loadDeals);
    };
  }, []);

  // Modal Thu Nợ Đối Soát
  const [payModalVoucher, setPayModalVoucher] = useState<B2bVoucher | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);

  const openPayModal = (v: B2bVoucher) => {
    setPayModalVoucher(v);
    setPayAmount(v.conNo);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalVoucher || payAmount <= 0) return;
    payVoucher(payModalVoucher.id, payAmount);
    setPayModalVoucher(null);
  };

  const getStatusBadge = (st: DebtStatus) => {
    switch (st) {
      case 'Trong hạn':
        return <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Trong hạn</span>;
      case 'Cảnh báo':
        return <span style={{ backgroundColor: '#fffbeb', color: 'var(--theme-color-dark, #b45309)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Cảnh báo</span>;
      case 'Quá hạn':
        return <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Quá hạn</span>;
      case 'Đã thanh toán':
        return <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Tất toán</span>;
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", color: "#0f172a", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: "1280px", margin: "0 auto", padding: "100px 16px 60px 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* HEADER B2B */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "0.3px" }}>
              B2B - Quản Lý Công Nợ Khách Hàng Doanh Nghiệp
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Hệ thống theo dõi hạn mức tín dụng, hóa đơn lũy kế và lịch sử đối soát số liệu bến bãi
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {/* Tabs trái */}
            <div style={{ display: "flex", backgroundColor: "#e2e8f0", padding: "3px", borderRadius: "8px" }}>
              {(['customers', 'vouchers', 'deals'] as const).map((tab) => {
                const labels: Record<string, string> = {
                  customers: `Khách B2B (${customers.length})`,
                  vouchers: `Chứng từ (${vouchers.length})`,
                  deals: `Đơn Sỉ & Báo Giá (${deals.length})`,
                };
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: activeTab === tab ? "700" : "500", border: "none", backgroundColor: activeTab === tab ? "#ffffff" : "transparent", color: activeTab === tab ? "#0f172a" : "#64748b", cursor: "pointer", boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none", whiteSpace: "nowrap" }}>
                    {labels[tab]}
                  </button>
                );
              })}
            </div>
            {/* Nút tạo nhanh */}
            <button onClick={() => setDealModalType('wholesale')} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "var(--theme-color)", color: "#111827", fontSize: "13px", fontWeight: "900", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 2px 8px var(--theme-color-15)" }}>Đặt Sỉ B2B</button>
            <button onClick={() => setDealModalType('quote')} style={{ padding: "8px 16px", borderRadius: "8px", border: "1.5px solid var(--theme-color)", backgroundColor: "transparent", color: "var(--theme-color-dark, #b45309)", fontSize: "13px", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" }}>Yêu Cầu Báo Giá</button>
          </div>
        </div>

        {/* =========================================================================
            DASHBOARD: 4 CHỈ SỐ CÔNG NỢ TỔNG HỢP
           ========================================================================= */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          
          {/* 1. TỔNG CÔNG NỢ */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Tổng công nợ hiện tại
              </span>
              <Building2 size={16} color="#64748b" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", fontFamily: "monospace", color: "#0f172a" }}>
              {metrics.tongCongNo.toLocaleString("vi-VN")}đ
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Toàn bộ {metrics.tongKhachHang} đối tác B2B bến bãi
            </span>
          </div>

          {/* 2. CÔNG NỢ QUÁ HẠN */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #fecaca", padding: "18px", boxShadow: "0 2px 6px rgba(220,38,38,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>
                Công nợ quá hạn
              </span>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", fontFamily: "monospace", color: "#dc2626" }}>
              {metrics.congNoQuaHan.toLocaleString("vi-VN")}đ
            </div>
            <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "600", marginTop: "4px", display: "block" }}>
              Cần đốc thúc {metrics.khachHangQuaHan} khách hàng quá hạn
            </span>
          </div>

          {/* 3. ĐÃ THANH TOÁN */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #bbf7d0", padding: "18px", boxShadow: "0 2px 6px rgba(22,163,74,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>
                Đã thanh toán (Thu lũy kế)
              </span>
              <CheckCircle size={16} color="#16a34a" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", fontFamily: "monospace", color: "#16a34a" }}>
              {metrics.daThanhToan.toLocaleString("vi-VN")}đ
            </div>
            <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600", marginTop: "4px", display: "block" }}>
              Tiền mặt & VietQR bến bãi
            </span>
          </div>

          {/* 4. CHƯA THANH TOÁN */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #bfdbfe", padding: "18px", boxShadow: "0 2px 6px rgba(37,99,235,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>
                Chưa thanh toán (Trong hạn)
              </span>
              <CreditCard size={16} color="#2563eb" />
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", fontFamily: "monospace", color: "#2563eb" }}>
              {metrics.chuaThanhToan.toLocaleString("vi-VN")}đ
            </div>
            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Dư nợ trong hạn mức tín dụng
            </span>
          </div>

        </div>

        {/* =========================================================================
            TAB 1: DANH SÁCH KHÁCH HÀNG DOANH NGHIỆP
           ========================================================================= */}
        {activeTab === 'customers' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* THANH BỘ LỌC KHÁCH HÀNG */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px" }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Tìm theo mã KH (KH001...), tên công ty, người liên hệ, SĐT..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 0", border: "none", background: "transparent", fontSize: "13px", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px" }}>
                {['all', 'Trong hạn', 'Cảnh báo', 'Quá hạn', 'Đã thanh toán'].map(st => (
                  <button
                    key={st}
                    onClick={() => setCustomerStatus(st)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: customerStatus === st ? "700" : "500",
                      border: customerStatus === st ? "1px solid #0f172a" : "1px solid #e2e8f0",
                      backgroundColor: customerStatus === st ? "#0f172a" : "#ffffff",
                      color: customerStatus === st ? "#ffffff" : "#475569",
                      cursor: "pointer"
                    }}
                  >
                    {st === 'all' ? 'Tất cả trạng thái' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* BẢNG KHÁCH HÀNG 8 CỘT CHUẨN */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11.5px", fontWeight: "700", textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 14px" }}>Mã KH</th>
                      <th style={{ padding: "10px 14px" }}>Tên công ty</th>
                      <th style={{ padding: "10px 14px" }}>Người liên hệ</th>
                      <th style={{ padding: "10px 14px" }}>Số điện thoại</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Hạn mức tín dụng</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Dư nợ hiện tại</th>
                      <th style={{ padding: "10px 14px" }}>Ngày đến hạn</th>
                      <th style={{ padding: "10px 14px" }}>Trạng thái</th>
                      <th style={{ padding: "10px 14px", textAlign: "center" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
                          Không tìm thấy khách hàng nào trong bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 14px", fontWeight: "700", fontFamily: "monospace", color: "#0f172a" }}>
                            {c.maKhachHang}
                          </td>
                          <td style={{ padding: "10px 14px", fontWeight: "600", color: "#1e293b", maxWidth: "240px" }}>
                            <div>{c.tenCongTy}</div>
                            {c.diaChiCongTrinh && (
                              <div style={{ fontSize: "11px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.diaChiCongTrinh}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "10px 14px", color: "#334155" }}>
                            {c.nguoiLienHe}
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475569" }}>
                            {c.soDienThoai}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", color: "#475569" }}>
                            {c.hanMucTinDung.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: c.duNoHienTai > 0 ? (c.trangThai === 'Quá hạn' ? '#dc2626' : '#0f172a') : '#16a34a' }}>
                            {c.duNoHienTai.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475569" }}>
                            {c.ngayDenHan}
                          </td>
                          <td style={{ padding: "10px 14px" }}>
                            {getStatusBadge(c.trangThai)}
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "center" }}>
                            <button
                              onClick={() => {
                                setVoucherCustomerFilter(c.maKhachHang);
                                setActiveTab('vouchers');
                              }}
                              style={{ padding: "4px 8px", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                            >
                              Xem chứng từ
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: SỔ CHI TIẾT CHỨNG TỪ (HOÀN TOÀN KHÔNG CÓ CHỮ ODOO)
           ========================================================================= */}
        {activeTab === 'vouchers' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* THANH BỘ LỌC CHỨNG TỪ */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "240px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "0 10px" }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Tìm theo Mã chứng từ (HD2026...), Tên công ty..."
                  value={voucherSearch}
                  onChange={(e) => setVoucherSearch(e.target.value)}
                  style={{ width: "100%", padding: "8px 0", border: "none", background: "transparent", fontSize: "13px", outline: "none" }}
                />
              </div>

              {/* Lọc theo khách hàng cụ thể */}
              <select
                value={voucherCustomerFilter}
                onChange={(e) => setVoucherCustomerFilter(e.target.value)}
                style={{ padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff" }}
              >
                <option value="all">Tất cả khách hàng</option>
                {customers.map(c => (
                  <option key={c.maKhachHang} value={c.maKhachHang}>{c.maKhachHang} - {c.tenCongTy}</option>
                ))}
              </select>

              <div style={{ display: "flex", gap: "6px" }}>
                {['all', 'Trong hạn', 'Cảnh báo', 'Quá hạn', 'Đã thanh toán'].map(st => (
                  <button
                    key={st}
                    onClick={() => setVoucherStatus(st)}
                    style={{
                      padding: "7px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: voucherStatus === st ? "700" : "500",
                      border: voucherStatus === st ? "1px solid #0f172a" : "1px solid #e2e8f0",
                      backgroundColor: voucherStatus === st ? "#0f172a" : "#ffffff",
                      color: voucherStatus === st ? "#ffffff" : "#475569",
                      cursor: "pointer"
                    }}
                  >
                    {st === 'all' ? 'Tất cả' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* BẢNG CHỨNG TỪ (ĐỔI TÊN FIELD ODOO THÀNH "Mã chứng từ") */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569", fontSize: "11.5px", fontWeight: "700", textTransform: "uppercase" }}>
                      <th style={{ padding: "10px 12px", width: "45px", textAlign: "center" }}>STT</th>
                      <th style={{ padding: "10px 12px" }}>Mã chứng từ</th>
                      <th style={{ padding: "10px 12px" }}>Ngày hóa đơn</th>
                      <th style={{ padding: "10px 12px" }}>Khách hàng doanh nghiệp</th>
                      <th style={{ padding: "10px 12px" }}>Hạng mục vật tư</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Tổng tiền</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Đã thanh toán</th>
                      <th style={{ padding: "10px 12px", textAlign: "right" }}>Còn nợ</th>
                      <th style={{ padding: "10px 12px" }}>Hạn thanh toán</th>
                      <th style={{ padding: "10px 12px" }}>Trạng thái</th>
                      <th style={{ padding: "10px 12px", textAlign: "center" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ padding: "36px", textAlign: "center", color: "#94a3b8" }}>
                          Không có chứng từ nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((v, idx) => (
                        <tr key={v.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b" }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: "700", fontFamily: "monospace", color: "#0f172a" }}>
                            {v.maChungTu}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#475569" }}>
                            {v.ngayHoaDon}
                          </td>
                          <td style={{ padding: "10px 12px", fontWeight: "600", color: "#1e293b", maxWidth: "200px" }}>
                            <div>{v.tenCongTy}</div>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>{v.maKhachHang}</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#475569", fontSize: "11.5px", maxWidth: "220px" }}>
                            {v.hangMucVatTu || 'Vật tư cát đá xi măng sắt thép'}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: "600", color: "#0f172a" }}>
                            {v.tongTien.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", color: "#16a34a" }}>
                            {v.daThanhToan.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: "700", color: v.conNo > 0 ? (v.trangThai === 'Quá hạn' ? '#dc2626' : '#0f172a') : '#16a34a' }}>
                            {v.conNo.toLocaleString("vi-VN")}đ
                          </td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: "#475569" }}>
                            {v.hanThanhToan}
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            {getStatusBadge(v.trangThai)}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            {v.conNo > 0 ? (
                              <button
                                onClick={() => openPayModal(v)}
                                style={{ padding: "4px 8px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "4px", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                              >
                                Thu nợ
                              </button>
                            ) : (
                              <span style={{ color: "#16a34a", fontSize: "11px", fontWeight: "700" }}> Hoàn tất</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =======================================================================
            TAB 3: ĐƠN SỈ & BÁO GIÁ B2B
           ======================================================================= */}
        {activeTab === 'deals' && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Tất cả', filterType: null, count: deals.length },
                { label: 'ĐƠn Sỉ', filterType: 'wholesale', count: deals.filter((d) => d.type === 'wholesale').length },
                { label: 'Báo Giá', filterType: 'quote', count: deals.filter((d) => d.type === 'quote').length },
                { label: 'Chờ Xác Nhận', filterType: 'pending', count: deals.filter((d) => d.status === 'pending').length },
              ].map((item) => (
                <div key={item.label} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>{item.count}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {deals.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}></div>
                <div style={{ fontWeight: '700', marginBottom: '8px' }}>Chưa có đơn sỉ hay yêu cầu báo giá nào</div>
                <div style={{ fontSize: '12px' }}>Nhấn <strong>Đặt Sỉ B2B</strong> hoặc <strong>Yêu Cầu Báo Giá</strong> ở trên để bắt đầu</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {deals.map((deal) => (
                  <div key={deal.id} style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '14px', color: '#0f172a' }}>{deal.id}</span>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: deal.type === 'wholesale' ? 'var(--theme-color-15)' : '#eff6ff', color: deal.type === 'wholesale' ? '#92400e' : '#1d4ed8' }}>
                            {deal.type === 'wholesale' ? 'Đơn Sỉ' : 'Báo Giá'}
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: deal.status === 'confirmed' ? '#dcfce7' : deal.status === 'cancelled' ? '#fee2e2' : 'var(--theme-color-15)', color: deal.status === 'confirmed' ? '#166534' : deal.status === 'cancelled' ? '#dc2626' : '#92400e' }}>
                            {deal.status === 'pending' ? 'Chờ xác nhận' : deal.status === 'negotiating' ? 'Kì kèo giá' : deal.status === 'confirmed' ? 'Chốt đơn' : 'Đã hủy'}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginTop: '4px' }}>{deal.customerName} {deal.companyName ? `— ${deal.companyName}` : ''}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{deal.customerPhone} • {new Date(deal.createdAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>{deal.totalAmount.toLocaleString('vi-VN')}đ</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{deal.lines.length} vật tư • {deal.phases.length} đợt giao hàng</div>
                      </div>
                    </div>

                    {/* Dảnh sách vật tư */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {deal.lines.map((l) => (
                        <span key={l.product_id} style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600', color: '#334155' }}>
                          {l.name}: {l.quantity} {l.uom} × {l.price.toLocaleString('vi-VN')}đ
                        </span>
                      ))}
                    </div>

                    {/* Kế hoạch giao đợt */}
                    {deal.phases.length > 0 && (
                      <div style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Kế hoạch giao hàng</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {deal.phases.map((ph, idx) => (
                            <div key={idx} style={{ backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px' }}>
                              <strong>{ph.label}:</strong> {ph.quantity > 0 ? `${ph.quantity} đv` : '?'} {ph.deliveryDate ? `— ${ph.deliveryDate}` : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {deal.note && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}> {deal.note}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL THU NỢ ĐỐI SOÁT CHỨNG TỪ */}
        {payModalVoucher && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
            <div style={{ position: "fixed", inset: 0 }} onClick={() => setPayModalVoucher(null)} />
            <div style={{ position: "relative", width: "100%", maxWidth: "460px", backgroundColor: "#ffffff", borderRadius: "12px", overflow: "hidden", boxSizing: "border-box", zIndex: 10, boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
              
              <div style={{ background: "#0F172A", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "3px solid var(--theme-color)" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "900", color: "var(--theme-color)" }}>
                  Đối Soát Thu Nợ - Chứng Từ {payModalVoucher.maChungTu}
                </h3>
                <button onClick={() => setPayModalVoucher(null)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#ffffff", fontWeight: "bold" }}></button>
              </div>

              <div style={{ padding: "20px" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "12.5px", lineHeight: "1.6" }}>
                  <div>Khách hàng: <strong>{payModalVoucher.tenCongTy}</strong> ({payModalVoucher.maKhachHang})</div>
                  <div>Tổng giá trị chứng từ: <strong>{payModalVoucher.tongTien.toLocaleString("vi-VN")}đ</strong></div>
                  <div>Đã thanh toán: {payModalVoucher.daThanhToan.toLocaleString("vi-VN")}đ</div>
                  <div style={{ marginTop: "4px", color: "#dc2626", fontWeight: "700" }}>
                    Còn nợ cần thu: {payModalVoucher.conNo.toLocaleString("vi-VN")}đ
                  </div>
                </div>

                <form onSubmit={handleConfirmPayment} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>
                      Số tiền thanh toán đợt này (VNĐ) *
                    </label>
                    <input
                      type="number"
                      max={payModalVoucher.conNo}
                      min={1000}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1.5px solid var(--theme-color)", fontSize: "14px", fontFamily: "monospace", fontWeight: "700", boxSizing: "border-box" }}
                      required
                    />
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setPayModalVoucher(null)}
                      style={{ flex: 1, padding: "11px", backgroundColor: "transparent", border: "1.5px solid var(--theme-color)", color: "var(--theme-color-dark, #b45309)", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 2, padding: "11px", backgroundColor: "var(--theme-color)", color: "#111827", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", boxShadow: "0 4px 12px var(--theme-color-15)" }}
                    >
                      Xác nhận thu nợ
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* MODAL ĐẶT HÀNG SỈ / BÁO GIÁ B2B */}
        {dealModalType && (
          <B2bDealModal
            type={dealModalType}
            products={products}
            onClose={() => setDealModalType(null)}
            themeColor={themeColor}
          />
        )}

      </main>
    </div>
  );
}