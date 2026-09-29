// src/services/ocrService.ts
import { OcrDocType, OcrExtractionResult } from '@/types/ocr.types';

export const ocrService = {
  async processOcrDocument(params: {
    imageBase64: string;
    imageMimeType: string;
    docType: OcrDocType;
    products?: any[];
  }): Promise<OcrExtractionResult> {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    if (!res.ok) {
      throw new Error('Lỗi máy chủ OCR');
    }

    const data = await res.json();
    if (!data.result) {
      throw new Error(data.error || 'Không bóc tách được dữ liệu');
    }

    return data.result;
  }
};
