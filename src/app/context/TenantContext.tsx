'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredTenant, saveTenant, TenantConfig } from '@/lib/vlxdStorage';

export interface PaymentBankInfo {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export interface TenantConfigData {
  id: number;
  subdomain: string;
  custom_domain: string;
  brand_name: string;
  phone: string;
  email: string;
  logo_url: string;
  primary_color: string;
  homepage_banners: string[];
  about_us_short: string;
  about_us_full: string;
  footer_copyright: string;
  footer_description: string;
  zalo_oa_url: string;
  facebook_page_url: string;
  youtube_channel_url: string;
  hotline_support: string;
  email_support: string;
  office_address: string;
  business_hours: string;
  payment_bank_info: PaymentBankInfo;
  vat?: string;
}

interface TenantContextType {
  tenant: TenantConfigData | null;
  loading: boolean;
  error: string | null;
  updateLocalTheme: (name: string, color: string) => void;
  refreshTenant: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

function mapStorageToTenantData(stored: TenantConfig): TenantConfigData {
  return {
    id: 1,
    subdomain: 'tailoratech',
    custom_domain: 'tailoratech.vn',
    brand_name: stored.brand_name || 'Hệ thống Demo TAILORA Tech',
    phone: stored.phone || '0949734567',
    email: stored.email || 'tailoratech@gmail.com',
    logo_url: '/lpdata/logo.png',
    primary_color: stored.primary_color || '#1e3a8a',
    homepage_banners: ['/lpdata/banner/banner1.jpg', '/lpdata/banner/banner2.png'],
    about_us_short: stored.brand_tagline || 'Nền tảng ERP may đo chuyên sâu cho chuỗi bến bãi vật liệu xây dựng.',
    about_us_full: 'TAILORA Tech cung cấp giải pháp chuyển đổi số toàn diện cho các bến bãi vật liệu xây dựng trên toàn quốc.',
    footer_copyright: ' 2026 TAILORA TECH - Nền tảng ERP Bến Bãi',
    footer_description: 'Giải pháp may đo chuyên sâu theo đặc thù chuỗi bến bãi vật liệu xây dựng.',
    zalo_oa_url: stored.zalo_oa_url || 'https://zalo.me/0949734567',
    facebook_page_url: stored.facebook_page_url || 'https://facebook.com',
    youtube_channel_url: stored.youtube_channel_url || 'https://youtube.com',
    hotline_support: stored.hotline_support || '0949734567',
    email_support: stored.email || 'tailoratech@gmail.com',
    office_address: stored.office_address || 'Hệ thống Demo TAILORA Tech - Bản Demo ERP Bến Bãi',
    business_hours: '06:30 - 18:00 (Thứ 2 - Chủ Nhật)',
    payment_bank_info: {
      bank_name: stored.bank_name || 'BIDV',
      account_number: stored.account_number || '7410276459',
      account_holder: stored.account_holder || 'HE THONG DEMO TAILORA TECH'
    },
    vat: '1801234567'
  };
}

// Hàm tiện ích tính toán độ sáng màu
export function getContrastYIQ(hexcolor: string) {
  if (hexcolor.startsWith('var(')) return '#111827';
  let hex = hexcolor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  if (hex.length !== 6) return '#111827';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111827' : '#ffffff';
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfigData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTenant = () => {
    try {
      const stored = getStoredTenant();
      const mapped = mapStorageToTenantData(stored);
      setTenant(mapped);
      if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--primary-color', mapped.primary_color);
        document.documentElement.style.setProperty('--theme-color', mapped.primary_color);
        const fgColor = getContrastYIQ(mapped.primary_color);
        document.documentElement.style.setProperty('--theme-color-fg', fgColor);
      }
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();

    const handleTenantUpdate = () => loadTenant();
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vlxd_tenant_config') {
        loadTenant();
      }
    };

    window.addEventListener('vlxd-tenant-updated', handleTenantUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('vlxd-tenant-updated', handleTenantUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateLocalTheme = (name: string, color: string) => {
    saveTenant({ brand_name: name, primary_color: color });
    loadTenant();
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, error, updateLocalTheme, refreshTenant: loadTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}