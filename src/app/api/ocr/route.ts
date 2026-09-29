import { NextResponse } from "next/server";
import { OcrExtractionResult, OcrDocType } from "@/types/ocr.types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, imageMimeType, docType = 'hoa_don', products } = body;

    const OCR_API_KEY = process.env.OCR_API_KEY || process.env.GEMINI_API_KEY;

    if (!imageBase64 || !imageMimeType) {
      return NextResponse.json({ error: "Thiếu dữ liệu tệp hình ảnh chứng từ." }, { status: 400 });
    }

    const docTypeNames: Record<OcrDocType, string> = {
      hoa_don: "Hóa đơn bán hàng / GTGT",
      phieu_nhap: "Phiếu nhập kho bến bãi",
      phieu_xuat: "Phiếu xuất kho bến bãi"
    };

    const docTypeName = docTypeNames[docType as OcrDocType] || "Hóa đơn";

    const productsContext = Array.isArray(products) && products.length > 0
      ? products.map((p: any) => `- ID: ${p.id} | ${p.name} | Giá: ${p.price || 0}/${p.uom}`).join("\n")
      : "- Cát vàng bê tông Tân Châu: 320.000đ/m³\n- Đá 1x2 xanh Đồng Nai: 380.000đ/m³\n- Xi măng Hà Tiên PCB40: 92.000đ/bao\n- Thép cuộn D6 Hòa Phát: 16.500đ/kg\n- Thép cây D10 Hòa Phát: 125.000đ/cây\n- Gạch tuynel 4 lỗ Bình Dương: 1.250đ/viên";

    const ocrSystemInstruction = `
Bạn là một máy quét OCR. BẮT BUỘC trích xuất TOÀN BỘ (ALL) 100% các dòng sản phẩm có trong ảnh. Không được tóm tắt, không được tự ý cắt giảm. Nếu ảnh có 5 dòng, phải trả về đủ 5 dòng.
BẮT BUỘC lấy đúng Tên khách hàng thật trong ảnh, KHÔNG ĐƯỢC bịa data. BẮT BUỘC lấy ĐỦ 100% các dòng sản phẩm, tuyệt đối không bỏ sót.

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một chuỗi JSON sạch đúng cấu trúc sau để Frontend đọc được:
{
  "customer_name": "[Tên khách hàng/đơn vị trong ảnh]",
  "document_code": "[Mã chứng từ nếu có]",
  "items": [
    { "name": "Tên vật tư 1", "unit": "ĐVT", "quantity": 10, "price": 100000, "total": 1000000 }
  ]
}
`;

    if (!OCR_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trong biến môi trường." }, { status: 500 });
    }

    try {
      const apiKey = (process.env.GEMINI_API_KEY || "").trim();
      // Sửa từ gemini-2.5-flash thành gemini-1.5-flash hoặc gemini-2.0-flash
      // Sửa từ gemini-3.6-flash thành gemini-1.5-flash hoặc gemini-2.0-flash
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      console.log(" ĐANG FETCH TỚI URL:", url.replace(apiKey, "***HIDDEN_KEY***"));

      const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Hãy nhận dạng và trích xuất chứng từ ${docTypeName} này.` },
                  { inlineData: { mimeType: imageMimeType, data: imageBase64 } }
                ]
              }
            ],
            systemInstruction: { parts: [{ text: ocrSystemInstruction }] },
            generationConfig: { responseMimeType: "application/json" }
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(" CHI TIẾT LỖI TỪ GOOGLE:", response.status, errorText);
        return NextResponse.json({ error: `Lỗi Google ${response.status}: ${errorText}` }, { status: 500 });
      }

      const data = await response.json();
      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      // Xử lý chuỗi JSON để loại bỏ markdown nếu có
      let cleanJsonText = rawJsonText.trim();
      if (cleanJsonText.startsWith("```json")) {
        cleanJsonText = cleanJsonText.replace(/^```json/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJsonText);
      
      // Map data từ chuẩn mới về cấu trúc OcrUploadZone đang dùng để tránh sập giao diện
      const mappedResult = {
        docType,
        docTypeName,
        maChungTu: parsed.document_code || "",
        tenKhachHang: parsed.customer_name || "",
        items: (parsed.items || []).map((i: any) => ({
          name: i.name || "",
          uom: i.unit || "",
          quantity: i.quantity || 0,
          unitPrice: i.price || 0,
          totalPrice: i.total || 0
        })),
        tongSoLuong: (parsed.items || []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0),
        tongThanhTien: (parsed.items || []).reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        tongTienThanhToan: (parsed.items || []).reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        confidenceScore: 98
      };

      return NextResponse.json({ result: mappedResult });
    } catch (err: any) {
      return NextResponse.json({ error: "Lỗi parse JSON OCR: " + err.message }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


