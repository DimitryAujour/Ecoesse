'use client';

import React, { useState } from 'react';
import { Product } from '@/types/commerce';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { ShoppingBag, Check } from 'lucide-react';

interface ProductDetailClientProps {
  product: Product;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product }) => {
  const { addItem } = useCart();
  const { dict } = useLocale();
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const lineTotal = ((product.price * quantity) / 100).toFixed(2);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-4">
        {/* Quantity Stepper */}
        <div className="flex items-center border border-white/10 rounded-xl bg-black/40 p-1">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-bold"
          >
            -
          </button>
          <span className="w-12 text-center text-sm font-bold text-white">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(product.inventoryCount, q + 1))}
            className="w-9 h-9 flex items-center justify-center text-slate-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors font-bold"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
            added
              ? 'bg-emerald-500 text-black shadow-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-emerald-950/60'
          }`}
        >
          {added ? (
            <>
              <Check className="w-5 h-5" /> {dict.detail.added}
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" /> {dict.detail.addToBag} (${lineTotal} CAD)
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>{dict.detail.inventory} <strong>{product.inventoryCount} {dict.detail.units}</strong></span>
        <span>{dict.detail.ships}</span>
      </div>
    </div>
  );
};
