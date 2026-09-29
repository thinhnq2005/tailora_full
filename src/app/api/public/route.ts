import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'product';
  const id = searchParams.get('id');

  if (!id) {
    return new NextResponse('Missing ID', { status: 400 });
  }

  // Cấu hình endpoint gốc trên VPS Odoo tương ứng với từng loại
  let odooTargetUrl = `http://103.173.228.156:8069/api/public/product/image/${id}`;
  if (type === 'banner') {
    odooTargetUrl = `http://103.173.228.156:8069/api/public/tenant/banner/image/${id}`;
  } else if (type === 'logo') {
    odooTargetUrl = `http://103.173.228.156:8069/api/public/tenant/logo/${id}`;
  }

  try {
    // Serverless Next.js đứng ra fetch thay vì trình duyệt gọi trực tiếp
    const res = await fetch(odooTargetUrl, { method: 'GET' });
    
    if (!res.ok) {
      return new NextResponse('Image not found from Odoo', { status: res.status });
    }

    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/png';

    // Trả bytes ảnh về kèm content-type chuẩn dưới giao thức HTTPS của Vercel
    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Proxy image error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}