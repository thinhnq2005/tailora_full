'use server';

const STATIC_PRODUCTS = [
  {
    id: 38,
    name: 'Cát Vàng Bê Tông Rửa Sạch Tân Châu',
    category: 'cat-da',
    brand: 'Tân Châu',
    price: 320000,
    uom: 'm³',
    spec: 'Mô đun độ lớn 2.6 - 3.2',
    description: 'Cát vàng hạt to chuyên dùng đổ bê tông tươi, sàn, dầm cột nhà cao tầng tại Cần Thơ.',
    img: '/lpdata/product/cat/cactobetong.png'
  },
  {
    id: 39,
    name: 'Cát Xây Tô Hạt Mịn Sông Tiền',
    category: 'cat-da',
    brand: 'Sông Tiền',
    price: 240000,
    uom: 'm³',
    spec: 'Hạt mịn, đã sàng lọc tạp chất',
    description: 'Cát xây tô bám dính cực tốt, chống rạn nứt bề mặt tường tô trát.',
    img: '/lpdata/product/cat/catxayto.png'
  },
  {
    id: 40,
    name: 'Đá Xây Dựng 0x4 Xám',
    category: 'cat-da',
    brand: 'Đồng Nai',
    price: 310000,
    uom: 'm³',
    spec: 'Đá cấp phối 0x4',
    description: 'Cấp phối đá dăm 0x4 rải nền đường, lót sàn xưởng.',
    img: '/lpdata/product/da/da0x4xam.png'
  },
  {
    id: 41,
    name: 'Đá Xây Dựng 1x2 Xanh Đồng Nai',
    category: 'cat-da',
    brand: 'Đồng Nai',
    price: 380000,
    uom: 'm³',
    spec: 'Kích cỡ 10x28mm, cường độ nén cao',
    description: 'Đá dăm 1x2 tuyển chọn chất lượng cao đổ bê tông dầm móng công trình.',
    img: '/lpdata/product/da/da1x2xam.png'
  },
  {
    id: 43,
    name: 'Đá 4x6 Xám Lót Móng Chịu Lực',
    category: 'cat-da',
    brand: 'Đồng Nai',
    price: 340000,
    uom: 'm³',
    spec: 'Kích cỡ 40x60mm sạch đất',
    description: 'Đá hộc 4x6 dùng đầm lót nền móng nhà xưởng, chống lún sụt bến bãi.',
    img: '/lpdata/product/da/da4x6xam.png'
  },
  {
    id: 54,
    name: 'Xi Măng Vicem Hà Tiên Đa Dụng PCB40',
    category: 'xi-mang',
    brand: 'Hà Tiên',
    price: 92000,
    uom: 'Bao',
    spec: 'Tiêu chuẩn TCVN 6260:2009',
    description: 'Xi măng phát triển cường độ sớm, tăng độ dẻo cho vữa xây tô.',
    img: '/lpdata/product/ximang/ximanghatienpcb.png'
  },
  {
    id: 56,
    name: 'Xi Măng Insee Đa Dụng Cao Cấp',
    category: 'xi-mang',
    brand: 'Insee',
    price: 95000,
    uom: 'Bao',
    spec: 'Công nghệ chống nứt vượt trội',
    description: 'Xi măng chất lượng ổn định, kháng mặn phèn cho vùng đất miền Tây.',
    img: '/lpdata/product/ximang/ximanginsee.png'
  },
  {
    id: 51,
    name: 'Thép Cuộn Hòa Phát Phi 6 (D6)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 16500,
    uom: 'Kg',
    spec: 'Mác thép CB240-T, trơn',
    description: 'Thép cuộn tròn trơn làm đai cột, dầm, gia cố bê tông.',
    img: '/lpdata/product/sat/thepphi6.png'
  },
  {
    id: 45,
    name: 'Thép Cây Vằn Hòa Phát Phi 10 (D10)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 125000,
    uom: 'Cây',
    spec: 'Mác CB300V / CB400V, dài 11.7m',
    description: 'Thép gân vằn tiêu chuẩn chịu lực cao cho kết cấu khung nhà.',
    img: '/lpdata/product/sat/thepphi10.png'
  },
  {
    id: 46,
    name: 'Thép Cây Vằn Hòa Phát Phi 12 (D12)',
    category: 'sat-thep',
    brand: 'Hòa Phát',
    price: 185000,
    uom: 'Cây',
    spec: 'Mác CB400V, dài 11.7m',
    description: 'Thép cây vằn cốt thép chịu lực chính cho dầm cột sàn.',
    img: '/lpdata/product/sat/thepphi12.png'
  }
];

export async function getCategoriesAction() {
  return [
    { id: 'cat-da', name: 'CÁT & ĐÁ XÂY DỰNG' },
    { id: 'xi-mang', name: 'XI MĂNG CÁC LOẠI' },
    { id: 'sat-thep', name: 'SẮT THÉP XÂY DỰNG' },
    { id: 'gach', name: 'GẠCH TUYNEL & GẠCH ỐNG' },
    { id: 'ong-nuoc', name: 'ỐNG NƯỚC & PHỤ KIỆN' }
  ];
}

export async function getProductsAction(filters?: { id?: string }) {
  if (filters?.id) {
    return STATIC_PRODUCTS.filter(p => String(p.id) === String(filters.id));
  }
  return STATIC_PRODUCTS;
}