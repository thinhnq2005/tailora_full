import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ─── POST /api/chat ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { message, history, products, orders, debtMetrics } = body;

        if (!message || typeof message !== "string" || !message.trim()) {
            return NextResponse.json({ content: "Dạ em là Trợ lý AI TAILORA. Em có thể hỗ trợ Anh/Chị:\n1. Kiểm tra tồn kho cát đá sắt thép\n2. Tra cứu tiến độ & khối lượng niêm phong đơn hàng\n3. Đối soát công nợ B2B\n4. Tư vấn thông số kỹ thuật vật tư\nAnh/Chị cần em kiểm tra mục nào ạ?" });
        }

        const API_KEY = (process.env.GEMINI_API_KEY || process.env.OCR_API_KEY || "").trim();

        // ── Xây dựng ngữ cảnh sản phẩm ─────────────────────────────────────
        const productsContext =
            Array.isArray(products) && products.length > 0
                ? products.map((p: any) => {
                    const minPrice = p.price_min || p.price || 0;
                    const maxPrice = p.price_max || 0;
                    const priceStr =
                        maxPrice === 0 || minPrice === maxPrice
                            ? `${Number(minPrice).toLocaleString("vi-VN")}đ`
                            : `${Number(minPrice).toLocaleString("vi-VN")}đ ~ ${Number(maxPrice).toLocaleString("vi-VN")}đ`;
                    const stock = p.stock != null ? ` | Tồn kho: ${p.stock} ${p.uom}` : "";
                    return `- ${p.name} | Giá: ${priceStr}/${p.uom}${stock} | Thương hiệu: ${p.brand || "TAILORA"} | Quy cách: ${p.spec || "Tiêu chuẩn"}`;
                  }).join("\n")
                : "- Cát vàng Tân Châu: 320.000đ/m³ | Tồn kho: 450 m³\nĐá 1x2 Đồng Nai: 380.000đ/m³ | Tồn kho: 580 m³\nXi măng Hà Tiên PCB40: 92.000đ/bao | Tồn kho: 1.200 bao\nThép cuộn D6 Hòa Phát (Sắt 6): 16.500đ/kg | Tồn kho: 15.000 kg\nThép vằn D10 Hòa Phát (Sắt 10): 125.000đ/cây | Tồn kho: 950 cây\nGạch tuynel 4 lỗ Bình Dương: 1.250đ/viên | Tồn kho: 45.000 viên";

        const ordersContext =
            Array.isArray(orders) && orders.length > 0
                ? orders.map((o: any) =>
                    `- Đơn #${o.id}: Khách ${o.customer_name} | ${Number(o.total_amount || 0).toLocaleString("vi-VN")}đ | Trạng thái: ${o.status} | Niêm phong: ${o.sealed_weight || "Chưa cân"}`
                  ).join("\n")
                : "- Đơn #ORD-8821: Nhà thầu Trần Minh Phát | 5.100.000đ | Đang giao hàng (Niêm phong: 7.850 kg, Kẹp chì SEAL-LP-4421)\nĐơn #ORD-8820: Cty Xây Dựng Nam Cần Thơ | 9.350.000đ | Đã hoàn thành giao hàng";

        const debtContext = debtMetrics
            ? `Tổng công nợ: ${Number(debtMetrics.tongCongNo || 0).toLocaleString("vi-VN")}đ. Quá hạn: ${Number(debtMetrics.congNoQuaHan || 0).toLocaleString("vi-VN")}đ.`
            : "Tổng công nợ B2B: 12,85 tỷ đồng (Quá hạn: 3,25 tỷ đồng | Đã thu lũy kế: 15,4 tỷ đồng).";

        // ── System Instruction ────────────────────────────────────────────────
        const systemInstruction = `
Bạn là Trợ lý AI TAILORA, tư vấn viên của Vật Liệu Xây Dựng TAILORA (Hotline/Zalo: 0949734567).
Địa chỉ: Bờ Kè Sông Hậu, Ninh Kiều, Cần Thơ.

BẢNG DỮ LIỆU THỰC TẾ CỦA CỬA HÀNG:
[SẢN PHẨM & GIÁ BÁN]
${productsContext}

[ĐƠN HÀNG]
${ordersContext}

[CÔNG NỢ B2B]
${debtContext}

QUY TẮC PHẢN HỒI NGHIÊM NGẶT:
1. Xưng "em", gọi khách là "Anh/Chị".
2. Trả lời LINH HOẠT, NGẮN GỌN và TRỰC TIẾP vào câu hỏi.
3. Khi khách hỏi giá hoặc thông tin của MỘT SẢN PHẨM CỤ THỂ (ví dụ: "sắt 6", "cát", "xi măng"): CHỈ BÁO GIÁ VÀ TỒN KHO CỦA ĐÚNG MÓN ĐÓ. TUYỆT ĐỐI KHÔNG IN LẠI TOÀN BỘ DANH SÁCH SẢN PHẨM.
4. Hiểu tên gọi dân dã: "Sắt 6" = "Thép cuộn D6 Hòa Phát", "Sắt 10" = "Thép vằn D10".
`.trim();

        // ── Xây dựng contents cho Gemini ─────────────────────────────────────
        const contents: { role: string; parts: { text: string }[] }[] = [];

        if (Array.isArray(history) && history.length > 0) {
            history.forEach((chat: { role: string; content: string }) => {
                if (!chat?.content || !chat?.role) return;
                contents.push({
                    role: chat.role === "user" ? "user" : "model",
                    parts: [{ text: chat.content }],
                });
            });
        }

        contents.push({
            role: "user",
            parts: [{ text: message.trim() }],
        });

        if (!API_KEY) {
            return NextResponse.json({ content: "Dạ hệ thống AI đang bảo trì, Anh/Chị cần hỗ trợ vui lòng gọi Hotline 0949734567 ạ." });
        }

        // Cập nhật model mới nhất theo thông báo từ Google
        const modelName = "gemini-3.8-flash";
        const isStandardKey = API_KEY.startsWith("AIzaSy");
        
        const url = isStandardKey 
            ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`
            : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (!isStandardKey) {
            headers["Authorization"] = `Bearer ${API_KEY}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
                contents,
                systemInstruction: { parts: [{ text: systemInstruction }] },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(" LỖI GOOGLE API:", response.status, errorText);
            return NextResponse.json({ content: "Dạ hệ thống AI đang bận chút xíu, Anh/Chị chờ em giây lát hỏi lại giúp em nhé!" });
        }

        const data = await response.json();
        const cleanOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Dạ em chưa rõ ý Anh/Chị, Anh/Chị cần hỗ trợ giá hay tồn kho món nào ạ?";

        return NextResponse.json({ content: cleanOutput });
    } catch (error: any) {
        console.error(" [CRITICAL ERROR]:", error.message || error);
        return NextResponse.json({ content: "Dạ em gặp sự cố kết nối, Anh/Chị nhắn lại giúp em nhé!" });
    }
}