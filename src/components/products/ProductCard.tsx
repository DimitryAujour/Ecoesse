'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/commerce';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { Trees, Waves, Plus, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, items } = useCart();
  const { dict } = useLocale();
  const [justAdded, setJustAdded] = React.useState(false);

  const isInCart = items.some((i) => i.product.id === product.id);
  const formattedPrice = (product.price / 100).toFixed(2);
  const formattedCompare = product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <div className="eco-glass-card rounded-2xl overflow-hidden flex flex-col group relative">
      {/* Category & Impact Pill Overlays */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/40">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-emerald-400 bg-emerald-950/30">
              Ecoesse
            </div>
          )}
        </Link>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-300 border border-white/10">
            {product.category.replace('-', ' ')}
          </span>
          {formattedCompare && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-black">
              {dict.product.save} ${(Number(formattedCompare) - Number(formattedPrice)).toFixed(2)}
            </span>
          )}
        </div>

        {/* Quick Impact Floating Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-emerald-500/30 text-[11px] font-medium text-emerald-300 flex items-center gap-1">
            <Trees className="w-3.5 h-3.5 text-emerald-400" />
            <span>+{product.sustainabilityMetrics.treesPlanted} {dict.product.tree}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-cyan-500/30 text-[11px] font-medium text-cyan-300 flex items-center gap-1">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>+{product.sustainabilityMetrics.plasticBottlesSaved} {dict.product.bottles}</span>
          </div>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/products/${product.slug}`} className="block group-hover:text-emerald-400 transition-colors">
            <h3 className="font-semibold text-base text-slate-100 line-clamp-1">{product.title}</h3>
          </Link>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {product.description.replace(/###/g, '').replace(/\*\*/g, '').slice(0, 110)}...
          </p>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white">${formattedPrice}</span>
              {formattedCompare && (
                <span className="text-xs text-slate-500 line-through">${formattedCompare}</span>
              )}
              <span className="text-[10px] text-slate-400">CAD</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 font-medium">{dict.product.inStock} ({product.inventoryCount})</span>
          </div>

          <button
            onClick={handleAdd}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
              justAdded
                ? 'bg-emerald-500 text-black'
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-950/50'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" /> {dict.product.added}
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> {dict.product.addToBag}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
