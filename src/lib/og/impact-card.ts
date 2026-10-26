// Impact share-card data — Task M-03, verified-only.
//
// This is the single place that decides what an OG image may claim.
// It is deliberately conservative, for Bill C-59:
//
// - "verified" only when the order's impactRecord (written by the Stripe
//   webhook after M-02) has greensparkStatus === 'verified' AND a
//   non-empty greensparkTransactionId. Totals shown are exactly the
//   totals stored on that verified record — never demo data, and never
//   the totals from the impact page, which is still a demo page with
//   hardcoded +2 trees / +28 bottles / +5.0 kg and a fabricated id.
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
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getImpactCardData(order: unknown): ImpactCardData {
  const generic: ImpactCardData = {
    variant: 'generic',
    trees: 0,
    bottles: 0,
    carbonKg: 0,
    transactionId: null,
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
    };
  }

  // Anything that is not provably verified — including pre-M-02 records
  // with no greensparkStatus — is pending, never verified.
  return { ...generic, variant: 'pending' };
}
