import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trees, Waves, Wind, ShieldCheck, CheckCircle2, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { getServerLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionary';

interface ImpactPageProps {
  params: Promise<{ orderId: string }>;
}

// Task M-03: point social crawlers at the dynamic OG image for this
// certificate. The image itself is verified-only (see
// src/app/api/og/impact/[orderId]/route.tsx), so the metadata here
// deliberately contains no totals and no verified claim — those are
// decided server-side by the OG route from the real order record.
// The page body below is still demo data; this follow-up translates
// its UI strings only and does not make the demo totals real.
// Fixing it to read the real order is a separate follow-up, and the OG
// route intentionally does not copy it.
export async function generateMetadata({ params }: ImpactPageProps): Promise<Metadata> {
  const { orderId } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  // Pass the locale through so the OG image itself is translated too;
  // crawlers fetch OG images without cookies, so the cookie alone
  // would not reach the OG route.
  const ogPath = `/api/og/impact/${orderId}?locale=${locale}`;
  const imageUrl = base ? `${base}${ogPath}` : ogPath;
  return {
    title: dict.impact.metaTitle,
    description: dict.impact.metaDescription,
    openGraph: {
      title: dict.impact.metaTitle,
      description: dict.impact.metaDescription,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: dict.impact.metaTitle,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.impact.metaTitle,
      description: dict.impact.metaDescription,
      images: [imageUrl],
    },
  };
}

export default async function ImpactCertificatePage({ params }: ImpactPageProps) {
  const { orderId } = await params;
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  // Mock / demo verification details or Firestore fetch
  const verifiedDate = new Date().toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const transactionId = `GPK-${orderId.slice(-8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Certificate Frame */}
      <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#0e2117] via-[#0b1712] to-[#0a1510] border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/80 overflow-hidden text-center">
        {/* Subtle decorative background rings */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Certificate Stamp */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> {dict.impact.badge}
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          {dict.impact.title}
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
          {dict.impact.text}
        </p>

        {/* Impact Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-center">
          <div className="p-6 rounded-2xl bg-black/50 border border-emerald-500/30">
            <Trees className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-3xl font-black text-emerald-300">+2 {dict.impact.trees}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.treesLabel}</div>
            <p className="text-[10px] text-slate-500 mt-2">{dict.impact.treesText}</p>
          </div>

          <div className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30">
            <Waves className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-3xl font-black text-cyan-300">+28 {dict.impact.bottles}</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.bottlesLabel}</div>
            <p className="text-[10px] text-slate-500 mt-2">{dict.impact.bottlesText}</p>
          </div>

          <div className="p-6 rounded-2xl bg-black/50 border border-amber-500/30">
            <Wind className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-3xl font-black text-amber-300">+5.0 kg</div>
            <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.carbonLabel}</div>
            <p className="text-[10px] text-slate-500 mt-2">{dict.impact.carbonText}</p>
          </div>
        </div>

        {/* Verification Ledger Details */}
        <div className="max-w-lg mx-auto p-4 rounded-xl bg-black/60 border border-white/10 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>{dict.impact.orderRef}</span>
            <code className="text-slate-200">{orderId}</code>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{dict.impact.ledgerHash}</span>
            <code className="text-emerald-400">{transactionId}</code>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{dict.impact.timestamp}</span>
            <span className="text-slate-200">{verifiedDate}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>{dict.impact.status}</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {dict.impact.statusText}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
          >
            {dict.impact.continue} <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href={`https://ledger.getgreenspark.com/ecoesse/${transactionId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center gap-2 transition-colors"
          >
            {dict.impact.viewExplorer} <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
