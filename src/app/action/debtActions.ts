"use server";

import { headers, cookies } from "next/headers";

const ODOO_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8069";

export async function getCustomerDebtLedgerAction() {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    
    const tenantHost = headerStore.get("x-tenant-host") || "localhost";
    const sessionId = cookieStore.get("server_session_id")?.value;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-host": tenantHost,
    };

    if (sessionId) {
      requestHeaders["Cookie"] = `session_id=${sessionId}`;
    }

    const response = await fetch(`${ODOO_URL}/api/debt/ledger`, {
      method: "GET",
      headers: requestHeaders,
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error("Không thể truy xuất sổ đối chiếu công nợ");
    }

    return await response.json();
  } catch (error) {
    console.error("[DEBT ACTION GET LEDGER ERROR]:", error);
    return { error: "Lỗi đồng bộ dữ liệu sổ nợ doanh nghiệp" };
  }
}

export async function setupDebtPhasesAction(orderId: string, phases: { phase_number: number; amount_to_pay: number; due_date: string }[]) {
  try {
    const headerStore = await headers();
    const cookieStore = await cookies();
    
    const tenantHost = headerStore.get("x-tenant-host") || "localhost";
    const sessionId = cookieStore.get("server_session_id")?.value;

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "x-tenant-host": tenantHost,
    };

    if (sessionId) {
      requestHeaders["Cookie"] = `session_id=${sessionId}`;
    }

    const response = await fetch(`${ODOO_URL}/api/debt/config-phases`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        order_id: orderId,
        phases: phases
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Thất bại khi cấu hình phân kỳ nợ");
    }

    return await response.json();
  } catch (error: any) {
    console.error("[DEBT ACTION SETUP PHASES ERROR]:", error);
    return { success: false, error: error.message || "Lỗi xử lý phân kỳ công nợ trả theo đợt" };
  }
}