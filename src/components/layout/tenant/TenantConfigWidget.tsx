'use client';

import React from 'react';
import { useTenant } from '@/app/context/TenantContext';

export interface TenantConfigProps {
  tenantName: string;
  primaryColor: string;
  onTenantNameChange: (next: string) => void;
  onPrimaryColorChange: (nextHex: string) => void;
}

export default function TenantConfigWidget({
  tenantName,
  primaryColor,
  onTenantNameChange,
  onPrimaryColorChange
}: TenantConfigProps): React.JSX.Element {
  const { tenant, loading, error } = useTenant();

  if (loading) return <div className="text-xs text-white/50">Đang quét hạ tầng tên miền...</div>;
  if (error) return <div className="text-xs text-red-400 font-mono">Lỗi: {error}</div>;
  if (!tenant) return <div className="text-xs text-red-400">Không tìm thấy Tenant thích hợp</div>;

  const swatches: string[] = ['var(--theme-color)', '#22c55e', '#3b82f6', '#ef4444', '#f97316'];

  return (
    <div className="w-full space-y-2"/>
  );
}