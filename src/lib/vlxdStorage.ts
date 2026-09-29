// src/lib/vlxdStorage.ts
// Bộ quản lý dữ liệu Client-Side LocalStorage chuẩn hóa cho hệ thống 2 Web ERP TAILORA TECH

export interface UomOption {
  name: string;
  rate: number; // Tỷ lệ quy đổi so với đơn vị cơ sở (ví dụ 1 Tấn = 1000 Kg -> rate 1000)
  priceMultiplier: number;
}

export interface VlxdProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  uom: string;
  uom_options?: UomOption[];
  stock: number;
  min_stock: number;
  max_stock: number;
  waste_rate?: number;
  is_best_seller: boolean;
  spec?: string;
  description?: string;
  img?: string;
  created_at?: string;
}

export interface VlxdDriver {
  id: string;
  name: string;
  phone: string;
  license: string; // 'Hạng C' | 'Hạng FC' | 'Hạng D'
  truck_plate: string;
  truck_type: string; // 'Xe Ben 5 Tấn' | 'Xe Ben 8 Tấn' | 'Xe Cẩu 10 Tấn' | 'Xe Tải Thùng 3.5 Tấn'
  max_payload: number; // Tấn hoặc m³
  status: 'available' | 'delivering' | 'off';
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  uom: string;
  total: number;
}

export interface OrderTimeline {
  status: 'pending' | 'approved' | 'loading' | 'delivering' | 'completed' | 'cancelled';
  time: string;
  title: string;
  description: string;
}

export interface VlxdOrder {
  id: string; // e.g. ORD-2026-8821
  created_at: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  district: string; // 'Ninh Kiều' | 'Cái Răng' | 'Bình Thủy' | 'Ô Môn' | 'Phong Điền' | 'Khác'
  items: OrderItem[];
  products_total: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: 'vietqr' | 'cod' | 'b2b_debt';
  payment_status: 'paid' | 'unpaid';
  status: 'pending' | 'approved' | 'loading' | 'delivering' | 'completed' | 'cancelled';
  note?: string;
  
  // Thông tin Chống Gian Lận Bến Bãi (Anti-Fraud)
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  truck_plate?: string;
  sealed_weight?: string; // Ví dụ: "5.45 Tấn (Trạm cân điện tử bến bãi TAILORA)"
  seal_code?: string; // Ví dụ: "SEAL-LP-9981"
  weight_slip_url?: string;
  timeline: OrderTimeline[];
}

export interface TenantConfig {
  brand_name: string;
  brand_tagline: string;
  primary_color: string;
  phone: string;
  hotline_support: string;
  email: string;
  office_address: string;
  bến_bãi_address: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  zalo_oa_url: string;
  facebook_page_url: string;
  youtube_channel_url: string;
}

export interface B2bDebtRecord {
  id: string;
  contractor_name: string;
  project_name: string;
  phone: string;
  credit_limit: number;
  current_debt: number;
  overdue_amount: number;
  last_payment_date: string;
  status: 'good' | 'warning' | 'overdue';
}

export interface BomComponent {
  product_id: string;
  product_name: string;
  quantity: number;
  uom: string;
}

export interface VlxdInventoryTransaction {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUST' | 'DISASSEMBLE';
  status: 'pending' | 'approved';
  product_id: string;
  product_name: string;
  quantity: number;
  base_quantity: number;
  uom: string;
  base_uom: string;
  counterparty?: string;
  actual_qty?: number;
  prev_stock?: number;
  out_reason?: string;
  bom_components?: BomComponent[];
  note: string;
  created_at: string;
  created_by: string;
}

export interface ScrapReportItem {
  id: string;
  category: string;
  material_name: string;
  standard_loss_pct: number; // Định mức cho phép %
  actual_loss_pct: number; // Thực tế %
  loss_qty: string;
  loss_value: number; // Giá trị thành tiền VNĐ
  reason: string;
  evaluated_date: string;
}

// =================== SEED DATA BAN ĐẦU CHUẨN NGÀNH VLXD ===================

