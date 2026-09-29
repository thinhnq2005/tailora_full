'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ProductSpecTable from '@/components/products/ProductSpecTable';
import TechnicalDocsPanel from '@/components/products/TechnicalDocsPanel';
import CommentSection from '@/components/comments/CommentSection';
import { useTenant } from '@/app/context/TenantContext';
import { getStoredProducts, VlxdProduct } from '@/lib/vlxdStorage';
import { getProductImageUrl } from '@/utils/imageHelper';
import { Package, ShieldCheck, MapPin, Building, Tag, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProductDetailData extends VlxdProduct {
  sku: string;
  supplier: string;
  origin: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = React.use(params);
  const productIdStr = unwrappedParams.id;

  const { tenant } = useTenant() as { tenant: any };
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';
  const zaloContactUrl = tenant?.zalo_oa_url || 'https://zalo.me';
  const officeAddress = tenant?.office_address || 'Bến bãi ERP TAILORA TECH, Bờ Kè Sông Hậu, Ninh Kiều, Cần Thơ';

  useEffect(() => {
    function loadProductDetail() {
      setLoading(true);
      try {
        const storedList = getStoredProducts();
        const found = storedList.find((p: any) => String(p.id) === String(productIdStr));

        if (found) {
          const realImageUrl = getProductImageUrl(found.id) || found.img || '/placeholder.png';
          
          // Gán thông tin chuẩn doanh nghiệp
          const origins: Record<string, string> = {
            'xi-mang': 'Nhà Máy Xi Măng Kiên Lương / Tây Ninh',
            'sat-thep': 'Khu Liên Hợp Gang Thép Hòa Phát Dung Quất',
            'gach': 'Nhà Máy Gạch Tuynel Bình Dương',
            'cat-da': 'Mỏ Cát Tân Châu / Mỏ Đá Thường Tân Đồng Nai',
            'ong-nuoc': 'Công Ty CP Nhựa Thiếu Niên Tiền Phong'
          };

          setProduct({
            ...found,
            img: realImageUrl,
            sku: `VLXD-${found.category.toUpperCase().slice(0, 3)}-${found.id.padStart(4, '0')}`,
            supplier: found.brand || 'Tổng Đại Lý ERP TAILORA TECH',
            origin: origins[found.category] || 'Nội địa Việt Nam - Chứng nhận chất lượng bến bãi'
          });
        }
      } catch (err) {
        console.error('Lỗi nạp thông tin vật tư:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProductDetail();
  }, [productIdStr]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontWeight: '700', color: '#475569' }}>Đang nạp thông số kỹ thuật vật tư bến bãi...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', gap: '14px' }}>
        <p style={{ fontWeight: '700', color: '#dc2626' }}>Vật tư hiện tại không tồn tại trong kho hoặc đã hạ bãi.</p>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600', fontSize: '13px' }}>← Quay lại danh mục vật tư</a>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '95px 16px 60px 16px', boxSizing: 'border-box' }}>
        
        {/* BREADCRUMB QUẢN TRỊ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '12px', color: '#64748b' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none' }}>Trang chủ</a>
          <span>/</span>
          <a href="/#vattu" style={{ color: '#64748b', textDecoration: 'none' }}>Danh mục vật tư</a>
          <span>/</span>
          <span style={{ color: '#0f172a', fontWeight: '700' }}>{product.name}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }} className="desktop-split">
          
          {/* CỘT TRÁI: HÌNH ẢNH + THÔNG TIN CƠ BẢN + NÚT LIÊN HỆ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              
              {/* Ảnh vật tư */}
              <div style={{ height: '320px', backgroundColor: '#f8fafc', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
                <img
                  src={product.img}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.png';
                  }}
                />
              </div>

              {/* Tên & Giá niêm yết */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px' }}>
                  {product.category.toUpperCase()}
                </span>
                <h1 style={{ fontSize: '20px', fontWeight: '800', margin: '8px 0', color: '#0f172a', lineHeight: '1.4' }}>
                  {product.name}
                </h1>
                
                <div style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'monospace', color: '#0f172a', margin: '10px 0' }}>
                  {product.price > 0 ? `${product.price.toLocaleString('vi-VN')}đ` : 'Giá thỏa thuận theo lô'}
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 'normal' }}> /{product.uom}</span>
                </div>

                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  {product.description || 'Vật tư xây dựng tiêu chuẩn cao, cấp phép lưu hành toàn quốc và kiểm định định kỳ tại bến bãi.'}
                </p>
              </div>

              {/* THÔNG TIN CƠ BẢN (THEO YÊU CẦU MỤC 9) */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '18px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.4px' }}>
                  Thông Tin Cơ Bản Sản Phẩm
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Mã sản phẩm (SKU):</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{product.sku}</strong>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Nhóm sản phẩm:</span>
                    <strong style={{ color: '#0f172a' }}>{product.category.toUpperCase()}</strong>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Nhà cung cấp / Thương hiệu:</span>
                    <strong style={{ color: '#0f172a' }}>{product.supplier}</strong>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Tình trạng tồn kho:</span>
                    <strong style={{ color: '#16a34a' }}>{product.stock.toLocaleString('vi-VN')} {product.uom} sẵn bãi</strong>
                  </div>

                  <div style={{ gridColumn: 'span 2', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '4px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Xuất xứ sản xuất:</span>
                    <strong style={{ color: '#0f172a' }}>{product.origin}</strong>
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={zaloContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--theme-color)',
                      color: '#111827',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '900',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      boxShadow: '0 4px 12px var(--theme-color-15)'
                    }}
                  >
                    Báo giá hợp đồng thầu
                  </button>
                </a>
              </div>

            </div>

            {/* BÌNH LUẬN & THẢO LUẬN REALTIME (MỤC 10) */}
            <CommentSection
              targetId={String(product.id)}
              targetType="product"
              title={`Thảo luận kỹ thuật: ${product.name}`}
            />

          </div>

          {/* CỘT PHẢI: THÔNG SỐ KỸ THUẬT & TÀI LIỆU PDF (CO, CQ, ISO, CATALOGUE) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* THÔNG TIN BẾN BÃI & TRẠM CÂN */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={20} color="#0f172a" />
              <div>
                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  Bến bãi xuất hàng trực tiếp:
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {officeAddress}
                </div>
              </div>
            </div>

            {/* BẢNG THÔNG SỐ KỸ THUẬT (MỤC 9) */}
            <ProductSpecTable
              category={product.category}
              specId={String(product.id)}
              macId="CB300"
              productName={product.name}
            />

            {/* TÀI LIỆU PDF: UPLOAD/DOWNLOAD/PREVIEW (MỤC 9) */}
            <TechnicalDocsPanel
              productName={product.name}
              themeColor={themeColor}
            />

          </div>

        </div>

      </main>

      <style jsx global>{`
        @media (min-width: 992px) {
          .desktop-split {
            grid-template-columns: 1.1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}