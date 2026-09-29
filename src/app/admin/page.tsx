'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredOrders, getStoredProducts, getStoredDrivers, VlxdOrder, VlxdProduct, VlxdDriver } from '@/lib/vlxdStorage';

// ─── Mini Chart Components (no external library) ───────────────────────────

function DonutChart({
  segments,
  size = 120,
  strokeWidth = 22,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#e2e8f0' }} />;

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - strokeWidth / 2} fill="#ffffff" />
    </svg>
  );
}

function BarChart({
  data,
  themeColor,
  height = 100,
}: {
  data: { label: string; value: number }[];
  themeColor: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: height + 20, paddingBottom: '20px', position: 'relative' }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * height;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div
              title={`${d.label}: ${d.value.toLocaleString('vi-VN')}`}
              style={{
                width: '100%',
                height: `${barH}px`,
                backgroundColor: i === data.length - 1 ? themeColor : '#e2e8f0',
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                cursor: 'default',
              }}
            />
            <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', whiteSpace: 'nowrap' }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal Tạo Đơn Nhanh ────────────────────────────────────────────────────
function CreateOrderModal({
  onClose,
  products,
  themeColor,
}: {
  onClose: () => void;
  products: VlxdProduct[];
  themeColor: string;
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [district, setDistrict] = useState('Ninh Kiều');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; name: string; price: number; quantity: number; uom: string }[]>([]);

  const isPhoneValid = customerPhone === '' || /^(0[3|5|7|8|9])+([0-9]{8})$/.test(customerPhone.trim());

  const addProduct = (p: VlxdProduct) => {
    if (selectedItems.find((i) => i.product_id === p.id)) return;
    setSelectedItems((prev) => [...prev, { product_id: p.id, name: p.name, price: p.price, quantity: 1, uom: p.uom }]);
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setSelectedItems((prev) => prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i));
  };

  const total = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || selectedItems.length === 0) {
      alert('Vui lòng nhập tên khách, SĐT và chọn ít nhất 1 vật tư!');
      return;
    }
    if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(customerPhone.trim())) {
      alert('Số điện thoại không hợp lệ! Vui lòng nhập chuẩn 10 số.');
      return;
    }

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newOrder = {
      id: orderId,
      created_at: now,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      address: address.trim() || district,
      district,
      items: selectedItems.map((i) => ({ ...i, total: i.price * i.quantity })),
      products_total: total,
      shipping_fee: 0,
      total_amount: total,
      payment_method: 'cod' as const,
      payment_status: 'unpaid' as const,
      status: 'pending' as const,
      note: note.trim(),
      timeline: [{ status: 'pending' as const, time: now, title: 'Đơn mới tạo từ Admin', description: `Tạo bởi quản trị viên bến bãi` }],
    };

    // Lưu vào localStorage
    const existing = JSON.parse(localStorage.getItem('vlxd_orders') || '[]');
    localStorage.setItem('vlxd_orders', JSON.stringify([newOrder, ...existing]));
    window.dispatchEvent(new Event('vlxd-orders-updated'));
    alert(`Đã tạo đơn ${orderId} thành công! Tổng tiền: ${total.toLocaleString('vi-VN')}đ`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '680px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', zIndex: 10, display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ background: '#0F172A', color: '#ffffff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--theme-color)', letterSpacing: '0.4px' }}>Tạo Đơn Hàng Mới</h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#FEF08A' }}>Đặt hàng trực tiếp từ bảng điều hành bến bãi</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}></button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Thông tin khách */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Thông Tin Khách Hàng</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên Khách / Công Trình *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nguyễn Văn A / CTy XD Nam..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Số Điện Thoại *</label>
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="09xx..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: isPhoneValid ? '1px solid #cbd5e1' : '1px solid #ef4444', fontSize: '13px', boxSizing: 'border-box' }} required />
                {!isPhoneValid && <div style={{ color: '#ef4444', fontSize: '10.5px', marginTop: '4px', opacity: 0.8 }}>Vui lòng nhập chuẩn 10 chữ số</div>}
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Quận / Huyện</label>
                <select value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}>
                  {['Ninh Kiều', 'Cái Răng', 'Bình Thủy', 'Ô Môn', 'Phong Điền', 'Thốt Nốt', 'Khác'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Địa chỉ giao hàng</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, phường..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          {/* Chọn vật tư */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', marginBottom: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>Chọn Vật Tư ({selectedItems.length} mặt hàng)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {products.map((p) => {
                const selected = selectedItems.find((i) => i.product_id === p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => !selected && addProduct(p)}
                    style={{ padding: '10px 12px', borderRadius: '8px', border: selected ? `2px solid ${themeColor}` : '1px solid #e2e8f0', backgroundColor: selected ? 'var(--theme-color-15)' : '#f8fafc', cursor: selected ? 'default' : 'pointer', fontSize: '12px', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{p.name}</div>
                    <div style={{ color: '#64748b' }}>{p.price.toLocaleString('vi-VN')}đ/{p.uom}</div>
                    {selected && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <button type="button" onClick={() => updateQty(p.id, selected.quantity - 1)} style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>−</button>
                        <span style={{ fontWeight: '800', fontFamily: 'monospace', minWidth: '20px', textAlign: 'center' }}>{selected.quantity}</span>
                        <button type="button" onClick={() => updateQty(p.id, selected.quantity + 1)} style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>+</button>
                        <span style={{ color: '#475569' }}>{p.uom}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '4px' }}>Ghi chú đơn hàng</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Yêu cầu đặc biệt về giao hàng, vật tư..." rows={2} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* Tổng tiền & Submit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>TỔNG GIÁ TRỊ ĐƠN</div>
              <div style={{ fontSize: '22px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>{total.toLocaleString('vi-VN')}đ</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} style={{ padding: '11px 20px', borderRadius: '8px', border: '1.5px solid var(--theme-color)', background: 'transparent', color: 'var(--theme-color-dark, #b45309)', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>Hủy</button>
              <button type="submit" disabled={selectedItems.length === 0} style={{ padding: '11px 24px', borderRadius: '8px', background: selectedItems.length > 0 ? 'var(--theme-color)' : '#e2e8f0', color: selectedItems.length > 0 ? '#111827' : '#94a3b8', border: 'none', fontSize: '13px', fontWeight: '900', cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed', textTransform: 'uppercase', boxShadow: selectedItems.length > 0 ? '0 4px 14px var(--theme-color-15)' : 'none' }}>
                Tạo Đơn Ngay
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [orders, setOrders] = useState<VlxdOrder[]>([]);
  const [products, setProducts] = useState<VlxdProduct[]>([]);
  const [drivers, setDrivers] = useState<VlxdDriver[]>([]);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  const loadData = () => {
    setOrders(getStoredOrders());
    setProducts(getStoredProducts());
    setDrivers(getStoredDrivers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('vlxd-orders-updated', loadData);
    window.addEventListener('vlxd-products-updated', loadData);
    window.addEventListener('vlxd-drivers-updated', loadData);
    return () => {
      window.removeEventListener('vlxd-orders-updated', loadData);
      window.removeEventListener('vlxd-products-updated', loadData);
      window.removeEventListener('vlxd-drivers-updated', loadData);
    };
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const deliveringOrders = orders.filter((o) => o.status === 'delivering');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock);
  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0);
  const completedRevenue = completedOrders.reduce((s, o) => s + o.total_amount, 0);

  // ── Dữ liệu biểu đồ tròn: Trạng thái đơn hàng ─────────────────────────
  const orderStatusSegments = [
    { value: pendingOrders.length, color: '#f59e0b', label: 'Chờ duyệt' },
    { value: deliveringOrders.length, color: '#3b82f6', label: 'Đang giao' },
    { value: completedOrders.length, color: '#22c55e', label: 'Hoàn thành' },
    { value: orders.filter((o) => o.status === 'cancelled').length, color: '#ef4444', label: 'Đã hủy' },
  ];

  // ── Biểu đồ doanh thu theo trạng thái ─────────────────────────────────
  const revenueSegments = [
    { value: completedRevenue, color: '#22c55e', label: 'Đã thu' },
    { value: totalRevenue - completedRevenue, color: '#93c5fd', label: 'Chưa thu' },
  ];

  // ── Bar chart: doanh thu 6 đơn gần nhất ──────────────────────────────
  const recentBarData = orders.slice(0, 6).reverse().map((o, i) => ({
    label: `Đ${i + 1}`,
    value: o.total_amount,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── TIÊU ĐỀ & ACTIONS ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
            Bảng Điều Hành Trung Tâm Bến Bãi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Theo dõi thời gian thực luồng đơn hàng, tồn kho và doanh thu
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setCreateOrderOpen(true)}
            style={{ padding: '10px 18px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px var(--theme-color-15)' }}
          >
            + Tạo Đơn Mới
          </button>
          <a
            href="/admin/products"
            style={{ padding: '10px 16px', backgroundColor: 'transparent', color: 'var(--theme-color-dark, #b45309)', border: '1.5px solid var(--theme-color)', borderRadius: '8px', fontWeight: '800', fontSize: '13px', textDecoration: 'none' }}
          >
            Thêm Vật Tư
          </a>
          <a
            href="/admin/orders"
            style={{ padding: '10px 16px', backgroundColor: '#0F172A', color: 'var(--theme-color)', border: '1px solid #1e293b', borderRadius: '8px', fontWeight: '800', fontSize: '13px', textDecoration: 'none' }}
          >
            Duyệt Đơn ({pendingOrders.length})
          </a>
        </div>
      </div>

      {/* ── 4 KPI CARDS (không có icon) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'DOANH THU ĐƠN HÀNG', value: totalRevenue.toLocaleString('vi-VN') + 'đ', sub: `Từ ${orders.length} đơn bến bãi`, subColor: '#16a34a', border: '#e2e8f0' },
          { label: 'ĐƠN CẦN DUYỆT & GÁN XE', value: `${pendingOrders.length} Đơn`, sub: pendingOrders.length > 0 ? '● Cần xử lý kẹp chì xuất bãi' : 'Không có đơn chờ', subColor: pendingOrders.length > 0 ? '#d97706' : '#64748b', border: '#e2e8f0' },
          { label: 'XE ĐANG CHỞ VẬT TƯ', value: `${deliveringOrders.length} Chuyến`, sub: `Đội xe sẵn sàng: ${drivers.length} xe`, subColor: '#2563eb', border: '#e2e8f0' },
          { label: 'VẬT TƯ CẢNH BÁO TỒN', value: `${lowStockProducts.length} Mặt hàng`, sub: lowStockProducts.length > 0 ? '● Cần nhập thêm gấp' : 'Tồn kho mức an toàn', subColor: lowStockProducts.length > 0 ? '#dc2626' : '#16a34a', border: '#e2e8f0' },
        ].map((card) => (
          <div key={card.label} style={{ backgroundColor: '#ffffff', padding: '18px 20px', borderRadius: '12px', border: `1px solid ${card.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
              {card.label}
            </div>
            <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace', marginBottom: '4px' }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11.5px', color: card.subColor, fontWeight: '700' }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── BIỂU ĐỒ ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* Biểu đồ tròn: Trạng thái đơn hàng */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>
            Phân Bổ Trạng Thái Đơn Hàng
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flexShrink: 0 }}>
              <DonutChart segments={orderStatusSegments} size={110} strokeWidth={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', flex: 1 }}>
              {orderStatusSegments.map((seg) => (
                <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: seg.color, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: '12px', color: '#475569' }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>{seg.value}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '2px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Tổng: <strong style={{ color: '#0f172a' }}>{orders.length} đơn</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Biểu đồ tròn: Doanh thu */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>
            Doanh Thu & Thu Hồi Công Nợ
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flexShrink: 0 }}>
              <DonutChart segments={revenueSegments} size={110} strokeWidth={20} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Đã thu (Hoàn thành)</div>
                <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'monospace', color: '#16a34a' }}>{completedRevenue.toLocaleString('vi-VN')}đ</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Chưa thu (Đang giao)</div>
                <div style={{ fontSize: '16px', fontWeight: '900', fontFamily: 'monospace', color: '#3b82f6' }}>{(totalRevenue - completedRevenue).toLocaleString('vi-VN')}đ</div>
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tỷ lệ hoàn thành</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: themeColor }}>
                  {totalRevenue > 0 ? Math.round((completedRevenue / totalRevenue) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bar chart: doanh thu gần nhất */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>
            Giá Trị 6 Đơn Hàng Gần Nhất
          </h3>
          {recentBarData.length > 0 ? (
            <BarChart data={recentBarData} themeColor={themeColor} height={90} />
          ) : (
            <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Chưa có đơn hàng nào
            </div>
          )}
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>
            Cột sáng = đơn mới nhất
          </div>
        </div>

      </div>

      {/* ── BẢNG ĐƠN HÀNG MỚI ── */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#0f172a', textTransform: 'uppercase' }}>
            Đơn Hàng Mới Nhận Từ Khách Hàng
          </h3>
          <a href="/admin/orders" style={{ fontSize: '12px', color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
            Xem toàn bộ đơn →
          </a>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
            Chưa có đơn hàng. Hãy thử <button onClick={() => setCreateOrderOpen(true)} style={{ background: 'none', border: 'none', color: themeColor, fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>tạo đơn mới</button> hoặc nhận đơn từ Web Khách!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Mã Đơn</th>
                  <th style={{ padding: '10px 14px' }}>Khách Hàng / Công Trình</th>
                  <th style={{ padding: '10px 14px' }}>Khu Vực</th>
                  <th style={{ padding: '10px 14px' }}>Tổng Tiền</th>
                  <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a' }}>{o.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{o.customer_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{o.items.length} mặt hàng</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '700', color: o.district === 'Ninh Kiều' ? '#16a34a' : '#0284c7' }}>{o.district}</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: '800', fontFamily: 'monospace' }}>{o.total_amount.toLocaleString('vi-VN')}đ</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', backgroundColor: o.status === 'delivering' ? '#ffedd5' : o.status === 'pending' ? 'var(--theme-color-15)' : '#dcfce7', color: o.status === 'delivering' ? '#c2410c' : o.status === 'pending' ? '#92400e' : '#166534' }}>
                        {o.status === 'delivering' ? 'Đang giao' : o.status === 'pending' ? 'Chờ duyệt' : o.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <a href="/admin/orders" style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', color: '#0f172a', textDecoration: 'none' }}>
                        Xử lý →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal tạo đơn */}
      {createOrderOpen && (
        <CreateOrderModal onClose={() => setCreateOrderOpen(false)} products={products} themeColor={themeColor} />
      )}
    </div>
  );
}
