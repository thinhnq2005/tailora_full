import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const odooUrl = process.env.ODOO_BASE_URL || "http://localhost:8069";
    const tenantHost = request.headers.get("x-tenant-host") || "tailoratech";

    const configRes = await fetch(`${odooUrl}/api/public/tenant/config/active?domain=${tenantHost}`, {
      cache: "no-store"
    });

    if (!configRes.ok) {
      return NextResponse.json([]);
    }

    const configData = await configRes.json();
    const activeConfig = configData.result || configData;

    if (!activeConfig || !Array.isArray(activeConfig.featured_projects)) {
      return NextResponse.json([]);
    }

    const processedProjects = activeConfig.featured_projects.map((project: any) => {
      let finalImg = project.img_url || "";
      if (finalImg && !finalImg.startsWith("http") && !finalImg.startsWith("data:image")) {
        const baseUrl = odooUrl.endsWith("/") ? odooUrl.slice(0, -1) : odooUrl;
        const cleanPath = finalImg.startsWith("/") ? finalImg : `/${finalImg}`;
        finalImg = `${baseUrl}${cleanPath}`;
      }

      return {
        id: String(project.id),
        name: project.name || "Công trình dự án",
        img_url: finalImg
      };
    });

    return NextResponse.json(processedProjects);
  } catch {
    return NextResponse.json([]);
  }
}