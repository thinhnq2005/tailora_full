'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredOrders, VlxdOrder } from '@/lib/vlxdStorage';

export default function OrderTrackingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = String(params?.id || '');
  const { tenant } = useTenant();

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [order, setOrder] = useState<VlxdOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function loadOrder() {
      if (!orderId) return;
      const all = getStoredOrders();
      const found = all.find(o => o.id.toLowerCase() === orderId.toLowerCase());
      setOrder(found || null);
      setLoading(false);
    }

    loadOrder();
    window.addEventListener('vlxd-orders-updated', loadOrder);
    return () => {
      window.removeEventListener('vlxd-orders-updated', loadOrder);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontFamily: 'monospace' }}>
        ĐANG TRUY VẤN TIẾN ĐỘ LOGISTICS BẾN BÃI...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
        <Navbar />
        <div style={{ maxWidth: '600px', margin: '100px auto', padding: '32px', backgroundColor: '#ffffff', borderRadius: '16px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>Không tìm thấy đơn hàng {orderId}</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>Đơn hàng có thể chưa được đồng bộ hoặc mã không chính xác.</p>
          <button
            onClick={() => router.push('/orders')}
            style={{ padding: '10px 20px', backgroundColor: themeColor, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Về Cổng Tra Cứu Đơn Hàng
          </button>
        </div>
      </div>
    );
  }

  const getPercentage = () => {
    switch (order.status) {
      case 'pending': return 15;
      case 'approved': return 35;
      case 'loading': return 60;
      case 'delivering': return 85;
      case 'completed': return 100;
      default: return 10;
    }
  };

  const pct = getPercentage();

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '100px 16px 40px 16px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => router.push('/orders')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
          >
            ← Danh sách đơn
          </button>
          <h1 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0 }}>
            Chi tiết đơn hàng #{order.id}
          </h1>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '28px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Khách hàng / Công trình</span>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '2px 0 0 0' }}>{order.customer_name}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}> {order.address}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Trạng thái bến bãi</span>
              <div style={{ fontSize: '16px', fontWeight: '900', color: themeColor, textTransform: 'uppercase' }}>
                {order.status === 'delivering' ? 'Đang giao trên đường' : order.status === 'loading' ? 'Đang bốc hàng & kẹp chì' : order.status === 'completed' ? 'Đã giao thành công' : 'Đang xử lý'}
              </div>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div style={{ position: 'relative', margin: '30px 0 50px 0', padding: '0 10px' }}>
            <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '6px', backgroundColor: '#e2e8f0', zIndex: 1, borderRadius: '3px' }} />
            <div style={{ position: 'absolute', top: '15px', left: 0, width: `${pct}%`, height: '6px', backgroundColor: themeColor, zIndex: 2, borderRadius: '3px', transition: 'width 0.5s ease-in-out' }} />

            <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'space-between' }}>
              {[
                { label: 'Tạo đơn', minPct: 15 },
                { label: 'Duyệt đơn', minPct: 35 },
                { label: 'Bốc hàng & Cân', minPct: 60 },
                { label: 'Giao hàng', minPct: 85 },
                { label: 'Hoàn thành', minPct: 100 }
              ].map((stg, i) => {
                const isPassed = pct >= stg.minPct;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '70px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isPassed ? themeColor : '#ffffff',
                        border: '3px solid ' + (isPassed ? themeColor : '#cbd5e1'),
                        color: isPassed ? '#000000' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '900'
                      }}
                    >
                      {isPassed ? '' : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: isPassed ? '800' : '500', color: isPassed ? '#0f172a' : '#64748b', marginTop: '8px', textAlign: 'center' }}>
                      {stg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI CHỐNG GIAN LẬN NIÊM PHONG */}
          <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
              ️ THÔNG TIN VẬN TẢI & NIÊM PHONG TRẠM CÂN BẾN BÃI
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: '#78350f', fontSize: '11px' }}>Tài xế:</span>
                <div><strong>{order.driver_name ? `${order.driver_name}` : 'Chưa gán tài xế'}</strong></div>
              </div>
              <div>
                <span style={{ color: '#78350f', fontSize: '11px' }}>Biển số xe:</span>
                <div><strong>{order.truck_plate ? `${order.truck_plate}` : 'Chưa gán xe'}</strong></div>
              </div>
              <div>
                <span style={{ color: '#78350f', fontSize: '11px' }}>Khối lượng niêm phong:</span>
                <div><strong style={{ color: '#166534' }}>{order.sealed_weight || 'Chờ cân xuất bãi'}</strong></div>
              </div>
              <div>
                <span style={{ color: '#78350f', fontSize: '11px' }}>Mã tem kẹp chì:</span>
                <div><strong>{order.seal_code || 'Chưa kẹp chì'}</strong></div>
              </div>
            </div>
          </div>

          {/* DANH SÁCH VẬT TƯ */}
          <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800' }}>Chi tiết vật tư trong toa:</h4>
            {order.items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '6px' }}>
                <span>• {it.name} ({it.quantity} {it.uom})</span>
                <strong style={{ fontFamily: 'monospace' }}>{it.total.toLocaleString('vi-VN')}đ</strong>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingTop: '4px' }}>
              <span>Phí vận chuyển bến bãi:</span>
              <span>{order.shipping_fee === 0 ? 'Miễn phí (Ninh Kiều)' : `${order.shipping_fee.toLocaleString('vi-VN')}đ`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '900', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '6px' }}>
              <span>TỔNG TIỀN:</span>
              <span style={{ color: themeColor, fontFamily: 'monospace', fontSize: '16px' }}>
                {order.total_amount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            LÀM MỚI TỌA ĐỘ HÀNH TRÌNH THỰC TẾ
          </button>

        </div>
      </main>
    </div>
  );
}