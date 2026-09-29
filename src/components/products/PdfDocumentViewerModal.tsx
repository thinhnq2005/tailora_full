'use client';

import React, { useState } from 'react';
import { TechnicalDocument } from '@/types/product.types';
import { FileText, Download, Eye, Upload, CheckCircle2, X } from 'lucide-react';

interface PdfDocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: TechnicalDocument | null;
  productName: string;
}

export default function PdfDocumentViewerModal({
  isOpen,
  onClose,
  document,
  productName
}: PdfDocumentViewerModalProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen || !document) return null;

  const handleDownload = () => {
    // Tải tài liệu PDF giả lập hoặc thực tế
    const element = window.document.createElement('a');
    element.href = document.fileUrl || '#';
    element.download = `${document.name}.pdf`;
    window.document.body.appendChild(element);
    element.click();
    window.document.body.removeChild(element);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
      <div style={{ position: 'fixed', inset: 0 }} onClick={onClose} />
      
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '850px',
        height: '85vh',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10
      }}>
        
        {/* HEADER MODAL PREVIEW */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} color="var(--theme-color)" />
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>
                {document.typeName}: {document.name}
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Vật tư: {productName} • Cập nhật: {document.updatedDate} • Dung lượng: {document.fileSize}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Thu nhỏ / Phóng to */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1e293b', borderRadius: '4px', padding: '2px 8px', fontSize: '11.5px' }}>
              <button
                type="button"
                onClick={() => setZoomLevel(Math.max(60, zoomLevel - 20))}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
              >
                -
              </button>
              <span style={{ color: '#ffffff', fontFamily: 'monospace' }}>{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel(Math.min(160, zoomLevel + 20))}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>

            {/* Nút Tải PDF */}
            <button
              type="button"
              onClick={handleDownload}
              style={{
                backgroundColor: 'var(--theme-color)',
                color: '#0f172a',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={13} />
              <span>Tải PDF</span>
            </button>

            {/* Nút Đóng */}
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NỘI DUNG PREVIEW PDF (Mô phỏng Bản Scan Hồ Sơ Kiểm Định & Chứng Nhận) */}
        <div style={{
          flex: 1,
          backgroundColor: '#525659',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          
          <div style={{
            width: `${(650 * zoomLevel) / 100}px`,
            minHeight: '840px',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            padding: '40px',
            boxSizing: 'border-box',
            fontFamily: 'serif',
            color: '#0f172a',
            position: 'relative'
          }}>
            
            {/* CON DẤU & CHỨNG THỰC BẢN QUYỀN */}
            <div style={{ position: 'absolute', top: '30px', right: '40px', textAlign: 'center', border: '2px solid #dc2626', color: '#dc2626', padding: '6px 14px', borderRadius: '4px', transform: 'rotate(-5deg)', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase' }}>
               ĐÃ CHỨNG THỰC BẾN BÃI<br />ERP TAILORA TECH
            </div>

            {/* TIÊU NGỮ QUỐC GIA */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div style={{ fontSize: '12px', fontStyle: 'italic', textDecoration: 'underline' }}>
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div style={{ marginTop: '16px', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}>
                {document.typeName} - {document.name}
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
                Số hồ sơ: <strong>{document.id.toUpperCase()}-2026/LP-QC</strong>
              </div>
            </div>

            {/* NỘI DUNG CHỨNG TỪ KỸ THUẬT */}
            <div style={{ borderTop: '2px solid #0f172a', paddingTop: '16px', fontSize: '13px', lineHeight: '1.8' }}>
              <p><strong>1. Đơn vị sản xuất / Nhà máy:</strong> Tổng công ty VLXD &amp; Bến Bãi TAILORA</p>
              <p><strong>2. Tên thương mại sản phẩm:</strong> {productName}</p>
              <p><strong>3. Tiêu chuẩn công bố áp dụng:</strong> TCVN ISO 9001:2015 / TCVN 6260 / TCVN 1651-2</p>
              <p><strong>4. Nơi lấy mẫu thí nghiệm:</strong> Trạm trung chuyển bến bãi Cần Thơ</p>
              <p><strong>5. Kết quả kiểm tra cơ lý tính:</strong></p>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', fontSize: '12px', border: '1px solid #0f172a' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #0f172a', padding: '6px' }}>Chỉ tiêu kiểm định</th>
                    <th style={{ border: '1px solid #0f172a', padding: '6px' }}>Đơn vị</th>
                    <th style={{ border: '1px solid #0f172a', padding: '6px' }}>Tiêu chuẩn quy định</th>
                    <th style={{ border: '1px solid #0f172a', padding: '6px' }}>Kết quả thử nghiệm</th>
                    <th style={{ border: '1px solid #0f172a', padding: '6px' }}>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px' }}>Giới hạn chảy / Cường độ nén</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>N/mm²</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>≥ 300 / ≥ 40</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>425 / 45.2</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>Đạt</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px' }}>Độ dẻo dai / Độ giãn dài</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>≥ 16%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>21.4%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>Đạt</td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #0f172a', padding: '6px' }}>Hàm lượng tạp chất vô cơ</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center' }}>≤ 1.0%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>0.32%</td>
                    <td style={{ border: '1px solid #0f172a', padding: '6px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>Đạt</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ marginTop: '16px' }}>
                <strong>6. Kết luận:</strong> Lô vật tư trên đáp ứng đầy đủ các chỉ tiêu kỹ thuật phục vụ thi công công trình dân dụng, cầu đường và nhà xưởng công nghiệp.
              </p>

              {/* CHỮ KÝ */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', textAlign: 'center' }}>
                <div>
                  <strong>TRƯỞNG PHÒNG KCS</strong>
                  <div style={{ height: '50px' }}></div>
                  <span>Kỹ sư Nguyễn Văn Thắng</span>
                </div>
                <div>
                  <strong>GIÁM ĐỐC ĐIỀU HÀNH BẾN BÃI</strong>
                  <div style={{ height: '50px' }}></div>
                  <span style={{ fontWeight: 'bold' }}>TAILORA Cons</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
