'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/layout/Navbar';
import OcrUploadZone from '../components/ai/ocr-upload/OcrUploadZone';
import OcrTable from '../components/ai/ocr-table/OcrTable';
import FleetLogisticsCard from '../components/inventory/FleetLogisticsCard';
import ComboSection from '../components/inventory/ComboSection';
import AIChatBox from '../components/chatbot/AIChatBox';
import GoogleAuthModal from '../components/ui/modal/GoogleAuthModal';
import { useTenant } from './context/TenantContext';
import { useCart } from './context/CartContext';
import { getStoredProducts, VlxdProduct } from '@/lib/vlxdStorage';
import { getProductImageUrl } from '@/utils/imageHelper';

const INLINE_FALLBACK_PRODUCT = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="100%" height="100%" fill="%23f8fafc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="%23cbd5e1">BẾN BÃI CHƯA CẬP NHẬT ẢNH</text></svg>';


const ITEMS_PER_PAGE = 8;

interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export default function HomePage() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<VlxdProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'best_seller'>('all');

  const [openDropdown, setOpenDropdown] = useState<'brand' | 'price' | null>(null);
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<VlxdProduct | null>(null);
  const [selectedUom, setSelectedUom] = useState<string>('');
  const [modalQty, setModalQty] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string>('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ocrData, setOcrData] = useState<any[]>([]);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Reviews cho Modal Xem Nhanh
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authType, setAuthType] = useState<'B2B' | 'B2C'>('B2C');

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const getContrastColor = (hexColor: string) => {
    const cleanHex = hexColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  const buyButtonTextColor = getContrastColor(themeColor);
  const activeTabTextColor = getContrastColor(themeColor);

  const brandOptions = [
    { value: 'all', label: 'Tất cả thương hiệu' },
    { value: 'Hòa Phát', label: 'Thép Hòa Phát' },
    { value: 'Hà Tiên', label: 'Xi măng Hà Tiên' },
    { value: 'Insee', label: 'Xi măng Insee' },
    { value: 'Tân Châu', label: 'Cát Tân Châu' },
    { value: 'Đồng Nai', label: 'Đá Đồng Nai' }
  ];

  const priceOptions = [
    { value: 'all', label: 'Tất cả mức giá' },
    { value: 'low', label: 'Dưới 100.000đ' },
    { value: 'mid', label: '100.000đ - 400.000đ' },
    { value: 'high', label: 'Trên 400.000đ' }
  ];

  const banners: string[] = [];

  // Nạp dữ liệu sản phẩm từ vlxdStorage & lắng nghe cập nhật real-time
  const loadProducts = () => {
    setProductsLoading(true);
    const list = getStoredProducts();
    setProducts(list);
    setProductsLoading(false);
  };

  useEffect(() => {
    loadProducts();

    const handleProductsUpdated = (e: any) => {
      setProducts(e.detail || getStoredProducts());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vlxd_products') {
        loadProducts();
      }
    };

    window.addEventListener('vlxd-products-updated', handleProductsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('vlxd-products-updated', handleProductsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(event.target as Node) &&
          priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, priceRange, searchTerm, activeViewTab]);

  // Quản lý Modal Xem Nhanh
  useEffect(() => {
    if (selectedProduct) {
      setSelectedUom(selectedProduct.uom);
      setModalQty(1);

      // Load reviews
      if (typeof window !== 'undefined') {
        const rawReviews = localStorage.getItem(`vlxd_reviews_${selectedProduct.id}`);
        if (rawReviews) {
          try {
            setReviews(JSON.parse(rawReviews));
          } catch {
            setReviews([]);
          }
        } else {
          setReviews([
            {
              id: 'rev_1',
              author: 'Kỹ sư Tuấn (Nhà thầu Tây Đô)',
              rating: 5,
              comment: 'Vật tư sạch chuẩn cát bê tông Tân Châu, giao xe ben đủ tải trạm cân.',
              date: '2 ngày trước'
            }
          ]);
        }
      }
    }
  }, [selectedProduct]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !reviewAuthor.trim() || !reviewComment.trim()) return;

    const newRev: ReviewItem = {
      id: `rev_${Date.now()}`,
      author: reviewAuthor.trim(),
      rating: reviewRating,
      comment: reviewComment.trim(),
      date: 'Vừa xong'
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`vlxd_reviews_${selectedProduct.id}`, JSON.stringify(updated));
    }
    setReviewAuthor('');
    setReviewComment('');
    showToast('Đã gửi đánh giá thành công!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleQuickAddToCart = (product: VlxdProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(product, 1, product.uom);
    showToast(`Đã thêm vào giỏ: 1 ${product.uom} ${product.name}`);
  };

  const handleModalAddToCart = () => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, modalQty, selectedUom);
    showToast(`Đã thêm vào toa: ${modalQty} ${selectedUom} ${selectedProduct.name}`);
    setSelectedProduct(null);
  };

  const handleContactZalo = () => {
    if (tenant?.zalo_oa_url) {
      window.open(tenant.zalo_oa_url, '_blank');
    } else {
      window.open('https://zalo.me', '_blank');
    }
  };

  // Danh mục động
  const categoriesList = [
    { id: 'all', name: 'TẤT CẢ VẬT TƯ' },
    { id: 'cat-da', name: 'CÁT & ĐÁ BẾN BÃI' },
    { id: 'xi-mang', name: 'XI MĂNG CÁC LOẠI' },
    { id: 'sat-thep', name: 'SẮT THÉP XÂY DỰNG' },
    { id: 'gach', name: 'GẠCH TUYNEL' },
    { id: 'ong-nuoc', name: 'ỐNG NƯỚC' }
  ];

  // Lọc sản phẩm
  const filteredProducts = products.filter(p => {
    const pNameLower = p.name.toLowerCase();
    const matchSearch = pNameLower.includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchBrand = selectedBrand === 'all' || p.brand.toLowerCase().includes(selectedBrand.toLowerCase());

    let matchPrice = true;
    if (priceRange === 'low') matchPrice = p.price < 100000;
    else if (priceRange === 'mid') matchPrice = p.price >= 100000 && p.price <= 400000;
    else if (priceRange === 'high') matchPrice = p.price > 400000;

    let matchTab = true;
    if (activeViewTab === 'best_seller') {
      matchTab = p.is_best_seller === true;
    }

    return matchSearch && matchCat && matchBrand && matchPrice && matchTab;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar onCartClick={() => router.push('/cart')} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          borderLeft: `4px solid ${themeColor}`
        }}>
          {toastMessage}
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <section style={{ maxWidth: '1440px', margin: '0 auto', padding: '85px 16px 20px 16px', boxSizing: 'border-box' }}>
        <div
          className="hero-banner-container"
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#0f172a',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }} />

          {/* PHẦN 3: DARK OVERLAY (rgba(0,0,0,0.35)) LÀM NỔI BẬT CHỮ */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.2) 100%)',
              zIndex: 2,
              pointerEvents: 'none'
            }}
          />

          {/* NỘI DUNG VĂN BẢN (Z-INDEX CAO HƠN OVERLAY) */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '32px 40px',
              color: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            <span style={{ backgroundColor: 'var(--theme-color)', color: '#0F172A', padding: '6px 14px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', width: 'fit-content', marginBottom: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
              HỆ THỐNG PHÂN PHỐI TRỰC TIẾP TẠI BẾN BÃI CẦN THƠ
            </span>
            <h1 style={{ color: 'var(--theme-color)', fontSize: '32px', fontWeight: '900', margin: '0 0 12px 0', textTransform: 'uppercase', lineHeight: '1.2', maxWidth: '700px', letterSpacing: '0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5)' }}>
              {tenant?.brand_name || 'ERP TAILORA TECH'}
            </h1>
            <p style={{ fontSize: '15px', color: '#ffffff', margin: 0, maxWidth: '580px', lineHeight: '1.6', textShadow: '0 2px 8px rgba(0,0,0,0.7)', fontWeight: '500' }}>
              {tenant?.about_us_short || 'Cung ứng vật tư thô Cát bê tông, Đá 1x2, Xi măng, Sắt thép chất lượng tiêu chuẩn nhà thầu.'}
            </p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '24px', flexWrap: 'wrap' }}>
              <a href="#vattu" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '12px 24px', backgroundColor: 'var(--theme-color)', color: '#111827', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', boxShadow: '0 4px 14px var(--theme-color-15)', transition: 'all 0.2s' }}>
                  XEM DANH MỤC VẬT TƯ
                </button>
              </a>
              <a href="/orders" style={{ textDecoration: 'none' }}>
                <button style={{ padding: '12px 24px', backgroundColor: 'rgba(15,23,42,0.65)', color: 'var(--theme-color)', border: '1.5px solid var(--theme-color)', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.2s' }}>
                  ĐƠN HÀNG
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMBO VẬT TƯ CÔNG TRÌNH (KIT BOM) ===== */}
      {/* Section hiển thị 3 gói vật tư trọn bộ với tính năng nội suy diện tích */}
      <div style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        <ComboSection />
      </div>

      {/* MAIN CATALOG SECTION */}
      <section id="vattu" style={{ maxWidth: '1440px', margin: '0 auto', padding: '10px 16px 40px 16px', boxSizing: 'border-box' }}>
        
        {/* TABS: TẤT CẢ VẬT TƯ vs SẢN PHẨM BÁN CHẠY */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveViewTab('all')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                border: activeViewTab === 'all' ? 'none' : '1px solid #cbd5e1',
                backgroundColor: activeViewTab === 'all' ? 'var(--theme-color)' : '#ffffff',
                color: activeViewTab === 'all' ? '#111827' : '#475569',
                textTransform: 'uppercase'
              }}
            >
              TẤT CẢ VẬT TƯ ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('best_seller')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                border: activeViewTab === 'best_seller' ? 'none' : '1px solid #cbd5e1',
                backgroundColor: activeViewTab === 'best_seller' ? 'var(--theme-color-15)' : '#ffffff',
                color: activeViewTab === 'best_seller' ? 'var(--theme-color-dark)' : '#475569',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span></span> SẢN PHẨM BÁN CHẠY ({products.filter(p => p.is_best_seller).length})
            </button>
          </div>

          {/* Ô TÌM KIẾM NHANH */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              placeholder="Tìm kiếm cát, đá, xi măng, sắt thép..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                width: '260px',
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* BỘ LỌC DANH MỤC & THƯƠNG HIỆU */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: selectedCategory === cat.id ? `2px solid ${themeColor}` : '1px solid #e2e8f0',
                backgroundColor: selectedCategory === cat.id ? '#ffffff' : '#ffffff',
                color: selectedCategory === cat.id ? themeColor : '#475569',
                boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* DANH SÁCH SẢN PHẨM GRID */}
        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px' }}>
            Đang tải dữ liệu kho bến bãi...
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            Không tìm thấy vật tư phù hợp. Hãy thử đổi từ khóa hoặc bộ lọc!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {paginatedProducts.map((p) => {
              const imgUrl = getProductImageUrl(p.id) || p.img || '/placeholder.png';
              const isStockLow = p.stock <= p.min_stock && p.stock > 0;
              const isOutOfStock = p.stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.borderColor = themeColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '170px', backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
                    <img
                      src={imgUrl}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = INLINE_FALLBACK_PRODUCT; }}
                    />
                    {p.is_best_seller && (
                      <span style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'var(--theme-color)', color: '#0f172a', fontSize: '10px', fontWeight: '900', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                         BÁN CHẠY
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      {/* BADGE TỒN KHO REAL-TIME */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        {!isOutOfStock && !isStockLow && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 7px', borderRadius: '4px' }}>
                             Sẵn bãi ({p.stock.toLocaleString('vi-VN')} {p.uom})
                          </span>
                        )}
                        {isStockLow && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', backgroundColor: 'var(--theme-color-15)', color: '#92400e', padding: '2px 7px', borderRadius: '4px' }}>
                             Sắp hết ({p.stock} {p.uom})
                          </span>
                        )}
                        {isOutOfStock && (
                          <span style={{ fontSize: '10.5px', fontWeight: '800', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 7px', borderRadius: '4px' }}>
                             Tạm hết bến bãi
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {p.brand}</span>
                      </div>

                      <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                        {p.name}
                      </h3>
                      {p.spec && (
                        <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 10px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.spec}
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            {p.price.toLocaleString('vi-VN')}đ
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'system-ui, -apple-system, sans-serif' }}>/ {p.uom}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/products/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            padding: '0 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            height: '32px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Chi tiết
                        </a>

                        <button
                          type="button"
                          onClick={(e) => handleQuickAddToCart(p, e)}
                          style={{
                            backgroundColor: themeColor,
                            color: buyButtonTextColor,
                            border: 'none',
                            padding: '0 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            height: '32px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          + Giỏ hàng
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PHÂN TRANG */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '30px' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              TRƯỚC
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: page === currentPage ? 'none' : '1px solid #cbd5e1',
                  backgroundColor: page === currentPage ? themeColor : '#ffffff',
                  color: page === currentPage ? activeTabTextColor : '#0f172a',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            >
              SAU
            </button>
          </div>
        )}

        {/* KHUNG AI OCR SỐ HÓA TOA HÀNG VIẾT TAY */}
        <div style={{ marginTop: '50px', backgroundColor: '#ffffff', border: `2px solid ${themeColor}`, borderRadius: '16px', padding: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', margin: '0 0 16px 0', letterSpacing: '0.5px' }}>
             SỐ HÓA TOA HÀNG (OCR)
          </h2>
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
  <OcrUploadZone
    onMockReady={(mockToa) => setOcrData(mockToa)}
    onOcrSuccess={(cleanResult) => {
      // Hàm hỗ trợ map giá CSDL mờ cho từng item
      const findDbPrice = (itemName: string, itemId: any) => {
        const nameLower = (itemName || '').toLowerCase().trim();
        
        // 1. Tìm chính xác theo ID hoặc Tên
        const exact = products?.find(
          (p) => String(p.id) === String(itemId) || p.name.toLowerCase().trim() === nameLower
        );
        if (exact?.price) return exact.price;

        // 2. Tìm mờ theo từ khóa
        if (nameLower.includes('1x2') || nameLower.includes('1*2')) return products?.find((p) => p.name.includes('1x2'))?.price;
        if (nameLower.includes('cát') || nameLower.includes('cat')) return products?.find((p) => p.name.includes('Cát'))?.price;
        if (nameLower.includes('xi măng') || nameLower.includes('hà tiên')) return products?.find((p) => p.name.includes('Hà Tiên') || p.name.includes('Xi'))?.price;
        if (nameLower.includes('12') || nameLower.includes('d12')) return products?.find((p) => p.name.includes('12'))?.price;
        if (nameLower.includes('10') || nameLower.includes('d10') || nameLower.includes('gr40')) return products?.find((p) => p.name.includes('10'))?.price;

        return products?.[0]?.price || 100000;
      };

      const formatted = cleanResult.items.map((it, idx) => {
        // Ưu tiên it.unitPrice -> Nếu bằng 0 thì map từ CSDL products -> Fallback 100k
        const matchedPrice = it.unitPrice && it.unitPrice > 0 ? it.unitPrice : findDbPrice(it.name, it.id);

        return {
          selected_item: {
            id: it.id || `ocr-${idx}`,
            name: it.name,
            price: matchedPrice,
            uom: it.uom || 'đơn vị'
          },
          quantity: it.quantity || 1,
          alternatives: products
            ?.filter((p) => String(p.id) !== String(it.id))
            .slice(0, 4) || []
        };
      });

      setOcrData(formatted);
    }}
    tenant={tenant}
    products={products}
  />

  {ocrData.length > 0 && (
    <OcrTable
      scannedData={ocrData}
      tenant={tenant}
      allProductsList={products}
    />
  )}
</div>
        </div>

        {/* ĐỘI XE & ĐIỀU PHỐI VẬN CHUYỂN */}
        <div style={{ marginTop: '30px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', margin: '0 0 16px 0' }}>
            HỆ THỐNG ĐỘI XE BEN & XE TẢI BẾN BÃI
          </h2>
          <FleetLogisticsCard />
        </div>
      </section>

      {/* MODAL XEM NHANH CHI TIẾT & ĐA UOM & REVIEW */}
      {selectedProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div style={{ position: 'fixed', inset: 0 }} onClick={() => setSelectedProduct(null)} />
          <div style={{ position: 'relative', width: '100%', maxWidth: '600px', maxHeight: '90vh', backgroundColor: '#ffffff', borderRadius: '16px', overflowY: 'auto', padding: '24px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', zIndex: 10 }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: themeColor, textTransform: 'uppercase' }}>
                  {selectedProduct.brand} • {selectedProduct.category.toUpperCase()}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: '4px 0 0 0' }}>
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                
              </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '16px', flexWrap: 'wrap' }}>
              <div style={{ width: '160px', height: '140px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                <img
                  src={getProductImageUrl(selectedProduct.id) || selectedProduct.img || '/placeholder.png'}
                  alt={selectedProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = INLINE_FALLBACK_PRODUCT; }}
                />
              </div>

              <div style={{ flex: 1, minWidth: '220px' }}>
                <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                  {selectedProduct.description || selectedProduct.spec || 'Vật tư tiêu chuẩn xuất bến trực tiếp.'}
                </p>

                {/* CHỌN ĐA ĐƠN VỊ TÍNH (UOM) */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '800', color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Đơn vị tính (UoM):
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(selectedProduct.uom_options && selectedProduct.uom_options.length > 0
                      ? selectedProduct.uom_options.map(o => o.name)
                      : [selectedProduct.uom]
                    ).map((uomName) => (
                      <button
                        key={uomName}
                        type="button"
                        onClick={() => setSelectedUom(uomName)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          border: selectedUom === uomName ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                          backgroundColor: selectedUom === uomName ? '#fffbeb' : '#ffffff',
                          color: selectedUom === uomName ? '#0f172a' : '#64748b'
                        }}
                      >
                        {uomName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SỐ LƯỢNG & TỔNG TIỀN */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block' }}>Số lượng:</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <button
                        onClick={() => setModalQty(q => Math.max(1, q - 1))}
                        style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={modalQty}
                        onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: '50px', height: '28px', textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '4px', fontWeight: 'bold' }}
                      />
                      <button
                        onClick={() => setModalQty(q => q + 1)}
                        style={{ width: '28px', height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#f8fafc', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Thành tiền tạm tính:</span>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                      {(selectedProduct.price * modalQty).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleModalAddToCart}
                    style={{ flex: 1, padding: '12px', backgroundColor: themeColor, color: buyButtonTextColor, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    THÊM VÀO TOA HÀNG
                  </button>
                  <button
                    onClick={() => {
                      handleModalAddToCart();
                      router.push('/checkout');
                    }}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}
                  >
                    ĐẶT GIAO NGAY
                  </button>
                </div>
              </div>
            </div>

            {/* MOCK REVIEWS / BÌNH LUẬN SẢN PHẨM */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', margin: '0 0 12px 0', color: '#0f172a' }}>
                Đánh giá từ nhà thầu & công trình ({reviews.length})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '140px', overflowY: 'auto', marginBottom: '14px' }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{ backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#0f172a' }}>{r.author}</strong>
                      <span style={{ color: 'var(--theme-color)' }}>{''.repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0, color: '#475569' }}>{r.comment}</p>
                    <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>{r.date}</span>
                  </div>
                ))}
              </div>

              {/* FORM GỬI ĐÁNH GIÁ MỚI */}
              <form onSubmit={handleAddReview} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Tên / Đơn vị thầu..."
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  style={{ width: '150px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  required
                />
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value={5}>5 sao </option>
                  <option value={4}>4 sao </option>
                  <option value={3}>3 sao </option>
                </select>
                <input
                  type="text"
                  placeholder="Nhận xét chất lượng vật tư..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{ flex: 1, minWidth: '160px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  required
                />
                <button
                  type="submit"
                  style={{ padding: '8px 14px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Gửi
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ backgroundColor: '#ffffff', borderTop: `4px solid ${themeColor}`, padding: '36px 16px', boxSizing: 'border-box', marginTop: '40px' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
          <h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '900', textTransform: 'uppercase' }}>
            {tenant?.footer_copyright || 'ERP TAILORA TECH - CẦN THƠ'}
          </h4>
          <p style={{ margin: '0 0 10px 0' }}>
            {tenant?.office_address || 'Bờ Kè Sông Hậu, Quận Ninh Kiều, Thành Phố Cần Thơ'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Hotline điều phối xe: <strong>{tenant?.hotline_support || '0907.123.456'}</strong> • Giờ làm việc: 06:30 - 18:00
          </p>
        </div>
      </footer>

      <AIChatBox isOpen={isChatOpen} onToggleOpen={setIsChatOpen} tenant={tenant} products={products} />
      <GoogleAuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} type={authType} />

      <style jsx global>{`
        .hero-banner-container {
          height: 500px;
        }
        @media (max-width: 768px) {
          .hero-banner-container {
            height: 350px;
          }
        }
      `}</style>
    </div>
  );
}