const INITIAL_PRODUCTS: VlxdProduct[] = [
  {
    id: '38',
    name: 'Cát Vàng Bê Tông Rửa Sạch Tân Châu',
    category: 'cat-da',
    brand: 'Mỏ Cát Tân Châu',
    price: 320000,
    uom: 'm³',
    uom_options: [
      { name: 'm³', rate: 1, priceMultiplier: 1 },
      { name: 'Xe Ben 5m³', rate: 5, priceMultiplier: 5 },
      { name: 'Xe Ben 10m³', rate: 10, priceMultiplier: 9.8 } // Chiết khấu nhẹ theo xe
    ],
    stock: 450,
    min_stock: 100,
    max_stock: 400,  // Tồn 450 > max 400 => VƯỢT ĐỊNH MỨC (demo)
    is_best_seller: true,
    spec: 'Mô đun độ lớn 2.6 - 3.2, cát sạch không nhiễm mặn',
    description: 'Cát vàng hạt to chuyên dùng đổ bê tông tươi, sàn, dầm cột nhà cao tầng tại Cần Thơ.',
    img: '/lpdata/product/cat/cactobetong.png'
  },
  {
    id: '39',
    name: 'Cát Xây Tô Hạt Mịn Sông Tiền',
    category: 'cat-da',
    brand: 'Mỏ Sông Tiền',
    price: 240000,
    uom: 'm³',
    uom_options: [
      { name: 'm³', rate: 1, priceMultiplier: 1 },
      { name: 'Xe Ben 5m³', rate: 5, priceMultiplier: 5 }
    ],
    stock: 620,
    min_stock: 150,
    max_stock: 800,  // AN TOÀN
    is_best_seller: true,
    spec: 'Hạt mịn, đã sàng lọc tạp chất',
    description: 'Cát xây tô bám dính cực tốt, chống rạn nứt bề mặt tường tô trát hoàn thiện.',
    img: '/lpdata/product/cat/catxayto.png'
  },
  {
    id: '41',
    name: 'Đá Xây Dựng 1x2 Xanh Đồng Nai',
    category: 'cat-da',
    brand: 'Đồng Nai',
    price: 380000,
    uom: 'm³',
    uom_options: [
      { name: 'm³', rate: 1, priceMultiplier: 1 },
      { name: 'Xe Ben 5m³', rate: 5, priceMultiplier: 5 }
    ],
    stock: 580,
    min_stock: 120,
    max_stock: 700,  // AN TOÀN
    is_best_seller: true,
    spec: 'Kích cỡ 10x28mm, cường độ nén cao',
    description: 'Đá dăm 1x2 tuyển chọn chất lượng cao đổ bê tông dầm móng công trình dân dụng & cầu đường.',
    img: '/lpdata/product/da/da1x2xam.png'
  },
  {
    id: '43',
    name: 'Đá 4x6 Xám Lót Móng Chịu Lực',
    category: 'cat-da',
    brand: 'Đồng Nai',
    price: 340000,
    uom: 'm³',
    stock: 320,
    min_stock: 80,
    max_stock: 500,  // AN TOÀN
    is_best_seller: false,
    spec: 'Kích cỡ 40x60mm sạch đất',
    description: 'Đá hộc 4x6 dùng đầm lót nền móng nhà xưởng, chống lún sụt bến bãi ven sông.',
    img: '/lpdata/product/da/da4x6xam.png'
  },
  {
    id: '54',
    name: 'Xi Măng Vicem Hà Tiên Đa Dụng PCB40',
    category: 'xi-mang',
    brand: 'Hà Tiên',
    price: 92000,
    uom: 'Bao',
    uom_options: [
      { name: 'Bao (50Kg)', rate: 1, priceMultiplier: 1 },
      { name: 'Tấn (20 Bao)', rate: 20, priceMultiplier: 19.6 } // 1 tấn rẻ hơn
    ],
    stock: 1200,
    min_stock: 200,
    max_stock: 2000, // AN TOÀN
    is_best_seller: true,
    spec: 'Tiêu chuẩn TCVN 6260:2009',
    description: 'Xi măng phát triển cường độ sớm, tăng độ dẻo, thích hợp đổ bê tông và vữa tô trát.',
    img: '/lpdata/product/ximang/ximanghatienpcb.png'
  },
  {
    id: '56',
    name: 'Xi Măng Insee Đa Dụng Cao Cấp',
    category: 'xi-mang',
    brand: 'Insee',
    price: 95000,
    uom: 'Bao',
    uom_options: [
      { name: 'Bao (50Kg)', rate: 1, priceMultiplier: 1 },
      { name: 'Tấn (20 Bao)', rate: 20, priceMultiplier: 19.6 }
    ],
    stock: 850,
    min_stock: 150,
    max_stock: 1500, // AN TOÀN
    is_best_seller: true,
    spec: 'Công nghệ chống nứt vượt trội',
    description: 'Xi măng chất lượng ổn định, kháng mặn phèn cho vùng đất miền Tây sông nước.',
    img: '/lpdata/product/ximang/ximanginsee.png'
  },
  {
    id: '51',
    name: 'Thép Cuộn Hòa Phát Phi 6 (D6)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 16500,
    uom: 'Kg',
    uom_options: [
      { name: 'Kg', rate: 1, priceMultiplier: 1 },
      { name: 'Tấn', rate: 1000, priceMultiplier: 980 }
    ],
    stock: 15000,
    min_stock: 2000,
    max_stock: 20000, // AN TOÀN
    is_best_seller: true,
    spec: 'Mác thép CB240-T, bề mặt trơn nhẵn',
    description: 'Thép cuộn tròn trơn làm đai cột, dầm, gia cố bê tông dự ứng lực.',
    img: '/lpdata/product/sat/thepphi6.png'
  },
  {
    id: '45',
    name: 'Thép Cây Vằn Hòa Phát Phi 10 (D10)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 125000,
    uom: 'Cây',
    uom_options: [
      { name: 'Cây (11.7m)', rate: 1, priceMultiplier: 1 },
      { name: 'Bó (100 Cây)', rate: 100, priceMultiplier: 97 }
    ],
    stock: 950,
    min_stock: 1000, // Tồn 950 < min 1000 => SẮP HẾT HÀNG (demo)
    max_stock: 5000,
    is_best_seller: true,
    spec: 'Mác CB300V / CB400V, chiều dài 11.7m',
    description: 'Thép gân vằn tiêu chuẩn chịu lực cao cho kết cấu khung nhà kiên cố.',
    img: '/lpdata/product/sat/thepphi10.png'
  },
  {
    id: '46',
    name: 'Thép Cây Vằn Hòa Phát Phi 12 (D12)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 185000,
    uom: 'Cây',
    uom_options: [
      { name: 'Cây (11.7m)', rate: 1, priceMultiplier: 1 },
      { name: 'Bó (100 Cây)', rate: 100, priceMultiplier: 97 }
    ],
    stock: 820,
    min_stock: 100,
    max_stock: 3000, // AN TOÀN
    is_best_seller: false,
    spec: 'Mác CB400V, chiều dài 11.7m',
    description: 'Thép cây vằn cốt thép chịu lực chính cho dầm cột sàn biệt thự và nhà xưởng.',
    img: '/lpdata/product/sat/thepphi12.png'
  },
  {
    id: '60',
    name: 'Gạch Tuynel 4 Lỗ Bình Dương Chuẩn Đẹp',
    category: 'gach',
    brand: 'Tuynel Bình Dương',
    price: 1250,
    uom: 'Viên',
    uom_options: [
      { name: 'Viên', rate: 1, priceMultiplier: 1 },
      { name: 'Thiên (1.000 Viên)', rate: 1000, priceMultiplier: 980 }
    ],
    stock: 45000,
    min_stock: 5000,
    max_stock: 100000, // AN TOÀN
    is_best_seller: true,
    spec: 'Kích thước 80x80x180mm, nung chín đều',
    description: 'Gạch tuynel chịu nén cao, vuông vức, không cong vênh, chống thấm tường tối ưu.',
    img: '/placeholder.png'
  }
];

