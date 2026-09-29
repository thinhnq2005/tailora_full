// src/hooks/useOrders.ts
import { useState, useEffect, useCallback } from 'react';
import { VlxdOrder, OrderFilterState, DispatchConfirmationPayload, OrderStatus } from '@/types/order.types';
import { orderService } from '@/services/orderService';

export function useOrders(initialFilters?: Partial<OrderFilterState>) {
  const [filters, setFilters] = useState<OrderFilterState>({
    searchTerm: '',
    customer: 'all',
    assignee: 'all',
    status: 'all',
    dateRange: 'all',
    valueRange: 'all',
    ...initialFilters
  });

  const [allOrders, setAllOrders] = useState<VlxdOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<VlxdOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const reload = useCallback(() => {
    const list = orderService.getOrders();
    setAllOrders(list);
    const filtered = orderService.filterOrders(filters);
    setFilteredOrders(filtered);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    reload();

    const handleUpdate = () => reload();
    window.addEventListener('vlxd-orders-updated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'vlxd_orders') reload();
    });

    return () => {
      window.removeEventListener('vlxd-orders-updated', handleUpdate);
    };
  }, [reload]);

  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const res = orderService.updateStatus(orderId, status, note);
    reload();
    return res;
  };

  const confirmDispatch = (payload: DispatchConfirmationPayload) => {
    const res = orderService.confirmYardDispatch(payload);
    reload();
    return res;
  };

  return {
    orders: filteredOrders,
    allOrders,
    totalCount: allOrders.length,
    filteredCount: filteredOrders.length,
    filters,
    setFilters,
    updateOrderStatus,
    confirmDispatch,
    reload,
    loading
  };
}
