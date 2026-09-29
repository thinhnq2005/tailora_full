'use client';

import React, { useState } from 'react';
import { TechnicalDocument } from '@/types/product.types';
import PdfDocumentViewerModal from './PdfDocumentViewerModal';
import { FileText, Eye, Download, Upload, CheckCircle2 } from 'lucide-react';

interface TechnicalDocsPanelProps {
  productName: string;
  themeColor?: string;
  initialDocuments?: TechnicalDocument[];
}

const DEFAULT_DOCUMENTS: TechnicalDocument[] = [
  {
    id: 'doc-cat-01',
    name: 'E-Catalogue Thông Số Bến Bãi',
    type: 'catalogue',
    typeName: 'Catalogue PDF',
    fileUrl: '/lpdata/docs/catalogue_sample.pdf',
    fileSize: '2.4 MB',
    updatedDate: '01/09/2026',
    previewAvailable: true
  },
  {
    id: 'doc-co-01',
    name: 'Chứng Nhận Nguồn Gốc Xuất Xứ (CO)',
    type: 'co',
    typeName: 'Chứng nhận CO',
    fileUrl: '/lpdata/docs/co_certificate.pdf',
    fileSize: '1.1 MB',
    updatedDate: '05/09/2026',
    previewAvailable: true
  },
  {
    id: 'doc-cq-01',
    name: 'Chứng Chỉ Chất Lượng Xuất Xưởng (CQ)',
    type: 'cq',
    typeName: 'Chứng chỉ CQ',
    fileUrl: '/lpdata/docs/cq_quality.pdf',
    fileSize: '1.8 MB',
    updatedDate: '08/09/2026',
    previewAvailable: true
  },
  {
    id: 'doc-iso-01',
    name: 'Chứng Chỉ Quản Lý Chất Lượng ISO 9001:2015',
    type: 'iso',
    typeName: 'Chứng nhận ISO',
    fileUrl: '/lpdata/docs/iso_9001.pdf',
    fileSize: '950 KB',
    updatedDate: '15/08/2026',
    previewAvailable: true
  },
  {
    id: 'doc-spec-01',
    name: 'Tài Liệu Kỹ Thuật & Cường Độ Nén',
    type: 'spec_sheet',
    typeName: 'Tài liệu kỹ thuật',
    fileUrl: '/lpdata/docs/technical_spec.pdf',
    fileSize: '1.5 MB',
    updatedDate: '10/09/2026',
    previewAvailable: true
  }
];

export default function TechnicalDocsPanel({
  productName,
  themeColor = 'var(--theme-color)',
  initialDocuments
}: TechnicalDocsPanelProps) {
  const [documents, setDocuments] = useState<TechnicalDocument[]>(initialDocuments || DEFAULT_DOCUMENTS);
  const [activeDocForPreview, setActiveDocForPreview] = useState<TechnicalDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: TechnicalDocument = {
        id: `doc-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        type: 'spec_sheet',
        typeName: 'Tài liệu kỹ thuật',
        fileUrl: URL.createObjectURL(file),
        fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        updatedDate: new Date().toLocaleDateString('vi-VN'),
        previewAvailable: true
      };
      setDocuments([newDoc, ...documents]);
      setIsUploading(false);
      alert(`Đã tải lên thành công hồ sơ kỹ thuật: "${file.name}"!`);
    }, 800);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
      
      {/* TIÊU ĐỀ & NÚT UPLOAD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '14px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '0.4px' }}>
            Hồ Sơ Kỹ Thuật &amp; Kiểm Định Pháp Lý
          </h4>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Catalogue PDF, Chứng chỉ CO, CQ, ISO phục vụ thầu dự án
          </span>
        </div>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 10px',
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: '600',
          color: '#0f172a',
          cursor: 'pointer'
        }}>
          <Upload size={12} />
          <span>{isUploading ? 'Đang tải...' : 'Tải lên PDF'}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* DANH SÁCH TÀI LIỆU PDF */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {documents.map((doc) => (
          <div
            key={doc.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc',
              fontSize: '12.5px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={16} color="#0f172a" />
              <div>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {doc.typeName} • {doc.fileSize} • Cập nhật: {doc.updatedDate}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {/* Nút Xem Trước PDF (Preview PDF) */}
              <button
                type="button"
                onClick={() => setActiveDocForPreview(doc)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Eye size={12} />
                <span>Xem PDF</span>
              </button>

              {/* Nút Tải về */}
              <button
                type="button"
                onClick={() => {
                  const element = window.document.createElement('a');
                  element.href = doc.fileUrl || '#';
                  element.download = `${doc.name}.pdf`;
                  window.document.body.appendChild(element);
                  element.click();
                  window.document.body.removeChild(element);
                }}
                style={{
                  padding: '5px 8px',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
                title="Tải về máy tính"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL XEM TRƯỚC PDF */}
      <PdfDocumentViewerModal
        isOpen={Boolean(activeDocForPreview)}
        onClose={() => setActiveDocForPreview(null)}
        document={activeDocForPreview}
        productName={productName}
      />

    </div>
  );
}