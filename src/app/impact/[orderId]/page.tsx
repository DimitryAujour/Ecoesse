import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trees, Waves, Wind, ShieldCheck, CheckCircle2, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';
import { getImpactCardData } from '@/lib/og/impact-card';
import { getServerLocale } from '@/lib/i18n/server';
import { getDictionary } from '@/lib/i18n/dictionary';

interface ImpactPageProps {
  params: Promise<{ orderId: string }>;
}

// Impact certificate page, wired to real orders (follow-up to M-03).
//
// The page reads the order document server-side with the Firebase
// Admin SDK (which bypasses Firestore rules) and renders exactly what
// the shared verified/pending/generic logic in
// src/lib/og/impact-card.ts allows — the same logic the OG image uses,
// so the page and its share card can never disagree:
//
// - verified: real totals from impactRecord, the Greenspark transaction
//   id, the verification date, and a certificate link only if the
//   record carries a greensparkCertificateUrl. No link is fabricated.
// - pending: no totals, no transaction id, no verified claim — the
//   stored totals for a pending order are expected impact, not
//   verified impact.
// - not found (unknown order, or a Firestore fetch error): no totals,
//   no claims, just a not-found state.
//
// Privacy: this page is public (shareable link), so it renders only
// shareable fields. It never renders customerEmail, shippingAddress,
// the full Stripe session id (the order id itself), or any payment
// amount. The order reference shown is truncated to its last 8
// characters, which is enough to identify the certificate without
// republishing the full session id in the page body.
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
  // Metadata stays generic on purpose: it must not claim verification
  // for an order that is pending or unknown, and the OG image — which
  // is state-aware — carries the actual totals and claims.
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
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-CA';

  let card = getImpactCardData(null);
  try {
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    card = getImpactCardData(orderDoc.exists ? orderDoc.data() : null);
  } catch (err) {
    // A fetch error must not turn into a fake certificate: fall back
    // to the not-found state, same as an unknown order.
    console.error('Impact page: failed to load order, showing not-found:', err);
    card = getImpactCardData(null);
  }

  const shortRef =
    orderId.length > 8 ? `…${orderId.slice(-8).toUpperCase()}` : orderId;
  const verifiedDate = card.verifiedAtISO
    ? new Date(card.verifiedAtISO).toLocaleDateString(dateLocale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      {/* Certificate Frame */}
      <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#0e2117] via-[#0b1712] to-[#0a1510] border-2 border-emerald-500/40 shadow-2xl shadow-emerald-950/80 overflow-hidden text-center">
        {/* Subtle decorative background rings */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {card.variant === 'generic' ? (
          <>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              {dict.impact.notFoundTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              {dict.impact.notFoundText}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors"
              >
                {dict.impact.notFoundCta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* Certificate Stamp */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />{' '}
              {card.variant === 'verified' ? dict.impact.badge : dict.impact.pendingBadge}
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
              {card.variant === 'verified' ? dict.impact.title : dict.impact.pendingTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              {card.variant === 'verified' ? dict.impact.text : dict.impact.pendingText}
            </p>

            {card.variant === 'verified' && (
              <>
                {/* Impact Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-center">
                  <div className="p-6 rounded-2xl bg-black/50 border border-emerald-500/30">
                    <Trees className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="text-3xl font-black text-emerald-300">+{card.trees} {dict.impact.trees}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.treesLabel}</div>
                    <p className="text-[10px] text-slate-500 mt-2">{dict.impact.treesText}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/50 border border-cyan-500/30">
                    <Waves className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                    <div className="text-3xl font-black text-cyan-300">+{card.bottles} {dict.impact.bottles}</div>
                    <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.bottlesLabel}</div>
                    <p className="text-[10px] text-slate-500 mt-2">{dict.impact.bottlesText}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/50 border border-amber-500/30">
                    <Wind className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <div className="text-3xl font-black text-amber-300">+{card.carbonKg.toFixed(1)} kg</div>
                    <div className="text-xs text-slate-400 font-semibold mt-1">{dict.impact.carbonLabel}</div>
                    <p className="text-[10px] text-slate-500 mt-2">{dict.impact.carbonText}</p>
                  </div>
                </div>
              </>
            )}

            {/* Verification Ledger Details */}
            <div className="max-w-lg mx-auto p-4 rounded-xl bg-black/60 border border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>{dict.impact.orderRef}</span>
                <code className="text-slate-200">{shortRef}</code>
              </div>
              {card.variant === 'verified' && card.transactionId && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>{dict.impact.ledgerHash}</span>
                  <code className="text-emerald-400">{card.transactionId}</code>
                </div>
              )}
              {card.variant === 'verified' && verifiedDate && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>{dict.impact.timestamp}</span>
                  <span className="text-slate-200">{verifiedDate}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-400">
                <span>{dict.impact.status}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />{' '}
                  {card.variant === 'verified' ? dict.impact.statusText : dict.impact.pendingBadge}
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
              {card.variant === 'verified' && card.certificateUrl && (
                <a
                  href={card.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 flex items-center gap-2 transition-colors"
                >
                  {dict.impact.viewCertificate} <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
