'use client';

import React, { useState } from 'react';
import { OcrDocType, OcrExtractionResult } from '@/types/ocr.types';
import { Upload, FileText, CheckCircle2, AlertCircle, Scan, ArrowRight } from 'lucide-react';

export type OcrUploadZoneProps = {
  onOcrSuccess?: (result: OcrExtractionResult, previewImg?: string) => void;
  onMockReady?: (mockToa: any) => void;
  tenant?: any;
  products?: any[];
};

// Hàm chuẩn hóa chuỗi tiếng Việt để so khớp tốt hơn
const cleanStr = (str: string = '') => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// HÀM BỔ SUNG: Match chuẩn xác CSDL TAILORA; nếu không match thì không ép giá 100k nữa
const normalizeOcrItems = (items: any[], productsList: any[] = []) => {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    const ocrClean = cleanStr(item.name || '');

    // 1. Tìm khớp ID hoặc tên chính xác
    let matchedProd = productsList.find((p) => {
      const pClean = cleanStr(p.name || '');
      return String(p.id) === String(item.id) || pClean === ocrClean;
    });

    // 2. Tìm chứa chuỗi con hai chiều
    if (!matchedProd && ocrClean) {
      matchedProd = productsList.find((p) => {
        const pClean = cleanStr(p.name || '');
        return pClean.includes(ocrClean) || ocrClean.includes(pClean);
      });
    }

    // 3. Quy tắc từ khóa đặc thù ngành xây dựng
    if (!matchedProd && ocrClean) {
      if (ocrClean.includes('1x2') || ocrClean.includes('1 2')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('1x2'));
      } else if (ocrClean.includes('cat to') || ocrClean.includes('cat xay to')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('cat xay to') || cleanStr(p.name).includes('cat to'));
      } else if (ocrClean.includes('cat')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('cat'));
      } else if (ocrClean.includes('ha tien') || ocrClean.includes('xi mang')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('ha tien') || cleanStr(p.name).includes('xi mang'));
      } else if (ocrClean.includes('d12') || ocrClean.includes('phi 12') || ocrClean.includes('12')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('phi 12') || cleanStr(p.name).includes('12'));
      } else if (ocrClean.includes('d10') || ocrClean.includes('phi 10') || ocrClean.includes('10')) {
        matchedProd = productsList.find((p) => cleanStr(p.name).includes('phi 10') || cleanStr(p.name).includes('10'));
      }
    }

    const finalQty = Number(item.quantity) || 0;

    // NẾU TÌM THẤY: Dùng tên và đơn giá chuẩn của TAILORA
    // NẾU KHÔNG TÌM THẤY: Giữ tên OCR, đơn giá = 0 (hiển thị "-")
    const isMatched = !!matchedProd;
    const finalPrice = isMatched ? matchedProd.price : (item.unitPrice || 0);
    const finalTotal = isMatched ? (finalPrice * finalQty) : 0;

    return {
      ...item,
      id: matchedProd ? matchedProd.id : item.id,
      name: matchedProd ? matchedProd.name : item.name,
      isMatched,
      unitPrice: finalPrice,
      totalPrice: finalTotal,
      uom: matchedProd?.uom || item.uom || 'đơn vị'
    };
  });
};

