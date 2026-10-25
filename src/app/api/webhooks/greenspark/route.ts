import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  parseGreensparkWebhookEvent,
  verifyGreensparkWebhookSignature,
} from '@/lib/greenspark/webhook';

// Greenspark incoming-webhook endpoint (Task M-02).
//
// Disabled by default: if GREENSPARK_WEBHOOK_SECRET is not set, this
// returns 503 and accepts nothing. When it is set, every request must
// pass HMAC-SHA256 verification over the raw body (see
// src/lib/greenspark/webhook.ts) or it is rejected with 401.
//
// Idempotency / double-counting guards:
// - An order already verified with the same transaction id is
//   acknowledged without any change.
// - An order already verified with a different transaction id is NOT
//   overwritten and its stats are NOT incremented again.
// - A pending order is marked verified and its impact totals are added
//   to site_stats once; the order count is NOT incremented here, because
//   it was already counted when the Stripe webhook saved the order.
// - An unknown order returns 404 so the sender can retry later, after
//   the Stripe webhook has created the order.
//
// See src/lib/greenspark/webhook.ts for the caveat that Greenspark's
// official webhook payload format could not be verified from the repo
// or public docs at implementation time. Confirm the header and field
// names in the Greenspark dashboard before setting the secret.

const CONFIRMED_STATUSES = new Set([
  'completed',
  'verified',
  'success',
  'confirmed',
]);

export async function POST(req: NextRequest) {
  const secret = process.env.GREENSPARK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Greenspark webhook is not configured.' },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature =
    req.headers.get('x-greenspark-signature') ||
    req.headers.get('greenspark-signature') ||
    req.headers.get('x-signature');

  if (!verifyGreensparkWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: 'Invalid Greenspark webhook signature.' },
      { status: 401 }
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }

  const event = parseGreensparkWebhookEvent(payload);
  if (!event) {
    return NextResponse.json(
      { error: 'Webhook event is missing an order reference or transaction id.' },
      { status: 400 }
    );
  }

  if (event.status && !CONFIRMED_STATUSES.has(event.status.toLowerCase())) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const orderRef = adminDb.collection('orders').doc(event.orderId);
  const statsRef = adminDb.collection('site_stats').doc('global_impact');

  try {
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: `Order ${event.orderId} not found.` },
        { status: 404 }
      );
    }

    const existingImpact: any = orderDoc.data()?.impactRecord || {};
    if (existingImpact.greensparkStatus === 'verified') {
      if (existingImpact.greensparkTransactionId === event.transactionId) {
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }
      return NextResponse.json({
        received: true,
        ignored: 'Order already verified with a different transaction id.',
      });
    }

    const trees = Number(existingImpact.treesPlanted || 0);
    const bottles = Number(existingImpact.plasticSaved || 0);
    const carbon = Number(existingImpact.carbonOffset || 0);

    await adminDb.runTransaction(async (transaction: any) => {
      const freshOrder = await transaction.get(orderRef);
      if (!freshOrder.exists) {
        throw new Error(`Order ${event.orderId} disappeared during processing.`);
      }
      const freshImpact: any = freshOrder.data()?.impactRecord || {};
      if (freshImpact.greensparkStatus === 'verified') {
        return;
      }

      const statsDoc = await transaction.get(statsRef);
      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          totalTreesPlanted: trees,
          totalPlasticBottlesRemoved: bottles,
          totalCarbonOffsetKg: carbon,
          totalOrdersCount: 1,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        const current = statsDoc.data()!;
        transaction.update(statsRef, {
          totalTreesPlanted: (current.totalTreesPlanted || 0) + trees,
          totalPlasticBottlesRemoved:
            (current.totalPlasticBottlesRemoved || 0) + bottles,
          totalCarbonOffsetKg: Number(
            ((current.totalCarbonOffsetKg || 0) + carbon).toFixed(1)
          ),
          lastUpdated: new Date().toISOString(),
        });
      }

      transaction.update(orderRef, {
        impactRecord: {
          ...freshImpact,
          greensparkTransactionId: event.transactionId,
          greensparkStatus: 'verified',
          greensparkCertificateUrl: event.certificateUrl,
          verifiedAt: new Date().toISOString(),
          greensparkLastError: null,
        },
      });
    });

    return NextResponse.json({ received: true, impact: 'verified' });
  } catch (err: any) {
    console.error('Error processing Greenspark webhook event:', err);
    return NextResponse.json(
      { error: 'Greenspark webhook processing failed.' },
      { status: 500 }
    );
  }
}
