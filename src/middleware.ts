import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. NÉ HOÀN TOÀN CÁC ROUTE API CÔNG KHAI (LẤY ẢNH, BANNER, LOGO)
  if (pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') || '';
  let cleanHost = hostname.trim().toLowerCase().split(':')[0];

  // Xóa www. bằng Regex chuẩn hóa chuỗi
  if (cleanHost.startsWith('www.')) {
    cleanHost = cleanHost.substring(4);
  }

  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    cleanHost = 'tailoratech';
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-host', cleanHost);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // 2. LOẠI TRỪ CẢ ROUTE '/api/public' KHÔNG CHO PHÉP MATCHER CHẠY QUA
  matcher: [
    '/((?!api/public|_next/static|_next/image|favicon.ico|assets|site.webmanifest|.*\\..*).*)',
  ],
};