import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const odooUrl = process.env.ODOO_BASE_URL || "http://localhost:8069";
        const hostHeader = request.headers.get("host") || "localhost";
        
        let host = hostHeader.split(':')[0].toLowerCase();
        if (host.startsWith('www.')) {
            host = host.replace('www.', '');
        }
        
        if (host === 'localhost' || host === '127.0.0.1') {
            host = 'tailoratech';
        }

        const res = await fetch(`${odooUrl}/api/public/tenant/config/active?domain=${host}`, {
            method: "GET",
            next: { revalidate: 60 },
        });

        if (!res.ok) {
            return NextResponse.json({ error: "Tenant not found" }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}