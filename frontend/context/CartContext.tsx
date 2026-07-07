import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Config } from '../constants/config';

export interface CartItemEntry {
  menuItemId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  addons: { id: string; name: string; price: number }[];
  imageEmoji: string;
  isVeg?: boolean;
}

interface CartContextValue {
  items: CartItemEntry[];
  restaurantId: string | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItemEntry, 'quantity'>, restaurantName: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItemEntry[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);

  const addItem = useCallback(
    (item: Omit<CartItemEntry, 'quantity'>, restName: string) => {
      setRestaurantId(item.restaurantId);
      setRestaurantName(restName);
      setItems((prev) => {
        const existing = prev.find((i) => i.menuItemId === item.menuItemId);
        if (existing) {
          if (existing.quantity >= Config.MAX_CART_ITEMS) return prev;
          return prev.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });
    },
    [],
  );

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.menuItemId !== menuItemId);
      if (next.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return next;
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)),
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.price + i.addons.reduce((a, ad) => a + ad.price, 0)) * i.quantity,
    0,
  );
  const taxes = Math.round(subtotal * TAX_RATE);
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + taxes + deliveryFee;

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        deliveryFee,
        taxes,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
};
