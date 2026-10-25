'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, CartItem, CartImpactTotals } from '@/types/commerce';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totals: CartImpactTotals;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'ecoesse_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse cart from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart to localStorage:', e);
    }
  }, [items, isLoaded]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex]!,
          quantity: next[existingIndex]!.quantity + quantity,
        };
        return next;
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  // Memoized Impact and Price calculations
  const totals: CartImpactTotals = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const qty = item.quantity;
        const metrics = item.product.sustainabilityMetrics || {
          treesPlanted: 1,
          plasticBottlesSaved: 10,
          carbonOffsetKg: 2,
        };
        return {
          totalTrees: acc.totalTrees + (metrics.treesPlanted || 0) * qty,
          totalPlasticBottles: acc.totalPlasticBottles + (metrics.plasticBottlesSaved || 0) * qty,
          totalCarbonKg: Number((acc.totalCarbonKg + (metrics.carbonOffsetKg || 0) * qty).toFixed(1)),
          totalAmountCents: acc.totalAmountCents + item.product.price * qty,
          itemCount: acc.itemCount + qty,
        };
      },
      {
        totalTrees: 0,
        totalPlasticBottles: 0,
        totalCarbonKg: 0,
        totalAmountCents: 0,
        itemCount: 0,
      }
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totals,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
