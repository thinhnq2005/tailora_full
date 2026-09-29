import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.phaseId || !body.amount) {
      return NextResponse.json(
        { error: "Thiếu thông tin định danh đợt nợ hoặc số tiền thanh toán" },
        { status: 400 }
      );
    }

    const ODOO_API_URL = process.env.ODOO_BASE_URL || "http://localhost:8069";

    // Gửi tín hiệu thanh toán khớp lệnh cho đợt công nợ cụ thể sang Odoo
    const odooResponse = await fetch(`${ODOO_API_URL}/api/debt/phase-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        params: {
          phase_id: body.phaseId,
          amount: body.amount,
          tx_reference: body.txReference || `WAL_PHASE_${body.phaseId}_${Date.now()}`,
          payment_method: "vietqr"
        }
      }),
    });

    if (!odooResponse.ok) {
      return NextResponse.json(
        { error: "Không thể kết nối dịch vụ thanh toán của Odoo" },
        { status: odooResponse.status }
      );
    }

    const result = await odooResponse.json();

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || "Giao dịch gạch nợ thất bại trên Odoo" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: result.result });
  } catch (error) {
    console.error("Error at phase-pay route:", error);
    return NextResponse.json(
      { error: "Internal Server Error tại luồng xác nhận thanh toán đợt" },
      { status: 500 }
    );
  }
}