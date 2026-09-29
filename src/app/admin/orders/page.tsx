'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { useOrders } from '@/hooks/useOrders';
import { getStoredDrivers, VlxdDriver } from '@/lib/vlxdStorage';
import { VlxdOrder } from '@/types/order.types';
import { ShieldCheck, Truck, Scale, Search, CheckCircle, XCircle, FileText } from 'lucide-react';

export default function AdminOrdersPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const { orders, totalCount, filters, setFilters, updateOrderStatus, confirmDispatch, reload } = useOrders();
  const [drivers, setDrivers] = useState<VlxdDriver[]>([]);

  // Modal Thủ Kho: Xác nhận xuất bãi & Cân niêm phong
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [targetOrder, setTargetOrder] = useState<VlxdOrder | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [truckPlate, setTruckPlate] = useState<string>('');
  const [truckType, setTruckType] = useState<string>('');
  const [sealedWeight, setSealedWeight] = useState<string>('');
  const [sealCode, setSealCode] = useState<string>('');
  
  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});

  useEffect(() => {
    setDrivers(getStoredDrivers());
  }, []);

  const openDispatchModal = (order: VlxdOrder) => {
    setTargetOrder(order);
    const firstDriver = drivers[0];
    if (firstDriver) {
      setSelectedDriverId(firstDriver.id);
      setTruckPlate(firstDriver.truck_plate);
      setTruckType(firstDriver.truck_type);
    }
    // Gợi ý khối lượng niêm phong dựa trên số lượng đặt
    const suggestedKg = order.items.reduce((sum, it) => sum + (it.quantity * 50), 5000);
    setSealedWeight(`${suggestedKg.toLocaleString('vi-VN')} kg`);
    setSealCode(`SEAL-LP-${Math.floor(1000 + Math.random() * 9000)}`);
    setDispatchModalOpen(true);
  };

  const handleDriverChange = (driverId: string) => {
    setSelectedDriverId(driverId);
    const d = drivers.find(drv => drv.id === driverId);
    if (d) {
      setTruckPlate(d.truck_plate);
      setTruckType(d.truck_type);
    }
  };

  const handleConfirmDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrder) return;

    if (!selectedDriverId || !truckPlate.trim() || !sealedWeight.trim()) {
      alert('YÊU CẦU BẮT BUỘC: Thủ kho phải chọn Xe tải, Tài xế và nhập Khối lượng xuất kho niêm phong (kg)!');
      return;
    }

    const driverObj = drivers.find(d => d.id === selectedDriverId);
    const numericKg = typeof sealedWeight === 'string' ? parseInt(sealedWeight.replace(/\D/g, '')) || 0 : Number(sealedWeight);

    if (numericKg < 0) {
      alert('Khối lượng niêm phong không được âm!');
      return;
    }

    confirmDispatch({
      orderId: targetOrder.id,
      driver_id: selectedDriverId,
      driver_name: driverObj?.name || 'Tài xế bến bãi',
      driver_phone: driverObj?.phone || '0907.123.456',
      truck_plate: truckPlate.trim(),
      truck_type: truckType || 'Xe ben chuyên dụng',
      sealed_weight: sealedWeight.trim(),
      sealed_weight_kg: numericKg,
      seal_code: sealCode.trim() || `SEAL-LP-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setDispatchModalOpen(false);
  };

  const handleApprove = (orderId: string) => {
    updateOrderStatus(orderId, 'approved', 'Thủ kho xác nhận lệnh bốc xếp vật tư bến bãi');
  };

  const handleComplete = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      message: `Xác nhận đơn hàng ${orderId} đã giao thành công và khách hàng đã đối chiếu khối lượng niêm phong?`,
      onConfirm: () => {
        updateOrderStatus(orderId, 'completed', 'Khách hàng đã ký nhận biên bản xuất bãi điện tử');
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const handleCancel = (orderId: string) => {
    setConfirmModal({
      isOpen: true,
      message: `Hủy đơn hàng ${orderId}?`,
      onConfirm: () => {
        updateOrderStatus(orderId, 'cancelled', 'Đơn hàng bị hủy bởi thủ kho / điều phối');
        setConfirmModal(prev => ({...prev, isOpen: false}));
      }
    });
  };

  const getStatusBadge = (st: VlxdOrder['status']) => {
    switch (st) {
      case 'pending':
        return <span style={{ backgroundColor: 'var(--theme-color-15)', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Chờ xuất kho</span>;
      case 'approved':
        return <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Đã duyệt lệnh</span>;
      case 'loading':
        return <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Đang cân tải</span>;
      case 'delivering':
        return <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Đang giao hàng</span>;
      case 'completed':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Hoàn thành</span>;
      case 'cancelled':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>Đã hủy</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER QUẢN TRỊ ERP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '0.3px' }}>
            Xuất Kho & Logistics — Điều Phối Bến Bãi
          </h1>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
            Quy trình an ninh bến bãi: Yêu cầu xác thực phương tiện, người vận hành và tải trọng niêm phong trước khi xuất bến.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', color: '#065f46', fontWeight: '700' }}>
          <ShieldCheck size={16} />
          <span>Cơ chế kiểm soát tải trọng trạm cân: KÍCH HOẠT</span>
        </div>
      </div>

      {/* THANH BỘ LỌC TỐI GIẢN ERP */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 10px' }}>
          <Search size={14} color="#64748b" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, số điện thoại..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            style={{ width: '100%', padding: '8px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ xuất kho' },
            { id: 'delivering', label: 'Đang giao' },
            { id: 'completed', label: 'Hoàn thành' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilters({ ...filters, status: tab.id })}
              style={{
                padding: '7px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: filters.status === tab.id ? '700' : '500',
                border: filters.status === tab.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                backgroundColor: filters.status === tab.id ? '#0f172a' : '#ffffff',
                color: filters.status === tab.id ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* BẢNG ĐƠN HÀNG CHUẨN ERP */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Mã Đơn</th>
                <th style={{ padding: '10px 14px' }}>Khách Hàng & Công Trình</th>
                <th style={{ padding: '10px 14px' }}>Vật Tư Đặt</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Tổng Tiền</th>
                <th style={{ padding: '10px 14px' }}>Điều Xe & Cân Niêm Phong</th>
                <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Không có đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                      {o.id}
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
                        {new Date(o.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', maxWidth: '220px' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b' }}>{o.customer_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{o.customer_phone}</div>
                      <div style={{ fontSize: '11px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={o.address}>
                        {o.address}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        {o.items.map((it, idx) => (
                          <span key={idx} style={{ color: '#334155' }}>
                            • {it.name}: <strong>{it.quantity} {it.uom}</strong>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                      {o.total_amount.toLocaleString('vi-VN')}đ
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {o.driver_name ? (
                        <div style={{ fontSize: '11.5px' }}>
                          <div>Tài xế: <strong>{o.driver_name}</strong> ({o.driver_phone})</div>
                          <div style={{ color: '#2563eb', fontWeight: '700' }}>Xe: {o.truck_plate} ({o.truck_type})</div>
                          <div style={{ color: '#166534', fontWeight: '800' }}>Niêm phong: {o.sealed_weight}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11.5px' }}>
                          Chưa xuất bến
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px' }}>
                      {getStatusBadge(o.status)}
                    </td>

                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {o.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(o.id)}
                            style={{ padding: '5px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
                          >
                            Duyệt Lệnh
                          </button>
                        )}

                        {(o.status === 'pending' || o.status === 'approved') && (
                          <button
                            onClick={() => openDispatchModal(o)}
                            style={{ padding: '6px 12px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px var(--theme-color-15)' }}
                          >
                            <Scale size={13} />
                            <span>Xuất bãi & Cân</span>
                          </button>
                        )}

                        {o.status === 'delivering' && (
                          <button
                            onClick={() => handleComplete(o.id)}
                            style={{ padding: '6px 10px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                          >
                            Xác nhận giao
                          </button>
                        )}

                        {o.status !== 'completed' && o.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(o.id)}
                            style={{ padding: '5px 8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#ef4444', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM XÁC NHẬN XUẤT BÃI & LOGISTICS */}
      {dispatchModalOpen && targetOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setDispatchModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '540px', backgroundColor: '#ffffff', borderRadius: '14px', overflow: 'hidden', boxSizing: 'border-box', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', zIndex: 10 }}>
            
            {/* Header */}
            <div style={{ background: '#0F172A', color: '#ffffff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--theme-color)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  HỆ THỐNG KIỂM SOÁT BẾN BÃI & TRẠM CÂN
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#ffffff' }}>
                  Xác Nhận Xuất Bãi - Đơn Hàng #{targetOrder.id}
                </h3>
              </div>
              <button onClick={() => setDispatchModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#ffffff', fontWeight: 'bold' }}></button>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px', fontSize: '12px', lineHeight: '1.6' }}>
                <div>Khách hàng: <strong>{targetOrder.customer_name}</strong> ({targetOrder.customer_phone})</div>
                <div>Giao tới: <strong>{targetOrder.address}</strong></div>
                <div>Vật tư: {targetOrder.items.map(i => `${i.quantity} ${i.uom} ${i.name}`).join(', ')}</div>
              </div>

              <form onSubmit={handleConfirmDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. CHỌN XE TẢI */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    1. Chọn Xe tải xuất bãi (Bắt buộc) *
                  </label>
                  <select
                    value={selectedDriverId}
                    onChange={(e) => handleDriverChange(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff' }}
                    required
                  >
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.truck_plate} - {d.truck_type} (Tài xế: {d.name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. CHỌN TÀI XẾ PHỤ TRÁCH */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    2. Tài xế phụ trách (Bắt buộc) *
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={drivers.find(d => d.id === selectedDriverId)?.name ? `${drivers.find(d => d.id === selectedDriverId)?.name} - SĐT: ${drivers.find(d => d.id === selectedDriverId)?.phone}` : ''}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f1f5f9', boxSizing: 'border-box' }}
                  />
                </div>

                {/* 3. KHỐI LƯỢNG CÂN XUẤT KHO */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    3. Khối lượng xuất kho niêm phong (kg) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sealedWeight}
                    onChange={(e) => setSealedWeight(e.target.value)}
                    placeholder="VD: 5400"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid var(--theme-color)', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                {/* 4. MÃ CHÌ NIÊM PHONG */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '4px' }}>
                    4. Mã chì niêm phong (Seal Code)
                  </label>
                  <input
                    type="text"
                    value={sealCode}
                    onChange={(e) => setSealCode(e.target.value)}
                    placeholder="SEAL-LP-xxxx"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setDispatchModalOpen(false)}
                    style={{ flex: 1, padding: '11px', backgroundColor: 'transparent', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: '#64748b' }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    style={{ flex: 2, padding: '11px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 12px var(--theme-color-15)' }}
                  >
                    Xác nhận xuất kho
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', zIndex: 10 }}>
            <div style={{ background: '#0F172A', color: '#ffffff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Xác nhận thao tác</h3>
              <button onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer' }}></button>
            </div>
            <div style={{ padding: '20px 18px' }}>
              <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                {confirmModal.message}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button onClick={confirmModal.onConfirm} style={{ padding: '8px 16px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