const INITIAL_DRIVERS: VlxdDriver[] = [
  {
    id: 'drv_1',
    name: 'Trần Văn Tài',
    phone: '0907.123.456',
    license: 'Hạng C',
    truck_plate: '65C-123.45',
    truck_type: 'Xe Ben 5 Tấn (Chuyên Cát Đá)',
    max_payload: 5.0,
    status: 'available'
  },
  {
    id: 'drv_2',
    name: 'Nguyễn Văn Hùng',
    phone: '0918.456.789',
    license: 'Hạng C',
    truck_plate: '65C-888.88',
    truck_type: 'Xe Ben 8 Tấn (Thùng Cao Chở Cát)',
    max_payload: 8.0,
    status: 'available'
  },
  {
    id: 'drv_3',
    name: 'Lê Hoàng Đức',
    phone: '0939.999.888',
    license: 'Hạng FC',
    truck_plate: '65C-555.22',
    truck_type: 'Xe Cẩu 10 Tấn (Chở Sắt Cây & Xi Măng Pallet)',
    max_payload: 10.0,
    status: 'available'
  },
  {
    id: 'drv_4',
    name: 'Phạm Minh Toàn',
    phone: '0909.333.222',
    license: 'Hạng C',
    truck_plate: '65C-345.67',
    truck_type: 'Xe Tải Thùng 3.5 Tấn (Vào Hẻm Nội Ô)',
    max_payload: 3.5,
    status: 'available'
  }
];

