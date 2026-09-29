"use client";

import React, { useState, useEffect, useMemo } from "react";
import VietQrModal, { type VietQrPaymentData } from "@/components/ai/vietqr/VietQrModal";
import { getStoredProducts, getStoredTenant, VlxdProduct } from "@/lib/vlxdStorage";

interface PosCartItem {
  product: VlxdProduct;
  quantity: number;
}

export default function PosTerminal(): React.JSX.Element {
  const [products, setProducts] = useState<VlxdProduct[]>([]);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [qrOpen, setQrOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");

  const tenant = getStoredTenant();

  useEffect(() => {
    setProducts(getStoredProducts());
  }, []);

  const handleAddToCart = (product: VlxdProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is PosCartItem => item !== null)
    );
  };

  const handleClearTerminalCart = () => setCart([]);

  const posTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const handlePosCheckoutTransaction = () => {
    if (cart.length === 0) return;
    setQrOpen(true);
  };

  return (
    <div style={{ width: '100%', backgroundColor: '#0b0c1e', color: '#fff', borderRadius: '14px', border: '1px solid #1e2042', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1e2042', paddingBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', textTransform: 'uppercase', color: 'var(--theme-color)', letterSpacing: '0.5px' }}>
            Máy Bán Hàng Tại Bến Bãi (POS Terminal)
          </h2>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chế độ xuất toa nhanh tại quầy thu ngân</span>
        </div>
        <span style={{ fontSize: '11px', backgroundColor: '#10b98120', color: '#10b981', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
          ● Trực tuyến
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px' }}>
        
        {/* DANH SÁCH VẬT TƯ CHỌN NHANH */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
          {products.map((prod) => (
            <button
              key={prod.id}
              type="button"
              onClick={() => handleAddToCart(prod)}
              style={{
                backgroundColor: '#141534',
                border: '1px solid #242654',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'left',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--theme-color)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#242654'}
            >
              <div>
                <span style={{ fontSize: '10px', color: 'var(--theme-color)', fontWeight: 'bold', textTransform: 'uppercase' }}>{prod.uom}</span>
                <div style={{ fontSize: '12px', fontWeight: 'bold', margin: '4px 0', lineHeight: '1.3' }}>{prod.name}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace', marginTop: '6px' }}>
                {prod.price.toLocaleString('vi-VN')}đ
              </div>
            </button>
          ))}
        </div>

        {/* KHAY ĐƠN TẠI QUẦY */}
        <div style={{ backgroundColor: '#101128', borderRadius: '10px', border: '1px solid #1e2042', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 'bold', color: 'var(--theme-color)', textTransform: 'uppercase' }}>
              Khay vật tư tại quầy ({cart.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '11px', color: '#64748b' }}>
                  Click vật tư bên trái để xếp vào khay quầy
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#17183b', padding: '8px', borderRadius: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontFamily: 'monospace' }}>
                        {(item.product.price * item.quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, -1)}
                        style={{ width: '22px', height: '22px', backgroundColor: '#0b0c1e', border: '1px solid #2c2d59', color: '#fff', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.product.id, 1)}
                        style={{ width: '22px', height: '22px', backgroundColor: '#0b0c1e', border: '1px solid #2c2d59', color: '#fff', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #1e2042', paddingTop: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Tổng thanh toán:</span>
              <span style={{ color: 'var(--theme-color)', fontFamily: 'monospace', fontSize: '16px', fontWeight: '900' }}>
                {posTotalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>

            <button
              type="button"
              onClick={handlePosCheckoutTransaction}
              disabled={cart.length === 0}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: cart.length === 0 ? '#334155' : 'var(--theme-color)',
                color: '#0b0c1e',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                textTransform: 'uppercase'
              }}
            >
              XUẤT MÃ VIETQR TẠI QUẦY
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearTerminalCart}
                style={{ width: '100%', marginTop: '6px', background: 'none', border: 'none', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}
              >
                Xóa khay đơn
              </button>
            )}
          </div>

        </div>

      </div>

      {qrOpen && (
        <VietQrModal
          isOpen={qrOpen}
          onClose={() => {
            setQrOpen(false);
            handleClearTerminalCart();
          }}
          checkoutPayload={{
            address: 'Bán lẻ tại quầy bến bãi TAILORA',
            items: cart.map(c => ({ name: c.product.name, quantity: c.quantity, price: c.product.price, uom: c.product.uom })),
            totalAmount: posTotalAmount,
            coordinates: { lat: 10.033, lng: 105.783 }
          }}
        />
      )}
    </div>
  );
}