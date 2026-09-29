"use client";

import React, { useState } from "react";
import { useCart } from "@/app/context/CartContext";

// =================== KIỂU DỮ LIỆU BOM ===================

interface BomLine {
  product_name: string;
  uom: string;
  base_qty: number;    // Số lượng định mức gốc (ứng với base_area m²)
  waste_pct: number;   // Hao hụt %
  note: string;
  unit_price: number;  // Đơn giá thực tế (VNĐ)
}

interface ComboKit {
  id: string;
  name: string;
  description: string;
  base_area: number;   // Diện tích gốc của định mức (m²)
  icon: string;
  lines: BomLine[];
}

// =================== MOCK DATA 3 COMBO BOM (GIÁ THỰC TẾ) ===================

const COMBO_KITS: ComboKit[] = [
  {
    id: "combo-wc-5m2",
    name: "Hoàn thiện Nhà vệ sinh tiêu chuẩn",
    description:
      "Giải pháp trọn gói vật tư thô và thiết bị cơ bản để hoàn thiện 1 phòng vệ sinh 5m².",
    base_area: 5,
    icon: "",
    lines: [
      {
        product_name: "Lavabo + Vòi sen Inax",
        uom: "Bộ",
        base_qty: 1,
        waste_pct: 0,
        note: "Hàng chính hãng",
        unit_price: 1500000,
      },
      {
        product_name: "Gạch lát nền chống trượt 30x30",
        uom: "Thùng (1m²)",
        base_qty: 5,
        waste_pct: 5,
        note: "Cắt gạch góc",
        unit_price: 120000,
      },
      {
        product_name: "Gạch ốp tường 30x60",
        uom: "Thùng (1.44m²)",
        base_qty: 12,
        waste_pct: 8,
        note: "Ốp cao 2m",
        unit_price: 150000,
      },
      {
        product_name: "Xi măng Vicem Hà Tiên PCB40",
        uom: "Bao (50kg)",
        base_qty: 3,
        waste_pct: 2,
        note: "Trộn vữa nền",
        unit_price: 92000,
      },
      {
        product_name: "Keo chà ron cá sấu",
        uom: "Gói (1kg)",
        base_qty: 2,
        waste_pct: 10,
        note: "Chống thấm",
        unit_price: 15000,
      },
    ],
  },
  {
    id: "combo-mong-bang-50m2",
    name: "Đổ móng băng nhà cấp 4",
    description:
      "Vật liệu thô cấu kiện ngầm, chuẩn tỷ lệ cấp phối bê tông mác 250.",
    base_area: 50,
    icon: "",
    lines: [
      {
        product_name: "Đá 1x2 Xanh Đồng Nai",
        uom: "m³",
        base_qty: 12,
        waste_pct: 5,
        note: "Trộn bê tông",
        unit_price: 380000,
      },
      {
        product_name: "Cát vàng bê tông",
        uom: "m³",
        base_qty: 6,
        waste_pct: 10,
        note: "Rửa sạch",
        unit_price: 320000,
      },
      {
        product_name: "Xi măng Vicem Hà Tiên PCB40",
        uom: "Bao (50kg)",
        base_qty: 65,
        waste_pct: 2,
        note: "Tránh ẩm",
        unit_price: 92000,
      },
      {
        product_name: "Thép phi 12 CB300",
        uom: "Cây (11.7m)",
        base_qty: 40,
        waste_pct: 5,
        note: "Thép chủ",
        unit_price: 145000,
      },
      {
        product_name: "Dây thép buộc 1 ly",
        uom: "Cuộn (1kg)",
        base_qty: 5,
        waste_pct: 15,
        note: "Cột đai thép",
        unit_price: 20000,
      },
    ],
  },
  {
    id: "combo-phongkhach-20m2",
    name: "Cải tạo phòng khách hiện đại",
    description: "Combo vật tư hoàn thiện sàn và tường phòng khách.",
    base_area: 20,
    icon: "",
    lines: [
      {
        product_name: "Gạch lát nền bóng kiếng 60x60",
        uom: "Thùng (1.44m²)",
        base_qty: 15,
        waste_pct: 8,
        note: "Lát vân đuổi",
        unit_price: 250000,
      },
      {
        product_name: "Bột trét tường nội thất",
        uom: "Bao (40kg)",
        base_qty: 2,
        waste_pct: 5,
        note: "Bả 2 lớp",
        unit_price: 180000,
      },
      {
        product_name: "Sơn nước nội thất Dulux",
        uom: "Thùng (18L)",
        base_qty: 1,
        waste_pct: 2,
        note: "Sơn 1 lót 2 phủ",
        unit_price: 1200000,
      },
    ],
  },
];

