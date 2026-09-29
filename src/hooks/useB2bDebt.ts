// src/hooks/useB2bDebt.ts
import { useState, useEffect, useCallback } from 'react';
import { B2bCustomer, B2bVoucher, DebtDashboardMetrics } from '@/types/debt.types';
import { b2bDebtService } from '@/services/b2bDebtService';

export function useB2bDebt() {
  const [customers, setCustomers] = useState<B2bCustomer[]>([]);
  const [vouchers, setVouchers] = useState<B2bVoucher[]>([]);
  const [metrics, setMetrics] = useState<DebtDashboardMetrics>({
    tongCongNo: 0,
    congNoQuaHan: 0,
    daThanhToan: 0,
    chuaThanhToan: 0,
    tongKhachHang: 0,
    khachHangQuaHan: 0
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatus, setCustomerStatus] = useState('all');

  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherStatus, setVoucherStatus] = useState('all');
  const [voucherCustomerFilter, setVoucherCustomerFilter] = useState('all');

  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const custs = b2bDebtService.filterCustomers(customerSearch, customerStatus);
    const vchs = b2bDebtService.filterVouchers(voucherSearch, voucherStatus, voucherCustomerFilter);
    const mets = b2bDebtService.getMetrics();

    setCustomers(custs);
    setVouchers(vchs);
    setMetrics(mets);
    setLoading(false);
  }, [customerSearch, customerStatus, voucherSearch, voucherStatus, voucherCustomerFilter]);

  useEffect(() => {
    reload();

    const handleUpdate = () => reload();
    window.addEventListener('vlxd-b2b-debt-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_b2b_customers' || e.key === 'vlxd_b2b_vouchers') reload();
    });

    return () => {
      window.removeEventListener('vlxd-b2b-debt-updated', handleUpdate);
    };
  }, [reload]);

  const payVoucher = (voucherId: number, amount: number) => {
    const res = b2bDebtService.recordVoucherPayment(voucherId, amount);
    reload();
    return res;
  };

  return {
    customers,
    vouchers,
    metrics,
    customerSearch,
    setCustomerSearch,
    customerStatus,
    setCustomerStatus,
    voucherSearch,
    setVoucherSearch,
    voucherStatus,
    setVoucherStatus,
    voucherCustomerFilter,
    setVoucherCustomerFilter,
    payVoucher,
    reload,
    loading
  };
}
