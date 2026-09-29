'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/app/context/TenantContext';

import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Truck,
  FileSpreadsheet,
  Settings,
  ExternalLink,
  Warehouse,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentPath = usePathname();
  const { tenant } = useTenant();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  // Tự động đóng sidebar khi chuyển trang trên Mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [currentPath]);

  const menuItems = [
    { href: '/admin', label: 'Tổng quan điều hành', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Vật tư bến bãi', icon: Package },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
    { href: '/admin/fleet', label: 'Đội xe & Vận chuyển', icon: Truck },
    { href: '/admin/reports', label: 'B2B', icon: FileSpreadsheet },
    { href: '/admin/inventory', label: 'Kho bãi', icon: Warehouse },
    { href: '/admin/settings', label: 'Cấu hình bến bãi', icon: Settings }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', overflowX: 'hidden' }}>
      
      {/* BACKDROP LỚP NỀN MỜ TRÊN MOBILE KHỦNG */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="admin-sidebar-backdrop"
        />
      )}

      {/* SIDEBAR ADMIN ERP (RESPONSIVE DRAWER) */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div>
          {/* LOGO & BRAND */}
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid #1e293b', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '900', color: themeColor, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                BÁN HÀNG & BẾN BÃI
              </div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: themeColor, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {tenant?.brand_name || 'TAILORA'}
              </h2>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Hệ thống ERP Bến Bãi & Trạm Cân</span>
            </div>

            {/* NÚT ĐÓNG SIDEBAR TRÊN MOBILE */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="admin-sidebar-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* MENU LINKS */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {menuItems.map((item) => {
              const isActive = currentPath === item.href;
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: isActive ? '800' : '600',
                    textDecoration: 'none',
                    backgroundColor: isActive ? themeColor : 'transparent',
                    color: isActive ? '#111827' : '#ffffff',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={16} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER SIDEBAR: NÚT VỀ WEB KHÁCH */}
        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '12.5px',
              fontWeight: '800',
              textDecoration: 'none',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: themeColor,
              border: `1.5px solid ${themeColor}`,
              transition: 'all 0.2s'
            }}
          >
            <ExternalLink size={14} />
            <span>Cổng Bán Hàng & Tra Cứu</span>
          </Link>

          <div style={{ fontSize: '10.5px', color: '#64748b', textAlign: 'center' }}>
            ERP Realtime Sync Active
          </div>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH CỦA ADMIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
        {/* HEADER TOP BAR */}
        <header style={{ height: '60px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* TOGGLE BUTTON TRÊN MOBILE */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="admin-hamburger-btn"
            >
              <Menu size={22} />
            </button>

            <span className="admin-header-title">Cổng thông tin trạm cân & điều xe bến bãi</span>
            <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>● Trực tuyến</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="admin-user-info" style={{ fontSize: '12px', color: '#64748b' }}>
              Điều phối viên: <strong>Admin Bến Bãi</strong>
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '13px', color: '#0f172a', flexShrink: 0 }}>
              TA
            </div>
          </div>
        </header>

        {/* NỘI DUNG VIEW */}
        <main style={{ flex: 1, padding: '16px', boxSizing: 'border-box', overflowY: 'auto', width: '100%' }}>
          {children}
        </main>
      </div>

      {/* CSS RESPONSIVE VÀ HOVER STYLES */}
      <style jsx global>{`
        .admin-sidebar {
          width: 250px;
          background-color: #0f172a;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 14px;
          box-sizing: border-box;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          border-right: 1px solid #1e293b;
          z-index: 100;
          transition: transform 0.3s ease;
        }

        .admin-sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
        }

        .admin-hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #0f172a;
          cursor: pointer;
          padding: 4px;
        }

        .admin-sidebar-backdrop {
          display: none;
        }

        .admin-sidebar-link:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }

        /* MOBILE STYLES (< 768px) */
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 15px rgba(0, 0, 0, 0.3);
          }

          .admin-sidebar.open {
            transform: translateX(0);
          }

          .admin-sidebar-close-btn {
            display: block;
          }

          .admin-hamburger-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .admin-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(2px);
            z-index: 90;
          }

          .admin-header-title {
            display: none;
          }

          .admin-user-info {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}