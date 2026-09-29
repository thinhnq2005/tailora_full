"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import VietQrModal from "@/components/ai/vietqr/VietQrModal";
import { useTenant } from "@/app/context/TenantContext";
import { useCart, CartItem } from "@/app/context/CartContext";
import { calculateShippingFee, createOrder, VlxdOrder } from "@/lib/vlxdStorage";

const CheckoutMap = dynamic(() => import("@/components/checkout/CheckoutMap"), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "13px", fontWeight: "500" }}>
      Đang tải sơ đồ bến bãi công trình...
    </div>
  )
});

interface OsmSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

function getContrastTextColor(hexColor: string): string {
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenant } = useTenant();
  const { cartItems, clearCart } = useCart();

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>("Nhà thầu xây dựng");
  const [customerPhone, setCustomerPhone] = useState<string>("0907.123.456");
  const [address, setAddress] = useState<string>("Phường Xuân Khánh, Quận Ninh Kiều, Cần Thơ");
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingNote, setShippingNote] = useState<string>("Miễn phí vận chuyển nội ô bến bãi Ninh Kiều");
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cod' | 'b2b_debt'>('vietqr');
  const [orderNote, setOrderNote] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<VlxdOrder | null>(null);

  const [suggestions, setSuggestions] = useState<OsmSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([10.033333, 105.783333]); // Tọa độ Ninh Kiều Cần Thơ
  const [markerPos, setMarkerPos] = useState<[number, number]>([10.033333, 105.783333]);
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const mapRef = useRef<any>(null);

  const themeColor = tenant?.primary_color || "var(--theme-color)";
  const textColorForTheme = getContrastTextColor(themeColor);

  // Lọc các item được chọn thanh toán từ giỏ hàng
  useEffect(() => {
    const idsRaw = searchParams.get("ids");
    if (idsRaw) {
      const idsArr = idsRaw.split(",");
      const matched = cartItems.filter(i => idsArr.includes(String(i.id)));
      setCheckoutItems(matched.length > 0 ? matched : cartItems);
    } else {
      setCheckoutItems(cartItems);
    }
  }, [searchParams, cartItems]);

  // Tự động tính phí vận chuyển theo địa chỉ (Ninh Kiều = 0đ, các quận huyện khác = 150k-200k)
  useEffect(() => {
    const res = calculateShippingFee(address);
    setShippingFee(res.fee);
    setShippingNote(res.note);
  }, [address]);

  const productsTotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = productsTotal + shippingFee;

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          setStatus("");
        }
      }
    } catch {
      setStatus("Lỗi phân giải chuỗi địa chỉ công trình.");
    }
  };

  const triggerGeolocation = () => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      setStatus("Đang truy vấn tọa độ GPS công trình...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMarkerPos([latitude, longitude]);
          setZoomLevel(16);
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 16);
          }
          await fetchAddressFromCoords(latitude, longitude);
        },
        () => {
          setStatus("Vui lòng cấp quyền vị trí để định vị công trình tự động.");
        }
      );
    } else {
      setStatus("Thiết bị không hỗ trợ Geolocation.");
    }
  };

  const fetchOsmSuggestions = (query: string) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error(err);
      }
    }, 500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddress(val);
    fetchOsmSuggestions(val);
  };

  const handleSelectSuggestion = (item: OsmSuggestion) => {
    const latNum = parseFloat(item.lat);
    const lonNum = parseFloat(item.lon);
    setAddress(item.display_name);
    setShowSuggestions(false);
    setMapCenter([latNum, lonNum]);
    setMarkerPos([latNum, lonNum]);
    if (mapRef.current) {
      mapRef.current.setView([latNum, lonNum], 16);
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setStatus("Vui lòng nhập địa chỉ nhận hàng tại công trình.");
      return;
    }
    if (checkoutItems.length === 0) {
      setStatus("Toa hàng đang trống, vui lòng chọn vật tư.");
      return;
    }

    // Xác định quận huyện
    let district = 'Khác';
    const lower = address.toLowerCase();
    if (lower.includes('ninh kiều') || lower.includes('ninh kieu')) district = 'Ninh Kiều';
    else if (lower.includes('cái răng') || lower.includes('cai rang')) district = 'Cái Răng';
    else if (lower.includes('bình thủy') || lower.includes('binh thuy')) district = 'Bình Thủy';
    else if (lower.includes('ô môn') || lower.includes('o mon')) district = 'Ô Môn';
    else if (lower.includes('phong điền')) district = 'Phong Điền';

    // Tạo đơn hàng lưu vào vlxd_orders
    const newOrder = createOrder({
      customer_name: customerName.trim() || "Nhà thầu",
      customer_phone: customerPhone.trim() || "0907.123.456",
      address: address.trim(),
      district,
      items: checkoutItems.map(i => ({
        product_id: String(i.product_id),
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        uom: i.uom,
        total: i.price * i.quantity
      })),
      products_total: productsTotal,
      shipping_fee: shippingFee,
      total_amount: finalTotal,
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'vietqr' ? 'unpaid' : 'unpaid',
      note: orderNote.trim()
    });

    setCreatedOrder(newOrder);
    clearCart();

    if (paymentMethod === 'vietqr') {
      setQrOpen(true);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', color: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Navbar onCartClick={() => { }} searchTerm="" setSearchTerm={() => { }} />

      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '100px 16px 40px 16px', boxSizing: 'border-box' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => router.push("/cart")}
            style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", color: "#0f172a", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
          >
            ←
          </button>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a', margin: 0, borderLeft: `4px solid ${themeColor}`, paddingLeft: '10px' }}>
              Xác nhận đặt đơn & Giao hàng bến bãi
            </h1>
            <p style={{ margin: '2px 0 0 10px', fontSize: '12px', color: '#64748b' }}>
              Kiểm tra vật tư, tính cước vận chuyển và điều xe ben giao tận chân công trình
            </p>
          </div>
        </div>

        {status && (
          <div style={{ marginBottom: '16px', fontSize: '13px', padding: '12px 16px', backgroundColor: '#fef2f2', border: `1px solid #ef4444`, color: '#ef4444', borderRadius: '8px', fontWeight: '600' }}>
            {status}
          </div>
        )}

        {createdOrder && !qrOpen ? (
          /* MÀN HÌNH XÁC NHẬN ĐƠN HÀNG THÀNH CÔNG */
          <div style={{ backgroundColor: '#ffffff', border: '2px solid #22c55e', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px auto', fontWeight: '900' }}>
              
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
              ĐẶT ĐƠN HÀNG THÀNH CÔNG!
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>
              Mã đơn hàng bến bãi: <strong style={{ color: themeColor, fontSize: '18px', fontFamily: 'monospace' }}>{createdOrder.id}</strong>
            </p>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'left', marginBottom: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div> <strong>Địa chỉ giao:</strong> {createdOrder.address}</div>
              <div> <strong>Tổng thanh toán:</strong> {createdOrder.total_amount.toLocaleString('vi-VN')}đ ({createdOrder.shipping_fee === 0 ? 'Miễn phí ship Ninh Kiều' : `Phí ship: ${createdOrder.shipping_fee.toLocaleString('vi-VN')}đ`})</div>
              <div>⏱ <strong>Trạng thái:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>Chờ điều phối bốc hàng & trạm cân</span></div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push(`/orders`)}
                style={{ flex: 1, padding: '14px', backgroundColor: themeColor, color: textColorForTheme, border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                 TRA CỨU TIẾN ĐỘ ĐƠN HÀNG
              </button>
              <button
                onClick={() => router.push(`/`)}
                style={{ padding: '14px 20px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                Trang chủ
              </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN VẬN CHUYỂN */
          <form onSubmit={handleOrderSubmit} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            
            {/* DANH SÁCH VẬT TƯ ĐÃ CHỌN */}
            <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: themeColor, letterSpacing: '0.5px' }}>
                Danh sách vật tư đặt giao ({checkoutItems.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '140px', overflowY: 'auto' }}>
                {checkoutItems.length === 0 ? (
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Không có vật tư nào.</span>
                ) : (
                  checkoutItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '6px' }}>
                      <span style={{ color: '#1e293b', fontWeight: '600' }}>• {item.name}</span>
                      <span style={{ color: '#475569', fontFamily: 'monospace' }}>
                        {item.quantity} {item.uom} × {item.price.toLocaleString('vi-VN')}đ = <strong style={{ color: '#0f172a' }}>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</strong>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* THÔNG TIN NGƯỜI NHẬN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Họ tên / Đội thầu công trình
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Kỹ sư Nguyễn Văn A..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Số điện thoại nhận hàng
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0907..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>
            </div>

            {/* ĐỊA CHỈ & BẢN ĐỒ CÔNG TRÌNH */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: "relative" }} ref={suggestionRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569' }}>
                  Địa chỉ nhận hàng (Công trình bến bãi)
                </label>
                <button
                  type="button"
                  onClick={triggerGeolocation}
                  style={{ background: 'none', border: 'none', fontSize: '11px', color: '#2563eb', fontWeight: 'bold', cursor: 'pointer', padding: '2px' }}
                >
                   Định vị GPS công trình
                </button>
              </div>

              <input
                type="text"
                value={address}
                onChange={handleInputChange}
                placeholder="Nhập địa chỉ (ví dụ: Phường Xuân Khánh, Ninh Kiều, Cần Thơ)..."
                style={{ width: '100%', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '11px 12px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
                required
              />

              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", marginTop: "4px", zIndex: 999, maxHeight: "150px", overflowY: "auto", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
                  {suggestions.map((item) => (
                    <div
                      key={item.place_id}
                      onClick={() => handleSelectSuggestion(item)}
                      style={{ padding: "10px 12px", fontSize: "12px", color: "#334155", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                    >
                       {item.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BẢN ĐỒ OSM */}
            <div style={{ width: "100%", height: "200px", borderRadius: "10px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
              <CheckoutMap
                mapCenter={mapCenter}
                markerPos={markerPos}
                zoomLevel={zoomLevel}
                onMapClick={(lat, lng) => {
                  setMarkerPos([lat, lng]);
                  fetchAddressFromCoords(lat, lng);
                }}
                onMarkerDragEnd={(lat, lng) => {
                  setMarkerPos([lat, lng]);
                  fetchAddressFromCoords(lat, lng);
                }}
                setMapRef={(mapInstance) => { mapRef.current = mapInstance; }}
              />
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '8px' }}>
                Phương thức thanh toán
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'vietqr', label: 'Quét VietQR', sub: 'Chuyển khoản tức thì' },
                  { id: 'cod', label: 'Tiền mặt (COD)', sub: 'Thu khi giao xe' },
                  { id: 'b2b_debt', label: 'Công nợ B2B', sub: 'Dành cho nhà thầu' }
                ].map(pm => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id as any)}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '8px',
                      border: paymentMethod === pm.id ? `2px solid ${themeColor}` : '1px solid #cbd5e1',
                      backgroundColor: paymentMethod === pm.id ? '#fffbeb' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>{pm.label}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{pm.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* GHI CHÚ GIAO HÀNG */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Ghi chú điều phối bến bãi (Tùy chọn)
              </label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="Ví dụ: Đổ vật tư trước 15h, đường hẻm 4m xe ben vào được..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            {/* BẢNG TÍNH TIỀN & PHÍ VẬN CHUYỂN */}
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#475569' }}>Tiền vật tư:</span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace' }}>{productsTotal.toLocaleString('vi-VN')}đ</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ color: '#475569' }}>
                  Phí vận chuyển bến bãi:
                  <span style={{ display: 'block', fontSize: '11px', color: shippingFee === 0 ? '#16a34a' : '#d97706', fontWeight: 'bold' }}>
                    ({shippingNote})
                  </span>
                </span>
                <span style={{ fontWeight: '700', fontFamily: 'monospace', color: shippingFee === 0 ? '#16a34a' : '#0f172a' }}>
                  {shippingFee === 0 ? 'MIỄN PHÍ (0đ)' : `${shippingFee.toLocaleString('vi-VN')}đ`}
                </span>
              </div>

              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>TỔNG CỘNG THANH TOÁN:</span>
                <span style={{ fontSize: '22px', fontWeight: '900', color: themeColor, fontFamily: 'monospace' }}>
                  {finalTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={checkoutItems.length === 0}
              style={{
                width: '100%',
                height: '48px',
                backgroundColor: checkoutItems.length === 0 ? '#cbd5e1' : 'var(--theme-color)',
                color: checkoutItems.length === 0 ? '#94a3b8' : '#111827',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '900',
                cursor: checkoutItems.length === 0 ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: checkoutItems.length > 0 ? '0 4px 14px var(--theme-color-15)' : 'none'
              }}
            >
              {paymentMethod === 'vietqr' ? 'XÁC NHẬN ĐƠN & QUÉT MÃ VIETQR' : 'XÁC NHẬN ĐẶT ĐƠN BẾN BÃI'}
            </button>

          </form>
        )}
      </main>

      {/* MODAL VIETQR */}
      {qrOpen && createdOrder && (
        <VietQrModal
          isOpen={qrOpen}
          onClose={() => setQrOpen(false)}
          checkoutPayload={{
            address: createdOrder.address,
            items: createdOrder.items,
            totalAmount: createdOrder.total_amount,
            coordinates: { lat: markerPos[0], lng: markerPos[1] }
          }}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '60px', fontSize: '14px', color: '#64748b' }}>
        Đang khởi tạo cổng thanh toán bến bãi...
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}