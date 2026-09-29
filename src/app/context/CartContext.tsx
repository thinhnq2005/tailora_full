// src/app/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Các đơn vị nguyên khối — số lượng phải là số nguyên (Math.ceil)
const DISCRETE_UNITS = ['bao', 'cây', 'thùng', 'bộ', 'cuộn', 'viên', 'gói', 'tấm', 'hộp'];

/** Làm tròn thông minh: đơn vị nguyên → ceil, đơn vị đong đếm → 2 chữ số */
export function smartRound(value: number, uom: string): number {
  const uomBase = uom.split('(')[0].trim().toLowerCase();
  const isDiscrete = DISCRETE_UNITS.some(u => uomBase.includes(u));
  return isDiscrete ? Math.ceil(value) : Number(value.toFixed(2));
}

export interface CartItem {
  id: string | number;
  product_id: string | number;
  name: string;
  price: number; // Đơn giá theo UoM đang chọn
  base_price?: number; // Đơn giá cơ sở ban đầu
  quantity: number;
  minQty?: number; // Số lượng tối thiểu (đã bao gồm hao hụt BOM — không được giảm xuống dưới)
  uom: string; // Đơn vị tính hiện tại
  uom_spec?: string; // Quy cách ĐVT (VD: "50kg", "11.7m", "1.44m²") — tách khỏi tên ĐVT
  uom_label?: string; // Tên ĐVT ngắn gọn (VD: "Bao", "Cây", "Thùng")
  conversionRate?: number; // Tỷ lệ quy đổi về ĐVT cơ sở (VD: Bao 50kg → rate=50)
  available_uoms?: string[]; // Danh sách đơn vị tính có thể chuyển đổi
  image?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, qty?: number, chosenUom?: string) => void;
  updateQuantity: (productId: string | number, qty: number) => void;
  updateUom: (productId: string | number, newUom: string) => void;
  removeFromCart: (productId: string | number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalCount: number;
  buyNowItem: (CartItem & { latitude?: number; longitude?: number }) | null;
  setBuyNowItem: (item: (CartItem & { latitude?: number; longitude?: number }) | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vlxd_cart';

function getStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    } else {
      return [];
    }
  } catch {
    return [];
  }
}

function saveStoredCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('cart-updated'));
  } catch (e) {
    console.error('Lỗi lưu giỏ hàng:', e);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<(CartItem & { latitude?: number; longitude?: number }) | null>(null);

  useEffect(() => {
    setCartItems(getStoredCart());

    const handleCartUpdate = () => {
      setCartItems(getStoredCart());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        setCartItems(getStoredCart());
      }
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addToCart = (product: any, qty: number = 1, chosenUom?: string) => {
    const current = getStoredCart();
    const pid = String(product.id || product.product_id);
    const uomToUse = chosenUom || product.uom || 'Đơn vị';
    const basePrice = Number(product.price) || 0;

    // Tính đơn giá theo UoM
    let unitPrice = basePrice;
    if (product.uom_options && Array.isArray(product.uom_options)) {
      const matchOpt = product.uom_options.find((opt: any) => opt.name.toLowerCase() === uomToUse.toLowerCase());
      if (matchOpt) {
        unitPrice = basePrice * (matchOpt.priceMultiplier || matchOpt.rate || 1);
      }
    }

    // Làm tròn số lượng thông minh trước khi lưu vào giỏ
    const roundedQty = smartRound(Math.max(1, qty), uomToUse);

    // Tách quy cách ra khỏi tên ĐVT: "Bao (50kg)" → label="Bao", spec="50kg"
    const specMatch = uomToUse.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
    const uomLabel = specMatch ? specMatch[1].trim() : uomToUse;
    const uomSpec = specMatch ? specMatch[2].trim() : undefined;

    const existingIdx = current.findIndex(i => String(i.product_id) === pid && i.uom === uomToUse);
    let updated: CartItem[];

    if (existingIdx >= 0) {
      updated = [...current];
      const newQty = smartRound(updated[existingIdx].quantity + roundedQty, uomToUse);
      updated[existingIdx] = { ...updated[existingIdx], quantity: newQty };
    } else {
      const availableUoms = product.uom_options && Array.isArray(product.uom_options)
        ? product.uom_options.map((opt: any) => opt.name)
        : [uomToUse];

      const newItem: CartItem = {
        id: `${pid}-${uomToUse}-${Date.now()}`,
        product_id: pid,
        name: product.name,
        price: unitPrice,
        base_price: basePrice,
        quantity: roundedQty,
        minQty: roundedQty, // Định mức tối thiểu = số lượng BOM ban đầu
        uom: uomToUse,
        uom_label: uomLabel,
        uom_spec: uomSpec,
        conversionRate: product.conversionRate,
        available_uoms: availableUoms,
        image: product.img || product.image || '/placeholder.png'
      };
      updated = [newItem, ...current];
    }

    setCartItems(updated);
    saveStoredCart(updated);
  };

  const updateQuantity = (productId: string | number, qty: number) => {
    const current = getStoredCart();
    let updated: CartItem[];
    if (qty <= 0) {
      updated = current.filter(i => String(i.product_id) !== String(productId) && String(i.id) !== String(productId));
    } else {
      updated = current.map(item => {
        if (String(item.product_id) === String(productId) || String(item.id) === String(productId)) {
          return { ...item, quantity: qty };
        }
        return item;
      });
    }
    setCartItems(updated);
    saveStoredCart(updated);
  };

  const updateUom = (productId: string | number, newUom: string) => {
    const current = getStoredCart();
    const updated = current.map(item => {
      if (String(item.product_id) === String(productId) || String(item.id) === String(productId)) {
        // --- Quy đổi ĐVT dựa trên conversionRate để giữ nguyên tổng tiền ---
        // Tỷ lệ quy đổi được xác định từ bảng cứng nếu item không có conversionRate
        const UOM_CONVERSION: Record<string, Record<string, number>> = {
          'bao': { 'tấn (20 bao)': 20, 'kg': 0.02 },
          'tấn (20 bao)': { 'bao': 0.05 },
          'kg': { 'tấn': 1000, 'bao': 50 },
          'tấn': { 'kg': 0.001 },
          'm³': { 'xe ben 5m³': 0.2 },
          'xe ben 5m³': { 'm³': 5 },
          'viên': { 'thiên (1.000 viên)': 0.001 },
          'thiên (1.000 viên)': { 'viên': 1000 },
          'cây': { 'bó (100 cây)': 0.01 },
          'bó (100 cây)': { 'cây': 100 },
        };

        const oldUomKey = item.uom.trim().toLowerCase();
        const newUomKey = newUom.trim().toLowerCase();
        const rateTable = UOM_CONVERSION[oldUomKey];
        const rate = rateTable?.[newUomKey];

        // Tách quy cách ra khỏi tên ĐVT mới
        const specMatch = newUom.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
        const newUomLabel = specMatch ? specMatch[1].trim() : newUom;
        const newUomSpec = specMatch ? specMatch[2].trim() : undefined;

        if (rate !== undefined) {
          // newQty = oldQty * rate, newUnitPrice = oldPrice / rate → Tổng tiền bất biến
          const newQty = smartRound(item.quantity * rate, newUom);
          const newPrice = Number((item.price / rate).toFixed(0));
          const newMinQty = item.minQty ? smartRound(item.minQty * rate, newUom) : newQty;
          return {
            ...item,
            uom: newUom,
            uom_label: newUomLabel,
            uom_spec: newUomSpec,
            quantity: newQty,
            minQty: newMinQty,
            price: newPrice,
          };
        }

        // Không có tỷ lệ → chỉ đổi nhãn ĐVT, giữ nguyên số lượng và đơn giá
        return {
          ...item,
          uom: newUom,
          uom_label: newUomLabel,
          uom_spec: newUomSpec,
        };
      }
      return item;
    });
    setCartItems(updated);
    saveStoredCart(updated);
  };

  const removeFromCart = (productId: string | number) => {
    const current = getStoredCart();
    const updated = current.filter(i => String(i.product_id) !== String(productId) && String(i.id) !== String(productId));
    setCartItems(updated);
    saveStoredCart(updated);
  };

  const clearCart = () => {
    setCartItems([]);
    saveStoredCart([]);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Badge đếm số lượng SKU (mặt hàng), không cộng dồn quantity
  const totalCount = cartItems.length;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        updateUom,
        removeFromCart,
        clearCart,
        totalAmount,
        totalCount,
        buyNowItem,
        setBuyNowItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
}