// =================== ĐƠN VỊ NGUYÊN KHỐI (BẮT BUỘC SỐ NGUYÊN) ===================
// Các đơn vị này không thể mua lẻ thập phân — phải làm tròn lên Math.ceil()
const DISCRETE_UNITS = ["bao", "cây", "thùng", "bộ", "cuộn", "viên", "gói", "tấm", "hộp"];

/**
 * Hàm tính số lượng thông minh (Smart Rounding)
 *
 * - Đơn vị nguyên khối (Bao, Cây, Thùng, Bộ, Cuộn...): Math.ceil() → số nguyên
 * - Đơn vị đong đếm (m³, Kg, Tấn, m²...): Number.toFixed(2) → 2 chữ số thập phân
 *
 * @param base_qty  Số lượng định mức gốc
 * @param area      Diện tích user nhập
 * @param baseArea  Diện tích gốc định mức
 * @param uom       Đơn vị tính (dùng để xác định loại đơn vị)
 */
function calculateQuantity(
  base_qty: number,
  area: number,
  baseArea: number,
  uom: string
): number {
  if (area <= 0 || baseArea <= 0) return base_qty;

  // Lấy tên đơn vị gốc (trước dấu ngoặc) để so sánh
  // VD: "Bao (50kg)" → "bao", "Thùng (1.44m²)" → "thùng", "m³" → "m³"
  const uomBase = uom.split("(")[0].trim().toLowerCase();

  const rawQty = base_qty * (area / baseArea);

  const isDiscrete = DISCRETE_UNITS.some((unit) => uomBase.includes(unit));

  if (isDiscrete) {
    // Đơn vị nguyên khối: làm tròn lên số nguyên (đủ vật tư, không thiếu)
    return Math.ceil(rawQty);
  } else {
    // Đơn vị đong đếm (m³, Kg, Tấn...): giữ 2 chữ số thập phân, tránh floating point
    return Number(rawQty.toFixed(2));
  }
}

// =================== COMPONENT CON: SINGLE COMBO CARD ===================

