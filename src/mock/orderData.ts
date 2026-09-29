// src/mock/orderData.ts
import { VlxdOrder } from '@/types/order.types';

export const INITIAL_ORDERS_MOCK: VlxdOrder[] = [
  {
    id: 'ORD-8821',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer_name: 'Nhà thầu Trần Minh Phát',
    customer_phone: '0908.777.666',
    address: 'Số 128 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
    district: 'Ninh Kiều',
    items: [
      { product_id: '38', name: 'Cát Vàng Bê Tông Rửa Sạch Tân Châu', price: 320000, quantity: 10, uom: 'm³', total: 3200000 },
      { product_id: '41', name: 'Đá Xây Dựng 1x2 Xanh Đồng Nai', price: 380000, quantity: 5, uom: 'm³', total: 1900000 }
    ],
    products_total: 5100000,
    shipping_fee: 0,
    total_amount: 5100000,
    payment_method: 'vietqr',
    payment_status: 'paid',
    status: 'delivering', // Đang giao
    assignee: 'Lê Hoàng Minh (Điều phối bãi)',
    note: 'Đổ vật tư sát mép cổng công trình trước 15h.',
    driver_id: 'drv_1',
    driver_name: 'Trần Văn Tài',
    driver_phone: '0907.123.456',
    truck_plate: '65C-123.45',
    truck_type: 'Xe Ben 5 Tấn (Chuyên Cát Đá)',
    sealed_weight: '7,850 kg',
    sealed_weight_kg: 7850,
    seal_code: 'SEAL-LP-4421',
    weight_slip_code: 'CAN-20260912-001',
    dispatched_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    timeline: [
      { status: 'pending', time: '08:15', title: 'Tiếp nhận đơn hàng', description: 'Đơn hàng được khởi tạo từ hệ thống bán hàng' },
      { status: 'approved', time: '08:45', title: 'Xác nhận đơn hàng', description: 'Kinh doanh & Điều phối xác nhận đủ nguồn vật tư bến bãi' },
      { status: 'loading', time: '09:20', title: 'Bốc hàng & Cân tải niêm phong', description: 'Xe 65C-123.45 qua bàn cân điện tử. Khối lượng niêm phong: 7,850 kg. Kẹp chì SEAL-LP-4421' },
      { status: 'delivering', time: '09:35', title: 'Đang giao hàng', description: 'Tài xế Trần Văn Tài đang di chuyển giao tới công trình tại Ninh Kiều' }
    ]
  },
  {
    id: 'ORD-8820',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    customer_name: 'Công ty TNHH MTV Xây Dựng Nam Cần Thơ',
    customer_phone: '0939.111.222',
    address: 'Khu Đô Thị Hưng Phú, Quận Cái Răng, Cần Thơ',
    district: 'Cái Răng',
    items: [
      { product_id: '54', name: 'Xi Măng Vicem Hà Tiên Đa Dụng PCB40', price: 92000, quantity: 100, uom: 'Bao', total: 9200000 }
    ],
    products_total: 9200000,
    shipping_fee: 150000,
    total_amount: 9350000,
    payment_method: 'vietqr',
    payment_status: 'paid',
    status: 'completed', // Hoàn thành
    assignee: 'Nguyễn Văn Long (Kinh doanh)',
    driver_id: 'drv_3',
    driver_name: 'Lê Hoàng Đức',
    driver_phone: '0939.999.888',
    truck_plate: '65C-555.22',
    truck_type: 'Xe Cẩu 10 Tấn (Pallet Xi Măng & Sắt)',
    sealed_weight: '5,000 kg',
    sealed_weight_kg: 5000,
    seal_code: 'SEAL-LP-3390',
    weight_slip_code: 'CAN-20260911-042',
    timeline: [
      { status: 'pending', time: 'Hôm qua 07:30', title: 'Tiếp nhận đơn', description: 'Khách hàng duyệt hợp đồng cấp vật tư đợt 1' },
      { status: 'approved', time: 'Hôm qua 08:00', title: 'Đã xác nhận', description: 'Kho xuất lệnh xuất bến bãi pallet xi măng' },
      { status: 'loading', time: 'Hôm qua 08:30', title: 'Bốc pallet & Niêm phong', description: 'Xe cẩu bốc 2 pallet 100 bao, cân đạt 5,000 kg' },
      { status: 'delivering', time: 'Hôm qua 09:00', title: 'Đang giao', description: 'Xe vận chuyển qua cầu Quang Trung' },
      { status: 'completed', time: 'Hôm qua 10:15', title: 'Hoàn thành giao hàng', description: 'Chỉ huy trưởng ký nhận đủ 100 bao nguyên seal' }
    ]
  },
  {
    id: 'ORD-8822',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    customer_name: 'Đội Thầu Bê Tông Anh Ba Cần Thơ',
    customer_phone: '0919.222.333',
    address: 'Khu nhà phố Căn hộ Cara River Park, Cái Răng, Cần Thơ',
    district: 'Cái Răng',
    items: [
      { product_id: '45', name: 'Thép Cây Vằn Hòa Phát Phi 10 (D10)', price: 125000, quantity: 150, uom: 'Cây', total: 18750000 },
      { product_id: '46', name: 'Thép Cây Vằn Hòa Phát Phi 12 (D12)', price: 185000, quantity: 80, uom: 'Cây', total: 14800000 }
    ],
    products_total: 33550000,
    shipping_fee: 150000,
    total_amount: 33700000,
    payment_method: 'b2b_debt',
    payment_status: 'unpaid',
    status: 'pending', // Chờ duyệt / Chờ xuất kho
    assignee: 'Trần Anh Thư (Kế toán công nợ)',
    note: 'Đơn hàng công nợ B2B theo hợp đồng thầu số 18/HĐ-LP2026',
    timeline: [
      { status: 'pending', time: '10:00', title: 'Chờ duyệt xuất bãi', description: 'Đang chờ thủ kho xếp xe và cân khối lượng niêm phong' }
    ]
  },
  {
    id: 'ORD-8823',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    customer_name: 'Công ty CP Đầu tư & Xây dựng Tây Đô',
    customer_phone: '0918.333.444',
    address: 'Khách sạn 4 sao Bến Ninh Kiều, Cần Thơ',
    district: 'Ninh Kiều',
    items: [
      { product_id: '39', name: 'Cát Xây Tô Hạt Mịn Sông Tiền', price: 240000, quantity: 20, uom: 'm³', total: 4800000 }
    ],
    products_total: 4800000,
    shipping_fee: 0,
    total_amount: 4800000,
    payment_method: 'vietqr',
    payment_status: 'paid',
    status: 'approved', // Đã xác nhận
    assignee: 'Lê Hoàng Minh (Điều phối bãi)',
    note: 'Hàng cần giao gấp đầu giờ chiều',
    timeline: [
      { status: 'pending', time: '10:30', title: 'Tiếp nhận đơn', description: 'Khách đặt qua cổng trực tuyến' },
      { status: 'approved', time: '10:45', title: 'Đã xác nhận đơn hàng', description: 'Sẵn sàng bốc hàng lên xe ben 8 tấn' }
    ]
  },
  {
    id: 'ORD-8824',
    created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    customer_name: 'Nguyễn Văn Minh (Hộ cá thể)',
    customer_phone: '0931.222.888',
    address: 'Khu Tái Định Cư An Bình, Ninh Kiều, Cần Thơ',
    district: 'Ninh Kiều',
    items: [
      { product_id: '60', name: 'Gạch Tuynel 4 Lỗ Bình Dương Chuẩn Đẹp', price: 1250, quantity: 2000, uom: 'Viên', total: 2500000 }
    ],
    products_total: 2500000,
    shipping_fee: 0,
    total_amount: 2500000,
    payment_method: 'cod',
    payment_status: 'unpaid',
    status: 'cancelled', // Hủy
    assignee: 'Nguyễn Văn Long (Kinh doanh)',
    note: 'Khách hoãn ngày khởi công dời sang tháng sau',
    timeline: [
      { status: 'pending', time: 'Hôm kia 09:00', title: 'Khách đặt đơn', description: 'Đơn hàng mua gạch lẻ xây tường bao' },
      { status: 'cancelled', time: 'Hôm kia 11:30', title: 'Hủy đơn hàng', description: 'Khách liên hệ xin hủy do đổi thợ hồ' }
    ]
  }
];
