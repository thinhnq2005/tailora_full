'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import {
  getStoredDebtB2b,
  recordDebtPayment,
  getStoredScrapReports,
  getStoredProducts,
  B2bDebtRecord,
  ScrapReportItem,
  VlxdProduct
} from '@/lib/vlxdStorage';

export default function AdminReportsPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [activeTab, setActiveTab] = useState<'debt' | 'scrap' | 'inventory' | 'cashbook'>('debt');
  const [debtList, setDebtList] = useState<B2bDebtRecord[]>([]);
  const [scrapList, setScrapList] = useState<ScrapReportItem[]>([]);
  const [products, setProducts] = useState<VlxdProduct[]>([]);

  // Modal Gạch Nợ
  const [selectedDebt, setSelectedDebt] = useState<B2bDebtRecord | null>(null);
  const [payAmount, setPayAmount] = useState<number>(50000000);

  const loadData = () => {
    setDebtList(getStoredDebtB2b());
    setScrapList(getStoredScrapReports());
    setProducts(getStoredProducts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    const updated = recordDebtPayment(selectedDebt.id, payAmount);
    setDebtList(updated);
    setSelectedDebt(null);
    alert(`Đã gạch nợ thành công số tiền ${payAmount.toLocaleString('vi-VN')}đ cho ${selectedDebt.contractor_name}!`);
  };

  const totalDebt = debtList.reduce((sum, d) => sum + d.current_debt, 0);
  const totalOverdue = debtList.reduce((sum, d) => sum + d.overdue_amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
            Báo Cáo Nghiệp Vụ & Sổ Nợ B2B Bến Bãi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Trung tâm phân tích: Quản trị tài chính nhà thầu, kiểm soát tỷ lệ hao hụt và tối ưu hóa ngưỡng tồn kho.
          </p>
        </div>
      </div>

      {/* TABS CHUYỂN BÁO CÁO */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', overflowX: 'auto' }}>
        {[
          { id: 'debt', label: 'Sổ Công Nợ B2B & Gạch Nợ' },
          { id: 'scrap', label: 'Báo Cáo Hao Hụt Bến Bãi' },
          { id: 'inventory', label: 'Tồn Kho' },
          { id: 'cashbook', label: ' Sổ Quỹ Thu / Chi' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '800',
              border: activeTab === t.id ? 'none' : '1px solid #cbd5e1',
              backgroundColor: activeTab === t.id ? '#0f172a' : '#ffffff',
              color: activeTab === t.id ? themeColor : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. SỔ CÔNG NỢ B2B */}
      {activeTab === 'debt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CÔNG NỢ NHÀ THẦU</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '6px 0 2px 0', fontFamily: 'monospace' }}>
                {totalDebt.toLocaleString('vi-VN')}đ
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Trên tổng hạn mức 5.5 Tỷ</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>NỢ QUÁ HẠN CẦN THU HỒI</span>
              <div style={{ fontSize: '22px', fontWeight: '900', color: totalOverdue > 0 ? '#dc2626' : '#16a34a', margin: '6px 0 2px 0', fontFamily: 'monospace' }}>
                {totalOverdue.toLocaleString('vi-VN')}đ
              </div>
              <span style={{ fontSize: '11px', color: totalOverdue > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                {totalOverdue > 0 ? '● Cảnh báo quá hạn hợp đồng' : 'Không có nợ xấu'}
              </span>
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '14px' }}>
              Bảng Theo Dõi Đối Soát Công Nợ Từng Công Trình
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Nhà Thầu / Dự Án</th>
                    <th style={{ padding: '12px 16px' }}>Hạn Mức Tín Dụng</th>
                    <th style={{ padding: '12px 16px' }}>Dư Nợ Hiện Tại</th>
                    <th style={{ padding: '12px 16px' }}>Nợ Quá Hạn</th>
                    <th style={{ padding: '12px 16px' }}>Thanh Toán Cuối</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {debtList.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{d.contractor_name}</div>
                        <div style={{ fontSize: '11.5px', color: '#2563eb' }}>{d.project_name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}> {d.phone}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '700' }}>
                        {d.credit_limit.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '900', color: '#0f172a' }}>
                        {d.current_debt.toLocaleString('vi-VN')}đ
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 'bold', color: d.overdue_amount > 0 ? '#dc2626' : '#16a34a' }}>
                        {d.overdue_amount > 0 ? `${d.overdue_amount.toLocaleString('vi-VN')}đ` : '0đ'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>
                        {d.last_payment_date}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedDebt(d);
                            setPayAmount(50000000);
                          }}
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Gạch Nợ Đợt →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. BÁO CÁO HAO HỤT BẾN BÃI */}
      {activeTab === 'scrap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', margin: '0 0 14px 0' }}>
              Định Mức Hao Hụt Tự Nhiên Bến Bãi Cát Đá Sắt Thép
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {scrapList.map(s => {
                const isWithinLimit = s.actual_loss_pct <= s.standard_loss_pct;
                return (
                  <div key={s.id} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                        {s.category}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: isWithinLimit ? '#16a34a' : '#dc2626' }}>
                        {isWithinLimit ? ' ĐẠT ĐỊNH MỨC' : '️ VƯỢT ĐỊNH MỨC'}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      {s.material_name}
                    </h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Định mức cho phép: <strong>{s.standard_loss_pct}%</strong></span>
                      <span style={{ color: '#0f172a' }}>Thực tế: <strong style={{ color: isWithinLimit ? '#16a34a' : '#dc2626' }}>{s.actual_loss_pct}%</strong></span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
                      <span>Lượng hao hụt: <strong>{s.loss_qty}</strong></span>
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>~ {s.loss_value.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <p style={{ margin: '8px 0 0 0', fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                      * Nguyên nhân: {s.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. TỒN KHO MIN - MAX */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: '800', fontSize: '14px' }}>
            Kiểm Soát Ngưỡng Tồn Kho Min - Max Bến Bãi
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Tên Vật Tư</th>
                  <th style={{ padding: '12px 16px' }}>Tồn Hiện Tại</th>
                  <th style={{ padding: '12px 16px' }}>Ngưỡng Tối Thiểu (Min)</th>
                  <th style={{ padding: '12px 16px' }}>Mức Tối Đa (Max Bến)</th>
                  <th style={{ padding: '12px 16px' }}>Đánh Giá Nhập Hàng</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.stock <= p.min_stock;
                  const maxStock = p.min_stock * 6;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '800' }}>{p.name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {p.stock.toLocaleString('vi-VN')} {p.uom}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#dc2626' }}>
                        {p.min_stock} {p.uom}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#2563eb' }}>
                        {maxStock} {p.uom}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isLow ? (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#fee2e2', color: '#dc2626', padding: '3px 8px', borderRadius: '4px' }}>
                             Cần nhập sà lan / xe bến gấp
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#16a34a', padding: '3px 8px', borderRadius: '4px' }}>
                             Dự trữ an toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SỔ QUỸ THU / CHI */}
      {activeTab === 'cashbook' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
            Nhật Ký Sổ Quỹ Tiền Mặt & Tài Khoản Ngân Hàng Bến Bãi
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { type: 'in', title: 'Thu tiền khách hàng quét VietQR (Đơn ORD-8821)', amount: 5100000, time: 'Hôm nay 08:30', method: 'VietQR MBBank' },
              { type: 'out', title: 'Chi dầu Diesel xe ben 65C-123.45 và 65C-888.88', amount: -2400000, time: 'Hôm nay 07:15', method: 'Tiền mặt bến bãi' },
              { type: 'in', title: 'Nhà thầu Tây Đô thanh toán đợt công trình Bến Ninh Kiều', amount: 50000000, time: 'Hôm qua 16:00', method: 'Chuyển khoản' },
              { type: 'out', title: 'Thanh toán tiền sà lan cát Tân Châu cập bến sông Hậu', amount: -38000000, time: 'Hôm qua 11:30', method: 'Chuyển khoản' }
            ].map((j, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{j.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{j.time} • Hình thức: {j.method}</div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'monospace', color: j.amount > 0 ? '#16a34a' : '#dc2626' }}>
                  {j.amount > 0 ? `+${j.amount.toLocaleString('vi-VN')}đ` : `${j.amount.toLocaleString('vi-VN')}đ`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL GẠCH NỢ B2B */}
      {selectedDebt && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setSelectedDebt(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '460px', backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', zIndex: 10 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>
              Xác Nhận Thu Tiền / Gạch Nợ Nhà Thầu
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#475569' }}>
              Nhà thầu: <strong>{selectedDebt.contractor_name}</strong><br />
              Dư nợ hiện tại: <strong style={{ color: '#dc2626' }}>{selectedDebt.current_debt.toLocaleString('vi-VN')}đ</strong>
            </p>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Số tiền thanh toán đợt này (VNĐ) *
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  XÁC NHẬN GẠCH NỢ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
