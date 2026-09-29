'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredTenant, saveTenant } from '@/lib/vlxdStorage';

// ─── Bank type từ VietQR API ─────────────────────────────────────────────────
interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

// ─── Fetch danh sách ngân hàng từ VietQR.io ─────────────────────────────────
async function fetchVietQRBanks(): Promise<VietQRBank[]> {
  try {
    const res = await fetch('https://api.vietqr.io/v2/banks', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data?.data || []) as VietQRBank[];
  } catch (err) {
    console.warn('[Settings] Failed to fetch VietQR banks:', err);
    return [];
  }
}

// ─── Static fallback cho các ngân hàng phổ biến ─────────────────────────────
const POPULAR_BANKS = [
  { code: 'MBBank', shortName: 'MBBank', name: 'Ngân hàng Quân đội', bin: '970422' },
  { code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương', bin: '970436' },
  { code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển', bin: '970418' },
  { code: 'VTB', shortName: 'VietinBank', name: 'Ngân hàng Công Thương', bin: '970415' },
  { code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu', bin: '970416' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương', bin: '970407' },
  { code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng', bin: '970432' },
  { code: 'SHB', shortName: 'SHBank', name: 'Ngân hàng Sài Gòn – Hà Nội', bin: '970443' },
  { code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong', bin: '970423' },
  { code: 'AGRIBANK', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp', bin: '970405' },
  { code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông', bin: '970448' },
  { code: 'HDBank', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM', bin: '970437' },
  { code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải', bin: '970426' },
  { code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc Tế', bin: '970441' },
  { code: 'SEABANK', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á', bin: '970440' },
];

export default function AdminSettingsPage() {
  const { tenant, refreshTenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [brandName, setBrandName] = useState('Công ty TNHH MTV TM DV TAILORA');
  const [tagline, setTagline] = useState('');
  const [color, setColor] = useState('#1e3a8a');
  const [phone, setPhone] = useState('0949734567');
  const [hotline, setHotline] = useState('0949734567 - 02923912699');
  const [officeAddress, setOfficeAddress] = useState('');
  const [bankCode, setBankCode] = useState('BIDV');
  const [accountNumber, setAccountNumber] = useState('7410276459');
  const [accountHolder, setAccountHolder] = useState('CONG TY TNHH MTV TM DV TAILORA');

  // VietQR bank list
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankSearch, setBankSearch] = useState('');
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);

  useEffect(() => {
    const config = getStoredTenant();
    setBrandName(config.brand_name || 'Công ty TNHH MTV TM DV TAILORA');
    setTagline(config.brand_tagline || '');
    setColor(config.primary_color || '#1e3a8a');
    setPhone(config.phone || '0949734567');
    setHotline(config.hotline_support || '0949734567 - 02923912699');
    setOfficeAddress(config.office_address || '');
    setBankCode(config.bank_name || 'BIDV');
    setAccountNumber(config.account_number || '7410276459');
    setAccountHolder(config.account_holder || 'CONG TY TNHH MTV TM DV TAILORA');
  }, []);

  // Thay đổi mã màu ngay lập tức trên DOM để xem trước (preview) hiệu ứng toàn trang
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--theme-color', color);
    }
  }, [color]);

  // Fetch danh sách ngân hàng từ VietQR.io
  useEffect(() => {
    setBanksLoading(true);
    fetchVietQRBanks().then((data) => {
      if (data.length > 0) {
        setBanks(data);
      } else {
        // fallback: dùng danh sách tĩnh
        setBanks(POPULAR_BANKS.map((b, i) => ({
          id: i,
          name: b.name,
          code: b.code,
          bin: b.bin,
          shortName: b.shortName,
          logo: `https://api.vietqr.io/img/${b.bin}.png`,
          transferSupported: 1,
          lookupSupported: 1,
        })));
      }
      setBanksLoading(false);
    });
  }, []);

  const filteredBanks = banks.filter(
    (b) =>
      b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const selectedBank = banks.find(
    (b) => b.code === bankCode || b.shortName === bankCode
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      alert('Vui lòng nhập tên cửa hàng / đại lý!');
      return;
    }

    saveTenant({
      brand_name: brandName.trim(),
      brand_tagline: tagline.trim(),
      primary_color: color,
      phone: phone.trim(),
      hotline_support: hotline.trim(),
      office_address: officeAddress.trim(),
      bank_name: selectedBank?.shortName || bankCode,
      account_number: accountNumber.trim(),
      account_holder: accountHolder.trim(),
    });

    if (refreshTenant) refreshTenant();
    alert('Đã lưu cấu hình đại lý thành công! Giao diện Web Khách đã được cập nhật.');
  };

  const presetColors = [
    { name: 'Xanh Navy (TAILORA)', code: '#1e3a8a' },
    { name: 'Cam Đất Nung Tuynel', code: '#ea580c' },
    { name: 'Xanh Lam Công Trình', code: '#0284c7' },
    { name: 'Xanh Lá Xây Dựng', code: '#16a34a' },
    { name: 'Đỏ Đô Xi Măng Hà Tiên', code: '#dc2626' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '760px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
          Cấu Hình Thương Hiệu & Bến Bãi
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Tùy biến tên cửa hàng, màu sắc chủ đạo và thông tin nhận chuyển khoản VietQR tự động
        </p>
      </div>

      <form onSubmit={handleSaveSettings} style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>

        {/* ── TÊN THƯƠNG HIỆU ── */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
            Tên Cửa Hàng / Doanh Nghiệp VLXD *
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Ví dụ: ERP TAILORA TECH..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>Khẩu hiệu / Giới thiệu ngắn</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Hệ thống phân phối Cát Đá Xi Măng Sắt Thép hàng đầu Cần Thơ..."
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
          />
        </div>

        {/* ── MÀU CHỦ ĐẠO ── */}
        <div>
          <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
            Màu sắc thương hiệu chủ đạo (Theme Color):
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ width: '44px', height: '40px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
            />
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px' }}>{color}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presetColors.map((preset) => (
              <button
                key={preset.code}
                type="button"
                onClick={() => setColor(preset.code)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: color === preset.code ? '2px solid #000' : '1px solid #cbd5e1', backgroundColor: preset.code, color: 'var(--theme-color-fg)', fontSize: '11.5px', fontWeight: 'bold', cursor: 'pointer', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── LIÊN HỆ & ĐỊA CHỈ ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>Hotline điều phối xe</label>
            <input type="tel" value={hotline} onChange={(e) => setHotline(e.target.value)} placeholder="0907.123.456" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>Số điện thoại bàn / Zalo</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0907.123.456" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '11.5px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>Địa chỉ bến bãi chính</label>
          <input type="text" value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="Bờ Kè Sông Hậu, Phường Xuân Khánh, Ninh Kiều, Cần Thơ..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} />
        </div>

        {/* ════════════════════════════════════════════════
            VIETQR BANK CONFIG — lấy từ api.vietqr.io
        ════════════════════════════════════════════════ */}
        <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>
              Cấu Hình Cổng Thanh Toán VietQR Tự Động
            </h4>
            {banksLoading ? (
              <span style={{ fontSize: '11px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                 Đang tải danh sách ngân hàng...
              </span>
            ) : (
              <span style={{ fontSize: '11px', color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
                 {banks.length} ngân hàng từ VietQR.io
              </span>
            )}
          </div>

          {/* Dropdown chọn ngân hàng */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Ngân hàng thụ hưởng
            </label>

            {/* Trigger button */}
            <button
              type="button"
              onClick={() => setBankDropdownOpen((v) => !v)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: bankDropdownOpen ? `2px solid ${themeColor}` : '1.5px solid #cbd5e1',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
            >
              {selectedBank ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={selectedBank.logo}
                    alt={selectedBank.shortName}
                    style={{ width: '28px', height: '20px', objectFit: 'contain', borderRadius: '3px' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a' }}>{selectedBank.shortName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{selectedBank.name}</div>
                  </div>
                </div>
              ) : (
                <span style={{ color: banksLoading ? '#94a3b8' : '#475569' }}>
                  {banksLoading ? 'Đang tải...' : 'Chọn ngân hàng thụ hưởng...'}
                </span>
              )}
              <span style={{ color: '#64748b', fontSize: '12px' }}>{bankDropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown panel */}
            {bankDropdownOpen && (
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '10px', marginTop: '4px', backgroundColor: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 100, position: 'relative' }}>
                {/* Search */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <input
                    type="text"
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    placeholder="Tìm nhanh: MBBank, Vietcombank, BIDV..."
                    autoFocus
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
                {/* List */}
                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                  {filteredBanks.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      Không tìm thấy ngân hàng nào
                    </div>
                  ) : (
                    filteredBanks.map((b) => {
                      const isSelected = b.code === bankCode || b.shortName === bankCode;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setBankCode(b.code || b.shortName);
                            setBankSearch('');
                            setBankDropdownOpen(false);
                          }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            border: 'none',
                            backgroundColor: isSelected ? 'var(--theme-color-15)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderBottom: '1px solid #f8fafc',
                            transition: 'background-color 0.1s',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f8fafc'; }}
                          onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
                        >
                          <img
                            src={b.logo}
                            alt={b.shortName}
                            style={{ width: '36px', height: '24px', objectFit: 'contain', borderRadius: '4px', flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{b.shortName}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                          </div>
                          {b.transferSupported === 1 && (
                            <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '3px', fontWeight: '700', flexShrink: 0 }}>VietQR</span>
                          )}
                          {isSelected && <span style={{ color: themeColor, fontWeight: '900', fontSize: '16px', flexShrink: 0 }}></span>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Số TK & Chủ TK */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Số tài khoản nhận tiền</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0907123456"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>Tên chủ tài khoản (In hoa không dấu)</label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="DOANH NGHIEP TU NHAN VLXD TAILORA"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* QR Preview */}
          {selectedBank && accountNumber && (
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
              <img
                src={`https://img.vietqr.io/image/${selectedBank.bin}-${accountNumber}-compact.png?accountName=${encodeURIComponent(accountHolder || brandName)}&addInfo=VLXD TAILORA`}
                alt="VietQR Preview"
                style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #e2e8f0', backgroundColor: '#fff' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Preview QR Code VietQR</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Ngân hàng: <strong>{selectedBank.shortName}</strong></div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>STK: <strong style={{ fontFamily: 'monospace' }}>{accountNumber}</strong></div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>QR sẽ được dùng trên trang thanh toán Web Khách</div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{ marginTop: '10px', padding: '14px', backgroundColor: color, color: '#111827', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: `0 4px 14px ${color}59`, transition: 'all 0.2s' }}
        >
          LƯU CẤU HÌNH THƯƠNG HIỆU & ĐẠI LÝ
        </button>
      </form>
    </div>
  );
}