const INITIAL_ORDERS: VlxdOrder[] = [
  {
    id: 'ORD-8821',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    customer_name: 'Nhà thầu Trần Minh Phát',
    customer_phone: '0908.777.666',
    address: 'Số 128 Đường 3/2, Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ',
    district: 'Ninh Kiều',
    items: [
      { product_id: '38', name: 'Cát Vàng Bê Tông Rửa Sạch Tân Châu', price: 320000, quantity: 10, uom: 'm³', total: 3200000 },
      { product_id: '41', name: 'Đá Xây Dựng 1x2 Xanh Đồng Nai', price: 380000, quantity: 5, uom: 'm³', total: 1900000 }
    ],
    products_total: 5100000,
    shipping_fee: 0, // Ninh Kiều = 0đ
    total_amount: 5100000,
    payment_method: 'vietqr',
    payment_status: 'paid',
    status: 'delivering',
    note: 'Đổ vật tư trước cổng công trình lúc 14h',
    driver_id: 'drv_1',
    driver_name: 'Trần Văn Tài',
    driver_phone: '0907.123.456',
    truck_plate: '65C-123.45',
    sealed_weight: '7.85 Tấn (Cân điện tử số 1 bến bãi TAILORA)',
    seal_code: 'SEAL-LP-4421',
    timeline: [
      { status: 'pending', time: '08:15', title: 'Tạo đơn hàng', description: 'Khách hàng đặt hàng qua Web' },
      { status: 'approved', time: '08:30', title: 'Duyệt đơn', description: 'Điều phối viên xác nhận kho vật tư sẵn sàng' },
      { status: 'loading', time: '09:00', title: 'Bốc hàng & Cân tải', description: 'Xe 65C-123.45 qua trạm cân. Khối lượng: 7.85 Tấn. Kẹp chì SEAL-LP-4421' },
      { status: 'delivering', time: '09:30', title: 'Đang giao hàng', description: 'Tài xế Trần Văn Tài đang di chuyển đến công trình' }
    ]
  },
  {
    id: 'ORD-8820',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer_name: 'Công ty TNHH MTV Xây Dựng Nam Cần Thơ',
    customer_phone: '0939.111.222',
    address: 'Khu Đô Thị Hưng Phú, Quận Cái Răng, Cần Thơ',
    district: 'Cái Răng',
    items: [
      { product_id: '54', name: 'Xi Măng Vicem Hà Tiên Đa Dụng PCB40', price: 92000, quantity: 100, uom: 'Bao', total: 9200000 }
    ],
    products_total: 9200000,
    shipping_fee: 150000, // Cái Răng = 150k
    total_amount: 9350000,
    payment_method: 'vietqr',
    payment_status: 'paid',
    status: 'completed',
    driver_id: 'drv_3',
    driver_name: 'Lê Hoàng Đức',
    driver_phone: '0939.999.888',
    truck_plate: '65C-555.22',
    sealed_weight: '5.00 Tấn (Pallet quấn màng co niêm phong)',
    seal_code: 'SEAL-LP-3390',
    timeline: [
      { status: 'pending', time: 'Hôm qua 07:00', title: 'Tạo đơn hàng', description: 'Đơn hàng B2B dự toán công trình' },
      { status: 'approved', time: 'Hôm qua 07:20', title: 'Duyệt & Xuất bến', description: 'Xe cẩu 65C-555.22 đã nâng hạ pallet xi măng' },
      { status: 'delivering', time: 'Hôm qua 08:00', title: 'Giao hàng', description: 'Xe đang trên đường sang Cầu Quang Trung' },
      { status: 'completed', time: 'Hôm qua 09:30', title: 'Hoàn thành giao', description: 'Chỉ huy trưởng công trình ký nhận đủ 100 bao nguyên seal' }
    ]
  }
];

const INITIAL_TENANT: TenantConfig = {
  brand_name: 'Công ty TNHH MTV TM DV TAILORA',
  brand_tagline: 'Hệ Thống Phân Phối Cát Đá Xi Măng Sắt Thép Hàng Đầu Cần Thơ',
  primary_color: '#1e3a8a',
  phone: '0949734567',
  hotline_support: '0949734567 - 02923912699',
  email: 'tailoratech@gmail.com',
  office_address: 'Bến bãi ERP TAILORA TECH, Bờ Kè Sông Hậu, Ninh Kiều, Cần Thơ',
  bến_bãi_address: 'Trạm trung chuyển bến cát Đá TAILORA, Cần Thơ',
  bank_name: 'BIDV',
  account_number: '7410276459',
  account_holder: 'CONG TY TNHH MTV TM DV TAILORA',
  zalo_oa_url: 'https://zalo.me/0949734567',
  facebook_page_url: 'https://facebook.com',
  youtube_channel_url: 'https://youtube.com'
};

const INITIAL_B2B_DEBT: B2bDebtRecord[] = [
  {
    id: 'DEBT-01',
    contractor_name: 'Công ty TNHH Xây Dựng Tây Đô',
    project_name: 'Khách sạn 4 sao Bến Ninh Kiều',
    phone: '0907.888.999',
    credit_limit: 2000000000,
    current_debt: 850000000,
    overdue_amount: 0,
    last_payment_date: '10/09/2026',
    status: 'good'
  },
  {
    id: 'DEBT-02',
    contractor_name: 'Đội Thầu Bê Tông Anh Ba Cần Thơ',
    project_name: 'Khu nhà phố Căn hộ Cara River Park',
    phone: '0919.222.333',
    credit_limit: 500000000,
    current_debt: 420000000,
    overdue_amount: 120000000,
    last_payment_date: '15/08/2026',
    status: 'warning'
  },
  {
    id: 'DEBT-03',
    contractor_name: 'Công ty CP Xây Dựng Miền Tây Phát',
    project_name: 'Bệnh viện Nam Cần Thơ Giai đoạn 2',
    phone: '0939.555.444',
    credit_limit: 3000000000,
    current_debt: 1250000000,
    overdue_amount: 0,
    last_payment_date: '05/09/2026',
    status: 'good'
  }
];

