// src/components/chatbot/QuickActions.tsx
'use client';

import React from 'react';
import { Package, Truck, Receipt, FileText } from 'lucide-react';

interface QuickActionsProps {
  onSelectAction: (query: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  {
    label: 'Kiểm tra tồn kho',
    icon: Package,
    query: 'Báo cáo tồn kho cát, đá, xi măng, thép tại bến bãi hiện tại?',
  },
  {
    label: 'Đơn hàng',
    icon: Truck,
    query: 'Tra cứu tiến độ các đơn hàng bến bãi gần nhất và khối lượng cân niêm phong?',
  },
  {
    label: 'Công nợ B2B',
    icon: Receipt,
    query: 'Báo cáo tình hình công nợ B2B, tổng dư nợ và các khoản nợ quá hạn?',
  },
  {
    label: 'Thông số sản phẩm',
    icon: FileText,
    query: 'Tư vấn thông số kỹ thuật xi măng PCB40, thép Hòa Phát, cát bê tông và tiêu chuẩn CO/CQ?',
  },
];

export default function QuickActions({ onSelectAction, disabled = false }: QuickActionsProps): React.JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        boxSizing: 'border-box'
      }}
    >
      {QUICK_ACTIONS.map((action, idx) => {
        const IconComponent = action.icon;
        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(action.query)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 9px',
              borderRadius: '16px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '11px',
              fontWeight: '600',
              color: '#334155',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#0f172a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = '#0f172a';
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = '#334155';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
          >
            <IconComponent size={12} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
