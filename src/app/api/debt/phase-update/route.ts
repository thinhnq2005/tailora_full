import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Giả định URL endpoint Odoo từ biến môi trường hoặc cấu hình nội bộ
    const ODOO_API_URL = process.env.ODOO_BASE_URL || "http://localhost:8069";
    
    // Đẩy dữ liệu đồng bộ sang module công nợ chia đợt trên Odoo
    const odooResponse = await fetch(`${ODOO_API_URL}/api/debt/phase-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        params: {
          order_id: body.orderId,
          phases: body.phases, // Mảng danh sách các đợt cần cập nhật/kì kèo
          action_type: body.actionType || "negotiate" // 'negotiate' hoặc 'confirm'
        }
      }),
    });

    if (!odooResponse.ok) {
      return NextResponse.json(
        { error: "Lỗi kết nối từ phía hệ thống quản lý Odoo" },
        { status: odooResponse.status }
      );
    }

    const result = await odooResponse.json();
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Odoo từ chối cập nhật cấu trúc đợt nợ" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.result });
  } catch (error) {
    console.error("Error at phase-update route:", error);
    return NextResponse.json(
      { error: "Internal Server Error tại luồng cập nhật đợt nợ" },
      { status: 500 }
    );
  }
}