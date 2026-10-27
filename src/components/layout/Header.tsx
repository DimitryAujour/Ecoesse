'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { LocaleSwitcher } from './LocaleSwitcher';
import { ShoppingBag, Sprout, Trees, Waves, User } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

export const Header: React.FC = () => {
  const { totals, setIsCartOpen } = useCart();
  const { dict, locale } = useLocale();
  // Header impact ticker, wired to real stats (follow-up to the demo
  // data cleanup). The old ticker hardcoded 1,420 trees and 18,450
  // bottles — exactly the INITIAL_GLOBAL_IMPACT seed values — in code,
  // so it could never move with real verified orders and would show
  // those numbers even if the store had never sold anything.
  // The ticker now reads site_stats/global_impact, which the M-01
  // rules make publicly readable and which the Stripe webhook
  // (M-02) increments only for verified orders. If the stats document
  // does not exist or cannot be read, the numbers are omitted
  // entirely rather than falling back to hardcoded figures.
  // Honest limit: the stats document's own baseline is still the seed
  // values the admin seeder writes (1,420 / 18,450 / 3,680 kg / 685
  // orders), so this change makes the ticker data-driven, not
  // independently verified. Replacing that baseline with audited
  // Greenspark totals is a separate decision, flagged in the PR.
  const [stats, setStats] = useState<{ trees: number; bottles: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'site_stats', 'global_impact'));
        if (cancelled || !snap.exists()) return;
        const data = snap.data();
        const toNumber = (v: unknown): number | null => {
          const n = Number(v);
          return Number.isFinite(n) && n >= 0 ? n : null;
        };
        const trees = toNumber(data.totalTreesPlanted);
        const bottles = toNumber(data.totalPlasticBottlesRemoved);
        if (trees !== null && bottles !== null) setStats({ trees, bottles });
      } catch {
        // No stats, no numbers — never a hardcoded fallback.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const numberLocale = locale === 'fr' ? 'fr-CA' : 'en-CA';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#09110d]/85 border-b border-emerald-950/60">
      {/* Live Environmental Impact Ticker */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-forest-900 to-teal-950/80 border-b border-emerald-500/20 py-1.5 px-4 text-center text-[11px] font-medium text-emerald-200">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          {stats && (
            <>
              <span className="flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                <strong>{stats.trees.toLocaleString(numberLocale)}</strong> {dict.header.tickerTrees}
              </span>
              <span className="hidden sm:inline text-emerald-700">•</span>
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <strong>{stats.bottles.toLocaleString(numberLocale)}</strong> {dict.header.tickerBottles}
              </span>
              <span className="hidden md:inline text-emerald-700">•</span>
            </>
          )}
          <span className="hidden md:flex items-center gap-1.5 text-emerald-300/80">
            🍁 {dict.header.tickerShipping}
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/40 group-hover:scale-105 transition-transform">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Ecoesse
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Commerce
              </span>
            </div>
            <p className="text-[10px] text-emerald-300/70 -mt-0.5 tracking-wider uppercase font-semibold">
              {dict.site.tagline}
            </p>
          </div>
        </Link>

        {/* Categories / Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            {dict.header.allProducts}
          </Link>
          <Link href="/?category=household" className="hover:text-emerald-400 transition-colors">
            {dict.header.household}
          </Link>
          <Link href="/?category=personal-care" className="hover:text-emerald-400 transition-colors">
            {dict.header.personalCare}
          </Link>
          <Link href="/?category=pet-care" className="hover:text-emerald-400 transition-colors">
            {dict.header.petCare}
          </Link>
          {/* No generic impact-certificate link: certificates are
              per-order (/impact/[orderId]) and only exist for real
              orders. The old demo link has been removed because, since
              PR #6, it correctly rendered a not-found state instead
              of a fake certificate. */}
        </nav>

        {/* Right Actions: Admin & Cart */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition-colors"
            title="Custom Zero-Bloat Admin"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{dict.header.admin}</span>
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-md shadow-emerald-950/40"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.header.cart}</span>
            {totals.itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-emerald-950 text-[11px] font-extrabold flex items-center justify-center -ml-0.5">
                {totals.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