function ComboCard({ kit }: { kit: ComboKit }) {
  const { addToCart } = useCart();
  const [area, setArea] = useState<number>(kit.base_area);
  const [addedToast, setAddedToast] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Tính số lượng thực tế (có waste) cho từng dòng BOM
  function calcDisplayQty(line: BomLine): number {
    const rawQty = line.base_qty * (area / kit.base_area) * (1 + line.waste_pct / 100);
    const uomBase = line.uom.split("(")[0].trim().toLowerCase();
    const isDiscrete = DISCRETE_UNITS.some((unit) => uomBase.includes(unit));
    return isDiscrete
      ? Math.ceil(rawQty)
      : Number(rawQty.toFixed(2));
  }

  // Tạm tính tổng tiền combo theo diện tích hiện tại
  const totalComboPrice = kit.lines.reduce((sum, line) => {
    return sum + calcDisplayQty(line) * line.unit_price;
  }, 0);

  const handleAddComboToCart = () => {
    // Dispatch tất cả BOM lines vào giỏ hàng — qty dùng chính calcDisplayQty
    // để đảm bảo số trong giỏ = số hiển thị trên bảng BOM (đã có waste)
    kit.lines.forEach((line) => {
      const qty = calcDisplayQty(line); // ← Nhất quán với số hiển thị

      // Tách quy cách khỏi tên ĐVT: "Bao (50kg)" → label="Bao", spec="50kg"
      const specMatch = line.uom.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
      const uomLabel = specMatch ? specMatch[1].trim() : line.uom;
      const uomSpec = specMatch ? specMatch[2].trim() : undefined;

      const product = {
        id: `combo-${kit.id}-${line.product_name}`,
        product_id: `combo-${kit.id}-${line.product_name}`,
        name: `[COMBO] ${line.product_name}`,
        price: line.unit_price,      // ← Đơn giá thực tế để trang Cart tính đúng tổng tiền
        base_price: line.unit_price,
        uom: line.uom,
        uom_label: uomLabel,
        uom_spec: uomSpec,
        img: "/placeholder.png",
      };
      addToCart(product, qty, line.uom);
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)";
        e.currentTarget.style.borderColor = "var(--theme-color)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* HEADER CARD — dùng var(--theme-color) thay vì màu hardcode */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--theme-color-15, rgba(234,179,8,0.10)) 0%, transparent 100%)",
          borderBottom: "3px solid var(--theme-color)",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          {/* Icon lớn */}
          <span
            style={{
              fontSize: "36px",
              lineHeight: 1,
              flexShrink: 0,
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))",
            }}
          >
            {kit.icon}
          </span>
          <div style={{ flex: 1 }}>
            {/* Badge gói — màu theme */}
            <span
              style={{
                display: "inline-block",
                fontSize: "10px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "1px",
                backgroundColor: "var(--theme-color)",
                color: "#0f172a",
                padding: "3px 9px",
                borderRadius: "999px",
                marginBottom: "8px",
              }}
            >
              KIT BOM · Gói {kit.base_area}m²
            </span>
            <h3
              style={{
                fontSize: "15px",
                fontWeight: "900",
                color: "#0f172a",
                margin: 0,
                lineHeight: "1.3",
              }}
            >
              {kit.name}
            </h3>
          </div>
        </div>
        <p
          style={{
            fontSize: "12.5px",
            color: "#64748b",
            margin: "12px 0 0 0",
            lineHeight: "1.5",
          }}
        >
          {kit.description}
        </p>
      </div>

      {/* BODY: DIỆN TÍCH INPUT + BOM TABLE */}
      <div style={{ padding: "16px 20px", flex: 1 }}>
        {/* INPUT DIỆN TÍCH */}
        <div
          style={{
            backgroundColor: "#f8fafc",
            border: "1.5px solid var(--theme-color-15, rgba(234,179,8,0.25))",
            borderRadius: "10px",
            padding: "12px 14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "20px", flexShrink: 0 }}></span>
          <div style={{ flex: 1 }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: "800",
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "block",
                marginBottom: "6px",
              }}
            >
              Diện tích cần thi công
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="number"
                min="1"
                step="0.5"
                value={area}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) setArea(val);
                }}
                style={{
                  width: "80px",
                  padding: "7px 10px",
                  borderRadius: "7px",
                  border: "1.5px solid var(--theme-color)",
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "#0f172a",
                  outline: "none",
                  textAlign: "center",
                  fontFamily: "monospace",
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748b" }}>
                m²
              </span>
              {area !== kit.base_area && (
                <span
                  style={{
                    fontSize: "11px",
                    backgroundColor: "var(--theme-color-15, rgba(234,179,8,0.15))",
                    color: "var(--theme-color-dark, #b45309)",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontWeight: "800",
                  }}
                >
                  ×{(area / kit.base_area).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOM TABLE */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: "900",
                textTransform: "uppercase",
                color: "#94a3b8",
                letterSpacing: "0.5px",
              }}
            >
              Danh mục vật tư BOM ({kit.lines.length} mặt hàng)
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                fontSize: "11px",
                color: "var(--theme-color-dark, #b45309)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              {isExpanded ? "Thu gọn ▲" : "Xem đủ ▼"}
            </button>
          </div>

          {/* Bảng BOM — hiển thị tối đa 3 dòng nếu chưa expand */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {(isExpanded ? kit.lines : kit.lines.slice(0, 3)).map((line, idx) => {
              const displayQty = calcDisplayQty(line);
              const hasChanged = area !== kit.base_area;
              const lineTotal = displayQty * line.unit_price;

              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: "8px",
                    padding: "9px 12px",
                    borderBottom:
                      idx <
                        (isExpanded
                          ? kit.lines.length - 1
                          : Math.min(2, kit.lines.length - 1))
                        ? "1px solid #f1f5f9"
                        : "none",
                    alignItems: "center",
                    backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                  }}
                >
                  {/* Tên vật tư */}
                  <div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontWeight: "700",
                        color: "#0f172a",
                      }}
                    >
                      {line.product_name}
                    </div>
                    <div
                      style={{
                        fontSize: "10.5px",
                        color: "#94a3b8",
                        marginTop: "2px",
                      }}
                    >
                      Hao hụt: {line.waste_pct}% · {line.note}
                    </div>
                  </div>
                  {/* UoM */}
                  <div
                    style={{
                      fontSize: "10.5px",
                      color: "#64748b",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {line.uom}
                  </div>
                  {/* Số lượng — đã smart-rounded */}
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "900",
                      color: hasChanged ? "var(--theme-color-dark, #b45309)" : "#0f172a",
                      textAlign: "right",
                      fontFamily: "monospace",
                      minWidth: "36px",
                      transition: "color 0.3s",
                    }}
                  >
                    {displayQty}
                  </div>
                  {/* Thành tiền dòng */}
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      fontFamily: "monospace",
                      minWidth: "70px",
                    }}
                  >
                    {lineTotal.toLocaleString("vi-VN")}đ
                  </div>
                </div>
              );
            })}

            {/* "...và N mặt hàng nữa" khi collapsed */}
            {!isExpanded && kit.lines.length > 3 && (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "11.5px",
                  color: "#94a3b8",
                  textAlign: "center",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
                onClick={() => setIsExpanded(true)}
              >
                ...và {kit.lines.length - 3} mặt hàng nữa → Xem đủ
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER: TẠM TÍNH + NÚT THÊM VÀO GIỎ */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #f1f5f9",
          backgroundColor: "#f8fafc",
        }}
      >
        {/* DÒNG TẠM TÍNH — nổi bật, đặt ngay trên nút */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            padding: "10px 14px",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1.5px solid var(--theme-color)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#475569",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Tạm tính:
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "900",
              color: "#0f172a",
              fontFamily: "monospace",
              letterSpacing: "-0.5px",
            }}
          >
            {totalComboPrice.toLocaleString("vi-VN")}đ
          </span>
        </div>

        {/* NÚT THÊM VÀO GIỎ — màu theme */}
        <button
          onClick={handleAddComboToCart}
          style={{
            width: "100%",
            padding: "13px 20px",
            backgroundColor: addedToast ? "#166534" : "var(--theme-color)",
            color: addedToast ? "#ffffff" : "#0f172a",
            border: "none",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "900",
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.3s ease",
            boxShadow: addedToast
              ? "0 4px 14px rgba(22,101,52,0.4)"
              : "0 4px 14px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
          onMouseEnter={(e) => {
            if (!addedToast) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.15)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {addedToast ? (
            <> Đã thêm {kit.lines.length} vật tư vào giỏ!</>
          ) : (
            <>Thêm toàn bộ Combo vào giỏ hàng</>
          )}
        </button>
        <p
          style={{
            fontSize: "10.5px",
            color: "#94a3b8",
            textAlign: "center",
            margin: "8px 0 0 0",
          }}
        >
          Nội suy theo {area}m² · Hao hụt đã tính · Giá chưa VAT
        </p>
      </div>

      {/* TOAST XÁC NHẬN NỘI BỘ CARD */}
      {addedToast && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            backgroundColor: "#166534",
            color: "#dcfce7",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "800",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 10,
          }}
        >
           Đã thêm vào giỏ!
        </div>
      )}
    </div>
  );
}

