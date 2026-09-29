// src/types/product.types.ts

export type ProductCategoryType = 'xi-mang' | 'sat-thep' | 'gach' | 'cat-da' | 'ong-nuoc' | 'all';

export interface CementSpecs {
  cuongDo: string; // PCB40, PCB30, PC50
  khoiLuong: string; // 50kg/bao, xá rời
  tieuChuan: string; // TCVN 6260:2009, ASTM C1157
  doMin: string; // >= 2800 cm2/g
  thoiGianDongKet: string; // Bắt đầu >= 45 phút, kết thúc <= 375 phút
}

export interface SteelSpecs {
  macThep: string; // CB240-T, CB300-V, CB400-V, SD295
  duongKinh: string; // D6, D8, D10, D12, D14, D16, D18, D20, D25, D32
  chieuDai: string; // 11.7m/cây hoặc cuộn tròn
  gioiHanChay: string; // >= 300 N/mm2
  doGianDai: string; // >= 16%
}

export interface BrickSpecs {
  kichThuoc: string; // 80x80x180mm, 40x80x180mm
  doHutNuoc: string; // <= 12%
  cuongDoNen: string; // Mác 75, Mác 100
  khoiLuongVien: string; // 1.2 kg/viên
}

export interface SandStoneSpecs {
  moDunDoLon: string; // 2.6 - 3.2 (cát to) hoặc 10x28mm (đá 1x2)
  hamLuongBuiBun: string; // < 1.0%
  doSach: string; // Rửa sạch không nhiễm phèn mặn
  nguonKhaiThac: string; // Mỏ Tân Châu / Mỏ Đồng Nai
}

export interface TechnicalDocument {
  id: string;
  name: string;
  type: 'catalogue' | 'co' | 'cq' | 'iso' | 'spec_sheet';
  typeName: string; // "Catalogue PDF", "Chứng chỉ CO", "Chứng chỉ CQ", "Chứng chỉ ISO", "Tài liệu kỹ thuật"
  fileUrl: string;
  fileSize: string;
  updatedDate: string;
  previewAvailable: boolean;
}

export interface DetailedProduct {
  id: string;
  name: string;
  sku: string; // Mã sản phẩm
  category: ProductCategoryType;
  categoryName: string; // Nhóm sản phẩm
  brand: string; // Nhà cung cấp / Thương hiệu
  origin: string; // Xuất xứ
  price: number;
  uom: string;
  stock: number;
  min_stock: number;
  is_best_seller: boolean;
  description: string;
  img: string;

  // Thông số kỹ thuật theo từng phân loại
  specs: {
    cement?: CementSpecs;
    steel?: SteelSpecs;
    brick?: BrickSpecs;
    sandStone?: SandStoneSpecs;
  };

  // Tài liệu PDF
  documents: TechnicalDocument[];
}
