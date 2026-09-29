import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const quantityStr = searchParams.get("quantity");
    const quantity = parseInt(quantityStr || "0", 10);

    let threshold = 20;
    const cleanCategory = category ? category.toLowerCase() : "";

    if (cleanCategory.includes("sat") || cleanCategory.includes("thep") || cleanCategory === "sat-thep") {
      threshold = 500;
    } else if (cleanCategory.includes("xi") || cleanCategory.includes("mang") || cleanCategory === "xi-mang") {
      threshold = 50;
    }

    const isEligible = quantity >= threshold;
    const remaining = Math.max(0, threshold - quantity);

    return NextResponse.json({
      threshold,
      isEligible,
      remaining
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi hệ thống kiểm tra hạn mức" }, { status: 500 });
  }
}