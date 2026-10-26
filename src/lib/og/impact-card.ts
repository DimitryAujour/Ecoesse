// Impact certificate data — Task M-03 (OG image), shared since the
// impact-page wiring with src/app/impact/[orderId]/page.tsx.
//
// This is the single place that decides what a certificate may claim,
// on the page or in the share card. It is deliberately conservative,
// for Bill C-59:
//
// - "verified" only when the order's impactRecord (written by the Stripe
//   webhook after M-02) has greensparkStatus === 'verified' AND a
//   non-empty greensparkTransactionId. Totals shown are exactly the
//   totals stored on that verified record — never demo data.
// - Orders created before M-02, which have a transaction id but no
//   greensparkStatus, are treated as "pending". That is intentional:
//   their verification status cannot be proven from the record alone.
// - "pending" shows no totals and no verified claim at all. The stored
//   totals for a pending order are *expected* impact, not verified
//   impact, so showing them on a share card would be misleading.
// - "generic" (no order, or a fetch error) shows no order-specific
//   information at all.
//
// Privacy: this data contains only shareable totals and, for verified
// orders, the public Greenspark transaction id. It never includes
// customerEmail, shippingAddress, stripeSessionId, or the order id
// itself (which, in this codebase, is the Stripe session id).

export type ImpactCardVariant = 'verified' | 'pending' | 'generic';

export interface ImpactCardData {
  variant: ImpactCardVariant;
  trees: number;
  bottles: number;
  carbonKg: number;
  transactionId: string | null;
  certificateUrl: string | null;
  verifiedAtISO: string | null;
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Normalize a verifiedAt value (ISO string, Firestore Timestamp, or
 *  { seconds } object) to an ISO string, or null if unusable. */
function toISODate(value: unknown): string | null {
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.toDate === 'function') {
      try {
        const date = (obj.toDate as () => Date)();
        return date instanceof Date && !Number.isNaN(date.getTime())
          ? date.toISOString()
          : null;
      } catch {
        return null;
      }
    }
    if (typeof obj.seconds === 'number') {
      const date = new Date(obj.seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
  }
  return null;
}

export function getImpactCardData(order: unknown): ImpactCardData {
  const generic: ImpactCardData = {
    variant: 'generic',
    trees: 0,
    bottles: 0,
    carbonKg: 0,
    transactionId: null,
    certificateUrl: null,
    verifiedAtISO: null,
  };

  if (!order || typeof order !== 'object') {
    return generic;
  }

  const impact: any = (order as Record<string, any>).impactRecord;
  if (!impact || typeof impact !== 'object') {
    return { ...generic, variant: 'pending' };
  }

  const transactionId =
    typeof impact.greensparkTransactionId === 'string' &&
    impact.greensparkTransactionId.trim().length > 0
      ? impact.greensparkTransactionId
      : null;

  if (impact.greensparkStatus === 'verified' && transactionId) {
    return {
      variant: 'verified',
      trees: toNumber(impact.treesPlanted),
      bottles: toNumber(impact.plasticSaved),
      carbonKg: toNumber(impact.carbonOffset),
      transactionId,
      certificateUrl:
        typeof impact.greensparkCertificateUrl === 'string' &&
        impact.greensparkCertificateUrl.trim().length > 0
          ? impact.greensparkCertificateUrl
          : null,
      verifiedAtISO: toISODate(impact.verifiedAt),
    };
  }

  // Anything that is not provably verified — including pre-M-02 records
  // with no greensparkStatus — is pending, never verified.
  return { ...generic, variant: 'pending' };
}
