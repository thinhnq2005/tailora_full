"use client";

import React, { useState, useEffect, useRef } from "react";

interface ProductItem {
  id: string | number;
  name: string;
  price: number;
  category?: string;
  uom?: string;
  isMatched?: boolean;
}

interface OcrData {
  selected_item: ProductItem;
  quantity: number;
  alternatives: ProductItem[];
}

interface OcrTableProps {
  scannedData: OcrData[];
  tenant?: any;
  allProductsList?: ProductItem[];
}

const cleanStr = (str: string = '') => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getContrastTextColor = (hexColor: string): string => {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
};

// HÀM TÌM SẢN PHẨM KHỎI CSDL DỰA TRÊN TỪ KHÓA MỜ (FUZZY MATCHING)
const findMatchingDbProduct = (ocrItem: ProductItem, dbList: ProductItem[]): ProductItem | undefined => {
  if (!dbList || dbList.length === 0) return undefined;

  const matchById = dbList.find((p) => String(p.id) === String(ocrItem.id));
  if (matchById) return matchById;

  const ocrClean = cleanStr(ocrItem.name || '');
  if (!ocrClean) return undefined;

  // Khớp chính xác tên
  const matchByNameExact = dbList.find((p) => cleanStr(p.name) === ocrClean);
  if (matchByNameExact) return matchByNameExact;

  // Khớp chứa nhau
  const matchSubstring = dbList.find((p) => {
    const dbClean = cleanStr(p.name);
    return dbClean.includes(ocrClean) || ocrClean.includes(dbClean);
  });
  if (matchSubstring) return matchSubstring;

  // Nhận diện theo từ khóa đặc thù
  if (ocrClean.includes("1x2") || ocrClean.includes("1 2")) {
    return dbList.find((p) => cleanStr(p.name).includes("1x2"));
  }
  if (ocrClean.includes("cat to") || ocrClean.includes("cat xay to")) {
    return dbList.find((p) => cleanStr(p.name).includes("cat xay to") || cleanStr(p.name).includes("cat to"));
  }
  if (ocrClean.includes("cat")) {
    return dbList.find((p) => cleanStr(p.name).includes("cat"));
  }
  if (ocrClean.includes("xi mang") || ocrClean.includes("ha tien")) {
    return dbList.find((p) => cleanStr(p.name).includes("ha tien") || cleanStr(p.name).includes("xi mang"));
  }
  if (ocrClean.includes("12") || ocrClean.includes("d12") || ocrClean.includes("phi 12")) {
    return dbList.find((p) => cleanStr(p.name).includes("phi 12") || cleanStr(p.name).includes("12"));
  }
  if (ocrClean.includes("10") || ocrClean.includes("d10") || ocrClean.includes("phi 10") || ocrClean.includes("gr40")) {
    return dbList.find((p) => cleanStr(p.name).includes("phi 10") || cleanStr(p.name).includes("10"));
  }

  return undefined;
};

