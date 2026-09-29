'use client';

import React, { useState, useEffect } from 'react';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredProducts, saveProduct, deleteProduct, VlxdProduct } from '@/lib/vlxdStorage';

export default function AdminProductsPage() {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const [products, setProducts] = useState<VlxdProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VlxdProduct | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('cat-da');
  const [brand, setBrand] = useState('Hòa Phát');
  const [price, setPrice] = useState<number>(100000);
  const [uom, setUom] = useState('m³');
  const [stock, setStock] = useState<number>(500);
  const [minStock, setMinStock] = useState<number>(100);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [spec, setSpec] = useState('');
  const [description, setDescription] = useState('');
  const [imgUrl, setImgUrl] = useState('/placeholder.png');
  const [wasteRate, setWasteRate] = useState<number>(0);

  const loadData = () => {
    setProducts(getStoredProducts());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('vlxd-products-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_products') loadData();
    });

    return () => {
      window.removeEventListener('vlxd-products-updated', handleUpdate);
    };
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('cat-da');
    setBrand('Tân Châu');
    setPrice(320000);
    setUom('m³');
    setStock(500);
    setMinStock(100);
    setIsBestSeller(false);
    setSpec('Tiêu chuẩn kỹ thuật bến bãi');
    setDescription('');
    setImgUrl('/placeholder.png');
    setWasteRate(0);
    setModalOpen(true);
  };

  const openEditModal = (p: VlxdProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category || 'cat-da');
    setBrand(p.brand || 'Khác');
    setPrice(p.price || 0);
    setUom(p.uom || 'm³');
    setStock(p.stock || 0);
    setMinStock(p.min_stock || 50);
    setIsBestSeller(!!p.is_best_seller);
    setSpec(p.spec || '');
    setDescription(p.description || '');
    setImgUrl(p.img || '/placeholder.png');
    setWasteRate(p.waste_rate ?? 0);
    setModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên vật tư!');
      return;
    }

    const payload: VlxdProduct = {
      id: editingProduct ? editingProduct.id : String(Date.now()),
      name: name.trim(),
      category,
      brand: brand.trim(),
      price: Number(price) || 0,
      uom,
      stock: Number(stock) || 0,
      min_stock: Number(minStock) || 0,
      is_best_seller: isBestSeller,
      spec: spec.trim(),
      description: description.trim(),
      img: imgUrl,
      waste_rate: Number(wasteRate) >= 0 ? Number(wasteRate) : 0,
    };

    saveProduct(payload);
    setModalOpen(false);
    alert(editingProduct ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm vật tư mới! Web Khách sẽ hiển thị ngay lập tức.');
  };

  const handleDelete = (id: string, prodName: string) => {
    if (confirm(`Bạn có chắc muốn xóa mặt hàng "${prodName}" khỏi kho bến bãi?`)) {
      deleteProduct(id);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCat === 'all' || p.category === selectedCat;
    return matchSearch && matchCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* TIÊU ĐỀ & NÚT THÊM */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
            Quản Lý Danh Mục Vật Tư Bến Bãi
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Hệ thống danh mục lõi. Dữ liệu được đồng bộ thời gian thực xuyên suốt các phân hệ.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            padding: '11px 20px',
            backgroundColor: themeColor,
            color: '#0f172a',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <span>+</span> THÊM VẬT TƯ MỚI
        </button>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#ffffff', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Tìm tên vật tư, thương hiệu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: '220px', padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
        />

        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#ffffff', cursor: 'pointer' }}
        >
          <option value="all">Tất cả phân loại</option>
          <option value="cat-da">Cát & Đá bến bãi</option>
          <option value="xi-mang">Xi măng các loại</option>
          <option value="sat-thep">Sắt thép xây dựng</option>
          <option value="gach">Gạch tuynel</option>
          <option value="ong-nuoc">Ống nước & phụ kiện</option>
        </select>
      </div>

      {/* BẢNG DANH SÁCH VẬT TƯ */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>TÊN VẬT TƯ</th>
                <th style={{ padding: '12px 16px' }}>DANH MỤC</th>
                <th style={{ padding: '12px 16px' }}>ĐƠN GIÁ</th>
                <th style={{ padding: '12px 16px' }}>TỒN KHO THỰC TẾ</th>
                <th style={{ padding: '12px 16px' }}>HAO HỤT (%)</th>
                <th style={{ padding: '12px 16px' }}>TRẠNG THÁI KHO</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Không có vật tư nào trong bộ lọc.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isStockLow = p.stock <= p.min_stock && p.stock > 0;
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          TH: <strong>{p.brand}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11.5px', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          {p.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '800', fontFamily: 'monospace' }}>
                        {p.price.toLocaleString('vi-VN')}đ <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>/{p.uom}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <strong style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                          {p.stock.toLocaleString('vi-VN')}
                        </strong> {p.uom}
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Tối thiểu: {p.min_stock} {p.uom}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!isOutOfStock && !isStockLow && (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>
                             Đủ tồn kho
                          </span>
                        )}
                        {isStockLow && (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: 'var(--theme-color-15)', color: '#92400e', padding: '3px 8px', borderRadius: '4px' }}>
                             Sắp hết
                          </span>
                        )}
                        {isOutOfStock && (
                          <span style={{ fontSize: '11px', fontWeight: '800', backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '4px' }}>
                             Tạm hết bãi
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {(p.waste_rate !== undefined && p.waste_rate > 0) ? (
                          <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#b45309' }}>{p.waste_rate}%</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>0%</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(p)}
                            style={{ padding: '6px 12px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            style={{ padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setModalOpen(false)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '580px', maxHeight: '92vh', backgroundColor: '#ffffff', borderRadius: '16px', overflowY: 'auto', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', zIndex: 10 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', textTransform: 'uppercase' }}>
                {editingProduct ? 'Sửa thông tin vật tư' : 'Thêm vật tư mới vào bến bãi'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}></button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Tên vật tư bến bãi *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Cát vàng bê tông Tân Châu, Thép phi 10..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Phân loại danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="cat-da">Cát & Đá bến bãi</option>
                    <option value="xi-mang">Xi măng các loại</option>
                    <option value="sat-thep">Sắt thép xây dựng</option>
                    <option value="gach">Gạch tuynel</option>
                    <option value="ong-nuoc">Ống nước & phụ kiện</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Thương hiệu / Mỏ khai thác
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Tân Châu, Hòa Phát, Hà Tiên..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Đơn giá bán cơ sở (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onKeyDown={(e) => {
                      if (['-', 'e', 'E', '+'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setPrice(val < 0 ? 0 : val);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Đơn vị tính cơ sở (UoM)
                  </label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="m³">m³ (Khối)</option>
                    <option value="Bao">Bao (50Kg)</option>
                    <option value="Kg">Kg</option>
                    <option value="Tấn">Tấn</option>
                    <option value="Cây">Cây (11.7m)</option>
                    <option value="Viên">Viên</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Số lượng tồn kho thực tế
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onKeyDown={(e) => {
                      if (['-', 'e', 'E', '+'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setStock(val < 0 ? 0 : val);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Ngưỡng tồn kho tối thiểu (Cảnh báo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStock}
                    onKeyDown={(e) => {
                      if (['-', 'e', 'E', '+'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMinStock(val < 0 ? 0 : val);
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Tỷ Lệ Hao Hụt (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={wasteRate}
                  onKeyDown={(e) => { if (['-', 'e', 'E', '+'].includes(e.key)) e.preventDefault(); }}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value)));
                    setWasteRate(val);
                  }}
                  placeholder="Ví dụ: 2.5 cho thép cắt, 0.5 cho xi măng..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                   Áp dụng cho phiếu xuất và kiểm kê — 0% nếu như không có hao hụt định mức.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Thông số quy cách (Spec)
                </label>
                <input
                  type="text"
                  value={spec}
                  onChange={(e) => setSpec(e.target.value)}
                  placeholder="Ví dụ: Mác thép CB400V, Kích thước 10x28mm..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    checked={isBestSeller}
                    onChange={(e) => setIsBestSeller(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: themeColor }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Đánh dấu là "Sản Phẩm Bán Chạy" (Hiển thị tab nổi bật Web 1)
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '12px', backgroundColor: themeColor, color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                  {editingProduct ? 'CẬP NHẬT VẬT TƯ' : 'LƯU VẬT TƯ MỚI'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