const INITIAL_SCRAP_REPORTS: ScrapReportItem[] = [
  {
    id: 'SCRAP-01',
    category: 'Cát xây dựng',
    material_name: 'Cát vàng đổ bê tông Tân Châu',
    standard_loss_pct: 2.0,
    actual_loss_pct: 1.6,
    loss_qty: '7.2 m³',
    loss_value: 2304000,
    reason: 'Rơi vãi tự nhiên khi xe gàu múc bốc lên xe ben & bốc hơi độ ẩm',
    evaluated_date: 'Tuần này'
  },
  {
    id: 'SCRAP-02',
    category: 'Đá dăm',
    material_name: 'Đá 1x2 xanh Đồng Nai',
    standard_loss_pct: 1.5,
    actual_loss_pct: 0.9,
    loss_qty: '5.2 m³',
    loss_value: 1976000,
    reason: 'Rơi vãi bến bãi quanh chân đống đá',
    evaluated_date: 'Tuần này'
  },
  {
    id: 'SCRAP-03',
    category: 'Sắt thép',
    material_name: 'Thép cây Hòa Phát D10-D20',
    standard_loss_pct: 1.0,
    actual_loss_pct: 0.8,
    loss_qty: '120 Kg',
    loss_value: 1980000,
    reason: 'Đầu mẩu sắt vụn khi cắt chia theo đơn lẻ nhà thầu (thu hồi ve chai)',
    evaluated_date: 'Tháng này'
  },
  {
    id: 'SCRAP-04',
    category: 'Xi măng',
    material_name: 'Xi măng bao Hà Tiên & Insee',
    standard_loss_pct: 0.5,
    actual_loss_pct: 0.2,
    loss_qty: '4 Bao',
    loss_value: 368000,
    reason: 'Bể rách vỏ bao trong quá trình bốc vác (gom đóng bao phụ bán hạ giá)',
    evaluated_date: 'Tháng này'
  }
];

const INITIAL_TRANSACTIONS: VlxdInventoryTransaction[] = [
  {
    id: 'TXN-001',
    type: 'IN',
    status: 'approved',
    product_id: '38',
    product_name: 'Cát Vàng Bê Tông Rửa Sạch Tân Châu',
    quantity: 100,
    base_quantity: 100,
    uom: 'm³',
    base_uom: 'm³',
    counterparty: 'Trạm Trộn Tân Châu',
    note: 'Nhập hàng từ xà lan',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_by: 'Thủ kho TAILORA'
  },
  {
    id: 'TXN-002',
    type: 'OUT',
    status: 'approved',
    product_id: '41',
    product_name: 'Đá Xây Dựng 1x2 Xanh Đồng Nai',
    quantity: 50,
    base_quantity: 50,
    uom: 'm³',
    base_uom: 'm³',
    counterparty: 'Dự án Khu Dân Cư 586',
    note: 'Xuất công trình khu dân cư 586',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_by: 'Thủ kho TAILORA'
  },
  {
    id: 'TXN-003',
    type: 'ADJUST',
    status: 'approved',
    product_id: '54',
    product_name: 'Xi Măng Vicem Hà Tiên Đa Dụng PCB40',
    quantity: 195,
    base_quantity: -5,
    uom: 'Bao',
    base_uom: 'Bao',
    actual_qty: 195,
    prev_stock: 200,
    note: 'Kiểm kê cuối tháng bị rách vỏ 5 bao',
    created_at: new Date().toISOString(),
    created_by: 'Kế toán kho'
  }
];

// =================== CÁC HÀM CRUD LOCALSTORAGE AN TOÀN ===================

