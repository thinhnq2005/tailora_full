"use client";

import React from "react";
import { useTenant } from "@/app/context/TenantContext";

interface ProductSpecTableProps {
  category: string;
  specId: string;
  macId: string;
  productName?: string;
}

export default function ProductSpecTable({ category, specId, macId, productName = "" }: ProductSpecTableProps): React.JSX.Element {
  const { tenant } = useTenant();
  const themeColor = tenant?.primary_color || "var(--theme-color)";

  const nameLower = productName.toLowerCase();
  const catLower = category.toLowerCase();

  const renderSpecs = () => {
    // 1. XI MĂNG
    if (catLower.includes("xi") || nameLower.includes("xi măng") || nameLower.includes("ximang")) {
      const isPcb40 = nameLower.includes("40");
      return (
        <>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600", width: "40%" }}>Cường độ nén (28 ngày)</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {isPcb40 ? "≥ 40 N/mm² (Mác PCB40 công trình)" : "≥ 30 N/mm² (Mác PCB30 xây tô)"}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Khối lượng tịnh</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>50 Kg/bao (hoặc xá rời theo xe bồn)</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Tiêu chuẩn sản xuất</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>TCVN 6260:2009 / ASTM C1157</td>
          </tr>
          <tr>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Thời gian đông kết</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>Bắt đầu: ≥ 45 phút, Kết thúc: ≤ 360 phút</td>
          </tr>
        </>
      );
    }

    // 2. SẮT / THÉP
    if (catLower.includes("sắt") || catLower.includes("sat") || catLower.includes("thep") || nameLower.includes("thép") || nameLower.includes("sắt")) {
      const isWire = nameLower.includes("cuộn") || nameLower.includes("phi 6") || nameLower.includes("phi 8");
      return (
        <>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600", width: "40%" }}>Mác thép chịu lực</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {isWire ? "CB240-T (Thép cuộn tròn trơn)" : "CB300-V / CB400-V (Thép thanh vằn)"}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Đường kính danh nghĩa</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {nameLower.includes("phi 6") ? "D6 (6.0 mm)" : nameLower.includes("phi 8") ? "D8 (8.0 mm)" : nameLower.includes("phi 10") ? "D10 (10.0 mm)" : nameLower.includes("phi 12") ? "D12 (12.0 mm)" : nameLower.includes("phi 16") ? "D16 (16.0 mm)" : "D10 - D32 tiêu chuẩn"}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Chiều dài tiêu chuẩn</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {isWire ? "Dạng cuộn tròn theo khối lượng tấn" : "11.7 mét / cây (hoặc cắt đôi bến bãi)"}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Tiêu chuẩn kỹ thuật</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>TCVN 1651-2:2018 / JIS G3112 (Nhật Bản)</td>
          </tr>
        </>
      );
    }

    // 3. GẠCH XÂY DỰNG
    if (catLower.includes("gạch") || catLower.includes("gach") || nameLower.includes("gạch") || nameLower.includes("gach")) {
      return (
        <>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600", width: "40%" }}>Kích thước hình học</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {nameLower.includes("đinh") ? "40 x 80 x 180 mm (Gạch đinh đặc)" : "80 x 80 x 180 mm (Gạch tuynel 4 lỗ)"}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Độ hút nước</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>≤ 12% (Nung chín đều, chống thấm tốt)</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Cường độ chịu nén</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>Mác 75 - Mác 100</td>
          </tr>
          <tr>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Trọng lượng viên</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>~ 1.15 - 1.25 kg / viên</td>
          </tr>
        </>
      );
    }

    // 4. ĐÁ XÂY DỰNG
    if (catLower.includes("đá") || catLower.includes("da") || nameLower.includes("đá")) {
      return (
        <>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600", width: "40%" }}>Quy cách kích cỡ hạt</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
              {nameLower.includes("1x2") ? "10 x 28 mm (Đá 1x2 đổ dầm móng sàn)" : nameLower.includes("4x6") ? "40 x 60 mm (Đá hộc lót nền)" : "5 - 25 mm tuyển chọn"}
            </td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Trọng lượng riêng</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>~ 1.55 - 1.62 Tấn / m³</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Độ sạch & Tạp chất</td>
            <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: "700" }}>&lt; 0.5% (Sàng rửa sạch bến bãi)</td>
          </tr>
          <tr>
            <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Cường độ kháng nén</td>
            <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>R28 ≥ 1000 kG/cm²</td>
          </tr>
        </>
      );
    }

    // 5. CÁT XÂY DỰNG
    return (
      <>
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600", width: "40%" }}>Mô đun độ lớn hạt</td>
          <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>
            {nameLower.includes("xây tô") ? "ML = 1.6 - 2.0 (Cát mịn dẻo xây tô)" : "ML = 2.6 - 3.2 (Cát vàng to đổ bê tông)"}
          </td>
        </tr>
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Hàm lượng bùn, sét hữu cơ</td>
          <td style={{ padding: "10px 12px", color: "#16a34a", fontWeight: "700" }}>&lt; 1.0% (Rửa sạch không nhiễm mặn)</td>
        </tr>
        <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
          <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Độ ẩm bãi bốc xếp</td>
          <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>3% - 5% (Chuẩn định mức m³)</td>
        </tr>
        <tr>
          <td style={{ padding: "10px 12px", color: "#64748b", fontWeight: "600" }}>Nguồn khai thác</td>
          <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: "700" }}>Mỏ Tân Châu / Sông Tiền</td>
        </tr>
      </>
    );
  };

  return (
    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "18px", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
      <h4 style={{ color: "#0f172a", fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: '0.4px', margin: "0 0 12px 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px" }}>
        Thông Số Kỹ Thuật &amp; Định Mức Vật Tư
      </h4>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
        <tbody>
          {renderSpecs()}
        </tbody>
      </table>
    </div>
  );
}