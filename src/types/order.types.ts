// src/types/order.types.ts

export type OrderStatus = 'pending' | 'approved' | 'loading' | 'delivering' | 'completed' | 'cancelled';

export type PaymentMethod = 'vietqr' | 'cod' | 'b2b_debt';
export type PaymentStatus = 'paid' | 'unpaid';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  uom: string;
  total: number;
}

export interface OrderTimeline {
  status: OrderStatus;
  time: string;
  title: string;
  description: string;
}

export interface VlxdOrder {
  id: string; // ví dụ: ORD-8821, ORD-2026-001
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  district: string;
  items: OrderItem[];
  products_total: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  assignee: string; // Người phụ trách (Kinh doanh/Điều phối)
  note?: string;

  // Dữ liệu Chống Gian Lận Trạm Cân & Niêm Phong Bến Bãi
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  truck_plate?: string;
  truck_type?: string;
  sealed_weight?: string; // Ví dụ: "7,850 kg" hoặc "7.85 Tấn"
  sealed_weight_kg?: number; // Số kg chốt cứng
  seal_code?: string; // Ví dụ: "SEAL-LP-9981"
  weight_slip_code?: string; // Số phiếu cân điện tử
  dispatched_at?: string;

  timeline: OrderTimeline[];
}

export interface OrderFilterState {
  searchTerm: string;
  customer: string;
  assignee: string;
  status: string;
  dateRange: 'all' | 'today' | '7days' | 'month';
  valueRange: 'all' | 'under5m' | '5m_to_20m' | 'above20m';
}

export interface DispatchConfirmationPayload {
  orderId: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  truck_plate: string;
  truck_type: string;
  sealed_weight: string;
  sealed_weight_kg?: number;
  seal_code?: string;
}