export default function OcrTable({ scannedData, tenant, allProductsList = [] }: OcrTableProps): React.JSX.Element {
  const [items, setItems] = useState<OcrData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalActiveIndex, setModalActiveIndex] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [hoveredAltId, setHoveredAltId] = useState<string | number | null>(null);

  const blockRef = useRef<HTMLDivElement>(null);
  const themeColor = tenant?.primary_color || 'var(--theme-color)';
  const buttonTextColor = getContrastTextColor(themeColor);

  useEffect(() => {
    if (scannedData && Array.isArray(scannedData)) {
      const normalizedData = scannedData.map((line) => {
        const dbProduct = findMatchingDbProduct(line.selected_item, allProductsList);
        const isMatched = !!dbProduct;

        // Nếu khớp CSDL TAILORA thì lấy giá và tên chuẩn, nếu không khớp thì giá = 0, hiển thị "-"
        return {
          ...line,
          selected_item: {
            id: dbProduct ? dbProduct.id : line.selected_item.id,
            name: dbProduct ? dbProduct.name : line.selected_item.name,
            price: dbProduct ? dbProduct.price : (line.selected_item.price || 0),
            uom: dbProduct?.uom || line.selected_item.uom,
            category: dbProduct?.category || line.selected_item.category,
            isMatched
          },
          alternatives: dbProduct
            ? allProductsList.filter((p) => p.category === dbProduct.category && String(p.id) !== String(dbProduct.id)).slice(0, 4)
            : []
        };
      });

      setItems(normalizedData);
    }
  }, [scannedData, allProductsList]);

  const handleQuantityChange = (index: number, nextQty: number) => {
    if (nextQty <= 0) {
      setItems((prev) => prev.filter((_, idx) => idx !== index));
      return;
    }
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, quantity: nextQty } : item)));
  };

  const switchAlternative = (lineIndex: number, alternativeItem: ProductItem) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== lineIndex) return item;
        const currentSelected = item.selected_item;
        const updatedAlternatives = item.alternatives.map((alt) =>
          String(alt.id) === String(alternativeItem.id) ? currentSelected : alt
        );
        return {
          ...item,
          selected_item: { ...alternativeItem, isMatched: true },
          alternatives: updatedAlternatives
        };
      })
    );
    setIsModalOpen(false);
  };

  const handleAddNewProductItem = (prod: ProductItem) => {
    const isExisted = items.some(item => String(item.selected_item.id) === String(prod.id));
    if (isExisted) {
      alert("Vật tư này đã có mặt trong danh sách!");
      setSearchQuery("");
      setShowSearchDropdown(false);
      return;
    }
    const newOcrLine: OcrData = {
      selected_item: { ...prod, isMatched: true },
      quantity: 1,
      alternatives: allProductsList.filter(p => p.category === prod.category && String(p.id) !== String(prod.id)).slice(0, 4)
    };
    setItems(prev => [...prev, newOcrLine]);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = item.selected_item.price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  const captureBlockToImage = () => {
    if (!blockRef.current) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 850;
    canvas.height = 140 + items.length * 60 + 80;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#000000";
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.fillStyle = "#000000";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("BẢNG KIỂM DUYỆT VÀ ĐIỀU CHỈNH VẬT TƯ TOA HÀNG", 30, 45);

    ctx.beginPath();
    ctx.moveTo(30, 65);
    ctx.lineTo(canvas.width - 30, 65);
    ctx.stroke();

    ctx.font = "bold 13px sans-serif";
    ctx.fillText("VẬT TƯ ĐỐI KHỚP KHẢ DỤNG", 30, 95);
    ctx.fillText("SỐ LƯỢNG", 450, 95);
    ctx.fillText("ĐƠN GIÁ", 580, 95);
    ctx.fillText("THÀNH TIỀN", 700, 95);

    let currentY = 135;
    items.forEach((item) => {
      const p = item.selected_item.price || 0;
      const priceText = p > 0 ? `${p.toLocaleString("vi-VN")}đ` : "-";
      const totalText = p > 0 ? `${(p * item.quantity).toLocaleString("vi-VN")}đ` : "-";

      ctx.fillText(item.selected_item.name, 30, currentY);
      ctx.fillText(String(item.quantity), 450, currentY);
      ctx.fillText(priceText, 580, currentY);
      ctx.fillText(totalText, 700, currentY);
      currentY += 50;
    });

    ctx.fillText(`Giá trị tạm tính: ${calculateTotal().toLocaleString("vi-VN")}đ`, 30, currentY + 10);
    const link = document.createElement("a");
    link.download = `toa_hang_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportToExcelFile = () => {
    if (items.length === 0) return;
    let tableBody = "";
    items.forEach((item, index) => {
      const p = item.selected_item.price || 0;
      tableBody += `
        <tr>
          <td style="border:1px solid #000;text-align:center;">${index + 1}</td>
          <td style="border:1px solid #000;">${item.selected_item.name}</td>
          <td style="border:1px solid #000;text-align:center;">${item.quantity}</td>
          <td style="border:1px solid #000;text-align:center;">${item.selected_item.uom || "đơn vị"}</td>
          <td style="border:1px solid #000;text-align:right;">${p > 0 ? p : "-"}</td>
          <td style="border:1px solid #000;text-align:right;">${p > 0 ? item.quantity * p : "-"}</td>
        </tr>`;
    });

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/></head>
      <body>
        <table>
          <thead>
            <tr style="background-color:#E2E8F0;font-weight:bold;">
              <th style="border:1px solid #000;">STT</th>
              <th style="border:1px solid #000;">Tên Vật Tư Chuẩn Hóa</th>
              <th style="border:1px solid #000;">Số Lượng</th>
              <th style="border:1px solid #000;">Đơn Vị</th>
              <th style="border:1px solid #000;">Đơn Giá (đ)</th>
              <th style="border:1px solid #000;">Thành Tiền (đ)</th>
            </tr>
          </thead>
          <tbody>${tableBody}</tbody>
        </table>
      </body>
      </html>`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `excel_toa_hang_${Date.now()}.xls`;
    link.click();
  };

  const filteredSearchSuggestions = allProductsList.filter(p =>
    cleanStr(p.name).includes(cleanStr(searchQuery))
  );

  const activeLineForModal = modalActiveIndex !== null ? items[modalActiveIndex] : null;

  return (
    <div
      ref={blockRef}
      style={{
        backgroundColor: "#ffffff",
        border: "2px solid #000000",
        borderRadius: "12px",
        padding: "16px 12px",
        boxSizing: "border-box",
        fontFamily: "system-ui, sans-serif",
        width: "100%",
        maxWidth: "100%",
        position: "relative"
      }}
    >
      <div style={{ borderBottom: "2px solid #000000", paddingBottom: "12px", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#000000", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          BẢNG KIỂM DUYỆT VÀ ĐIỀU CHỈNH VẬT TƯ TOA HÀNG
        </h3>
      </div>

      <div style={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        display: "block",
        boxSizing: "border-box"
      }}>
        <table style={{ width: "100%", minWidth: "480px", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #000000", color: "#475569", fontSize: "11px", textTransform: "uppercase", fontWeight: "900" }}>
              <th style={{ padding: "8px 6px", minWidth: "130px" }}>Vật tư đối khớp khả dụng</th>
              <th style={{ padding: "8px 4px", textAlign: "center", width: "100px", whiteSpace: "nowrap" }}>Số lượng</th>
              <th style={{ padding: "8px 6px", textAlign: "right", width: "90px", whiteSpace: "nowrap" }}>Đơn giá</th>
              <th style={{ padding: "8px 6px", textAlign: "right", width: "100px", whiteSpace: "nowrap" }}>Thành tiền</th>
              <th style={{ padding: "8px 4px", width: "26px" }}></th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "13px", color: "#000000" }}>
            {items.map((line, index) => {
              const hasPrice = line.selected_item.price && line.selected_item.price > 0;
              const totalLine = hasPrice ? line.selected_item.price * line.quantity : 0;

              return (
                <tr key={`${line.selected_item.id}-${index}`} style={{ borderBottom: "1px solid #e2e8f0", height: "60px" }}>
                  <td style={{ padding: "8px 6px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "900", color: "#000000", wordBreak: "break-word" }}>
                        {line.selected_item.name}
                        {!line.selected_item.isMatched && (
                          <span style={{ marginLeft: "6px", fontSize: "10px", color: "#e11d48", backgroundColor: "#ffe4e6", padding: "1px 5px", borderRadius: "4px", display: "inline-block" }}>
                            Chưa có giá bến
                          </span>
                        )}
                      </div>
                      {line.alternatives && line.alternatives.length > 0 && (
                        <div style={{ marginTop: "2px" }}>
                          <button
                            type="button"
                            onClick={() => { setModalActiveIndex(index); setIsModalOpen(true); }}
                            style={{ backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontSize: "10px", fontWeight: "900", padding: "2px 6px", borderRadius: "12px", cursor: "pointer", boxShadow: '1px 1px 0px #000000', whiteSpace: "nowrap" }}
                          >
                             +{line.alternatives.length} lựa chọn khác
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "8px 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <button type="button" onClick={() => handleQuantityChange(index, line.quantity - 1)} style={{ width: "22px", height: "26px", backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontWeight: "900", borderRadius: "4px 0 0 4px", cursor: "pointer", flexShrink: 0 }}>-</button>
                      <input
                        type="text"
                        value={line.quantity}
                        onChange={(e) => handleQuantityChange(index, Math.max(0, parseInt(e.target.value, 10) || 0))}
                        style={{
                          width: "36px",
                          height: "26px",
                          backgroundColor: "#ffffff",
                          borderTop: "2px solid #000000",
                          borderBottom: "2px solid #000000",
                          borderLeft: "none",
                          borderRight: "none",
                          color: "#000000",
                          fontSize: "12px",
                          fontWeight: "700",
                          fontFamily: "monospace",
                          textAlign: "center",
                          outline: "none",
                          boxSizing: "border-box",
                          padding: "0 2px",
                          borderRadius: 0,
                          flexShrink: 0
                        }}
                      />
                      <button type="button" onClick={() => handleQuantityChange(index, line.quantity + 1)} style={{ width: "22px", height: "26px", backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontWeight: "900", borderRadius: "0 4px 4px 0", cursor: "pointer", flexShrink: 0 }}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: "#475569", fontWeight: "700", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {hasPrice ? `${line.selected_item.price.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                  <td style={{ padding: "8px 6px", textAlign: "right", color: "#000000", fontWeight: "900", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {hasPrice && totalLine > 0 ? `${totalLine.toLocaleString("vi-VN")}đ` : "-"}
                  </td>
                  <td style={{ padding: "8px 2px", textAlign: "center" }}>
                    <button type="button" onClick={() => handleQuantityChange(index, 0)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "900" }}></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "16px", position: "relative", width: "100%", maxWidth: "100%", zIndex: 60 }}>
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setShowSearchDropdown(true)}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder=" Cộng thêm vật tư khác vào toa hàng..."
          style={{ width: "100%", padding: "8px 12px", border: "2px solid #000000", borderRadius: "6px", fontSize: "13px", fontWeight: "700", outline: "none", boxSizing: "border-box" }}
        />
        {showSearchDropdown && searchQuery && (
          <>
            <div style={{ position: "fixed", inset: 0, zIndex: 70 }} onClick={() => setShowSearchDropdown(false)}></div>
            <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: "6px", backgroundColor: "#ffffff", border: "2px solid #000000", borderRadius: "8px", zIndex: 80, padding: "4px 0", boxShadow: "4px 4px 0px #000000", maxHeight: "220px", overflowY: "auto" }}>
              {filteredSearchSuggestions.length === 0 ? (
                <div style={{ padding: "10px 14px", fontSize: "12px", color: "#64748b", fontWeight: "bold" }}>Không tìm thấy vật tư trùng khớp</div>
              ) : (
                filteredSearchSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleAddNewProductItem(prod)}
                    style={{ padding: "10px 14px", fontSize: "13px", fontWeight: "700", color: "#000000", cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span>{prod.name}</span>
                    <span style={{ color: "#475569", fontFamily: "monospace" }}>{prod.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "2px solid #000000", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ fontSize: "13px", color: "#000000", fontWeight: "700" }}>
          Giá trị tạm tính: <span style={{ color: "#000000", fontSize: "18px", fontWeight: "900", marginLeft: "4px", fontFamily: "monospace" }}>{calculateTotal().toLocaleString("vi-VN")}đ</span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={captureBlockToImage}
            style={{ padding: "8px 14px", backgroundColor: "#ffffff", border: "2px solid #000000", color: "#000000", fontSize: "11.5px", fontWeight: "900", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase", boxShadow: '2px 2px 0px #000000' }}
          >
            Xuất Ảnh
          </button>
          <button
            type="button"
            onClick={exportToExcelFile}
            style={{ padding: "8px 14px", backgroundColor: themeColor, border: "2px solid #000000", color: buttonTextColor, fontSize: "11.5px", fontWeight: "900", borderRadius: "6px", cursor: "pointer", textTransform: "uppercase", boxShadow: '2px 2px 0px #000000' }}
          >
            Xuất File Excel
          </button>
        </div>
      </div>

      {isModalOpen && activeLineForModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#ffffff", border: "3px solid #000000", borderRadius: "12px", width: "100%", maxWidth: "480px", padding: "20px", boxSizing: "border-box", boxShadow: "6px 6px 0px #000000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #000000", paddingBottom: "10px", marginBottom: "16px" }}>
              <div>
                <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "900", textTransform: "uppercase" }}>Chọn hàng thay thế bến bãi</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#64748b", fontWeight: "700" }}>{activeLineForModal.selected_item.name}</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", fontSize: "16px", fontWeight: "900", cursor: "pointer" }}></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {activeLineForModal.alternatives.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => modalActiveIndex !== null && switchAlternative(modalActiveIndex, alt)}
                  onMouseEnter={() => setHoveredAltId(alt.id)}
                  onMouseLeave={() => setHoveredAltId(null)}
                  style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700", borderRadius: "6px", border: "2px solid #000000", color: hoveredAltId === alt.id ? buttonTextColor : "#000000", backgroundColor: hoveredAltId === alt.id ? themeColor : "#f8fafc", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.15s ease" }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alt.name}</span>
                  <span style={{ fontFamily: "monospace", fontWeight: "900", whiteSpace: "nowrap" }}>{alt.price.toLocaleString("vi-VN")}đ</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}