// =================== COMPONENT CHÍNH: COMBO SECTION ===================

export default function ComboSection() {
  return (
    <section
      id="combo-vattu"
      style={{
        maxWidth: "1440px",
        margin: "0 auto",
        padding: "40px 16px",
        boxSizing: "border-box",
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ marginBottom: "28px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "8px",
          }}
        >
          {/* Badge dùng theme color */}
          <span
            style={{
              fontSize: "10px",
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              backgroundColor: "var(--theme-color)",
              color: "#0f172a",
              padding: "4px 12px",
              borderRadius: "999px",
            }}
          >
            Chọn theo combo cho công trình
          </span>
        </div>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "900",
            color: "#0f172a",
            margin: "0 0 8px 0",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          Combo Vật Tư Công Trình
        </h2>
        <p
          style={{
            fontSize: "13.5px",
            color: "#64748b",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Nhập diện tích thi công — hệ thống tự động tính số lượng và{" "}
          <strong>tạm tính tổng tiền</strong> kèm hao hụt theo định mức.
          Thêm toàn bộ combo vào giỏ hàng chỉ với 1 cú nhấp.
        </p>
      </div>

      {/* GRID 3 CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {COMBO_KITS.map((kit) => (
          <ComboCard key={kit.id} kit={kit} />
        ))}
      </div>
    </section>
  );
}
