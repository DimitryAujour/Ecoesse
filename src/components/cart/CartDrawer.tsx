'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { localizedTitle } from '@/lib/i18n/product';
import { X, Trash2, Trees, Waves, Wind, ShieldCheck, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

export const CartDrawer: React.FC = () => {
  const { items, removeItem, updateQuantity, isCartOpen, setIsCartOpen, totals } = useCart();
  const { dict, locale } = useLocale();
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.demoMode) {
        // Stripe keys are in test/mock mode
        window.location.href = `/impact/${data.orderId || 'demo_order_123'}`;
      } else {
        throw new Error(data.error || dict.cart.checkoutFailed);
      }
    } catch (err: any) {
      setCheckoutError(err.message || dict.cart.checkoutRedirectFailed);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-[#0e1713] border-l border-emerald-950/80 shadow-2xl flex flex-col h-full z-10 text-slate-100">
        {/* Drawer Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold">{dict.cart.title} ({totals.itemCount})</h2>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Impact Calculator Banner */}
        {items.length > 0 && (
          <div className="m-4 p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-teal-950/60 border border-emerald-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> {dict.cart.realImpact}
              </span>
              <span className="text-[11px] text-emerald-400/80 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-700/50">
                {dict.cart.greensparkVerified}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">
                <Trees className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-emerald-300">+{totals.totalTrees}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">{dict.cart.trees}</div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-cyan-500/20">
                <Waves className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-cyan-300">+{totals.totalPlasticBottles}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">{dict.cart.bottles}</div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-amber-500/20">
                <Wind className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-extrabold text-amber-300">+{totals.totalCarbonKg} kg</div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight">{dict.cart.carbon}</div>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-2 divide-y divide-white/5">
          {items.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-base font-semibold text-slate-300">{dict.cart.emptyTitle}</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                {dict.cart.emptyText}
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
              >
                {dict.cart.browseCatalog}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const unitPrice = (item.product.price / 100).toFixed(2);
              const lineTotal = ((item.product.price * item.quantity) / 100).toFixed(2);

              return (
                <div key={item.product.id} className="py-4 flex gap-4 items-center">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={localizedTitle(item.product, locale)}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-900/30 flex items-center justify-center text-xs text-emerald-400">
                        Eco
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-200 truncate">{localizedTitle(item.product, locale)}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">${unitPrice} {dict.cart.each}</p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="flex items-center border border-white/10 rounded-lg bg-black/40">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2.5 py-0.5 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2.5 py-0.5 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title={dict.cart.removeItem}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-white">${lineTotal}</span>
                    <span className="block text-[10px] text-slate-500">CAD</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-black/40 space-y-3">
            {checkoutError && (
              <div className="p-3 text-xs bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg">
                {checkoutError}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{dict.cart.subtotal}</span>
                <span>${(totals.totalAmountCents / 100).toFixed(2)} CAD</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{dict.cart.shippingTax}</span>
                <span>{dict.cart.shippingTaxValue}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                <span>{dict.cart.totalEstimated}</span>
                <span className="text-emerald-400">${(totals.totalAmountCents / 100).toFixed(2)} CAD</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {dict.cart.preparingCheckout}
                </>
              ) : (
                <>
                  {dict.cart.proceedCheckout} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              🔒 {dict.cart.stripeNote}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
