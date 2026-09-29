"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { getStoredOrders } from "@/lib/vlxdStorage";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface OrderProgress {
  id: string;
  date: string;
  status: string;
  truck_plate: string;
  driver_name: string;
  eta: string;
}

export default function PortalDashboardPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Nguyễn Văn Thầu",
    email: "thauxaydung@gmail.com",
    phone: "0907123456",
    company: "Công ty TNHH Xây Dựng Tây Đô"
  });
  const [editForm, setEditForm] = useState<UserProfile>({ ...profile });
  const [activeTab, setActiveTab] = useState<"tracking" | "history">("tracking");
  const [orders, setOrders] = useState<OrderProgress[]>([]);

  useEffect(() => {
    function fetchOrders() {
      try {
        const stored = getStoredOrders();
        const mapped: OrderProgress[] = stored.map(o => ({
          id: o.id,
          date: new Date(o.created_at).toLocaleDateString('vi-VN'),
          status: o.status === 'delivering' ? 'Đang giao hàng' : o.status === 'completed' ? 'Đã hoàn thành' : o.status === 'loading' ? 'Đang bốc hàng' : 'Chờ duyệt',
          truck_plate: o.truck_plate || 'Chờ điều xe',
          driver_name: o.driver_name || 'Chưa gán',
          eta: o.status === 'delivering' ? '25 phút' : o.status === 'completed' ? 'Đã giao' : 'Đang chuẩn bị'
        }));
        setOrders(mapped);
      } catch {
        setOrders([
          { id: "ORD-8821", date: "Hôm nay", status: "Đang giao hàng", truck_plate: "65C-123.45", driver_name: "Trần Văn Tài", eta: "20 phút" },
          { id: "ORD-8820", date: "Hôm qua", status: "Đã hoàn thành", truck_plate: "65C-555.22", driver_name: "Lê Hoàng Đức", eta: "Đã giao" }
        ]);
      }
    }
    fetchOrders();
    window.addEventListener('vlxd-orders-updated', fetchOrders);
    return () => window.removeEventListener('vlxd-orders-updated', fetchOrders);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    setIsEditing(false);
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.truck_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ backgroundColor: '#0f1026', color: '#f6f2e8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Navbar onCartClick={() => {}} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '110px 16px 40px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        <div style={{ backgroundColor: 'rgba(20, 21, 52, 0.65)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'black', color: 'var(--theme-color)', margin: 0, textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Thông tin cấu hình tài khoản
            </h2>
            {!isEditing && (
              <button type="button" onClick={() => { setEditForm({ ...profile }); setIsEditing(true); }} style={{ backgroundColor: 'transparent', border: '1px solid var(--theme-color)', color: 'var(--theme-color)', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                Chỉnh sửa
              </button>
            )}
          </div>

          {!isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '13px' }}>
              <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Họ và tên:</span> <strong style={{ display: 'block', marginTop: '4px', color: '#fff' }}>{profile.name}</strong></div>
              <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Số điện thoại:</span> <strong style={{ display: 'block', marginTop: '4px', color: '#fff' }}>{profile.phone}</strong></div>
              <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Email hệ thống:</span> <strong style={{ display: 'block', marginTop: '4px', color: '#fff' }}>{profile.email}</strong></div>
              <div><span style={{ color: 'rgba(255,255,255,0.4)' }}>Thực thể doanh nghiệp:</span> <strong style={{ display: 'block', marginTop: '4px', color: '#fff' }}>{profile.company}</strong></div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Họ và tên</label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ backgroundColor: '#0f1026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Số điện thoại</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} style={{ backgroundColor: '#0f1026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Email hệ thống</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} style={{ backgroundColor: '#0f1026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Thực thể doanh nghiệp</label>
                  <input type="text" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} style={{ backgroundColor: '#0f1026', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none' }} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ backgroundColor: 'var(--theme-color)', border: 'none', color: '#0f1026', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu thay đổi</button>
              </div>
            </form>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <a href="/portal/rfq" style={{ textDecoration: 'none', backgroundColor: 'rgba(20, 21, 52, 0.65)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'block' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'black', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.5px', margin: 0 }}>
              Theo dõi đơn yêu cầu báo giá sỉ
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: '1.5' }}>
              Xem chi tiết tiến độ phê duyệt đơn giá dự thảo từ phòng kinh doanh bến bãi.
            </p>
          </a>
          <a href="/portal/ledger" style={{ textDecoration: 'none', backgroundColor: 'rgba(20, 21, 52, 0.65)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'block' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'black', textTransform: 'uppercase', color: '#fff', letterSpacing: '0.5px', margin: 0 }}>
              Thống kê công nợ lũy kế
            </h3>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '8px', lineHeight: '1.5' }}>
              Đối soát dòng sổ quỹ kế toán tài chính, trạng thái hóa đơn đối trừ VietQR.
            </p>
          </a>
        </div>

        <div style={{ backgroundColor: 'rgba(20, 21, 52, 0.65)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', backgroundColor: '#0f1026', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button type="button" onClick={() => setActiveTab("tracking")} style={{ flex: 1, padding: '14px', backgroundColor: activeTab === "tracking" ? 'rgba(20, 21, 52, 0.65)' : 'transparent', border: 'none', color: activeTab === "tracking" ? 'var(--theme-color)' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace' }}>
              Giám sát hành trình vận tải real-time
            </button>
            <button type="button" onClick={() => setActiveTab("history")} style={{ flex: 1, padding: '14px', backgroundColor: activeTab === "history" ? 'rgba(20, 21, 52, 0.65)' : 'transparent', border: 'none', color: activeTab === "history" ? 'var(--theme-color)' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'monospace' }}>
              Lịch sử chứng từ xuất kho
            </button>
          </div>

          <div style={{ padding: '24px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  <th style={{ padding: '10px 16px' }}>Mã chứng từ</th>
                  <th style={{ padding: '10px 16px' }}>Ngày khởi tạo</th>
                  <th style={{ padding: '10px 16px' }}>Thông tin tài xế</th>
                  <th style={{ padding: '10px 16px' }}>Biển kiểm soát xe</th>
                  <th style={{ padding: '10px 16px', textAlign: 'right' }}>Tiến độ bến bãi</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '13px', color: '#cbd5e1' }}>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                      Không tìm thấy dữ liệu vận tải khớp lệnh.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', height: '54px' }}>
                      <td style={{ padding: '0 16px', fontWeight: 'bold', color: '#fff' }}>{order.id}</td>
                      <td style={{ padding: '0 16px', fontFamily: 'monospace' }}>{order.date}</td>
                      <td style={{ padding: '0 16px' }}>{order.driver_name}</td>
                      <td style={{ padding: '0 16px', fontFamily: 'monospace' }}>{order.truck_plate}</td>
                      <td style={{ padding: '0 16px', textAlign: 'right', fontWeight: 'bold', color: order.status === "Đang giao hàng" ? "var(--theme-color)" : "#4ade80" }}>
                        {order.status} {order.status === "Đang giao hàng" && `(ETA: ${order.eta})`}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}