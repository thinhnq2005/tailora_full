'use client';

import React from 'react';
import Link from 'next/link';
import { useTenant } from '@/app/context/TenantContext';

export default function Navbar(): React.JSX.Element {
  const { tenant } = useTenant();
  


  return (
    <nav className="w-full bg-[#141534] border-b border-[#2c2d59] px-6 py-4 flex justify-between items-center shadow-lg mb-6">
      <Link href="/" className="flex items-center gap-3 no-underline group">
        <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: '#ffffff' }}>TAILORA</span>
        <span className="text-white font-black text-sm tracking-wider uppercase">
          {tenant ? tenant.brand_name : 'TAILORA'}
        </span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-4 text-xs font-bold text-white/70">
          <span className="text-white/40">Giờ mở bãi:</span>
          <span>{tenant ? tenant.business_hours : '07:00 - 17:00'}</span>
        </div>
        
        {/* SỐ HOTLINE LIÊN HỆ ĐỘNG CHO TỪNG ĐẠI LÝ */}
        <a 
          href={`tel:${tenant ? tenant.hotline_support : ''}`}
          style={{ borderColor: 'var(--accent-gold)' }}
          className="bg-transparent border text-white text-xs font-black px-4 py-2 rounded-md hover:bg-white hover:text-[#0f1026] transition-colors no-underline"
        >
          HOTLINE: {tenant ? tenant.hotline_support : ''}
        </a>
      </div>
    </nav>
  );
}