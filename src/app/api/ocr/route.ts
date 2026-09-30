import { NextResponse } from "next/server";
import { OcrExtractionResult, OcrDocType } from "@/types/ocr.types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageBase64, imageMimeType, docType = 'hoa_don', products } = body;

    const OCR_API_KEY = (process.env.OCR_API_KEY || process.env.GEMINI_API_KEY || "").trim();

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
      : [
          "- Cát vàng bê tông Tân Châu: 320.000đ/m³",
          "- Đá 1x2 xanh Đồng Nai: 380.000đ/m³",
          "- Xi măng Hà Tiên PCB40: 92.000đ/bao",
          "- Thép cuộn D6 Hòa Phát: 16.500đ/kg",
          "- Thép cây D10 Hòa Phát: 125.000đ/cây",
          "- Gạch tuynel 4 lỗ Bình Dương: 1.250đ/viên"
        ].join("\n");

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
`.trim();

    if (!OCR_API_KEY) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY trong biến môi trường." }, { status: 500 });
    }

    try {
      const modelName = "gemini-2.5-flash";
      const isStandardKey = OCR_API_KEY.startsWith("AIzaSy");
      
      // Xử lý chuẩn xác URL và Header theo loại khóa (AIzaSy dùng query param, AQ... dùng Bearer Token)
      const url = isStandardKey
        ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${OCR_API_KEY}`
        : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (!isStandardKey) {
        headers["Authorization"] = `Bearer ${OCR_API_KEY}`;
      }

      console.log("ĐANG FETCH OCR TỚI URL:", url.replace(OCR_API_KEY, "***HIDDEN_KEY***"));

      const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Hãy nhận dạng và trích xuất chứng từ ${docTypeName} này dựa trên danh mục vật tư:\n${productsContext}` },
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
        console.error("CHI TIẾT LỖI TỪ GOOGLE OCR:", response.status, errorText);
        return NextResponse.json({ error: `Lỗi Google ${response.status}: ${errorText}` }, { status: 500 });
      }

      const data = await response.json();
      const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      
      let cleanJsonText = rawJsonText.trim();
      if (cleanJsonText.startsWith("```json")) {
        cleanJsonText = cleanJsonText.replace(/^```json/, "").replace(/```$/, "").trim();
      }

      const parsed = JSON.parse(cleanJsonText);
      
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