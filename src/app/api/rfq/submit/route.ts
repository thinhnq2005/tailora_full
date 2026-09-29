import { NextResponse } from "next/server";

const ODOO_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8069";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total_amount, notes, company_rfq_meta } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Danh sách vật tư bóc tách không hợp lệ hoặc trống." },
        { status: 400 }
      );
    }

    const response = await fetch(`${ODOO_URL}/api/rfq/create_draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        total_amount,
        notes: notes || "Đơn yêu cầu báo giá sỉ tự động khởi tạo từ bảng bóc tách OCR",
        company_rfq_meta,
        state: "draft"
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || "Lỗi xử lý tạo bản ghi đơn thương lượng trên Odoo bến bãi" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      orderId: data.rfq_id || data.name || `RFQ-${Date.now().toString().slice(-6)}`,
      total_amount: data.amount || total_amount,
      state: "draft",
      message: "Khởi tạo bản ghi đơn Draft thương lượng thành công trên hệ thống Odoo bến bãi."
    });

  } catch (error) {
    console.error("[RFQ SUBMIT ROUTE ERROR]:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ dữ liệu đơn hàng thương lượng sỉ B2B" },
      { status: 500 }
    );
  }
}