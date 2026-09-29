"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { useTenant } from "@/app/context/TenantContext";
import { useOrders } from "@/hooks/useOrders";
import { VlxdOrder, OrderStatus } from "@/types/order.types";
import { Search, Filter, ShieldCheck, Truck, Scale, Phone, User, Calendar, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import CommentSection from "@/components/comments/CommentSection";

export default function OrdersPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || "var(--theme-color)";

  // Quản lý tab chính: 'list' (Danh sách đơn hàng) | 'tracking' (Cổng tra cứu & Biên bản niêm phong)
  const [activeTab, setActiveTab] = useState<'list' | 'tracking'>('list');

  // Hook đơn hàng
  const { orders, allOrders, filters, setFilters, loading } = useOrders();

  // State cho Cổng Tra Cứu (Order Tracking)
  const [searchTrackingCode, setSearchTrackingCode] = useState<string>("");
  const [trackedOrder, setTrackedOrder] = useState<VlxdOrder | null>(null);

  // Modal Chi tiết Đơn hàng & Bình luận
  const [detailModalOrder, setDetailModalOrder] = useState<VlxdOrder | null>(null);

  useEffect(() => {
    if (allOrders.length > 0 && !trackedOrder) {
      // Mặc định chọn đơn hàng đang giao hoặc đơn đầu tiên
      const deliveringOrder = allOrders.find(o => o.status === 'delivering') || allOrders[0];
      setTrackedOrder(deliveringOrder);
      setSearchTrackingCode(deliveringOrder.id);
    }
  }, [allOrders, trackedOrder]);

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTrackingCode.trim()) return;
    const found = allOrders.find(
      o => o.id.toLowerCase() === searchTrackingCode.trim().toLowerCase()
    );
    if (found) {
      setTrackedOrder(found);
    } else {
      alert(`Không tìm thấy đơn hàng với mã "${searchTrackingCode.trim()}". Vui lòng kiểm tra lại!`);
    }
  };

  const getStatusLabel = (st: OrderStatus): string => {
    switch (st) {
      case 'pending': return 'Chờ duyệt';
      case 'approved': return 'Đã xác nhận';
      case 'loading': return 'Chờ xuất kho';
      case 'delivering': return 'Đang giao';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Hủy';
    }
  };

  const getStatusBadge = (st: OrderStatus) => {
    const label = getStatusLabel(st);
    switch (st) {
      case 'pending':
        return <span style={{ backgroundColor: 'var(--theme-color-15)', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
      case 'approved':
        return <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
      case 'loading':
        return <span style={{ backgroundColor: '#fef08a', color: '#854d0e', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
      case 'delivering':
        return <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
      case 'completed':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
      case 'cancelled':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '700' }}>{label}</span>;
    }
  };

  // Danh sách khách hàng và nhân viên duy nhất để lọc
  const uniqueCustomers = Array.from(new Set(allOrders.map(o => o.customer_name)));
  const uniqueAssignees = Array.from(new Set(allOrders.map(o => o.assignee).filter(Boolean)));

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '100px 16px 60px 16px', boxSizing: 'border-box' }}>
        
        {/* HEADER VÀ TAB NAVIGATION CHUẨN ERP */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '0.3px' }}>
              Quản Lý Đơn Hàng & Vận Tải Bến Bãi
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Theo dõi tình trạng đơn đặt hàng, tiến độ giao hàng và biên bản niêm phong trạm cân
            </p>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('list')}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === 'list' ? '700' : '500',
                border: 'none',
                backgroundColor: activeTab === 'list' ? '#ffffff' : 'transparent',
                color: activeTab === 'list' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Danh sách đơn hàng
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: activeTab === 'tracking' ? '700' : '500',
                border: 'none',
                backgroundColor: activeTab === 'tracking' ? '#ffffff' : 'transparent',
                color: activeTab === 'tracking' ? '#0f172a' : '#64748b',
                cursor: 'pointer',
                boxShadow: activeTab === 'tracking' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Cổng tra cứu & Niêm phong
            </button>
          </div>
        </div>

        {/* =========================================================================
            TAB 1: DANH SÁCH ĐƠN HÀNG (ERP TABLE & 5 BỘ LỌC)
           ========================================================================= */}
        {activeTab === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* CỤM TÌM KIẾM & 5 BỘ LỌC */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Hàng 1: Ô tìm kiếm */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0 12px' }}>
                  <Search size={15} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Tìm mã đơn hàng, tên khách hàng, số điện thoại hoặc địa chỉ..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    style={{ width: '100%', padding: '9px 0', border: 'none', background: 'transparent', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                {filters.searchTerm && (
                  <button
                    onClick={() => setFilters({ ...filters, searchTerm: '' })}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Xóa tìm kiếm
                  </button>
                )}
              </div>

              {/* Hàng 2: 5 Dropdown Bộ lọc */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                
                {/* 1. Lọc Khách hàng */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Khách hàng:
                  </label>
                  <select
                    value={filters.customer}
                    onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">Tất cả khách hàng</option>
                    {uniqueCustomers.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Lọc Nhân viên */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Người phụ trách:
                  </label>
                  <select
                    value={filters.assignee}
                    onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">Tất cả nhân viên</option>
                    {uniqueAssignees.map((a, i) => (
                      <option key={i} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Lọc Trạng thái */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Trạng thái:
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã xác nhận</option>
                    <option value="delivering">Đang giao</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Hủy</option>
                  </select>
                </div>

                {/* 4. Lọc Ngày tạo */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Ngày tạo:
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">Tất cả thời gian</option>
                    <option value="today">Hôm nay (24 giờ)</option>
                    <option value="7days">7 ngày qua</option>
                    <option value="month">Trong tháng này</option>
                  </select>
                </div>

                {/* 5. Lọc Giá trị đơn */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                    Giá trị đơn:
                  </label>
                  <select
                    value={filters.valueRange}
                    onChange={(e) => setFilters({ ...filters, valueRange: e.target.value as any })}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', backgroundColor: '#ffffff' }}
                  >
                    <option value="all">Tất cả khoảng giá</option>
                    <option value="under5m">Dưới 5 triệu VNĐ</option>
                    <option value="5m_to_20m">Từ 5 - 20 triệu VNĐ</option>
                    <option value="above20m">Trên 20 triệu VNĐ</option>
                  </select>
                </div>

              </div>
            </div>

            {/* BẢNG ĐƠN HÀNG 10 CỘT CHUẨN ERP */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px', width: '45px', textAlign: 'center' }}>STT</th>
                      <th style={{ padding: '10px 12px' }}>Mã đơn hàng</th>
                      <th style={{ padding: '10px 12px' }}>Ngày tạo</th>
                      <th style={{ padding: '10px 12px' }}>Khách hàng</th>
                      <th style={{ padding: '10px 12px' }}>Số điện thoại</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Tổng tiền</th>
                      <th style={{ padding: '10px 12px' }}>Thanh toán</th>
                      <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                      <th style={{ padding: '10px 12px' }}>Người phụ trách</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                          Không tìm thấy đơn hàng nào phù hợp với điều kiện lọc.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                            {idx + 1}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                            {order.id}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569' }}>
                            {new Date(order.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '10px 12px', fontWeight: '600', color: '#1e293b' }}>
                            {order.customer_name}
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>
                            {order.customer_phone}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace', color: '#0f172a' }}>
                            {order.total_amount.toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: order.payment_status === 'paid' ? '#16a34a' : '#d97706' }}>
                              {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {getStatusBadge(order.status)}
                          </td>
                          <td style={{ padding: '10px 12px', color: '#475569', fontSize: '12px' }}>
                            {order.assignee || 'Điều phối bãi'}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => setDetailModalOrder(order)}
                                style={{ padding: '5px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Chi tiết
                              </button>
                              <button
                                onClick={() => {
                                  setTrackedOrder(order);
                                  setSearchTrackingCode(order.id);
                                  setActiveTab('tracking');
                                }}
                                style={{ padding: '5px 10px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Tra cứu
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>Hiển thị <strong>{orders.length}</strong> / <strong>{allOrders.length}</strong> đơn hàng</span>
                <span>Hệ thống ERP Bến Bãi ERP TAILORA TECH</span>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            TAB 2: CỔNG TRA CỨU ĐƠN HÀNG (ORDER TRACKING & BIÊN BẢN NIÊM PHONG)
           ========================================================================= */}
        {activeTab === 'tracking' && (
          <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* KHUNG TÌM KIẾM MÃ ĐƠN HÀNG */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <form onSubmit={handleSearchTracking} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng (Ví dụ: ORD-8821, ORD-8820)..."
                  value={searchTrackingCode}
                  onChange={(e) => setSearchTrackingCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  Tra cứu đơn
                </button>
              </form>

              {/* QUICK SELECTOR */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', overflowX: 'auto' }}>
                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>Mẫu nhanh:</span>
                {allOrders.slice(0, 4).map(o => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setTrackedOrder(o);
                      setSearchTrackingCode(o.id);
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: trackedOrder?.id === o.id ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      backgroundColor: trackedOrder?.id === o.id ? '#0f172a' : '#f8fafc',
                      color: trackedOrder?.id === o.id ? '#ffffff' : '#475569',
                      fontSize: '11.5px',
                      fontFamily: 'monospace',
                      cursor: 'pointer'
                    }}
                  >
                    {o.id} ({getStatusLabel(o.status)})
                  </button>
                ))}
              </div>
            </div>

            {trackedOrder && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* BLOCK 1: THÔNG TIN XUẤT KHO NIÊM PHONG (HIGHLIGHT ĐẶC BIỆT KHI ĐANG GIAO HOẶC ĐÃ GIAO) */}
                {(trackedOrder.status === 'delivering' || trackedOrder.sealed_weight) && (
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '2px solid #f59e0b',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fde68a', paddingBottom: '12px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={20} color="var(--theme-color-dark, #b45309)" />
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Biên Bản Xuất Bãi Điện Tử (Thông Tin Xuất Kho Niêm Phong)
                        </h3>
                      </div>
                      <span style={{ fontSize: '11px', backgroundColor: 'var(--theme-color-15)', color: '#92400e', padding: '3px 8px', borderRadius: '4px', fontWeight: '700', border: '1px solid #fde68a' }}>
                        CHỐT CỨNG ĐỐI CHIẾU
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                      
                      {/* TÀI XẾ & SỐ ĐIỆN THOẠI */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#78350f', display: 'block', textTransform: 'uppercase' }}>
                          Tài xế giao hàng & SĐT:
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                          {trackedOrder.driver_name || 'Đang cập nhật'}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: '700', fontFamily: 'monospace' }}>
                          SĐT: {trackedOrder.driver_phone || '---'}
                        </div>
                      </div>

                      {/* BIỂN SỐ XE & LOẠI XE */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#78350f', display: 'block', textTransform: 'uppercase' }}>
                          Biển số xe & Loại xe:
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                          {trackedOrder.truck_plate || 'Đang điều phối'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>
                          {trackedOrder.truck_type || 'Xe ben chuyên dụng'}
                        </div>
                      </div>

                      {/* CON SỐ QUAN TRỌNG NHẤT: KHỐI LƯỢNG XUẤT KHO NIÊM PHONG (KG) */}
                      <div style={{ gridColumn: 'span 1', backgroundColor: 'var(--theme-color-15)', border: '1.5px dashed #d97706', padding: '10px 14px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#92400e', display: 'block', textTransform: 'uppercase' }}>
                          Số liệu quan trọng đối chiếu:
                        </span>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--theme-color-dark, #b45309)', fontFamily: 'monospace', marginTop: '2px' }}>
                          Khối lượng xuất kho niêm phong: {trackedOrder.sealed_weight || `${trackedOrder.sealed_weight_kg || '---'} kg`}
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#78350f', display: 'block', marginTop: '2px' }}>
                          Mã kẹp chì: <strong>{trackedOrder.seal_code || 'SEAL-LP-0000'}</strong>
                        </span>
                      </div>

                    </div>

                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #fde68a', fontSize: '11.5px', color: '#92400e' }}>
                      * Quý khách vui lòng cầm điện thoại đối chiếu trực tiếp con số <strong>{trackedOrder.sealed_weight || 'khối lượng niêm phong'}</strong> với phiếu cân trạm cân khi xe tải đến chân công trình trước khi ký nhận hạ vật tư.
                    </div>
                  </div>
                )}

                {/* BLOCK 2: TIMELINE TIẾN ĐỘ VẬN CHUYỂN */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a' }}>
                      Hành Trình Giao Hàng (Timeline)
                    </h3>
                    <div>{getStatusBadge(trackedOrder.status)}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
                    <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', backgroundColor: '#e2e8f0' }} />

                    {trackedOrder.timeline.map((step, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-24px',
                          top: '3px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: idx === trackedOrder.timeline.length - 1 ? '#0f172a' : '#22c55e',
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 0 1.5px ' + (idx === trackedOrder.timeline.length - 1 ? '#0f172a' : '#22c55e')
                        }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{step.title}</strong>
                          <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{step.time}</span>
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#475569' }}>
                          {step.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BLOCK 3: CHI TIẾT ĐƠN HÀNG VẬT TƯ */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a' }}>
                    Chi Tiết Đơn Hàng #{trackedOrder.id}
                  </h3>

                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trackedOrder.items.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '6px' }}>
                        <span style={{ color: '#1e293b', fontWeight: '600' }}>• {item.name}</span>
                        <span style={{ color: '#475569', fontFamily: 'monospace' }}>
                          {item.quantity} {item.uom} × {item.price.toLocaleString('vi-VN')}đ = <strong style={{ color: '#0f172a' }}>{item.total.toLocaleString('vi-VN')}đ</strong>
                        </span>
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingTop: '4px' }}>
                      <span>Phí vận chuyển bến bãi:</span>
                      <span>{trackedOrder.shipping_fee === 0 ? 'Miễn phí nội ô Ninh Kiều' : `${trackedOrder.shipping_fee.toLocaleString('vi-VN')}đ`}</span>
                    </div>

                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800' }}>
                      <span>TỔNG TIỀN:</span>
                      <span style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '16px' }}>
                        {trackedOrder.total_amount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#475569' }}>
                    <div>Khách hàng: <strong>{trackedOrder.customer_name}</strong> - SĐT: {trackedOrder.customer_phone}</div>
                    <div>Địa chỉ giao: {trackedOrder.address}</div>
                  </div>
                </div>

                {/* BLOCK 4: TRAO ĐỔI & BÌNH LUẬN REALTIME THEO ĐƠN HÀNG */}
                <CommentSection
                  targetId={trackedOrder.id}
                  targetType="order"
                  title={`Trao đổi đơn hàng #${trackedOrder.id}`}
                />

              </div>
            )}

          </div>
        )}

        {/* MODAL CHI TIẾT ĐƠN HÀNG */}
        {detailModalOrder && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
            <div style={{ position: 'fixed', inset: 0 }} onClick={() => setDetailModalOrder(null)} />
            <div style={{ position: 'relative', width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxSizing: 'border-box', zIndex: 10, boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
              
              <div style={{ background: '#0F172A', color: '#ffffff', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--theme-color)', textTransform: 'uppercase' }}>
                    Chi Tiết Đơn Hàng #{detailModalOrder.id}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#FEF08A' }}>
                    Ngày tạo: {new Date(detailModalOrder.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <button onClick={() => setDetailModalOrder(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#ffffff', fontWeight: 'bold' }}></button>
              </div>

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12.5px', marginBottom: '16px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                <div>Khách hàng: <strong>{detailModalOrder.customer_name}</strong></div>
                <div>Số điện thoại: <strong>{detailModalOrder.customer_phone}</strong></div>
                <div style={{ gridColumn: 'span 2' }}>Địa chỉ: {detailModalOrder.address}</div>
                <div>Trạng thái: {getStatusBadge(detailModalOrder.status)}</div>
                <div>Thanh toán: <strong>{detailModalOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</strong></div>
              </div>

              {/* THÔNG TIN NIÊM PHONG NẾU CÓ */}
              {detailModalOrder.driver_name && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '12px' }}>
                  <div style={{ fontWeight: '800', color: '#92400e', marginBottom: '4px' }}>THÔNG TIN NIÊM PHONG BẾN BÃI:</div>
                  <div>Tài xế: <strong>{detailModalOrder.driver_name}</strong> - SĐT: {detailModalOrder.driver_phone}</div>
                  <div>Phương tiện: <strong>{detailModalOrder.truck_plate}</strong> ({detailModalOrder.truck_type})</div>
                  <div>Khối lượng niêm phong: <strong style={{ color: 'var(--theme-color-dark, #b45309)' }}>{detailModalOrder.sealed_weight}</strong></div>
                  <div>Mã chì: <strong>{detailModalOrder.seal_code}</strong></div>
                </div>
              )}

              {/* DANH SÁCH VẬT TƯ */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Danh mục vật tư:</div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tên vật tư</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Số lượng</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModalOrder.items.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 10px' }}>{it.name}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{it.quantity} {it.uom}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{it.price.toLocaleString('vi-VN')}đ</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'monospace' }}>{it.total.toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: '#f8fafc', fontWeight: '800' }}>
                        <td colSpan={3} style={{ padding: '10px' }}>TỔNG CỘNG:</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a' }}>
                          {detailModalOrder.total_amount.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BÌNH LUẬN TRONG MODAL */}
              <CommentSection targetId={detailModalOrder.id} targetType="order" title="Trao đổi nội bộ đơn hàng" />

            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
