// app/api/checkout/submit/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { total_amount } = body;
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      orderId,
      amount: total_amount || 0,
      accountNo: "0907123456",
      bankId: "MBBank",
      accountName: "DOANH NGHIEP TU NHAN VLXD TAILORA"
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi kết nối máy chủ dữ liệu đơn hàng" }, 
      { status: 500 }
    );
  }
}