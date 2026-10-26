import { ImageResponse } from 'next/og';
import { adminDb } from '@/lib/firebase/admin';
import { getDictionary, isLocale } from '@/lib/i18n/dictionary';
import { getImpactCardData } from '@/lib/og/impact-card';

// Dynamic Impact Certificate Social Sharing Card — Task M-03.
// GET /api/og/impact/[orderId] returns a 1200x630 PNG for Instagram,
// LinkedIn, and other social crawlers.
//
// Verified-only (see src/lib/og/impact-card.ts): real totals are shown
// only for orders whose impactRecord is greensparkStatus === 'verified'
// with a real Greenspark transaction id. Pending and unknown orders get
// a generic card with no totals and no verified claim.
//
// Privacy: social crawlers fetch this unauthenticated, so the image
// contains only shareable totals and, for verified orders, the public
// Greenspark transaction id. It never contains customerEmail,
// shippingAddress, stripeSessionId, or the order id itself.
//
// Data source: the order document in Firestore, read server-side with
// the Firebase Admin SDK (which bypasses Firestore rules). This route
// intentionally does NOT copy the /impact/[orderId] page, which is still
// a demo page with hardcoded totals and a fabricated transaction id.
// Any Firestore error falls back to the generic card rather than a 500,
// so a crawler always receives a usable image.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  // Crawlers fetch OG images without cookies, so the locale arrives as
  // a query parameter (set by the impact page's metadata, see
  // src/app/impact/[orderId]/page.tsx). Default to English otherwise.
  const requestedLocale = new URL(req.url).searchParams.get('locale');
  const locale = isLocale(requestedLocale) ? requestedLocale : 'en';
  const og = getDictionary(locale).og;

  let card = getImpactCardData(null);
  try {
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();
    card = getImpactCardData(orderDoc.exists ? orderDoc.data() : null);
  } catch (err) {
    console.error('OG impact card: failed to load order, using generic card:', err);
    card = getImpactCardData(null);
  }

  const verified = card.variant === 'verified';
  const pending = card.variant === 'pending';

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0a130f',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '64px 72px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 800,
              color: '#000000',
            }}
          >
            E
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Ecoesse
          </div>
          {verified && (
            <div
              style={{
                marginLeft: 'auto',
                backgroundColor: '#052e16',
                border: '1px solid #34d399',
                color: '#6ee7b7',
                borderRadius: '999px',
                padding: '10px 20px',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              ✓ {og.verifiedBadge}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.05 }}>
            {verified
              ? og.verifiedTitle
              : pending
                ? og.pendingTitle
                : og.genericTitle}
          </div>
          <div style={{ fontSize: '26px', color: '#94a3b8', lineHeight: 1.4 }}>
            {verified
              ? og.verifiedText
              : pending
                ? og.pendingText
                : og.genericText}
          </div>
        </div>

        {verified ? (
          <div style={{ display: 'flex', gap: '24px' }}>
            <div
              style={{
                flex: 1,
                backgroundColor: '#00000066',
                border: '1px solid #34d39955',
                borderRadius: '24px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#6ee7b7' }}>
                +{card.trees}
              </div>
              <div style={{ fontSize: '20px', color: '#cbd5e1' }}>{og.trees}</div>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#00000066',
                border: '1px solid #22d3ee55',
                borderRadius: '24px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#67e8f9' }}>
                +{card.bottles}
              </div>
              <div style={{ fontSize: '20px', color: '#cbd5e1' }}>{og.bottles}</div>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: '#00000066',
                border: '1px solid #fbbf2455',
                borderRadius: '24px',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ fontSize: '44px', fontWeight: 800, color: '#fcd34d' }}>
                +{card.carbonKg.toFixed(1)} kg
              </div>
              <div style={{ fontSize: '20px', color: '#cbd5e1' }}>{og.carbon}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '22px', color: '#64748b' }}>
            {og.thanks}
          </div>
        )}

        {verified && card.transactionId && (
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              wordBreak: 'break-all',
            }}
          >
            {og.greensparkId} {card.transactionId}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );

  // Verified cards are immutable, so crawlers may cache them. Pending
  // and generic cards may change when verification completes, so they
  // must not be cached long.
  response.headers.set(
    'Cache-Control',
    verified ? 'public, max-age=86400' : 'public, max-age=0, must-revalidate'
  );
  return response;
}
