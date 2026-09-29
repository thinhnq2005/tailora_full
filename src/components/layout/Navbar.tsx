'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import GoogleAuthModal from '../ui/modal/GoogleAuthModal';
import { useTenant } from '@/app/context/TenantContext';
import { useCart } from '@/app/context/CartContext';
import { getStoredProducts, VlxdProduct } from '@/lib/vlxdStorage';
import { checkActiveSessionAction, clearSessionAction } from '@/app/action/authActions';


const AuthModalSafe = GoogleAuthModal as React.ComponentType<any>;

interface CategoryTreeData {
  id: string;
  name: string;
  items: { id: string; name: string }[];
}

interface NavbarProps {
  onCartClick?: () => void;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
}

export default function Navbar({ searchTerm, setSearchTerm }: NavbarProps): React.JSX.Element {
  const currentPath = usePathname();
  const { tenant } = useTenant();
  const { totalCount } = useCart();

  const [categories, setCategories] = useState<CategoryTreeData[]>([]);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authType, setAuthType] = useState<'B2B' | 'B2C'>('B2C');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const openAuth = (type: 'B2B' | 'B2C') => {
    setAuthType(type);
    setAuthModalOpen(true);
    setUserOpen(false);
  };

  const handleUserLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('odoo_session_id');
    }
    await clearSessionAction();
    setCurrentUser(null);
    setUserOpen(false);
    window.location.href = '/';
  };

  useEffect(() => {
    async function syncSessionProfile() {
      try {
        const session = await checkActiveSessionAction();
        if (session && session.authenticated && session.user) {
          setCurrentUser({
            name: session.user.name,
            email: session.user.email
          });
        }
      } catch {
        // Safe fallback
      }
    }
    syncSessionProfile();
  }, []);

  const loadCategories = () => {
    const prods = getStoredProducts();
    const catMap: Record<string, { id: string; name: string; items: { id: string; name: string }[] }> = {
      'cat-da': { id: 'cat-da', name: 'CÁT & ĐÁ XÂY DỰNG', items: [] },
      'xi-mang': { id: 'xi-mang', name: 'XI MĂNG CÁC LOẠI', items: [] },
      'sat-thep': { id: 'sat-thep', name: 'SẮT THÉP XÂY DỰNG', items: [] },
      'gach': { id: 'gach', name: 'GẠCH TUYNEL & GẠCH ỐNG', items: [] },
      'ong-nuoc': { id: 'ong-nuoc', name: 'ỐNG NƯỚC & PHỤ KIỆN', items: [] }
    };

    prods.forEach(p => {
      const cat = p.category || 'cat-da';
      if (!catMap[cat]) {
        catMap[cat] = { id: cat, name: cat.toUpperCase(), items: [] };
      }
      catMap[cat].items.push({ id: p.id, name: p.name });
    });

    setCategories(Object.values(catMap));
  };

  useEffect(() => {
    loadCategories();
    const handleProductsUpdated = () => loadCategories();
    window.addEventListener('vlxd-products-updated', handleProductsUpdated);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_products') loadCategories();
    });
    return () => {
      window.removeEventListener('vlxd-products-updated', handleProductsUpdated);
    };
  }, []);

  const activeProducts = categories.find(c => c.id === activeSubMenu)?.items || [];
  const displayName = tenant?.brand_name || 'ERP TAILORA TECH';

  return (
    <>
      <nav style={{ width: '100%', backgroundColor: '#0F172A', borderBottom: '3px solid var(--theme-color)', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', boxShadow: '0 4px 25px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', boxSizing: 'border-box' }}>

          {/* LOGO & CỤM MENU TRÁI */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
            <button
              type="button"
              className="mobile-burger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', border: '1.5px solid var(--theme-color)', color: 'var(--theme-color)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', padding: '5px 8px', display: 'none', borderRadius: '6px', flexShrink: 0 }}
            >
              MENU
            </button>

            <a href="/" style={{ fontWeight: '900', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>

              <span style={{
                color: 'var(--theme-color)',
                lineHeight: '1.1',
                fontWeight: '900',
                fontSize: '14px',
                letterSpacing: '0.5px',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {displayName}
              </span>
            </a>

            {/* DROPDOWN DANH MỤC VẬT TƯ (DESKTOP) */}
            <div style={{ position: 'relative' }} className="desktop-nav-links" onMouseLeave={() => setActiveSubMenu(null)}>
              <button
                type="button"
                className="navbar-menu-btn"
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setActiveSubMenu(null);
                }}
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: menuOpen ? '#111827' : 'var(--theme-color)',
                  backgroundColor: menuOpen ? 'var(--theme-color)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
              >
                Danh mục vật tư ▾
              </button>

              {menuOpen && (
                <div style={{ display: 'flex', position: 'absolute', left: 0, marginTop: '8px', backgroundColor: '#0F172A', border: '1.5px solid var(--theme-color)', borderRadius: '12px', zIndex: 150, boxShadow: '0 20px 45px rgba(0,0,0,0.5)', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <div style={{ position: 'fixed', inset: 0, zIndex: -1 }} onClick={() => setMenuOpen(false)} />

                  <div style={{ width: '250px', padding: '8px 0', borderRight: activeSubMenu && activeProducts.length > 0 ? '1px solid #1e293b' : 'none', boxSizing: 'border-box' }}>
                    <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                      {categories.map((cat) => {
                        const isRowActive = activeSubMenu === cat.id;
                        return (
                          <div
                            key={cat.id}
                            onMouseEnter={() => setActiveSubMenu(cat.id)}
                            className="navbar-dropdown-row"
                            style={{
                              padding: '10px 14px',
                              color: isRowActive ? '#111827' : 'var(--theme-color)',
                              fontSize: '12.5px',
                              fontWeight: '800',
                              letterSpacing: '0.3px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: isRowActive ? 'var(--theme-color)' : 'transparent',
                              transition: 'all 0.15s'
                            }}
                          >
                            <span>{cat.name}</span>
                            <span style={{ fontSize: '10px', color: isRowActive ? '#111827' : '#fef08a' }}>
                              {cat.items.length > 0 ? '' : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {activeSubMenu && activeProducts.length > 0 && (
                    <div style={{ width: '260px', padding: '8px 0', boxSizing: 'border-box', backgroundColor: '#1e293b' }}>
                      <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                        {activeProducts.map((prod) => (
                          <a
                            key={prod.id}
                            href={`/products/${prod.id}`}
                            onClick={() => setMenuOpen(false)}
                            className="navbar-sub-link"
                            style={{ display: 'block', color: '#f8fafc', textDecoration: 'none', padding: '10px 16px', fontWeight: '600', fontSize: '12.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'all 0.15s' }}
                          >
                            • {prod.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', fontSize: '13px', fontWeight: '800', alignItems: 'center' }} className="desktop-nav-links">
              <a
                href="/#vattu"
                className="navbar-menu-btn"
                style={{
                  color: currentPath === '/' ? '#111827' : 'var(--theme-color)',
                  backgroundColor: currentPath === '/' ? 'var(--theme-color)' : 'transparent',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  transition: 'all 0.2s'
                }}
              >
                Vật tư bến bãi
              </a>
              <a
                href="/portal/showcase"
                className="navbar-menu-btn"
                style={{
                  color: currentPath === '/portal/showcase' ? '#111827' : 'var(--theme-color)',
                  backgroundColor: currentPath === '/portal/showcase' ? 'var(--theme-color)' : 'transparent',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  transition: 'all 0.2s'
                }}
              >
                Công trình tiêu biểu
              </a>
              <a
                href="/orders"
                className="navbar-menu-btn"
                style={{
                  color: currentPath.startsWith('/orders') ? '#111827' : 'var(--theme-color)',
                  backgroundColor: currentPath.startsWith('/orders') ? 'var(--theme-color)' : 'transparent',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  transition: 'all 0.2s'
                }}
              >
                Đơn hàng
              </a>
              <a
                href="/portal/ledger"
                className="navbar-menu-btn"
                style={{
                  color: currentPath === '/portal/ledger' ? '#111827' : 'var(--theme-color)',
                  backgroundColor: currentPath === '/portal/ledger' ? 'var(--theme-color)' : 'transparent',
                  textDecoration: 'none',
                  padding: '7px 12px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  transition: 'all 0.2s'
                }}
              >
                B2B
              </a>
            </div>
          </div>

          {/* CỤM MENU PHẢI: GIỎ HÀNG + ADMIN + LOGIN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {/* NÚT GIỎ HÀNG */}
            <a
              href="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                backgroundColor: 'var(--theme-color-15)',
                border: '1.5px solid var(--theme-color)',
                padding: '5px 10px',
                borderRadius: '8px',
                color: 'var(--theme-color)',
                fontWeight: '800',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
              className="navbar-menu-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <img src="/cart_icon.png" alt="Cart" style={{ height: '18px', width: 'auto', display: 'block' }} />
                <span className="cart-text" style={{ whiteSpace: 'nowrap' }}>GIỎ HÀNG</span>
              </div>
              {totalCount > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: '900',
                  borderRadius: '999px',
                  padding: '2px 5px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: 1
                }}>
                  {totalCount}
                </span>
              )}
            </a>

            {/* NÚT QUẢN TRỊ BẾN BÃI */}
            <a
              href="/admin"
              className="desktop-nav-links"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                backgroundColor: 'var(--theme-color)',
                color: '#111827',
                fontSize: '12px',
                fontWeight: '900',
                padding: '7px 12px',
                borderRadius: '8px',
                letterSpacing: '0.3px',
                boxShadow: '0 2px 10px var(--theme-color-15)',
                transition: 'all 0.2s'
              }}
              title="Chuyển sang Web 2 - Admin Quản Lý Nội Bộ"
            >
              <span>Quản Trị Bến Bãi</span>
            </a>

            {/* ĐĂNG NHẬP / TÀI KHOẢN */}
            <div style={{ position: 'relative' }} className="desktop-nav-links">
              {currentUser ? (
                <button
                  onClick={() => setUserOpen(!userMenuOpen)}
                  className="navbar-menu-btn"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #334155', color: 'var(--theme-color)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', padding: '7px 10px', borderRadius: '6px' }}
                >
                  {currentUser.name}
                </button>
              ) : (
                <button
                  onClick={() => setUserOpen(!userMenuOpen)}
                  className="navbar-menu-btn"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid #334155', color: 'var(--theme-color)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', padding: '7px 10px', borderRadius: '6px' }}
                >
                  Đăng nhập
                </button>
              )}

              {userMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserOpen(false)} />
                  <div style={{ position: 'absolute', right: 0, marginTop: '12px', width: '210px', backgroundColor: '#0F172A', border: '1.5px solid var(--theme-color)', borderRadius: '12px', padding: '8px', zIndex: 110, boxShadow: '0 15px 35px rgba(0,0,0,0.5)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                    {currentUser ? (
                      <div
                        className="navbar-sub-link"
                        style={{ fontSize: '13px', color: '#ef4444', padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', fontWeight: '700' }}
                        onClick={handleUserLogout}
                      >
                        Đăng xuất tài khoản
                      </div>
                    ) : (
                      <>
                        <div className="navbar-dropdown-row" style={{ fontSize: '13px', color: '#ffffff', padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', fontWeight: '700' }} onClick={() => openAuth('B2B')}>Đối tác B2B Khách sỉ</div>
                        <div className="navbar-dropdown-row" style={{ fontSize: '13px', color: '#ffffff', padding: '10px 12px', cursor: 'pointer', borderRadius: '6px', fontWeight: '700' }} onClick={() => openAuth('B2C')}>Tài khoản B2C Mua lẻ</div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER / SIDEBAR */}
        {mobileMenuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, top: '65px', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 120 }} onClick={() => setMobileMenuOpen(false)} />
            <div style={{ position: 'fixed', top: '65px', left: 0, bottom: 0, width: '280px', backgroundColor: '#0F172A', borderRight: '2px solid var(--theme-color)', zIndex: 130, padding: '20px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', boxShadow: '10px 0 30px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', fontWeight: '700' }}>
                <a href="/#vattu" onClick={() => setMobileMenuOpen(false)} style={{ color: currentPath === '/' ? '#111827' : 'var(--theme-color)', backgroundColor: currentPath === '/' ? 'var(--theme-color)' : 'transparent', textDecoration: 'none', padding: '10px 12px', borderRadius: '6px' }}>Vật tư bến bãi</a>
                <a href="/portal/showcase" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--theme-color)', textDecoration: 'none', padding: '10px 12px', borderRadius: '6px' }}>Công trình tiêu biểu</a>
                <a href="/orders" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--theme-color)', textDecoration: 'none', padding: '10px 12px', borderRadius: '6px' }}>Đơn hàng</a>
                <a href="/portal/ledger" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--theme-color)', textDecoration: 'none', padding: '10px 12px', borderRadius: '6px' }}>B2B</a>
                <a href="/admin" onClick={() => setMobileMenuOpen(false)} style={{ color: '#111827', backgroundColor: 'var(--theme-color)', textDecoration: 'none', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '900', marginTop: '10px' }}>Quản Trị Bến Bãi</a>
                
                <div style={{ borderTop: '1px solid #334155', marginTop: '10px', paddingTop: '10px' }}>
                  {currentUser ? (
                    <button onClick={handleUserLogout} style={{ width: '100%', background: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}>Đăng xuất ({currentUser.name})</button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button onClick={() => openAuth('B2B')} style={{ background: 'transparent', border: '1px solid var(--theme-color)', color: 'var(--theme-color)', padding: '8px', borderRadius: '6px', fontWeight: '700' }}>Đăng nhập B2B</button>
                      <button onClick={() => openAuth('B2C')} style={{ background: 'var(--theme-color)', border: 'none', color: '#111827', padding: '8px', borderRadius: '6px', fontWeight: '800' }}>Đăng nhập B2C</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <AuthModalSafe isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} type={authType} />

        <style jsx global>{`
          .navbar-menu-btn:hover {
            background-color: var(--theme-color) !important;
            color: #111827 !important;
          }
          .navbar-dropdown-row:hover {
            background-color: var(--theme-color) !important;
            color: #111827 !important;
          }
          .navbar-dropdown-row:hover span {
            color: #111827 !important;
          }
          .navbar-sub-link:hover {
            background-color: var(--theme-color) !important;
            color: #111827 !important;
          }
          @media (max-width: 991px) {
            .desktop-nav-links { display: none !important; }
            .mobile-burger-btn { display: block !important; }
            .cart-text { display: none !important; }
          }
        `}</style>
      </nav>

      {/* SOCIAL ICONS TRÔI NỔI GÓC DƯỚI BÊN TRÁI */}
      <div style={{ position: 'fixed', left: '16px', bottom: '80px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 110 }}>
        <a href={"https://www.facebook.com/share/1DVf7316r1/?mibextid=wwXIfr"} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', display: 'block', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', borderRadius: '50%', transition: 'transform 0.2s' }}>
          <img src="/yt_icon.png" alt="YouTube" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </a>
        <a href={"https://www.facebook.com/share/1DVf7316r1/?mibextid=wwXIfr"} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', display: 'block', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', borderRadius: '50%', transition: 'transform 0.2s' }}>
          <img src="/fb_icon.png" alt="Facebook" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </a>
        <a href={tenant?.zalo_oa_url || "https://zalo.me/0949734567"} target="_blank" rel="noopener noreferrer" style={{ width: '40px', height: '40px', display: 'block', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', borderRadius: '50%', transition: 'transform 0.2s' }}>
          <img src="/zalo_icon.png" alt="Zalo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </a>
      </div>
    </>
  );
}