// src/types/ocr.types.ts

export type OcrDocType = 'hoa_don' | 'phieu_nhap' | 'phieu_xuat';

export interface OcrProductItem {
  id?: string;
  name: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  totalPrice: number;
  isMatched?: boolean;
}

export interface OcrExtractionResult {
  docType: OcrDocType;
  docTypeName: string; // 'Hóa đơn', 'Phiếu nhập kho', 'Phiếu xuất kho'
  maChungTu: string;
  tenKhachHang: string;
  ngayChungTu: string;
  soDienThoai?: string;
  diaChiCongTrinh?: string;
  items: OcrProductItem[];
  tongSoLuong: number;
  tongThanhTien: number;
  thueVat?: number;
  tongTienThanhToan: number;
  ghiChu?: string;
  confidenceScore?: number; // % độ tin cậy
}
