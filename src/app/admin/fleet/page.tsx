'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredDrivers, saveDriver, VlxdDriver } from '@/lib/vlxdStorage';

// ─── Truck storage helpers (separate from drivers) ─────────────────────────
interface VlxdTruck {
  id: string;
  plate: string;
  type: string;
  max_payload: number;
  status: 'available' | 'delivering' | 'maintenance';
  driverIds: string[]; // M-to-M: các tài xế được phép lái xe này
}

const TRUCKS_KEY = 'vlxd_trucks';

function getStoredTrucks(): VlxdTruck[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRUCKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as VlxdTruck[];
  } catch {
    return [];
  }
}

function saveTruck(truck: VlxdTruck) {
  const existing = getStoredTrucks();
  const idx = existing.findIndex((t) => t.id === truck.id);
  if (idx >= 0) existing[idx] = truck;
  else existing.push(truck);
  localStorage.setItem(TRUCKS_KEY, JSON.stringify(existing));
  window.dispatchEvent(new Event('vlxd-trucks-updated'));
}

// ─── Status badge component ──────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: '#dcfce7', text: '#166534', label: '● Sẵn sàng' },
  delivering: { bg: '#ffedd5', text: '#c2410c', label: '● Đang chở hàng' },
  maintenance: { bg: 'var(--theme-color-15)', text: '#92400e', label: '● Bảo dưỡng' },
  off: { bg: '#f1f5f9', text: '#475569', label: '● Nghỉ phép' },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.available;
  return (
    <span style={{ fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

// ─── Modal Thêm Tài Xế ──────────────────────────────────────────────────────
function AddDriverModal({
  onClose,
  onSaved,
  themeColor,
}: {
  onClose: () => void;
  onSaved: () => void;
  themeColor: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('Hạng C');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { alert('Vui lòng nhập họ tên tài xế!'); return; }
    
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name.trim())) {
      alert('Tên tài xế không hợp lệ! Chỉ được phép nhập chữ cái và khoảng trắng.');
      return;
    }

    if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone.trim())) {
      alert('Số điện thoại không hợp lệ! Vui lòng nhập chuẩn 10 chữ số.');
      return;
    }

    const newDriver: VlxdDriver = {
      id: `drv_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      license,
      truck_plate: '',       // Tài xế không gắn cứng với 1 xe (M-to-M)
      truck_type: '',
      max_payload: 0,
      status: 'available',
    };

    saveDriver(newDriver);
    onSaved();
    onClose();
    alert(`Đã thêm tài xế "${newDriver.name}" thành công! Hãy gán xe cho tài xế này trong danh sách xe bên dưới.`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '460px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', zIndex: 10 }}>
        <div style={{ background: '#0F172A', color: '#fff', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--theme-color)' }}>Thêm Tài Xế Mới</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Họ và Tên Tài Xế *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Nguyễn Văn Hùng" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Số Điện Thoại *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0918..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Giấy Phép Lái Xe</label>
              <select value={license} onChange={(e) => setLicense(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}>
                <option>Hạng C</option>
                <option>Hạng FC</option>
                <option>Hạng B2</option>
                <option>Hạng D</option>
              </select>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            ℹ️ Sau khi thêm tài xế, hãy gán xe cho tài xế này trong phần <strong>Quản Lý Đội Xe</strong> bên dưới (quan hệ nhiều-nhiều).
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1.5px solid var(--theme-color)', color: 'var(--theme-color-dark, #b45309)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 12px var(--theme-color-15)' }}>Lưu Tài Xế</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Thêm Xe ──────────────────────────────────────────────────────────
function AddTruckModal({
  onClose,
  onSaved,
  drivers,
  themeColor,
}: {
  onClose: () => void;
  onSaved: () => void;
  drivers: VlxdDriver[];
  themeColor: string;
}) {
  const [plate, setPlate] = useState('');
  const [type, setType] = useState('Xe Ben 5 Tấn (Chuyên Cát Đá)');
  const [maxPayload, setMaxPayload] = useState(5.0);
  const [assignedDriverIds, setAssignedDriverIds] = useState<string[]>([]);

  const toggleDriver = (id: string) => {
    setAssignedDriverIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) { alert('Vui lòng nhập biển số xe!'); return; }
    if (Number(maxPayload) < 0) {
      alert('Tải trọng không được là số âm!');
      return;
    }

    const newTruck: VlxdTruck = {
      id: `trk_${Date.now()}`,
      plate: plate.trim().toUpperCase(),
      type,
      max_payload: Number(maxPayload) || 5.0,
      status: 'available',
      driverIds: assignedDriverIds,
    };

    saveTruck(newTruck);

    // Đồng bộ truck_plate vào driver record để backward-compat với dispatch
    assignedDriverIds.forEach((dId) => {
      const d = drivers.find((dr) => dr.id === dId);
      if (d) {
        saveDriver({ ...d, truck_plate: newTruck.plate, truck_type: newTruck.type, max_payload: newTruck.max_payload });
      }
    });

    onSaved();
    onClose();
    alert(`Đã thêm xe "${newTruck.plate}" với ${assignedDriverIds.length} tài xế được gán.`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: '520px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', zIndex: 10 }}>
        <div style={{ background: '#0F172A', color: '#fff', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--theme-color)' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--theme-color)' }}>Thêm Xe Tải / Xe Ben Mới</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Biển Số Xe *</label>
              <input type="text" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="65C-999.99" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', boxSizing: 'border-box' }} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Tải Trọng (Tấn) *</label>
              <input type="number" step="0.5" min="0" value={maxPayload} onChange={(e) => setMaxPayload(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Loại Phương Tiện</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}>
              <option>Xe Ben 5 Tấn (Chuyên Cát Đá)</option>
              <option>Xe Ben 10 Tấn (Chuyên Cát Đá Lớn)</option>
              <option>Xe Tải Thùng 8 Tấn (Chuyên Xi Măng)</option>
              <option>Xe Cẩu Tự Hành (Chuyên Gạch/Ống)</option>
              <option>Xe Đầu Kéo Rơ-moóc (Sắt Thép)</option>
            </select>
          </div>

          {/* Gán tài xế (M-to-M) */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', marginBottom: '6px' }}>
              Gán Tài Xế Lái Xe Này (chọn nhiều người)
            </div>
            {drivers.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                Chưa có tài xế nào. Hãy tạo tài xế trước.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {drivers.map((d) => {
                  const checked = assignedDriverIds.includes(d.id);
                  return (
                    <label key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: checked ? '2px solid var(--theme-color)' : '1px solid #e2e8f0', backgroundColor: checked ? 'var(--theme-color-15)' : '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleDriver(d.id)}
                        style={{ width: '15px', height: '15px', accentColor: 'var(--theme-color)', flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.phone} | Bằng {d.license}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', backgroundColor: 'transparent', border: '1.5px solid var(--theme-color)', color: 'var(--theme-color-dark, #b45309)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 12px var(--theme-color-15)' }}>Lưu Xe Tải</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Fleet Page ─────────────────────────────────────────────────────────
export default function AdminFleetPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [drivers, setDrivers] = useState<VlxdDriver[]>([]);
  const [trucks, setTrucks] = useState<VlxdTruck[]>([]);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [addTruckOpen, setAddTruckOpen] = useState(false);

  const loadData = () => {
    setDrivers(getStoredDrivers());
    setTrucks(getStoredTrucks());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('vlxd-drivers-updated', loadData);
    window.addEventListener('vlxd-trucks-updated', loadData);
    return () => {
      window.removeEventListener('vlxd-drivers-updated', loadData);
      window.removeEventListener('vlxd-trucks-updated', loadData);
    };
  }, []);

  const getDriversForTruck = (truck: VlxdTruck): VlxdDriver[] =>
    drivers.filter((d) => truck.driverIds.includes(d.id));

  const getTrucksForDriver = (driver: VlxdDriver): VlxdTruck[] =>
    trucks.filter((t) => t.driverIds.includes(driver.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
          Đội Xe & Vận Chuyển Bến Bãi
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Hệ thống điều phối linh hoạt: Quản lý độc lập trạng thái phương tiện và nhân sự vận hành.
        </p>
      </div>

      {/* ════════════════════════════════════════════════
          PHẦN 1: DANH SÁCH TÀI XẾ
      ════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {/* Sub-header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
              Tài Xế Bến Bãi ({drivers.length} người)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Nhân sự lái xe vận chuyển. Một tài xế có thể lái nhiều xe.</p>
          </div>
          <button
            onClick={() => setAddDriverOpen(true)}
            style={{ padding: '9px 18px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}
          >
            + Tạo Tài Xế
          </button>
        </div>

        {/* Driver List */}
        {drivers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Chưa có tài xế nào. Nhấn <strong>+ Tạo Tài Xế</strong> để thêm.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px', padding: '16px 20px' }}>
            {drivers.map((d) => {
              const assignedTrucks = getTrucksForDriver(d);
              return (
                <div key={d.id} style={{ borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>{d.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}> {d.phone} | Bằng {d.license}</div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <strong>Xe được gán ({assignedTrucks.length}):</strong>{' '}
                    {assignedTrucks.length > 0
                      ? assignedTrucks.map((t) => (
                          <span key={t.id} style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', marginRight: '4px' }}>{t.plate}</span>
                        ))
                      : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa gán xe nào</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          PHẦN 2: DANH SÁCH XE TẢI
      ════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        {/* Sub-header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
              Phương Tiện Vận Tải ({trucks.length} xe)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>Quản lý biển số, tải trọng và gán nhiều tài xế cho mỗi xe.</p>
          </div>
          <button
            onClick={() => setAddTruckOpen(true)}
            style={{ padding: '9px 18px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}
          >
            + Tạo Xe
          </button>
        </div>

        {/* Truck List */}
        {trucks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            Chưa có xe nào. Nhấn <strong>+ Tạo Xe</strong> để thêm xe và gán tài xế.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px', padding: '16px 20px' }}>
            {trucks.map((t) => {
              const assignedDrivers = getDriversForTruck(t);
              return (
                <div key={t.id} style={{ borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '17px', color: '#0f172a' }}>{t.plate}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{t.type}</div>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}> {t.max_payload} Tấn</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                    <strong>Tài xế được gán ({assignedDrivers.length}):</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '5px' }}>
                      {assignedDrivers.length > 0
                        ? assignedDrivers.map((d) => (
                            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>{d.name}</span>
                              <span style={{ color: '#94a3b8' }}>— {d.phone}</span>
                            </div>
                          ))
                        : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa gán tài xế</span>
                      }
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {addDriverOpen && (
        <AddDriverModal
          onClose={() => setAddDriverOpen(false)}
          onSaved={loadData}
          themeColor={themeColor}
        />
      )}
      {addTruckOpen && (
        <AddTruckModal
          onClose={() => setAddTruckOpen(false)}
          onSaved={loadData}
          drivers={drivers}
          themeColor={themeColor}
        />
      )}
    </div>
  );
}
