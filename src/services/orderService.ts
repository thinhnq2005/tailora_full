// src/services/orderService.ts
import { VlxdOrder, OrderFilterState, DispatchConfirmationPayload, OrderStatus } from '@/types/order.types';
import { INITIAL_ORDERS_MOCK } from '@/mock/orderData';

const ORDERS_KEY = 'vlxd_orders';

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

function safeSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Lỗi ghi orders localStorage:', e);
  }
}

export const orderService = {
  getOrders(): VlxdOrder[] {
    return safeGet<VlxdOrder[]>(ORDERS_KEY, INITIAL_ORDERS_MOCK);
  },

  getOrderById(id: string): VlxdOrder | undefined {
    const orders = this.getOrders();
    return orders.find(o => o.id.toLowerCase() === id.trim().toLowerCase());
  },

  filterOrders(filters: OrderFilterState): VlxdOrder[] {
    const orders = this.getOrders();
    return orders.filter(o => {
      // 1. Tìm kiếm
      const matchSearch = !filters.searchTerm ||
        o.id.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        o.customer_phone.includes(filters.searchTerm) ||
        o.address.toLowerCase().includes(filters.searchTerm.toLowerCase());

      // 2. Khách hàng
      const matchCustomer = !filters.customer || filters.customer === 'all' ||
        o.customer_name.toLowerCase().includes(filters.customer.toLowerCase());

      // 3. Nhân viên phụ trách
      const matchAssignee = !filters.assignee || filters.assignee === 'all' ||
        (o.assignee && o.assignee.toLowerCase().includes(filters.assignee.toLowerCase()));

      // 4. Trạng thái
      const matchStatus = !filters.status || filters.status === 'all' || o.status === filters.status;

      // 5. Ngày tạo
      let matchDate = true;
      if (filters.dateRange !== 'all') {
        const orderDate = new Date(o.created_at).getTime();
        const now = Date.now();
        if (filters.dateRange === 'today') {
          matchDate = (now - orderDate) <= 86400000;
        } else if (filters.dateRange === '7days') {
          matchDate = (now - orderDate) <= 86400000 * 7;
        } else if (filters.dateRange === 'month') {
          matchDate = (now - orderDate) <= 86400000 * 30;
        }
      }

      // 6. Giá trị đơn
      let matchValue = true;
      if (filters.valueRange !== 'all') {
        if (filters.valueRange === 'under5m') {
          matchValue = o.total_amount < 5000000;
        } else if (filters.valueRange === '5m_to_20m') {
          matchValue = o.total_amount >= 5000000 && o.total_amount <= 20000000;
        } else if (filters.valueRange === 'above20m') {
          matchValue = o.total_amount > 20000000;
        }
      }

      return matchSearch && matchCustomer && matchAssignee && matchStatus && matchDate && matchValue;
    });
  },

  updateStatus(orderId: string, status: OrderStatus, note?: string): VlxdOrder | null {
    const orders = this.getOrders();
    const target = orders.find(o => o.id === orderId);
    if (!target) return null;

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const statusTitles: Record<OrderStatus, string> = {
      pending: 'Chờ duyệt',
      approved: 'Đã xác nhận đơn hàng',
      loading: 'Đang bốc hàng & Cân tải',
      delivering: 'Đang vận chuyển giao hàng',
      completed: 'Hoàn thành giao hàng',
      cancelled: 'Hủy đơn hàng'
    };

    const updatedOrder: VlxdOrder = {
      ...target,
      status,
      timeline: [
        ...target.timeline,
        {
          status,
          time: nowTime,
          title: statusTitles[status] || 'Cập nhật tiến độ',
          description: note || `Đơn hàng chuyển sang trạng thái ${statusTitles[status]}`
        }
      ]
    };

    const updatedList = orders.map(o => o.id === orderId ? updatedOrder : o);
    safeSet(ORDERS_KEY, updatedList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vlxd-orders-updated', { detail: updatedList }));
    }

    return updatedOrder;
  },

  /**
   * LUỒNG CHỐNG GIAN LẬN BẾN BÃI (Duyệt Lệnh xuất kho của Thủ kho)
   * Bắt buộc: Xe tải + Tài xế + Khối lượng xuất kho niêm phong (chốt cứng kg)
   * Chuyển trạng thái đơn sang 'delivering' ("Đang giao hàng")
   */
  confirmYardDispatch(payload: DispatchConfirmationPayload): VlxdOrder | null {
    const orders = this.getOrders();
    const target = orders.find(o => o.id === payload.orderId);
    if (!target) return null;

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();

    const updatedOrder: VlxdOrder = {
      ...target,
      status: 'delivering',
      driver_id: payload.driver_id,
      driver_name: payload.driver_name,
      driver_phone: payload.driver_phone,
      truck_plate: payload.truck_plate,
      truck_type: payload.truck_type,
      sealed_weight: payload.sealed_weight,
      sealed_weight_kg: payload.sealed_weight_kg || parseInt(payload.sealed_weight.replace(/\D/g, '')) || 0,
      seal_code: payload.seal_code || `SEAL-LP-${Math.floor(1000 + Math.random() * 9000)}`,
      weight_slip_code: `CAN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      dispatched_at: nowIso,
      timeline: [
        ...target.timeline,
        {
          status: 'loading',
          time: nowTime,
          title: 'Xuất bãi & Cân niêm phong chống gian lận',
          description: `Xe ${payload.truck_plate} do tài xế ${payload.driver_name} điều khiển đã qua trạm cân điện tử bến bãi. Khối lượng niêm phong: ${payload.sealed_weight}. Tem kẹp chì: ${payload.seal_code || 'Chính hãng'}`
        },
        {
          status: 'delivering',
          time: nowTime,
          title: 'Đang giao hàng tới công trình',
          description: `Phương tiện đã rời bãi TAILORA vận chuyển tới địa chỉ: ${target.address}`
        }
      ]
    };

    const updatedList = orders.map(o => o.id === payload.orderId ? updatedOrder : o);
    safeSet(ORDERS_KEY, updatedList);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vlxd-orders-updated', { detail: updatedList }));
    }

    return updatedOrder;
  }
};
