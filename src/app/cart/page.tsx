"use client";

import React, { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useTenant } from "@/app/context/TenantContext";
import { useCart, CartItem } from "@/app/context/CartContext";

function getContrastTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

/** Lấy nhãn ĐVT ngắn gọn (không có quy cách trong ngoặc) */
function getUomLabel(item: CartItem): string {
  if (item.uom_label) return item.uom_label;
  const match = item.uom.match(/^([^(]+?)(?:\s*\([^)]+\))?\s*$/);
  return match ? match[1].trim() : item.uom;
}

/** Lấy quy cách ĐVT (phần trong ngoặc, VD: "50kg", "11.7m") */
function getUomSpec(item: CartItem): string | undefined {
  if (item.uom_spec) return item.uom_spec;
  const match = item.uom.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : undefined;
}

function CartContent() {
  const router = useRouter();
  const { tenant } = useTenant();
  const { cartItems, updateQuantity, updateUom, removeFromCart, totalAmount } = useCart();

  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [dummySearch, setDummySearch] = useState<string>("");

  const themeColor = tenant?.primary_color || "var(--theme-color)";
  const textColorForTheme = getContrastTextColor(themeColor);
  const brandNameDisplay = tenant?.brand_name || "TAILORA";

  // Khi cartItems thay đổi, tự động chọn tất cả nếu chưa chọn gì
  React.useEffect(() => {
    if (cartItems.length > 0 && selectedIds.length === 0) {
      setSelectedIds(cartItems.map(item => item.id));
    }
  }, [cartItems]);

  const handleToggleCheck = (itemId: string | number) => {
    if (selectedIds.includes(itemId)) {
      setSelectedIds(selectedIds.filter(id => id !== itemId));
    } else {
      setSelectedIds([...selectedIds, itemId]);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map(item => item.id));
    }
  };

  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));
  const currentTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleExportExcel = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư để xuất file báo giá!");
      return;
    }

    let csvContent = "\uFEFFSTT,Tên Vật Tư,Quy Cách,Số Lượng,Đơn Vị Tính,Đơn Giá,Thành Tiền\n";
    selectedItems.forEach((item, index) => {
      const totalRow = item.price * item.quantity;
      const spec = getUomSpec(item) || "";
      const label = getUomLabel(item);
      csvContent += `${index + 1},"${item.name.replace(/"/g, '""')}","${spec}",${item.quantity},${label},${item.price},${totalRow}\n`;
    });
    csvContent += `,,,,Tổng Cộng,,${currentTotal}\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Toa_Hang_${brandNameDisplay.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =================== XUẤT ẢNH TỌA HÀNG (TABLE-BASED) ===================
  const handleExportImage = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư để xuất ảnh toa hàng!");
      return;
    }

    // Tạo div HTML ẩn với layout chuẩn để render
    const wrapper = document.createElement("div");
    wrapper.style.cssText = [
      "position:fixed", "left:-9999px", "top:0",
      "width:700px", "background:#ffffff",
      "font-family:Arial,sans-serif", "padding:0",
    ].join(";");

    const headerColor = themeColor.startsWith("#") ? themeColor : "#1e3a8a";

    wrapper.innerHTML = `
      <div style="background:${headerColor};height:8px;"></div>
      <div style="padding:24px 28px 20px 28px;">
        <div style="font-size:18px;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">
          TOA HÀNG VẬT LIỆU XÂY DỰNG
        </div>
        <div style="font-size:12px;color:#64748b;margin-bottom:16px;">
          Đại lý phân phối: <strong>${brandNameDisplay.toUpperCase()}</strong>
        </div>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 14px 0;">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="text-align:left;padding:9px 10px;color:#475569;font-weight:800;border-bottom:2px solid #e2e8f0;width:38%;">Tên vật tư</th>
              <th style="text-align:right;padding:9px 10px;color:#475569;font-weight:800;border-bottom:2px solid #e2e8f0;width:13%;">Số lượng</th>
              <th style="text-align:left;padding:9px 6px;color:#475569;font-weight:800;border-bottom:2px solid #e2e8f0;width:10%;">ĐVT</th>
              <th style="text-align:right;padding:9px 10px;color:#475569;font-weight:800;border-bottom:2px solid #e2e8f0;width:19%;">Đơn giá</th>
              <th style="text-align:right;padding:9px 10px;color:#475569;font-weight:800;border-bottom:2px solid #e2e8f0;width:20%;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${selectedItems.map((item, idx) => {
              const label = getUomLabel(item);
              const spec = getUomSpec(item);
              const rowBg = idx % 2 === 0 ? "#ffffff" : "#fafafa";
              const total = item.price * item.quantity;
              return `
                <tr style="background:${rowBg};">
                  <td style="padding:9px 10px;color:#0f172a;font-weight:700;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    ${item.name}
                    ${spec ? `<div style="font-size:10.5px;color:#94a3b8;margin-top:2px;">${spec}</div>` : ""}
                  </td>
                  <td style="text-align:right;padding:9px 10px;color:#0f172a;font-weight:900;font-family:monospace;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    ${item.quantity.toLocaleString("vi-VN")}
                  </td>
                  <td style="padding:9px 6px;color:#334155;font-weight:700;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    ${label}
                  </td>
                  <td style="text-align:right;padding:9px 10px;color:#334155;font-family:monospace;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    ${item.price.toLocaleString("vi-VN")}đ/${label}
                  </td>
                  <td style="text-align:right;padding:9px 10px;color:#0f172a;font-weight:900;font-family:monospace;border-bottom:1px solid #f1f5f9;vertical-align:top;">
                    ${total.toLocaleString("vi-VN")}đ
                  </td>
                </tr>`;
            }).join("")}
          </tbody>
          <tfoot>
            <tr style="background:#f1f5f9;">
              <td colspan="4" style="padding:12px 10px;font-size:13px;font-weight:900;color:#0f172a;text-align:right;letter-spacing:0.3px;">
                TỔNG TIỀN VẬT TƯ:
              </td>
              <td style="text-align:right;padding:12px 10px;font-size:14px;font-weight:900;color:#0f172a;font-family:monospace;">
                ${currentTotal.toLocaleString("vi-VN")}đ
              </td>
            </tr>
          </tfoot>
        </table>
        <div style="font-size:10px;color:#94a3b8;margin-top:12px;">
          * Giá chưa bao gồm VAT. Phí vận chuyển tính riêng theo địa chỉ giao hàng.
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    // Dùng html2canvas nếu có, fallback về Canvas API đơn giản
    const exportViaCanvas = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) { document.body.removeChild(wrapper); return; }

      const PADDING = 28;
      const WIDTH = 700;
      const ROW_H = 36;
      const HEADER_H = 100;
      const FOOTER_H = 60;
      canvas.width = WIDTH;
      canvas.height = HEADER_H + 40 + selectedItems.length * ROW_H + FOOTER_H + 40;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top bar
      ctx.fillStyle = headerColor;
      ctx.fillRect(0, 0, canvas.width, 8);

      // Title
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 17px Arial";
      ctx.fillText("TOA HÀNG VẬT LIỆU XÂY DỰNG", PADDING, 38);

      ctx.fillStyle = "#64748b";
      ctx.font = "12px Arial";
      ctx.fillText(`Đại lý phân phối: ${brandNameDisplay.toUpperCase()}`, PADDING, 58);

      // Divider
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PADDING, 72); ctx.lineTo(WIDTH - PADDING, 72); ctx.stroke();

      // Column positions [x, align, width]
      const cols = [
        { x: PADDING, align: "left", w: 260, label: "Tên vật tư" },
        { x: 320, align: "right", w: 80, label: "Số lượng" },
        { x: 410, align: "left", w: 50, label: "ĐVT" },
        { x: 470, align: "right", w: 100, label: "Đơn giá" },
        { x: WIDTH - PADDING, align: "right", w: 110, label: "Thành tiền" },
      ] as const;

      // Table header
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 80, WIDTH, 28);
      ctx.fillStyle = "#475569";
      ctx.font = "bold 11.5px Arial";
      cols.forEach(col => {
        if (col.align === "right") {
          const tw = ctx.measureText(col.label).width;
          ctx.fillText(col.label, col.x - tw, 98);
        } else {
          ctx.fillText(col.label, col.x, 98);
        }
      });

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(PADDING, 108); ctx.lineTo(WIDTH - PADDING, 108); ctx.stroke();

      // Rows
      ctx.font = "12px Arial";
      let y = 130;
      selectedItems.forEach((item, idx) => {
        const label = getUomLabel(item);
        const rowTotal = item.price * item.quantity;

        if (idx % 2 === 1) {
          ctx.fillStyle = "#fafafa";
          ctx.fillRect(0, y - 16, WIDTH, ROW_H);
        }

        ctx.fillStyle = "#0f172a";
        let displayName = item.name;
        if (displayName.length > 36) displayName = displayName.substring(0, 34) + "…";
        ctx.fillText(displayName, PADDING, y);

        // Số lượng (right-aligned)
        const qtyStr = item.quantity.toLocaleString("vi-VN");
        ctx.fillText(qtyStr, 400 - ctx.measureText(qtyStr).width, y);

        // ĐVT
        ctx.fillText(label, 410, y);

        // Đơn giá (right-aligned)
        const priceStr = `${item.price.toLocaleString("vi-VN")}đ`;
        ctx.fillText(priceStr, 568 - ctx.measureText(priceStr).width, y);

        // Thành tiền (right-aligned)
        const totalStr = `${rowTotal.toLocaleString("vi-VN")}đ`;
        ctx.fillText(totalStr, WIDTH - PADDING - ctx.measureText(totalStr).width + ctx.measureText(totalStr).width, y);
        ctx.fillText(totalStr, WIDTH - PADDING - ctx.measureText(totalStr).width, y);

        // Divider dòng
        ctx.strokeStyle = "#f1f5f9";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(PADDING, y + 14); ctx.lineTo(WIDTH - PADDING, y + 14); ctx.stroke();

        y += ROW_H;
      });

      // Footer tổng tiền
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, y, WIDTH, 36);
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 13px Arial";
      ctx.fillText("TỔNG TIỀN VẬT TƯ:", PADDING, y + 22);
      const totalStr = `${currentTotal.toLocaleString("vi-VN")}đ`;
      ctx.fillText(totalStr, WIDTH - PADDING - ctx.measureText(totalStr).width, y + 22);

      // Note
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px Arial";
      ctx.fillText("* Giá chưa bao gồm VAT. Phí vận chuyển tính riêng.", PADDING, y + 52);

      document.body.removeChild(wrapper);

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Toa_Hang_${brandNameDisplay.replace(/\s+/g, '_')}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    exportViaCanvas();
  };

  const handleProceedCheckout = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một vật tư để đặt hàng!");
      return;
    }
    const idsParam = selectedItems.map(i => i.id).join(",");
    router.push(`/checkout?ids=${encodeURIComponent(idsParam)}`);
  };

  // Các tùy chọn UoM nhanh cho từng mặt hàng
  const getUomList = (item: CartItem): string[] => {
    if (item.available_uoms && item.available_uoms.length > 1) {
      return item.available_uoms;
    }
    const lower = item.name.toLowerCase();
    if (lower.includes('xi măng')) return ['Bao (50kg)', 'Tấn (20 Bao)'];
    if (lower.includes('thép') || lower.includes('sắt')) {
      if (item.uom.toLowerCase().includes('cây')) return ['Cây (11.7m)', 'Bó (100 Cây)'];
      return ['Kg', 'Tấn'];
    }
    if (lower.includes('cát') || lower.includes('đá')) return ['m³', 'Xe Ben 5m³'];
    if (lower.includes('gạch')) return ['Viên', 'Thiên (1.000 Viên)'];
    return [item.uom];
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar onCartClick={() => { }} searchTerm={dummySearch} setSearchTerm={setDummySearch} />

      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '100px 16px 40px 16px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', margin: 0, borderLeft: `4px solid ${themeColor}`, paddingLeft: '12px' }}>
              Toa hàng bến bãi ({brandNameDisplay})
            </h1>
            <p style={{ margin: '4px 0 0 16px', fontSize: '12px', color: '#64748b' }}>
              Hỗ trợ đa đơn vị tính UoM thực tế & xuất toa báo giá nhanh cho nhà thầu
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← Tiếp tục bốc hàng
          </button>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {cartItems.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid #f1f5f9', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                  onChange={handleToggleAll}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: themeColor }}
                />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>
                  Chọn tất cả ({cartItems.length} vật tư trong toa)
                </span>
              </label>

              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Đã chọn: <strong style={{ color: themeColor }}>{selectedItems.length}</strong> mặt hàng
              </span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: '14px' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}></div>
                <p style={{ margin: 0, fontWeight: '600' }}>Toa hàng hiện đang trống.</p>
                <p style={{ margin: '6px 0 16px 0', fontSize: '12px', color: '#94a3b8' }}>Hãy quay lại trang chủ để chọn vật tư đưa vào toa bến bãi.</p>
                <button
                  onClick={() => router.push("/")}
                  style={{ padding: '10px 20px', backgroundColor: themeColor, color: textColorForTheme, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}
                >
                  XEM DANH MỤC VẬT TƯ
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                const uomOptions = getUomList(item);
                const uomLabel = getUomLabel(item);
                const uomSpec = getUomSpec(item);
                const minQty = item.minQty ?? 1;
                const isAtMin = item.quantity <= minQty;

                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px dashed #f1f5f9'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleCheck(item.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: themeColor, marginTop: '4px' }}
                    />

                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '220px' }}>
                        {/* TÊN VẬT TƯ */}
                        <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                          {item.name}
                        </h4>

                        {/* QUY CÁCH ĐVT — text phụ dưới tên */}
                        {uomSpec && (
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#94a3b8' }}>
                            Quy cách: {uomSpec}
                          </p>
                        )}

                        {/* NOTE BẢO VỆ ĐỊNH MỨC HAO HỤT */}
                        {isAtMin && (
                          <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            ️ Số lượng đã tính hao hụt an toàn. Không thể giảm thêm.
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                          {/* TĂNG GIẢM SỐ LƯỢNG */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={isAtMin}
                              title={isAtMin ? "Không thể giảm dưới định mức hao hụt" : "Giảm"}
                              style={{
                                width: '26px', height: '26px', borderRadius: '4px',
                                border: `1px solid ${isAtMin ? '#e2e8f0' : '#cbd5e1'}`,
                                backgroundColor: isAtMin ? '#f8fafc' : '#ffffff',
                                cursor: isAtMin ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold', fontSize: '12px',
                                color: isAtMin ? '#cbd5e1' : '#1e293b',
                                opacity: isAtMin ? 0.5 : 1
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={minQty}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (!isNaN(val) && val >= minQty) updateQuantity(item.id, val);
                              }}
                              style={{
                                fontSize: '13px', fontWeight: '800', width: '48px', textAlign: 'center',
                                border: '1px solid #cbd5e1', borderRadius: '4px', padding: '3px 4px',
                                fontFamily: 'monospace', color: '#0f172a'
                              }}
                            />
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              style={{ width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                            >
                              +
                            </button>
                          </div>

                          {/* ĐVT LABEL — ngắn gọn */}
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', minWidth: '32px' }}>
                            {uomLabel}
                          </span>

                          {/* ĐA ĐƠN VỊ TÍNH (UOM) CHUYỂN ĐỔI */}
                          {uomOptions.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>ĐVT:</span>
                              <select
                                value={item.uom}
                                onChange={(e) => updateUom(item.id, e.target.value)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '11.5px',
                                  fontWeight: '700',
                                  backgroundColor: '#f8fafc',
                                  color: '#1e293b',
                                  cursor: 'pointer'
                                }}
                              >
                                {uomOptions.map(u => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ĐƠN GIÁ & THÀNH TIỀN */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: '900', fontFamily: 'monospace', color: '#0f172a' }}>
                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                          </div>
                          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                            {item.price.toLocaleString('vi-VN')}đ / {uomLabel}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', padding: '4px' }}
                          title="Xóa khỏi toa"
                        >
                          
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* TỔNG TIỀN VÀ HÀNH ĐỘNG */}
          {cartItems.length > 0 && (
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '2px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155' }}>Tổng chi phí vật tư đã chọn:</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>* Phí vận chuyển sẽ được tính tại trang thanh toán theo địa chỉ</p>
                </div>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>
                  {currentTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <button
                  onClick={handleExportImage}
                  style={{ height: '44px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                   Xuất Ảnh Toa Hàng
                </button>
                <button
                  onClick={handleExportExcel}
                  style={{ height: '44px', backgroundColor: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', textTransform: 'uppercase' }}
                >
                   Xuất Toa Báo Giá Excel
                </button>
              </div>

              <button
                onClick={handleProceedCheckout}
                disabled={selectedItems.length === 0}
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: selectedItems.length === 0 ? '#cbd5e1' : 'var(--theme-color)',
                  color: selectedItems.length === 0 ? '#94a3b8' : '#111827',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '900',
                  cursor: selectedItems.length === 0 ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: selectedItems.length > 0 ? '0 4px 14px var(--theme-color-15)' : 'none'
                }}
              >
                TIẾN HÀNH ĐẶT HÀNG & THANH TOÁN ({selectedItems.length})
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', fontSize: '14px', color: '#64748b' }}>
        Đang tải toa hàng bến bãi...
      </div>
    }>
      <CartContent />
    </Suspense>
  );
}