export default function OcrUploadZone({ onOcrSuccess, tenant, products = [] }: OcrUploadZoneProps): React.JSX.Element {
  const [docType, setDocType] = useState<OcrDocType>('hoa_don');
  const [fileStatus, setFileStatus] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<OcrExtractionResult | null>(null);

  const themeColor = tenant?.primary_color || 'var(--theme-color)';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setExtractedResult(null);
    setFileStatus('Đang quét OCR bóc tách: Mã chứng từ, Khách hàng, Vật tư, Số lượng, Thành tiền...');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Result = reader.result as string;
        const base64DataClean = base64Result.split(',')[1];

        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64DataClean,
            imageMimeType: file.type,
            docType: docType,
            products: products || []
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setFileStatus(`Lỗi từ Server: ${errData.error || res.status}`);
          setIsProcessing(false);
          return;
        }

        const data = await res.json();

        if (data && data.result) {
          // Chuẩn hóa và so khớp danh mục kho bãi TAILORA
          const normalizedItems = normalizeOcrItems(data.result.items || [], products);
          const calculatedTotalAmount = normalizedItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

          const finalResult: OcrExtractionResult = {
            ...data.result,
            items: normalizedItems,
            tongThanhTien: calculatedTotalAmount
          };

          setExtractedResult(finalResult);
          setFileStatus('');
          if (onOcrSuccess) {
            onOcrSuccess(finalResult, base64Result);
          }
        } else {
          setFileStatus('Lỗi bóc tách OCR từ hệ thống: Không có dữ liệu.');
        }
      } catch (err) {
        setFileStatus('Lỗi kết nối hoặc lỗi xử lý OCR.');
        console.error(" Lỗi Exception OCR:", err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setFileStatus('Lỗi đọc tệp hình ảnh.');
      setIsProcessing(false);
    };
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scan size={18} color="#0f172a" />
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Phân Hệ OCR Số Hóa Chứng Từ Bến Bãi
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'hoa_don', label: 'Hóa đơn' },
            { id: 'phieu_nhap', label: 'Phiếu nhập kho' },
            { id: 'phieu_xuat', label: 'Phiếu xuất kho' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setDocType(tab.id as OcrDocType);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: docType === tab.id ? '700' : '500',
                border: docType === tab.id ? '1px solid #0f172a' : '1px solid #cbd5e1',
                backgroundColor: docType === tab.id ? '#0f172a' : '#f8fafc',
                color: docType === tab.id ? '#ffffff' : '#475569',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <label style={{
        border: '1.5px dashed #cbd5e1',
        borderRadius: '8px',
        padding: '24px 16px',
        textAlign: 'center',
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        backgroundColor: isProcessing ? '#f8fafc' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        boxSizing: 'border-box',
        width: '100%',
        transition: 'border-color 0.2s'
      }}>
        <Upload size={24} color="#64748b" />
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
          {isProcessing ? 'Đang trích xuất dữ liệu...' : `Kéo thả hoặc bấm để tải lên ${docType === 'hoa_don' ? 'Hóa đơn' : docType === 'phieu_nhap' ? 'Phiếu nhập kho' : 'Phiếu xuất kho'}`}
        </div>
        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
          Hỗ trợ ảnh chụp JPG, PNG hoặc file PDF chứng từ thực tế
        </span>
        <input
          type="file"
          accept="image/*,.pdf"
          disabled={isProcessing}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </label>

      {fileStatus && (
        <div style={{ fontSize: '12px', color: '#2563eb', padding: '8px 12px', backgroundColor: '#eff6ff', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
          <span>{fileStatus}</span>
        </div>
      )}

      {extractedResult && (
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                Kết quả OCR ({extractedResult.docTypeName})
              </strong>
            </div>
            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
              Độ khớp: {extractedResult.confidenceScore || 98}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', width: '100%' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>1. Mã chứng từ:</span>
              <strong style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '14px' }}>
                {extractedResult.maChungTu || '-'}
              </strong>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>2. Khách hàng / Đơn vị:</span>
              <strong style={{ color: '#0f172a', fontSize: '13px', wordBreak: 'break-word' }}>
                {extractedResult.tenKhachHang || '-'}
              </strong>
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '6px', 
            border: '1px solid #e2e8f0', 
            width: '100%', 
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: '100%', 
              maxWidth: '100%',
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch',
              display: 'block',
              boxSizing: 'border-box'
            }}>
              <table style={{ width: '100%', minWidth: '450px', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 8px', minWidth: '130px' }}>3. Sản phẩm vật tư</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>4. Số lượng</th>
                    <th style={{ padding: '8px 6px', textAlign: 'right', whiteSpace: 'nowrap' }}>Đơn giá</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>5. Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedResult.items.map((item, idx) => {
                    const hasValidPrice = item.unitPrice && item.unitPrice > 0;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '8px 8px', fontWeight: '600', color: '#1e293b', wordBreak: 'break-word' }}>
                          {item.name}
                          {!item.isMatched && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', color: '#e11d48', backgroundColor: '#ffe4e6', padding: '1px 5px', borderRadius: '4px', display: 'inline-block' }}>
                              Chưa có mã bến
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          <strong>{item.quantity ? item.quantity.toLocaleString('vi-VN') : '-'}</strong> {item.uom || ''}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'monospace', color: '#64748b', whiteSpace: 'nowrap' }}>
                          {hasValidPrice ? `${item.unitPrice.toLocaleString('vi-VN')}đ` : '-'}
                        </td>
                        <td style={{ padding: '8px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                          {hasValidPrice && item.totalPrice > 0 ? `${item.totalPrice.toLocaleString('vi-VN')}đ` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ backgroundColor: '#f8fafc', fontWeight: '800' }}>
                    <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>TỔNG CỘNG CHỨNG TỪ:</td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {extractedResult.tongSoLuong ? extractedResult.tongSoLuong.toLocaleString('vi-VN') : '-'}
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right' }}></td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {extractedResult.tongThanhTien > 0 ? `${extractedResult.tongThanhTien.toLocaleString('vi-VN')}đ` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}