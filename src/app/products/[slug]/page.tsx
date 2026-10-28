import React from 'react';
import { getCatalogProducts } from '@/lib/products/catalog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Trees, Waves, Wind, ShieldCheck, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { ProductDetailClient } from './ProductDetailClient';
import { getServerLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionary';
import { localizedTitle, localizedDescription } from '@/lib/i18n/product';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  // Same catalog source as the homepage, so a product's stock and
  // status cannot disagree between the grid and its detail page.
  const catalog = await getCatalogProducts();
  const product = catalog.find((p) => p.slug === slug);
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  if (!product) {
    notFound();
  }

  const formattedPrice = (product.price / 100).toFixed(2);
  const formattedCompare = product.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> {dict.detail.back}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={localizedTitle(product, locale)}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-400">
                Ecoesse
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer hover:border-emerald-500/60 transition-colors"
                >
                  <Image src={img} alt={`${localizedTitle(product, locale)} ${i}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Cart Action */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                {product.category.replace('-', ' ')}
              </span>
              <span className="text-xs text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {localizedTitle(product, locale)}
            </h1>

            {/* Price Row */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl font-extrabold text-white">${formattedPrice}</span>
              {formattedCompare && (
                <span className="text-base text-slate-500 line-through">${formattedCompare}</span>
              )}
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {dict.detail.taxNote}
              </span>
            </div>

            {/* Environmental Impact Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-teal-950/50 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> {dict.detail.impactTitle}
                </span>
                <span className="text-[11px] text-emerald-400 font-medium">{dict.detail.ledger}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-black/50 border border-emerald-500/20">
                  <Trees className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-emerald-300">
                    +{product.sustainabilityMetrics.treesPlanted}
                  </div>
                  <div className="text-[10px] text-slate-400">{dict.detail.trees}</div>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20">
                  <Waves className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-cyan-300">
                    +{product.sustainabilityMetrics.plasticBottlesSaved}
                  </div>
                  <div className="text-[10px] text-slate-400">{dict.detail.bottles}</div>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-amber-500/20">
                  <Wind className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-xl font-bold text-amber-300">
                    +{product.sustainabilityMetrics.carbonOffsetKg} kg
                  </div>
                  <div className="text-[10px] text-slate-400">{dict.detail.carbon}</div>
                </div>
              </div>
            </div>

            {/* Interactive Add to Cart & Quantity Stepper */}
            <ProductDetailClient product={product} />

            {/* Description & Specs */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> {dict.detail.specs}
              </h3>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-2">
                {localizedDescription(product, locale)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
