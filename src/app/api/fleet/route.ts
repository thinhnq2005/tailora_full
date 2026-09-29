import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const odooUrl = process.env.ODOO_BASE_URL || "http://localhost:8069";
    const tenantHost = request.headers.get("x-tenant-host") || "tailoratech";

    let companyColor = "#3a2312"; 
    try {
      const configRes = await fetch(`${odooUrl}/api/tenant/config/active?domain=${tenantHost}`);
      if (configRes.ok) {
        const configData = await configRes.json();
        const activeConfig = configData.result || configData;
        if (activeConfig.company_color) companyColor = activeConfig.company_color;
        else if (activeConfig.primary_color) companyColor = activeConfig.primary_color;
      }
    } catch {}

    const targetUrl = `${odooUrl}/api/public/logistics/vehicles?domain=${tenantHost}`;
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params: {} }),
      next: { revalidate: 0 },
    });

    if (!res.ok) return NextResponse.json({ fleet: [], companyColor });

    const raw = await res.json();
    const odooResult = raw.result || raw;

    if (!odooResult || !Array.isArray(odooResult.vehicles)) {
      return NextResponse.json({ fleet: [], companyColor });
    }

    const processedFleet = odooResult.vehicles.map((vehicle: any) => {
      const cleanTitle = vehicle.x_web_fleet_name || vehicle.name || vehicle.license_plate || "Xe bến bãi";

      let finalImg = "";
      const customBigImage = vehicle.x_web_fleet_image;
      
      if (customBigImage) {
        finalImg = customBigImage.startsWith("data:image")
          ? customBigImage
          : `data:image/png;base64,${customBigImage}`;
      } else {
        const highResImage = vehicle.image_1920 || vehicle.image_256 || vehicle.image_128;
        if (highResImage) {
          finalImg = highResImage.startsWith("data:image")
            ? highResImage
            : `data:image/png;base64,${highResImage}`;
        } else {
          finalImg = `${odooUrl}/web/image/fleet.vehicle/${vehicle.id}/image_1920`;
        }
      }

      return {
        id: String(vehicle.id),
        title: cleanTitle,
        img_url: finalImg
      };
    });

    return NextResponse.json({ fleet: processedFleet, companyColor });
  } catch (error) {
    return NextResponse.json({ fleet: [], companyColor: "#3a2312" });
  }
}