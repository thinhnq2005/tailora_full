import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { login, password, type } = body;

        const ODOO_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8069";

        const response = await fetch(`${ODOO_URL}/api/public/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                params: { login, password, type }
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ error: "Lỗi máy chủ kết nối hệ thống bến bãi" }, { status: response.status });
        }

        const jsonRes = await response.json();

        if (jsonRes.error) {
            return NextResponse.json({ error: jsonRes.error.message || "Tài khoản hoặc mật khẩu không đúng" }, { status: 400 });
        }

        const userData = jsonRes.result;
        if (userData && userData.error) {
            return NextResponse.json({ error: userData.error }, { status: 400 });
        }

        const cookieStore = await cookies();

        cookieStore.set("server_session_id", userData.session_id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        cookieStore.set("partner_id", String(userData.partner_id || ""), {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        cookieStore.set("user_profile", JSON.stringify({
            uid: userData.uid,
            partner_id: userData.partner_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            type: type
        }), {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return NextResponse.json(userData);
    } catch (error) {
        return NextResponse.json({ error: "Lỗi xử lý kết nối dữ liệu" }, { status: 500 });
    }
}