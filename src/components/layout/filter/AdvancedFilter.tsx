'use client';

import React, { useState, useEffect, useRef } from "react";

interface AdvancedFilterProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedBrand: string;
  setSelectedBrand: (val: string) => void;
  selectedType: string;
  setSelectedType: (val: string) => void;
  priceRange: string;
  setPriceRange: (val: string) => void;
  themeColor?: string; // Tiếp nhận mã màu thương hiệu động từ trang cha
}

interface FilterOption {
  id: string;
  label: string;
}

export default function AdvancedFilter({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedType,
  setSelectedType,
  priceRange,
  setPriceRange,
  themeColor = 'var(--theme-color)' // Fallback nếu không truyền themeColor
}: AdvancedFilterProps): React.JSX.Element {
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const PRICE_OPTIONS = [
    { id: "all", label: "Tất cả mức giá" },
    { id: "low", label: "Dưới 100.000đ" },
    { id: "mid", label: "100.000đ - 400.000đ" },
    { id: "high", label: "Trên 400.000đ" }
  ];

  // Hàm tính toán màu chữ tương phản (Trắng hoặc Đen) dựa trên độ sáng của themeColor
  const getContrastColor = (hexColor: string) => {
    const cleanHex = hexColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
  };

  const dropdownHoverTextColor = getContrastColor(themeColor);

  // Khắc phục lỗi giữ quy cách cũ khi đổi danh mục
  useEffect(() => {
    setSelectedType("all");
  }, [selectedCategory, setSelectedType]);

  useEffect(() => {
    async function fetchTenantConfig() {
      try {
        const res = await fetch("/api/tenant/config/active");
        if (res.ok) {
          const config = await res.json();
          if (config.available_brands) setBrands(config.available_brands);
          if (config.active_categories) setCategories(config.active_categories);
        } else {
          setFallbackData();
        }
      } catch {
        setFallbackData();
      }
    }
    fetchTenantConfig();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setFallbackData = () => {
    setBrands(["Bến Bãi Cần Thơ", "Hà Tiên", "Hòa Phát", "Tây Đô", "Insee", "Pomina"]);
    setCategories([
      { id: "all", label: "TẤT CẢ VẬT TƯ" },
      { id: "cat-da", label: "CÁT - ĐÁ" },
      { id: "xi-mang", label: "XI MĂNG" },
      { id: "sat-thep", label: "SẮT THÉP" },
      { id: "gach", label: "GẠCH" },
      { id: "ong-nuoc", label: "ỐNG NƯỚC" }
    ]);
  };

  const getDynamicTypeOptions = (): FilterOption[] => {
    const allSpecs = [
      { id: "phi6", label: "Phi 6 (Φ6)" },
      { id: "phi8", label: "Phi 8 (Φ8)" },
      { id: "phi12", label: "Phi 12 (Φ12)" },
      { id: "da1x2", label: "Đá dăm 1x2" },
      { id: "da4x6", label: "Đá tảng 4x6" },
      { id: "cat_lon", label: "Hạt lớn 2.0-3.3mm" },
      { id: "pcb40", label: "Mác PCB40" },
      { id: "pcb30", label: "Mác PCB30" },
      { id: "dac", label: "Gạch đặc" },
      { id: "2lo", label: "Gạch 2 lỗ" },
      { id: "ong_pvc", label: "Ống nhựa PVC" },
      { id: "ong_hdpe", label: "Ống HDPE" }
    ];

    if (selectedCategory === "all") {
      return [{ id: "all", label: "Tất cả các loại" }, ...allSpecs];
    }
    if (selectedCategory === "cat-da") {
      return [
        { id: "all", label: "Tất cả loại Cát - Đá" },
        { id: "da1x2", label: "Đá dăm 1x2" },
        { id: "da4x6", label: "Đá tảng 4x6" },
        { id: "cat_lon", label: "Hạt lớn 2.0-3.3mm" }
      ];
    }
    if (selectedCategory === "xi-mang") {
      return [
        { id: "all", label: "Tất cả loại Xi măng" },
        { id: "pcb40", label: "Mác PCB40" },
        { id: "pcb30", label: "Mác PCB30" }
      ];
    }
    if (selectedCategory === "sat-thep") {
      return [
        { id: "all", label: "Tất cả loại Sắt Thép" },
        { id: "phi6", label: "Phi 6 (Φ6)" },
        { id: "phi8", label: "Phi 8 (Φ8)" },
        { id: "phi12", label: "Phi 12 (Φ12)" }
      ];
    }
    if (selectedCategory === "gach") {
      return [
        { id: "all", label: "Tất cả loại Gạch" },
        { id: "dac", label: "Gạch đặc" },
        { id: "2lo", label: "Gạch 2 lỗ" }
      ];
    }
    if (selectedCategory === "ong-nuoc") {
      return [
        { id: "all", label: "Tất cả loại Ống nước" },
        { id: "ong_pvc", label: "Ống nhựa PVC" },
        { id: "ong_hdpe", label: "Ống HDPE" }
      ];
    }
    return [{ id: "all", label: "Tất cả các loại" }];
  };

  const toggleDropdown = (menuKey: string) => {
    setActiveDropdown(activeDropdown === menuKey ? null : menuKey);
  };

  const currentTypeOptions = getDynamicTypeOptions();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "16px", padding: "24px", boxSizing: "border-box", position: "relative", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.04), inset 0 2px 4px #ffffff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "900", color: "#000000", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          LỌC SẢN PHẨM NÂNG CAO
        </h2>
        <div style={{ display: "flex", alignItems: "center", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "10px 16px", width: "320px", boxSizing: "border-box", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }}>
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ backgroundColor: "transparent", border: "none", color: "#000000", outline: "none", width: "100%", fontSize: "13px" }}
          />
        </div>
      </div>

      <div ref={dropdownRef} style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #e2e8f0", paddingTop: "20px", position: "relative", zIndex: 60 }}>
        
        {/* Dropdown Thương hiệu */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Thương hiệu chủ lực</span>
          <div style={{ position: "relative", width: "230px" }}>
            <div 
              onClick={() => toggleDropdown("brand")}
              className="custom-filter-dropdown-trigger"
              style={{ backgroundColor: "#ffffff", color: "#000000", border: "1px solid #cbd5e1", padding: "11px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "600", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.15s ease" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedBrand === 'all' ? "Tất cả thương hiệu" : selectedBrand}
              </span>
              <span style={{ color: themeColor, fontSize: "10px", marginLeft: "6px" }}>▼</span>
            </div>

            {activeDropdown === "brand" && (
              <div style={{ position: "absolute", top: "108%", left: 0, width: "100%", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", zIndex: 999, maxHeight: "240px", overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.08)", padding: "4px 0" }}>
                <div onClick={() => { setSelectedBrand('all'); setActiveDropdown(null); }} className="dropdown-selectable-item" style={{ padding: "10px 14px", cursor: "pointer", color: "#000000", fontSize: "13px", fontWeight: "500", transition: "all 0.1s ease" }}>Tất cả thương hiệu</div>
                {brands.map(brand => (
                  <div key={brand} onClick={() => { setSelectedBrand(brand); setActiveDropdown(null); }} className="dropdown-selectable-item" style={{ padding: "10px 14px", cursor: "pointer", color: "#000000", fontSize: "13px", fontWeight: "500", transition: "all 0.1s ease" }}>{brand}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Quy cách */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Quy cách kích thước</span>
          <div style={{ position: "relative", width: "240px" }}>
            <div 
              onClick={() => toggleDropdown("type")}
              className="custom-filter-dropdown-trigger"
              style={{ backgroundColor: "#ffffff", color: "#000000", border: "1px solid #cbd5e1", padding: "11px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "600", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.15s ease" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentTypeOptions.find(o => o.id === selectedType)?.label || "Tất cả các loại"}
              </span>
              <span style={{ color: themeColor, fontSize: "10px", marginLeft: "6px" }}>▼</span>
            </div>

            {activeDropdown === "type" && (
              <div style={{ position: "absolute", top: "108%", left: 0, width: "100%", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", zIndex: 999, maxHeight: "240px", overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.08)", padding: "4px 0" }}>
                {currentTypeOptions.map(opt => (
                  <div 
                    key={opt.id} 
                    onClick={() => { setSelectedType(opt.id); setActiveDropdown(null); }} 
                    className="dropdown-selectable-item"
                    style={{ padding: "10px 14px", cursor: "pointer", color: "#000000", fontSize: "13px", fontWeight: "500", transition: "all 0.1s ease" }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Khoảng giá */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Khoảng giá dự toán</span>
          <div style={{ position: "relative", width: "230px" }}>
            <div 
              onClick={() => toggleDropdown("price")}
              className="custom-filter-dropdown-trigger"
              style={{ backgroundColor: "#ffffff", color: "#000000", border: "1px solid #cbd5e1", padding: "11px 14px", borderRadius: "8px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "600", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", transition: "all 0.15s ease" }}
            >
              <span>{PRICE_OPTIONS.find(o => o.id === priceRange)?.label}</span>
              <span style={{ color: themeColor, fontSize: "10px", marginLeft: "6px" }}>▼</span>
            </div>

            {activeDropdown === "price" && (
              <div style={{ position: "absolute", top: "108%", left: 0, width: "100%", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", zIndex: 999, maxHeight: "240px", overflowY: "auto", boxShadow: "0 12px 32px rgba(0,0,0,0.08)", padding: "4px 0" }}>
                {PRICE_OPTIONS.map(opt => (
                  <div key={opt.id} onClick={() => { setPriceRange(opt.id); setActiveDropdown(null); }} className="dropdown-selectable-item" style={{ padding: "10px 14px", cursor: "pointer", color: "#000000", fontSize: "13px", fontWeight: "500", transition: "all 0.1s ease" }}>{opt.label}</div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-filter-dropdown-trigger:hover {
          border-color: #000000 !important;
          background-color: #fafafa !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.04) !important;
        }
        .dropdown-selectable-item:hover {
          background-color: ${themeColor} !important;
          color: ${dropdownHoverTextColor} !important;
        }
      `}</style>
    </div>
  );
}