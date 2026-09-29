import './globals.css';
import React from 'react';
import { TenantProvider } from './context/TenantContext';
import { CartProvider } from './context/CartContext';
import ToastProvider from '@/components/ui/ToastProvider';

interface RootLayoutProps {
  children: React.ReactNode;
}

export const metadata = {
  title: 'TAILORA Tech - Nền tảng ERP Quản trị Bến bãi',
  description: 'Giải pháp chuyển đổi số và may đo chuyên sâu theo đặc thù chuỗi bến bãi vật liệu xây dựng.',
};

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="vi" className="scroll-smooth" suppressHydrationWarning>
      <body
        className="antialiased selection:bg-[var(--theme-color)] selection:text-[#0f1026]"
        suppressHydrationWarning
      >
        <TenantProvider>
          <CartProvider>
            <ToastProvider />
            {children}
          </CartProvider>
        </TenantProvider>
      </body>
    </html>
  );
}