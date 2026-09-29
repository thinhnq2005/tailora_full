// src/types/debt.types.ts

export type DebtStatus = 'Trong hạn' | 'Cảnh báo' | 'Quá hạn' | 'Đã thanh toán';

export interface B2bCustomer {
  id: number;
  maKhachHang: string; // ví dụ: KH001, KH002
  tenCongTy: string;
  nguoiLienHe: string;
  soDienThoai: string;
  hanMucTinDung: number; // VNĐ
  duNoHienTai: number; // VNĐ
  ngayDenHan: string; // YYYY-MM-DD
  trangThai: DebtStatus;
  diaChiCongTrinh?: string;
  email?: string;
}

export interface B2bVoucher {
  id: number;
  maKhachHang: string;
  tenCongTy: string;
  maChungTu: string; // HD202609001 - KHÔNG ODOO
  ngayHoaDon: string; // YYYY-MM-DD
  tongTien: number;
  daThanhToan: number;
  conNo: number;
  hanThanhToan: string; // YYYY-MM-DD
  trangThai: DebtStatus;
  hangMucVatTu?: string;
}

export interface DebtDashboardMetrics {
  tongCongNo: number;
  congNoQuaHan: number;
  daThanhToan: number;
  chuaThanhToan: number;
  tongKhachHang: number;
  khachHangQuaHan: number;
}
