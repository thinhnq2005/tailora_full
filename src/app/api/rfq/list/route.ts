import { NextResponse } from "next/server";

const ODOO_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8069";

export async function GET() {
  try {
    const response = await fetch(`${ODOO_URL}/api/rfq/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData.error || "Lỗi xử lý hệ thống đối soát dữ liệu ERP" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : []);

  } catch (error) {
    console.error("[PORTAL RFQ LIST ERROR]:", error);
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ dữ liệu danh sách phiếu thầu" }, 
      { status: 500 }
    );
  }
}