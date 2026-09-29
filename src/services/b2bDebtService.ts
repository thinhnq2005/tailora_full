// src/services/b2bDebtService.ts
import { B2bCustomer, B2bVoucher, DebtDashboardMetrics } from '@/types/debt.types';
import { INITIAL_B2B_CUSTOMERS, INITIAL_B2B_VOUCHERS, calculateDebtMetrics } from '@/mock/b2bDebtData';

const STORAGE_KEYS = {
  CUSTOMERS: 'vlxd_b2b_customers',
  VOUCHERS: 'vlxd_b2b_vouchers'
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Lỗi lưu trữ B2B localStorage:', e);
  }
}

export const b2bDebtService = {
  getCustomers(): B2bCustomer[] {
    return safeGet<B2bCustomer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_B2B_CUSTOMERS);
  },

  getVouchers(): B2bVoucher[] {
    return safeGet<B2bVoucher[]>(STORAGE_KEYS.VOUCHERS, INITIAL_B2B_VOUCHERS);
  },

  getMetrics(): DebtDashboardMetrics {
    const customers = this.getCustomers();
    const vouchers = this.getVouchers();
    return calculateDebtMetrics(customers, vouchers);
  },

  filterCustomers(searchTerm: string, status: string): B2bCustomer[] {
    const list = this.getCustomers();
    return list.filter(c => {
      const matchSearch = !searchTerm ||
        c.maKhachHang.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tenCongTy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nguoiLienHe.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.soDienThoai.includes(searchTerm);
      const matchStatus = status === 'all' || c.trangThai === status;
      return matchSearch && matchStatus;
    });
  },

  filterVouchers(searchTerm: string, status: string, customerCode?: string): B2bVoucher[] {
    const list = this.getVouchers();
    return list.filter(v => {
      const matchSearch = !searchTerm ||
        v.maChungTu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.tenCongTy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.maKhachHang.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = status === 'all' || v.trangThai === status;
      const matchCustomer = !customerCode || customerCode === 'all' || v.maKhachHang === customerCode;
      return matchSearch && matchStatus && matchCustomer;
    });
  },

  recordVoucherPayment(voucherId: number, amount: number): { success: boolean; updatedVoucher?: B2bVoucher } {
    const vouchers = this.getVouchers();
    const target = vouchers.find(v => v.id === voucherId);
    if (!target) return { success: false };

    const newPaid = target.daThanhToan + amount;
    const newDebt = Math.max(0, target.tongTien - newPaid);
    const newStatus = newDebt === 0 ? 'Đã thanh toán' : target.trangThai;

    const updatedVoucher: B2bVoucher = {
      ...target,
      daThanhToan: newPaid,
      conNo: newDebt,
      trangThai: newStatus
    };

    const newVouchers = vouchers.map(v => v.id === voucherId ? updatedVoucher : v);
    safeSet(STORAGE_KEYS.VOUCHERS, newVouchers);

    // Cập nhật dư nợ khách hàng tương ứng
    const customers = this.getCustomers();
    const newCustomers = customers.map(c => {
      if (c.maKhachHang === target.maKhachHang) {
        const updatedCustDebt = Math.max(0, c.duNoHienTai - amount);
        return {
          ...c,
          duNoHienTai: updatedCustDebt,
          trangThai: updatedCustDebt === 0 ? 'Đã thanh toán' as const : c.trangThai
        };
      }
      return c;
    });
    safeSet(STORAGE_KEYS.CUSTOMERS, newCustomers);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vlxd-b2b-debt-updated'));
    }

    return { success: true, updatedVoucher };
  }
};