const KEYS = {
  PRODUCTS: 'vlxd_products',
  DRIVERS: 'vlxd_staff_drivers',
  ORDERS: 'vlxd_orders',
  TENANT: 'vlxd_tenant_config',
  DEBT: 'vlxd_debt_b2b',
  SCRAP: 'vlxd_scrap_reports',
  CART: 'vlxd_cart',
  TRANSACTIONS: 'vlxd_inventory_txn'
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
  } catch (e) {
    console.error(`Lỗi đọc localStorage key ${key}:`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Lỗi ghi localStorage key ${key}:`, e);
  }
}

// 1. PRODUCTS
export function getStoredProducts(): VlxdProduct[] {
  const stored = safeGet<VlxdProduct[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  
  // === MIGRATION: Tự động backfill max_stock nếu dữ liệu localStorage cũ chưa có ===
  let needsMigration = false;
  const migrated = stored.map(p => {
    const seed = INITIAL_PRODUCTS.find(s => s.id === p.id);
    let updated = { ...p };
    if (p.max_stock === undefined || p.max_stock === null) {
      needsMigration = true;
      updated = { ...updated, max_stock: seed?.max_stock ?? (p.min_stock * 10) };
    }
    if (p.waste_rate === undefined || p.waste_rate === null) {
      needsMigration = true;
      updated = { ...updated, waste_rate: seed?.waste_rate ?? 0 };
    }
    return updated;
  });

  // Lưu lại nếu có migration
  if (needsMigration) {
    safeSet(KEYS.PRODUCTS, migrated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vlxd-products-updated', { detail: migrated }));
    }
  }
  
  return migrated;
}

export function saveProduct(product: VlxdProduct): VlxdProduct[] {
  const current = getStoredProducts();
  const existingIdx = current.findIndex(p => String(p.id) === String(product.id));
  let updated: VlxdProduct[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...product };
  } else {
    const newProduct: VlxdProduct = {
      ...product,
      id: product.id || String(Date.now()),
      created_at: new Date().toISOString()
    };
    updated = [newProduct, ...current];
  }
  safeSet(KEYS.PRODUCTS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-products-updated', { detail: updated }));
  }
  return updated;
}

export function deleteProduct(productId: string): VlxdProduct[] {
  const current = getStoredProducts();
  const updated = current.filter(p => String(p.id) !== String(productId));
  safeSet(KEYS.PRODUCTS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-products-updated', { detail: updated }));
  }
  return updated;
}

// 2. DRIVERS & FLEET
export function getStoredDrivers(): VlxdDriver[] {
  return safeGet<VlxdDriver[]>(KEYS.DRIVERS, INITIAL_DRIVERS);
}

export function saveDriver(driver: VlxdDriver): VlxdDriver[] {
  const current = getStoredDrivers();
  const existingIdx = current.findIndex(d => d.id === driver.id);
  let updated: VlxdDriver[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = { ...updated[existingIdx], ...driver };
  } else {
    const newDriver: VlxdDriver = {
      ...driver,
      id: driver.id || `drv_${Date.now()}`
    };
    updated = [...current, newDriver];
  }
  safeSet(KEYS.DRIVERS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-drivers-updated', { detail: updated }));
  }
  return updated;
}

// 3. ORDERS
export function getStoredOrders(): VlxdOrder[] {
  return safeGet<VlxdOrder[]>(KEYS.ORDERS, INITIAL_ORDERS);
}

export function createOrder(orderPayload: Omit<VlxdOrder, 'id' | 'created_at' | 'timeline' | 'status'> & { id?: string }): VlxdOrder {
  const current = getStoredOrders();
  const newOrder: VlxdOrder = {
    ...orderPayload,
    id: orderPayload.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    created_at: new Date().toISOString(),
    status: 'pending',
    timeline: [
      {
        status: 'pending',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        title: 'Tạo đơn đặt hàng bến bãi',
        description: `Khách hàng ${orderPayload.customer_name} đã xác nhận đặt đơn hàng vật tư`
      }
    ]
  };
  const updated = [newOrder, ...current];
  safeSet(KEYS.ORDERS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-orders-updated', { detail: updated }));
  }
  return newOrder;
}

export function updateOrderStatus(orderId: string, status: VlxdOrder['status'], note?: string): VlxdOrder | null {
  const current = getStoredOrders();
  const target = current.find(o => o.id === orderId);
  if (!target) return null;

  const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const statusTitles: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt đơn',
    loading: 'Đang bốc hàng lên xe',
    delivering: 'Đang vận chuyển giao công trình',
    completed: 'Đã hoàn thành giao hàng',
    cancelled: 'Đã hủy đơn'
  };

  const updatedTimeline = [
    ...target.timeline,
    {
      status,
      time: nowTime,
      title: statusTitles[status] || 'Cập nhật tiến độ',
      description: note || `Đơn hàng chuyển sang trạng thái ${statusTitles[status]}`
    }
  ];

  const updatedOrder: VlxdOrder = {
    ...target,
    status,
    timeline: updatedTimeline
  };

  const updated = current.map(o => o.id === orderId ? updatedOrder : o);
  safeSet(KEYS.ORDERS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-orders-updated', { detail: updated }));
  }
  return updatedOrder;
}

// Luồng chống gian lận bến bãi bắt buộc: Gán Xe + Tài xế + Khối lượng niêm phong + Kẹp chì
export function assignAntiFraudAndDispatch(
  orderId: string,
  params: {
    driver_id: string;
    driver_name: string;
    driver_phone: string;
    truck_plate: string;
    sealed_weight: string;
    seal_code: string;
  }
): VlxdOrder | null {
  const current = getStoredOrders();
  const target = current.find(o => o.id === orderId);
  if (!target) return null;

  const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const updatedTimeline: OrderTimeline[] = [
    ...target.timeline,
    {
      status: 'loading',
      time: nowTime,
      title: 'Bốc hàng & Niêm phong xuất bãi',
      description: `Xe ${params.truck_plate} do tài xế ${params.driver_name} điều khiển đã cân tải. Khối lượng niêm phong: ${params.sealed_weight}. Tem kẹp chì: ${params.seal_code}`
    },
    {
      status: 'delivering',
      time: nowTime,
      title: 'Xuất bến giao hàng',
      description: `Xe ben/tải đã rời bến bãi TAILORA di chuyển đến ${target.address}`
    }
  ];

  const updatedOrder: VlxdOrder = {
    ...target,
    status: 'delivering',
    driver_id: params.driver_id,
    driver_name: params.driver_name,
    driver_phone: params.driver_phone,
    truck_plate: params.truck_plate,
    sealed_weight: params.sealed_weight,
    seal_code: params.seal_code,
    timeline: updatedTimeline
  };

  const updated = current.map(o => o.id === orderId ? updatedOrder : o);
  safeSet(KEYS.ORDERS, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-orders-updated', { detail: updated }));
  }
  return updatedOrder;
}

// 4. TENANT CONFIG
export function getStoredTenant(): TenantConfig {
  return safeGet<TenantConfig>(KEYS.TENANT, INITIAL_TENANT);
}

export function saveTenant(config: Partial<TenantConfig>): TenantConfig {
  const current = getStoredTenant();
  const updated = { ...current, ...config };
  safeSet(KEYS.TENANT, updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-tenant-updated', { detail: updated }));
  }
  return updated;
}

// 5. B2B DEBT & REPORTS
export function getStoredDebtB2b(): B2bDebtRecord[] {
  return safeGet<B2bDebtRecord[]>(KEYS.DEBT, INITIAL_B2B_DEBT);
}

export function recordDebtPayment(debtId: string, amount: number): B2bDebtRecord[] {
  const current = getStoredDebtB2b();
  const updated = current.map(item => {
    if (item.id === debtId) {
      const newDebt = Math.max(0, item.current_debt - amount);
      const newOverdue = Math.max(0, item.overdue_amount - amount);
      return {
        ...item,
        current_debt: newDebt,
        overdue_amount: newOverdue,
        last_payment_date: new Date().toLocaleDateString('vi-VN'),
        status: (newOverdue > 0 ? 'warning' : 'good') as 'warning' | 'good'
      };
    }
    return item;
  });
  safeSet(KEYS.DEBT, updated);
  return updated;
}

export function getStoredScrapReports(): ScrapReportItem[] {
  return safeGet<ScrapReportItem[]>(KEYS.SCRAP, INITIAL_SCRAP_REPORTS);
}

// 6. PHÍ SHIP THEO ĐỊA BÀN CẦN THƠ
export function calculateShippingFee(address: string): { fee: number; note: string } {
  if (!address) return { fee: 0, note: 'Chưa nhập địa chỉ' };
  const lower = address.toLowerCase();

  // Ninh Kiều = 0đ (Miễn phí nội ô bến bãi)
  if (lower.includes('ninh kiều') || lower.includes('ninh kieu') || lower.includes('xuân khánh') || lower.includes('an khánh') || lower.includes('hưng lợi') || lower.includes('an cư')) {
    return { fee: 0, note: 'Miễn phí vận chuyển nội ô bến bãi Ninh Kiều' };
  }

  // Các quận huyện cận kề Cần Thơ = 150.000đ
  if (lower.includes('cái răng') || lower.includes('cai rang') || lower.includes('bình thủy') || lower.includes('binh thuy')) {
    return { fee: 150000, note: 'Phí ship xe tải bến bãi (Cái Răng / Bình Thủy)' };
  }

  // Các quận huyện xa hơn = 200.000đ
  if (lower.includes('ô môn') || lower.includes('o mon') || lower.includes('phong điền') || lower.includes('phong dien') || lower.includes('thốt nốt') || lower.includes('vĩnh thạnh') || lower.includes('cờ đỏ')) {
    return { fee: 200000, note: 'Phí ship xe tải tuyến xa (Ngoại ô Cần Thơ)' };
  }

  // Mặc định quận khác / tỉnh lân cận
  return { fee: 180000, note: 'Phí vận chuyển giao hàng tiêu chuẩn bến bãi' };
}

// 7. INVENTORY TRANSACTIONS
export function getStoredTransactions(): VlxdInventoryTransaction[] {
  const raw = safeGet<VlxdInventoryTransaction[]>(KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  // === MIGRATION: Backfill new fields cho records cũ không có status/base_quantity ===
  let migrated = false;
  const result = raw.map(t => {
    const needsFix = !t.status || t.base_quantity === undefined || !t.base_uom;
    if (!needsFix) return t;
    migrated = true;
    return {
      ...t,
      status: t.status || 'approved',
      base_quantity: t.base_quantity ?? t.quantity,
      base_uom: t.base_uom || t.uom,
    } as VlxdInventoryTransaction;
  });
  if (migrated) safeSet(KEYS.TRANSACTIONS, result);
  return result;
}

/**
 * createTransaction: Tạo phiếu mới với status='pending'.
 * Tồn kho CHƯА bị thay đổi. Chỉ thay đổi khi 'approveTransaction' được gọi.
 */
export function createTransaction(
  txnPayload: Omit<VlxdInventoryTransaction, 'id' | 'created_at' | 'status'>
): VlxdInventoryTransaction | null {
  const currentTxns = getStoredTransactions();
  const products = getStoredProducts();
  const productIndex = products.findIndex(p => p.id === txnPayload.product_id);
  if (productIndex === -1) return null;

  const newTxn: VlxdInventoryTransaction = {
    ...txnPayload,
    id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const updatedTxns = [newTxn, ...currentTxns];
  safeSet(KEYS.TRANSACTIONS, updatedTxns);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-transactions-updated', { detail: updatedTxns }));
  }
  return newTxn;
}

/**
 * approveTransaction: Duyệt phiếu - thực thi cộng/trừ tồn kho chính thức.
 */
export function approveTransaction(txnId: string): VlxdInventoryTransaction | null {
  const txns = getStoredTransactions();
  const products = getStoredProducts();

  const txnIndex = txns.findIndex(t => t.id === txnId);
  if (txnIndex === -1) return null;
  const txn = txns[txnIndex];
  if (txn.status === 'approved') return txn; // Đã duyệt rồi

  const productIndex = products.findIndex(p => p.id === txn.product_id);
  if (productIndex === -1) return null;

  const product = products[productIndex];
  let newStock = product.stock;

  if (txn.type === 'IN') {
    newStock += txn.base_quantity;
  } else if (txn.type === 'OUT') {
    newStock -= txn.base_quantity;
    if (newStock < 0) {
      if (typeof window !== 'undefined') alert('Không đủ số lượng trong kho để duyệt phiếu xuất!');
      return null;
    }
  } else if (txn.type === 'ADJUST') {
    // base_quantity đã là giá trị chênh lệch (actual - prev)
    newStock += txn.base_quantity;
    if (newStock < 0) newStock = 0;
  }

  // Cập nhật tồn kho
  const updatedProducts = products.map((p, i) =>
    i === productIndex ? { ...p, stock: newStock } : p
  );
  safeSet(KEYS.PRODUCTS, updatedProducts);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-products-updated', { detail: updatedProducts }));
  }

  // Cập nhật status phiếu
  const updatedTxn: VlxdInventoryTransaction = { ...txn, status: 'approved' };
  const updatedTxns = txns.map((t, i) => i === txnIndex ? updatedTxn : t);
  safeSet(KEYS.TRANSACTIONS, updatedTxns);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-transactions-updated', { detail: updatedTxns }));
  }

  return updatedTxn;
}
export function createDisassembleTransaction(
  payload: {
    product_id: string;
    product_name: string;
    quantity: number;
    uom: string;
    bom_components: BomComponent[];
    note: string;
  }
): VlxdInventoryTransaction | null {
  const products = getStoredProducts();
  const productIndex = products.findIndex(p => p.id === payload.product_id);
  if (productIndex === -1) return null;

  const newTxn: VlxdInventoryTransaction = {
    id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
    type: 'DISASSEMBLE',
    status: 'pending',
    product_id: payload.product_id,
    product_name: payload.product_name,
    quantity: payload.quantity,
    base_quantity: payload.quantity,
    uom: payload.uom,
    base_uom: payload.uom,
    bom_components: payload.bom_components,
    note: payload.note || 'Rã kho',
    created_at: new Date().toISOString(),
    created_by: 'Admin Bến Bãi',
  };

  const currentTxns = getStoredTransactions();
  const updatedTxns = [newTxn, ...currentTxns];
  safeSet(KEYS.TRANSACTIONS, updatedTxns);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-transactions-updated', { detail: updatedTxns }));
  }
  return newTxn;
}

export function approveDisassembleTransaction(txnId: string): VlxdInventoryTransaction | null {
  const txns = getStoredTransactions();
  const products = getStoredProducts();

  const txnIndex = txns.findIndex(t => t.id === txnId);
  if (txnIndex === -1) return null;
  const txn = txns[txnIndex];
  if (txn.type !== 'DISASSEMBLE' || txn.status === 'approved') return txn;

  const comboIndex = products.findIndex(p => p.id === txn.product_id);
  if (comboIndex === -1) return null;

  const combo = products[comboIndex];
  if (combo.stock < txn.base_quantity) {
    if (typeof window !== 'undefined') alert('Tồn kho combo không đủ để rã kho!');
    return null;
  }

  let updatedProducts = [...products];
  updatedProducts[comboIndex] = { ...combo, stock: combo.stock - txn.base_quantity };

  for (const comp of (txn.bom_components || [])) {
    const idx = updatedProducts.findIndex(p => p.id === comp.product_id);
    if (idx !== -1) {
      updatedProducts[idx] = {
        ...updatedProducts[idx],
        stock: updatedProducts[idx].stock + comp.quantity * txn.base_quantity,
      };
    }
  }

  safeSet(KEYS.PRODUCTS, updatedProducts);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-products-updated', { detail: updatedProducts }));
  }

  const updatedTxn: VlxdInventoryTransaction = { ...txn, status: 'approved' };
  const updatedTxns = txns.map((t, i) => i === txnIndex ? updatedTxn : t);
  safeSet(KEYS.TRANSACTIONS, updatedTxns);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vlxd-transactions-updated', { detail: updatedTxns }));
  }
  return updatedTxn;
}
