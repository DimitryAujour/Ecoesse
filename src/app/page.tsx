import React from 'react';
import { SAMPLE_PRODUCTS, INITIAL_GLOBAL_IMPACT } from '@/lib/seed/products';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Trees, Waves, Wind, ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { getServerLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionary';

export default async function HomePage() {
  // Products dataset (sample seed or Firestore)
  const products = SAMPLE_PRODUCTS;
  const stats = INITIAL_GLOBAL_IMPACT;
  // Task M-04: homepage copy follows the resolved locale. Product
  // titles/descriptions are data, not UI strings, and stay as stored.
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const numberLocale = locale === 'fr' ? 'fr-CA' : 'en-CA';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden border border-emerald-900/60 bg-gradient-to-br from-[#0e1d15] via-[#09150f] to-[#0a1811] p-8 sm:p-12 lg:p-16 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {dict.home.badge}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            {dict.home.titleLine1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              {dict.home.titleLine2}
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
            {dict.home.heroText}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#catalog"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm shadow-lg shadow-emerald-950/60 flex items-center gap-2 transition-all"
            >
              {dict.home.shopCta} <ArrowRight className="w-4 h-4" />
            </a>

            {/* No "View Impact Ledger" button here: certificates are
                per-order (/impact/[orderId]) for real orders only, and
                the old demo link has been removed for the same reason
                as the header/footer links. */}
          </div>

          {/* Environmental Assurance Badges */}
          <div className="pt-4 flex items-center gap-6 text-xs text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {dict.home.badgePlasticFree}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {dict.home.badgeCarbonNeutral}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {dict.home.badgeCadQuebec}
            </span>
          </div>
        </div>
      </section>

      {/* Global Impact Ledger Live Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-6 rounded-2xl eco-glass border border-emerald-900/60 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalTreesPlanted.toLocaleString(numberLocale)}+
            </div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-0.5">
              {dict.home.statsTrees}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{dict.home.statsTreesText}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl eco-glass border border-cyan-900/60 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalPlasticBottlesRemoved.toLocaleString(numberLocale)}+
            </div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mt-0.5">
              {dict.home.statsBottles}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{dict.home.statsBottlesText}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl eco-glass border border-amber-900/60 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalCarbonOffsetKg.toLocaleString(numberLocale)}+ kg
            </div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mt-0.5">
              {dict.home.statsCarbon}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{dict.home.statsCarbonText}</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl eco-glass border border-purple-900/60 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {stats.totalOrdersCount.toLocaleString(numberLocale)}+
            </div>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mt-0.5">
              {dict.home.statsOrders}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{dict.home.statsOrdersText}</p>
          </div>
        </div>
      </section>

      {/* Catalog Grid Section */}
      <div id="catalog">
        <ProductGrid products={products} />
      </div>

      {/* Value Proposition: Why Ecoesse Beats Shopify */}
      <section className="p-8 sm:p-12 rounded-3xl eco-glass border border-white/10 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {dict.home.valueEyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {dict.home.valueTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {dict.home.valueText}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-base font-bold text-white">{dict.home.valueCard1Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dict.home.valueCard1Text}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-base font-bold text-white">{dict.home.valueCard2Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dict.home.valueCard2Text}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-base font-bold text-white">{dict.home.valueCard3Title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {dict.home.valueCard3Text}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
