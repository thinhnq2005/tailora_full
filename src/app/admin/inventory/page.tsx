'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import {
  getStoredTransactions,
  getStoredProducts,
  createTransaction,
  approveTransaction,
  createDisassembleTransaction,
  approveDisassembleTransaction,
  VlxdInventoryTransaction,
  VlxdProduct,
  BomComponent
} from '@/lib/vlxdStorage';

// =================== ITEM STATE ===================
interface ItemRow {
  productId: string;
  quantity: number;
  selectedUom: string;
  actualQty?: number;
  discrepancy_reason?: string;
  out_reason?: string;
}

// Mock danh sách nhân viên kiểm kê
const STAFF_OPTIONS = [
  { id: 'nv-001', name: 'Nguyễn Thị Linh — Thủ kho' },
  { id: 'nv-002', name: 'Trần Minh Khôi — Kế toán kho' },
  { id: 'nv-003', name: 'Lê Thanh Tùng — Giám sát bến bãi' },
  { id: 'nv-004', name: 'Phạm Hồng Phúc — Trưởng ca' },
];

export default function AdminInventoryPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [transactions, setTransactions] = useState<VlxdInventoryTransaction[]>([]);
  const [products, setProducts] = useState<VlxdProduct[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [txnType, setTxnType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [items, setItems] = useState<ItemRow[]>([{ productId: '', quantity: 0, selectedUom: '' }]);
  const [note, setNote] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [inspector, setInspector] = useState(STAFF_OPTIONS[0].id);

  const [disassembleOpen, setDisassembleOpen] = useState(false);
  const [disComboId, setDisComboId] = useState('');
  const [disQty, setDisQty] = useState(1);
  const [disNote, setDisNote] = useState('');
  const [disBom, setDisBom] = useState<BomComponent[]>([{ product_id: '', product_name: '', quantity: 1, uom: '' }]);

  // =================== DATA LOADING ===================
  const loadData = () => {
    setTransactions(getStoredTransactions());
    setProducts(getStoredProducts());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('vlxd-transactions-updated', handleUpdate);
    window.addEventListener('vlxd-products-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_inventory_txn' || e.key === 'vlxd_products') loadData();
    });
    return () => {
      window.removeEventListener('vlxd-transactions-updated', handleUpdate);
      window.removeEventListener('vlxd-products-updated', handleUpdate);
    };
  }, []);

  // =================== MODAL OPEN ===================
  const openModal = (type: 'IN' | 'OUT' | 'ADJUST') => {
    setTxnType(type);
    const firstId = products.length > 0 ? products[0].id : '';
    const firstUom = products.length > 0 ? products[0].uom : '';
    setItems([{ productId: firstId, quantity: 0, selectedUom: firstUom, actualQty: undefined, discrepancy_reason: '' }]);
    setNote('');
    setCounterparty('');
    setInspector(STAFF_OPTIONS[0].id);
    setModalOpen(true);
  };

  // Helper: thêm dòng vật tư mới
  const addItemRow = () => {
    const firstId = products.length > 0 ? products[0].id : '';
    const firstUom = products.length > 0 ? products[0].uom : '';
    setItems(prev => [...prev, { productId: firstId, quantity: 0, selectedUom: firstUom, actualQty: undefined, discrepancy_reason: '' }]);
  };

  // Helper: xóa dòng vật tư
  const removeItemRow = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Helper: cập nhật một field trong một dòng
  const updateItemRow = (index: number, patch: Partial<ItemRow>) => {
    setItems(prev => prev.map((row, i) => i === index ? { ...row, ...patch } : row));
  };

  // Lấy ĐVT options cho một product (bao gồm ĐVT gốc + các ĐVT quy đổi)
  const getUomOptions = (productId: string): { name: string; rate: number }[] => {
    const p = products.find(x => x.id === productId);
    if (!p) return [];
    if (p.uom_options && p.uom_options.length > 0) {
      return p.uom_options.map(o => ({ name: o.name, rate: o.rate }));
    }
    return [{ name: p.uom, rate: 1 }];
  };

  // =================== SAVE TRANSACTION ===================
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Vui lòng thêm ít nhất 1 mặt hàng!');
      return;
    }

    let savedCount = 0;
    let hasError = false;

    for (const item of items) {
      if (!item.productId) {
        alert('Vui lòng chọn vật tư cho tất cả các dòng!');
        return;
      }
      if (txnType !== 'ADJUST' && item.quantity <= 0) {
        alert('Vui lòng nhập số lượng hợp lệ!');
        return;
      }

      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      // Tính toán số lượng theo đơn vị gốc
      const uomOpts = getUomOptions(item.productId);
      const selectedOpt = uomOpts.find(o => o.name === item.selectedUom);
      const convRate = selectedOpt?.rate || 1;

      let baseQty = 0;
      let displayQty = item.quantity;

      if (txnType === 'ADJUST') {
        // ADJUST: Người dùng nhập số thực tế đếm được
        const actualQty = item.actualQty ?? 0;
        const diff = actualQty - product.stock;
        baseQty = diff;      // Chênh lệch = Thực tế - Tồn hiện tại
        displayQty = actualQty;
      } else {
        // IN / OUT: Nhân theo tỷ lệ quy đổi ra đơn vị gốc
        baseQty = item.quantity * convRate;
        displayQty = item.quantity;
      }

      // Xây dựng ghi chú tổng hợp cho ADJUST (bao gồm lý do chênh lệch)
      const inspectorName = STAFF_OPTIONS.find(s => s.id === inspector)?.name || inspector;
      const adjustNote = txnType === 'ADJUST'
        ? [
          note.trim() || 'Kiểm kê kho',
          `Người kiểm kê: ${inspectorName}`,
          item.discrepancy_reason?.trim() ? `Lý do CL: ${item.discrepancy_reason.trim()}` : ''
        ].filter(Boolean).join(' | ')
        : note.trim() || (txnType === 'IN' ? 'Nhập kho' : 'Xuất kho');

      const payload = {
        type: txnType,
        product_id: product.id,
        product_name: product.name,
        quantity: displayQty,
        base_quantity: baseQty,
        uom: item.selectedUom || product.uom,
        base_uom: product.uom,
        counterparty: txnType === 'ADJUST' ? inspectorName : (counterparty.trim() || undefined),
        actual_qty: txnType === 'ADJUST' ? (item.actualQty ?? 0) : undefined,
        prev_stock: txnType === 'ADJUST' ? product.stock : undefined,
        note: adjustNote,
        created_by: 'Admin Bến Bãi',
      };

      const res = createTransaction(payload);
      if (res) savedCount++;
      else hasError = true;
    }

    if (savedCount > 0) {
      setModalOpen(false);
      alert(
        `Da tao ${savedCount} phieu cho duyet thanh cong!` +
        (hasError ? ' (Co mot so dong bi loi)' : '') +
        '\n\nPhieu dang o trang thai CHO DUYET. Ton kho se duoc cap nhat khi duoc duyet.'
      );
    }
  };

  const openDisassemble = () => {
    const firstId = products.length > 0 ? products[0].id : '';
    setDisComboId(firstId);
    setDisQty(1);
    setDisNote('');
    setDisBom([{ product_id: '', product_name: '', quantity: 1, uom: '' }]);
    setDisassembleOpen(true);
  };

  const handleSaveDisassemble = (e: React.FormEvent) => {
    e.preventDefault();
    const combo = products.find(p => p.id === disComboId);
    if (!combo) { alert('Vui lòng chọn mã hàng combo!'); return; }
    if (disQty <= 0) { alert('Vui lòng nhập số lượng hợp lệ!'); return; }
    const validBom = disBom.filter(b => b.product_id && b.quantity > 0);
    if (validBom.length === 0) { alert('Vui lòng thêm ít nhất 1 vật tư BOM!'); return; }
    const filledBom = validBom.map(b => {
      const p = products.find(x => x.id === b.product_id);
      return { ...b, product_name: p?.name || b.product_name, uom: p?.uom || b.uom };
    });
    const res = createDisassembleTransaction({
      product_id: combo.id,
      product_name: combo.name,
      quantity: disQty,
      uom: combo.uom,
      bom_components: filledBom,
      note: disNote.trim() || 'Rã kho',
    });
    if (res) {
      setDisassembleOpen(false);
      alert('Đã tạo phiếu Rã kho. Tồn kho sẽ cập nhật sau khi duyệt.');
    }
  };

  // =================== APPROVE ===================
  const handleApprove = (txnId: string) => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) return;
    if (txn.type === 'DISASSEMBLE') {
      const result = approveDisassembleTransaction(txnId);
      if (result) loadData();
    } else {
      const result = approveTransaction(txnId);
      if (result) loadData();
    }
  };

  // =================== UI HELPERS ===================
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'IN': return { text: 'Nhap Kho', color: '#166534', bg: '#dcfce7' };
      case 'OUT': return { text: 'Xuat Kho', color: '#991b1b', bg: '#fee2e2' };
      case 'ADJUST': return { text: 'Kiem Ke', color: '#854d0e', bg: '#fef08a' };
      case 'DISASSEMBLE': return { text: 'Ra Kho', color: '#6b21a8', bg: '#f3e8ff' };
      default: return { text: type, color: '#475569', bg: '#f1f5f9' };
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: '800',
    color: '#475569',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ===== GLOBAL FOCUS STYLE ===== */}
      <style>{`
        .inv-input:focus { border-color: ${themeColor} !important; box-shadow: 0 0 0 3px ${themeColor}22; }
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 4px 16px rgba(239,68,68,0.15); }
          50% { box-shadow: 0 4px 24px rgba(239,68,68,0.40); }
        }
        .approve-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .txn-row-pending { background-color: #fefce8 !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
            Quản Lý Lưu Chuyển Kho Bãi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Ghi nhận Nhập - Xuất - Kiểm kê theo quy trình <strong>Xin → Duyệt</strong>. Tồn kho chỉ thay đổi khi được phê duyệt.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => openModal('IN')}
            style={{ padding: '10px 16px', backgroundColor: '#ffffff', color: '#166534', border: '1.5px solid #166534', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            + TẠO PHIẾU NHẬP
          </button>

          <button
            onClick={() => openModal('OUT')}
            style={{ padding: '10px 16px', backgroundColor: '#ffffff', color: '#991b1b', border: '1.5px solid #991b1b', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            - TẠO PHIẾU XUẤT
          </button>

          <button
            onClick={openDisassemble}
            style={{ padding: '10px 16px', backgroundColor: '#ffffff', color: '#6b21a8', border: '1.5px solid #6b21a8', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3e8ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
          >
            RÃ KHO
          </button>

          <button
            onClick={() => openModal('ADJUST')}
            style={{ padding: '10px 16px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            KIỂM KÊ KHO
          </button>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${themeColor}` }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Tổng mã vật tư</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>{products.length}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #166534' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Phiếu Nhập (đã duyệt)</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#166534' }}>
            {transactions.filter(t => t.type === 'IN' && t.status === 'approved').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '4px solid #991b1b' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Phiếu Xuất (đã duyệt)</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#991b1b' }}>
            {transactions.filter(t => t.type === 'OUT' && t.status === 'approved').length}
          </div>
        </div>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: `4px solid ${themeColor}` }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}> Chờ Duyệt</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#b45309' }}>
            {transactions.filter(t => t.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* ALERT CARDS */}
      {(() => {
        const lowStockItems = products.filter(p => p.stock <= (p.min_stock || 0));
        const overStockItems = products.filter(p => p.stock >= (p.max_stock || Infinity));
        if (lowStockItems.length === 0 && overStockItems.length === 0) return null;
        return (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {lowStockItems.length > 0 && (
              <div style={{ flex: 1, minWidth: '280px', backgroundColor: '#fff1f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(239,68,68,0.15)', animation: 'pulseRed 2s infinite' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>️</div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#991b1b', fontFamily: 'monospace' }}>{lowStockItems.length} vật tư</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', marginTop: '2px' }}>Dưới mức an toàn — Cần nhập gấp!</div>
                  <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                    {lowStockItems.slice(0, 2).map(p => p.name).join(', ')}{lowStockItems.length > 2 ? ` và ${lowStockItems.length - 2} khác...` : ''}
                  </div>
                </div>
              </div>
            )}
            {overStockItems.length > 0 && (
              <div style={{ flex: 1, minWidth: '280px', backgroundColor: '#fefce8', border: '2px solid #fde047', borderRadius: '12px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 16px rgba(234,179,8,0.15)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}></div>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: '#92400e', fontFamily: 'monospace' }}>{overStockItems.length} vật tư</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#b45309', marginTop: '2px' }}>Tồn đọng / Vượt định mức — Cần xả kho!</div>
                  <div style={{ fontSize: '11px', color: '#ca8a04', marginTop: '4px' }}>
                    {overStockItems.slice(0, 2).map(p => p.name).join(', ')}{overStockItems.length > 2 ? ` và ${overStockItems.length - 2} khác...` : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* BẢNG TỒN KHO */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>TÌNH TRẠNG TỒN KHO VẬT TƯ</h3>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 20px' }}>Mã VT</th>
                <th style={{ padding: '12px 20px' }}>Tên Vật Tư</th>
                <th style={{ padding: '12px 20px' }}>Danh Mục</th>
                <th style={{ padding: '12px 20px' }}>Tồn Kho</th>
                <th style={{ padding: '12px 20px' }}>Cảnh Báo</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu vật tư.</td></tr>
              ) : (
                products.map(p => {
                  const isLowStock = p.stock <= (p.min_stock || 0);
                  const isOverStock = p.stock >= (p.max_stock || Infinity);
                  const isSafe = !isLowStock && !isOverStock;
                  const rowBg = isLowStock ? '#fff1f2' : isOverStock ? '#fefce8' : 'transparent';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rowBg }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold', color: '#0f172a' }}>{p.id}</td>
                      <td style={{ padding: '12px 20px', fontWeight: '600' }}>{p.name}</td>
                      <td style={{ padding: '12px 20px', color: '#64748b' }}>{p.category}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ fontSize: '14px', color: isLowStock ? '#ef4444' : isOverStock ? '#b45309' : '#166534' }}>
                            {p.stock.toLocaleString('vi-VN')} {p.uom}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Min: {(p.min_stock || 0).toLocaleString('vi-VN')} / Max: {(p.max_stock || 0).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        {isLowStock && <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#fee2e2', color: '#991b1b', padding: '5px 10px', borderRadius: '6px', border: '1px solid #fca5a5' }}> Sắp hết</span>}
                        {isOverStock && <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#fefce8', color: '#92400e', padding: '5px 10px', borderRadius: '6px', border: '1px solid #fde047' }}>🟡 Vượt định mức</span>}
                        {isSafe && <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#166534', padding: '5px 10px', borderRadius: '6px', border: '1px solid #86efac' }}>🟢 An Toàn</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BẢNG LỊCH SỬ GIAO DỊCH */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>LỊCH SỬ GIAO DỊCH KHO</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
             Phiếu chờ duyệt: <strong style={{ color: '#b45309' }}>{transactions.filter(t => t.status === 'pending').length}</strong>
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Mã Phiếu</th>
                <th style={{ padding: '12px 16px' }}>Thời Gian</th>
                <th style={{ padding: '12px 16px' }}>Loại</th>
                <th style={{ padding: '12px 16px' }}>Vật Tư</th>
                <th style={{ padding: '12px 16px' }}>Số Lượng</th>
                <th style={{ padding: '12px 16px' }}>Đối Tượng</th>
                <th style={{ padding: '12px 16px' }}>Ghi Chú</th>
                <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Chưa có giao dịch kho nào.</td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const typeLabel = getTypeLabel(t.type);
                  const isPending = t.status === 'pending';

                  // Hiển thị số lượng: nếu ĐVT quy đổi thì hiện cả hai
                  const qtyDisplay = t.type === 'ADJUST'
                    ? `TT: ${t.actual_qty ?? t.quantity} | Δ: ${t.base_quantity >= 0 ? '+' : ''}${t.base_quantity}`
                    : (t.uom !== t.base_uom
                      ? `${t.quantity} ${t.uom} (≡ ${t.base_quantity} ${t.base_uom})`
                      : `${t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : ''}${t.quantity} ${t.uom}`);

                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isPending ? '#fefce8' : 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>{t.id}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {new Date(t.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: typeLabel.bg, color: typeLabel.color, padding: '4px 8px', borderRadius: '4px' }}>
                          {typeLabel.text}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{t.product_name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ fontSize: '13px', color: t.type === 'IN' ? '#166534' : t.type === 'OUT' ? '#991b1b' : '#ca8a04', fontFamily: 'monospace' }}>
                          {qtyDisplay}
                        </strong>
                        {t.type === 'ADJUST' && t.prev_stock !== undefined && (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                            Tồn trước: {t.prev_stock} {t.base_uom}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>
                        {t.counterparty || <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px', maxWidth: '180px' }}>
                        {t.note}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isPending ? (
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="approve-btn"
                            style={{
                              padding: '6px 14px',
                              backgroundColor: themeColor,
                              color: '#0f172a',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '900',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                              boxShadow: `0 2px 8px ${themeColor}44`,
                            }}
                          >
                             DUYỆT
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '4px', border: '1px solid #86efac' }}>
                             Đã duyệt
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== MODAL TẠO PHIẾU ===== */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '560px', backgroundColor: '#ffffff', borderRadius: '16px', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

            {/* Modal Header — accent color bar */}
            <div style={{ height: '5px', backgroundColor: themeColor }} />
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>
                  {txnType === 'IN' ? 'Tạo Phiếu Nhập Kho' : txnType === 'OUT' ? 'Tạo Phiếu Xuất Kho' : 'Phiếu Kiểm Kê Kho'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Phiếu tạo ra sẽ ở trạng thái <strong style={{ color: '#b45309' }}>Chờ Duyệt</strong>. Tồn kho chưa thay đổi.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}></button>
            </div>

            <form onSubmit={handleSaveTransaction}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto' }}>

                {/* COUNTERPARTY / INSPECTOR FIELD */}
                {txnType === 'ADJUST' ? (
                  /* ADJUST: Dropdown chọn nhân viên kiểm kê */
                  <div>
                    <label style={labelStyle}>Người Kiểm Kê</label>
                    <select
                      className="inv-input"
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                      style={inputStyle}
                    >
                      {STAFF_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* IN / OUT: Text input Nhà cung cấp / Công trình */
                  <div>
                    <label style={labelStyle}>
                      {txnType === 'IN' ? 'Nhà Cung Cấp' : 'Công Trình / Người Nhận'}
                    </label>
                    <input
                      type="text"
                      className="inv-input"
                      value={counterparty}
                      onChange={(e) => setCounterparty(e.target.value)}
                      placeholder={txnType === 'IN' ? 'VD: Trạm Trộn An Bình' : 'VD: Dự án Cần Thơ Gateway'}
                      style={inputStyle}
                    />
                  </div>
                )}

                {txnType === 'OUT' && (
                  <div>
                    <label style={labelStyle}>Ly Do / Muc Dich Xuat Kho</label>
                    <select
                      className="inv-input"
                      value={items[0]?.out_reason || ''}
                      onChange={(e) => setItems(prev => prev.map((row, i) => i === 0 ? { ...row, out_reason: e.target.value } : row))}
                      style={inputStyle}
                    >
                      <option value="">-- Chon ly do xuat --</option>
                      <option value="Xuat ban hang">Xuat ban hang cho cong trinh</option>
                      <option value="Hao hut / That thoat">Hao hut / That thoat (vo, re, roi vai)</option>
                      <option value="Tra hang NCC">Tra hang nha cung cap</option>
                      <option value="Dieu chuyen kho">Dieu chuyen giua kho</option>
                      <option value="Khac">Khac (ghi ro trong ghi chu)</option>
                    </select>
                    {items[0]?.out_reason === 'Hao hut / That thoat' && (
                      <input
                        type="text"
                        className="inv-input"
                        placeholder="Mo ta: VD: Vo ngoi, hao hut thep khi cat..."
                        style={{ ...inputStyle, marginTop: '8px' }}
                        onChange={(e) => setItems(prev => prev.map((row, i) => i === 0 ? { ...row, discrepancy_reason: e.target.value } : row))}
                      />
                    )}
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      Danh sách Vật tư
                      {txnType === 'ADJUST' && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>({items.length} mặt hàng)</span>
                      )}
                    </strong>
                    <button
                      type="button"
                      onClick={addItemRow}
                      style={{ padding: '5px 12px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      + Thêm dòng
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      const uomOptions = getUomOptions(item.productId);
                      const selectedUomRate = uomOptions.find(o => o.name === item.selectedUom)?.rate || 1;
                      const diff = (product && item.actualQty !== undefined) ? item.actualQty - product.stock : null;

                      return (
                        <div
                          key={index}
                          style={{
                            backgroundColor: '#f8fafc',
                            padding: '14px',
                            borderRadius: '10px',
                            border: `1px solid ${txnType === 'ADJUST' && diff !== null && diff !== 0 ? (diff > 0 ? '#86efac' : '#fca5a5') : '#e2e8f0'}`,
                            position: 'relative',
                          }}
                        >
                          {/* Số thứ tự + nút Xóa dòng */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>
                              Vật Tư {items.length > 1 ? `#${index + 1}` : ''}
                            </label>
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                style={{ padding: '3px 10px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                              >
                                 Xóa
                              </button>
                            )}
                          </div>

                          {/* Chọn vật tư */}
                          <div style={{ marginBottom: '10px' }}>
                            <select
                              className="inv-input"
                              value={item.productId}
                              onChange={(e) => {
                                const pid = e.target.value;
                                const prod = products.find(p => p.id === pid);
                                updateItemRow(index, { productId: pid, selectedUom: prod?.uom || '' });
                              }}
                              style={inputStyle}
                              required
                            >
                              <option value="" disabled>-- Chọn vật tư --</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock} {p.uom})</option>
                              ))}
                            </select>
                          </div>

                          {/* Số lượng + ĐVT */}
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <label style={labelStyle}>
                                {txnType === 'ADJUST' ? 'Số lượng đếm thực tế' : 'Số Lượng'}
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  className="inv-input"
                                  min="0"
                                  value={txnType === 'ADJUST' ? (item.actualQty ?? '') : item.quantity}
                                  onKeyDown={(e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                                  onChange={(e) => {
                                    const val = Math.max(0, Number(e.target.value));
                                    if (txnType === 'ADJUST') {
                                      updateItemRow(index, { actualQty: val });
                                    } else {
                                      updateItemRow(index, { quantity: val });
                                    }
                                  }}
                                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '800', fontSize: '15px' }}
                                  required
                                />
                                {uomOptions.length > 1 ? (
                                  <select
                                    className="inv-input"
                                    value={item.selectedUom}
                                    onChange={(e) => updateItemRow(index, { selectedUom: e.target.value })}
                                    style={{ ...inputStyle, width: 'auto', minWidth: '110px', fontWeight: '700', backgroundColor: '#ffffff' }}
                                  >
                                    {uomOptions.map(o => (
                                      <option key={o.name} value={o.name}>{o.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span style={{ padding: '10px 12px', backgroundColor: '#e2e8f0', borderRadius: '8px', fontSize: '13px', fontWeight: '800', color: '#334155', whiteSpace: 'nowrap' }}>
                                    {item.selectedUom || product?.uom || '—'}
                                  </span>
                                )}
                              </div>

                              {/* Hint quy đổi */}
                              {txnType !== 'ADJUST' && uomOptions.length > 1 && selectedUomRate !== 1 && item.quantity > 0 && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                                  ≡ {item.quantity * selectedUomRate} {product?.uom} (đơn vị gốc vào kho)
                                </p>
                              )}

                              {/* Hint chênh lệch kiểm kê */}
                              {txnType === 'ADJUST' && diff !== null && item.actualQty !== undefined && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontWeight: '700', color: diff === 0 ? '#166534' : diff > 0 ? '#15803d' : '#dc2626' }}>
                                  Tồn hiện tại: {product!.stock} {product!.uom}
                                  {' → Chênh lệch: '}
                                  <strong>{diff > 0 ? '+' : ''}{diff} {product!.uom}</strong>
                                  {diff === 0 && '  Khớp'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Lý do chênh lệch — chỉ hiện với ADJUST */}
                          {txnType === 'ADJUST' && (
                            <div style={{ marginTop: '10px' }}>
                              <label style={{ ...labelStyle, color: '#94a3b8' }}> Lý do chênh lệch (nếu có)</label>
                              <textarea
                                className="inv-input"
                                value={item.discrepancy_reason ?? ''}
                                onChange={(e) => updateItemRow(index, { discrepancy_reason: e.target.value })}
                                placeholder="VD: Bao bị rách trong bốc vác, rò rỉ do mưa, nhập sai số liệu trước..."
                                rows={2}
                                style={{
                                  ...inputStyle,
                                  resize: 'vertical',
                                  minHeight: '52px',
                                  fontSize: '13px',
                                  color: '#475569',
                                  backgroundColor: diff !== null && diff !== 0 ? '#ffffff' : '#f8fafc',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GHI CHÚ */}
                <div>
                  <label style={labelStyle}>Ghi Chú / Chứng Từ Tham Chiếu</label>
                  <textarea
                    className="inv-input"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="VD: Sà lan số hiệu SG-1234, Hóa đơn VAT 000123"
                    style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                  />
                </div>
              </div>

              {/* FOOTER BUTTONS */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', backgroundColor: '#fafafa' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  style={{ flex: 2, padding: '12px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', boxShadow: `0 4px 14px ${themeColor}44` }}
                >
                   LƯU PHIẾU (CHỜ DUYỆT)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {disassembleOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setDisassembleOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '560px', backgroundColor: '#ffffff', borderRadius: '16px', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ height: '5px', backgroundColor: '#6b21a8' }} />
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', fontWeight: '900', color: '#0f172a' }}>Rã Kho</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Trừ combo, cộng dồn vật tư rời vào tồn kho sau khi duyệt.</p>
              </div>
              <button onClick={() => setDisassembleOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>X</button>
            </div>
            <form onSubmit={handleSaveDisassemble}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '65vh', overflowY: 'auto' }}>
                <div>
                  <label style={labelStyle}>MÃ HÀNG</label>
                  <select className="inv-input" value={disComboId} onChange={(e) => setDisComboId(e.target.value)} style={inputStyle} required>
                    <option value="">-- Chọn combo / hàng đóng gói --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock} {p.uom})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>SỐ LƯỢNG RÃ KHO</label>
                  <input type="number" min="1" className="inv-input" value={disQty}
                    onKeyDown={(e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                    onChange={(e) => setDisQty(Math.max(1, Number(e.target.value)))}
                    style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '800', fontSize: '15px' }}
                    required
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={labelStyle}>VẬT TƯ RỜI</label>
                    <button type="button"
                      onClick={() => setDisBom(prev => [...prev, { product_id: '', product_name: '', quantity: 1, uom: '' }])}
                      style={{ padding: '4px 10px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >+ Thêm dòng</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {disBom.map((row, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <select className="inv-input" value={row.product_id}
                          onChange={(e) => {
                            const pid = e.target.value;
                            setDisBom(prev => prev.map((b, i) => i === idx ? { ...b, product_id: pid } : b));
                          }}
                          style={{ ...inputStyle, margin: 0 }}
                        >
                          <option value="">-- Chọn vật tư --</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.uom})</option>)}
                        </select>
                        <input type="number" min="0.01" step="0.01" value={row.quantity}
                          onKeyDown={(e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                          onChange={(e) => setDisBom(prev => prev.map((b, i) => i === idx ? { ...b, quantity: Math.max(0, Number(e.target.value)) } : b))}
                          placeholder="SL/đơn vị"
                          style={{ ...inputStyle, width: '80px', margin: 0, fontFamily: 'monospace', fontWeight: '700' }}
                        />
                        {disBom.length > 1 && (
                          <button type="button" onClick={() => setDisBom(prev => prev.filter((_, i) => i !== idx))}
                            style={{ padding: '4px 8px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                          >X</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>SL/đơn vị = số lượng vật tư rời trên mỗi đơn vị combo.</p>
                </div>
                <div>
                  <label style={labelStyle}>GHI CHÚ</label>
                  <textarea className="inv-input" value={disNote} onChange={(e) => setDisNote(e.target.value)}
                    placeholder="VD: Tháo pallet combo 01, giao công trình KTX..."
                    style={{ ...inputStyle, minHeight: '56px', resize: 'vertical' }}
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', backgroundColor: '#fafafa' }}>
                <button type="button" onClick={() => setDisassembleOpen(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >HỦY BỎ</button>
                <button type="submit"
                  style={{ flex: 2, padding: '12px', backgroundColor: '#6b21a8', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer' }}
                >LƯU PHIẾU RÃ KHO</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
