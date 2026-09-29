// utils/imageHelper.ts

const PRODUCT_IMAGE_MAP: Record<number | string, string> = {
  38: 'product/cat/cactobetong.png',
  39: 'product/cat/catxayto.png',
  40: 'product/da/da0x4xam.png',
  41: 'product/da/da1x2xam.png',
  42: 'product/da/da1x2trang.png',
  43: 'product/da/da4x6xam.png',
  44: 'product/sat/kem.png',
  45: 'product/sat/thepphi10.png',
  46: 'product/sat/thepphi12.png',
  47: 'product/sat/thepphi14.png',
  48: 'product/sat/thepphi16.png',
  49: 'product/sat/thepphi18.png',
  50: 'product/sat/thepphi20.png',
  51: 'product/sat/thepphi6.png',
  52: 'product/sat/thepphi8.png',
  53: 'product/ximang/ximang40taydoxanh.png',
  54: 'product/ximang/ximanghatienpcb.png', 
  55: 'product/ximang/ximanghatienxanh.png', // Đã cập nhật đúng file ảnh xi măng xanh của ông
  56: 'product/ximang/ximanginsee.png',
  57: 'product/ximang/ximanginseetaydo.png',
  58: 'product/ximang/ximangvicemhatien.png',
};

const SHOWCASE_IMAGE_MAP: Record<string, string> = {
  'Đại học FPT Cần Thơ': 'product/congtrinh/fpt.png',
  'Trường Đại học Nam Cần Thơ': 'product/congtrinh/nct.png',
  'Căn hộ cao cấp Cara River Park': 'product/congtrinh/cara.png',
  'Bệnh viện chấn thương chỉnh hình trung ương Cần Thơ': 'product/congtrinh/chinhhinh.png',
  'Bệnh viện Nhi đồng': 'product/congtrinh/nhidong.png',
  'Khách sạn Wink': 'product/congtrinh/wink.png',
  'Học viện Chính trị khu vực IV': 'product/congtrinh/chinhtri.png',
  'Khách sạn Mường Thanh': 'product/congtrinh/muongthanh.png',
  'Bệnh viện Đại học Nam Cần Thơ': 'product/congtrinh/bvnct.png',
};

export const getProductImageUrl = (productId: number | string): string => {
  if (!productId) return '/placeholder.png';
  const relativePath = PRODUCT_IMAGE_MAP[productId];
  return relativePath ? `/lpdata/${relativePath}` : '/placeholder.png';
};

export const getShowcaseImageUrl = (projectName: string): string => {
  if (!projectName) return '/placeholder.png';
  const relativePath = SHOWCASE_IMAGE_MAP[projectName.trim()];
  return relativePath ? `/lpdata/${relativePath}` : '/placeholder.png';
};

export const getFleetImageUrl = (fleetIndexId: number | string): string => {
  if (!fleetIndexId) return '/placeholder.png';
  const cleanId = String(fleetIndexId).replace(/\D/g, '');
  return cleanId ? `/lpdata/fleet/xe${cleanId}.jpg` : '/placeholder.png';
};

export const getBannerImageUrl = (bannerId: number | string): string => {
  if (!bannerId) return '/placeholder.png';
  const cleanId = String(bannerId).replace(/\D/g, '');
  if (cleanId === '2') return `/lpdata/banner/banner2.png`;
  return `/lpdata/banner/banner${cleanId || '1'}.jpg`;
};

export const getLogoImageUrl = (): string => {
  return '/lpdata/logo.png';
};