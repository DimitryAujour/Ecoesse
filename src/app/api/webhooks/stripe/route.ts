import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { recordGreensparkImpact } from '@/lib/greenspark/client';

// Stripe webhook handler — Task M-02 changes:
// 1. Idempotency: a Stripe redelivery for an already-verified order is
//    acknowledged without re-running Greenspark or re-incrementing stats.
// 2. Pending recovery: if Greenspark fails, the paid order is still saved
//    with impact status "pending" (never a fabricated transaction id),
//    global impact totals are NOT incremented, and the handler returns
//    HTTP 500 so Stripe redelivers. On redelivery, a pending order resumes
//    Greenspark instead of being skipped, and stats are incremented once
//    — and only once — when verification succeeds.
// 3. Failures are no longer swallowed into a 200 response. Returning 200
//    after a database error would tell Stripe the event was processed and
//    permanently lose the retry. Database errors now return 500.
// 4. Stripe signature verification itself was already present and is
//    unchanged; M-02's verification work is on the Greenspark side
//    (see /api/webhooks/greenspark).

type ImpactTotals = { trees: number; bottles: number; carbon: number };

export async function POST(req: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json(
      { error: 'Stripe webhook secrets are not configured.' },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeSecret, {
    apiVersion: '2025-01-27.acacia' as any,
  });

  const sig = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error('Missing stripe-signature header.');
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const trees = Number(session.metadata?.totalTrees || 1);
  const bottles = Number(session.metadata?.totalBottles || 10);
  const carbon = Number(session.metadata?.totalCarbon || 2);
  const customerEmail = session.customer_details?.email || 'customer@example.com';
  const orderId = session.id;
  const totals: ImpactTotals = { trees, bottles, carbon };

  const orderRef = adminDb.collection('orders').doc(orderId);
  const statsRef = adminDb.collection('site_stats').doc('global_impact');

  try {
    const existing = await orderRef.get();

    if (existing.exists) {
      const existingData: any = existing.data();
      const existingStatus = existingData?.impactRecord?.greensparkStatus;

      // Already verified: acknowledge, do not double-count.
      if (existingStatus === 'verified') {
        return NextResponse.json({ received: true, alreadyProcessed: true });
      }

      // Pending: resume Greenspark. If it still fails, keep the order
      // pending and return 500 so Stripe redelivers later.
      const impactRecord = await recordGreensparkImpact({
        orderId,
        customerEmail,
        trees,
        plasticBottles: bottles,
        carbonKg: carbon,
      });

      if (!impactRecord.success) {
        await orderRef.update({
          'impactRecord.greensparkAttempts': impactRecord.attempts,
          'impactRecord.greensparkLastError':
            impactRecord.error || 'Greenspark retry failed.',
        });
        console.error(
          `Greenspark verification still pending for order ${orderId}: ${impactRecord.error}`
        );
        return NextResponse.json(
          { error: 'Greenspark impact not verified; order remains pending.' },
          { status: 500 }
        );
      }

      // Verified on retry: update the order and increment impact totals
      // only (the order count was already incremented when the pending
      // order was first saved).
      await adminDb.runTransaction(async (transaction: any) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) {
          throw new Error(`Order ${orderId} disappeared during retry.`);
        }
        const currentImpact = orderDoc.data()?.impactRecord || {};
        if (currentImpact.greensparkStatus === 'verified') {
          return;
        }

        const statsDoc = await transaction.get(statsRef);
        if (!statsDoc.exists) {
          transaction.set(statsRef, {
            totalTreesPlanted: totals.trees,
            totalPlasticBottlesRemoved: totals.bottles,
            totalCarbonOffsetKg: totals.carbon,
            totalOrdersCount: 1,
            lastUpdated: new Date().toISOString(),
          });
        } else {
          const current = statsDoc.data()!;
          transaction.update(statsRef, {
            totalTreesPlanted: (current.totalTreesPlanted || 0) + totals.trees,
            totalPlasticBottlesRemoved:
              (current.totalPlasticBottlesRemoved || 0) + totals.bottles,
            totalCarbonOffsetKg: Number(
              ((current.totalCarbonOffsetKg || 0) + totals.carbon).toFixed(1)
            ),
            lastUpdated: new Date().toISOString(),
          });
        }

        transaction.update(orderRef, {
          impactRecord: {
            ...currentImpact,
            greensparkTransactionId: impactRecord.transactionId,
            greensparkStatus: 'verified',
            greensparkCertificateUrl: impactRecord.certificateUrl,
            verifiedAt: impactRecord.verifiedAt,
            greensparkAttempts: impactRecord.attempts,
            greensparkLastError: null,
          },
        });
      });

      console.log(`Order ${orderId} impact verified on Stripe redelivery.`);
      return NextResponse.json({ received: true, impact: 'verified' });
    }

    // First delivery: try Greenspark, then save the order accordingly.
    const impactRecord = await recordGreensparkImpact({
      orderId,
      customerEmail,
      trees,
      plasticBottles: bottles,
      carbonKg: carbon,
    });

    if (impactRecord.success) {
      await orderRef.set({
        id: orderId,
        stripeSessionId: session.id,
        customerEmail,
        customerUid: null,
        shippingAddress: (session as any).shipping_details?.address || {},
        totalAmountCents: session.amount_total || 0,
        paymentStatus: 'paid',
        fulfillmentStatus: 'unfulfilled',
        trackingNumber: null,
        impactRecord: {
          greensparkTransactionId: impactRecord.transactionId,
          treesPlanted: trees,
          plasticSaved: bottles,
          carbonOffset: carbon,
          verifiedAt: impactRecord.verifiedAt,
          greensparkStatus: 'verified',
          greensparkCertificateUrl: impactRecord.certificateUrl,
          greensparkAttempts: impactRecord.attempts,
          greensparkLastError: null,
        },
        createdAt: new Date().toISOString(),
      });

      await adminDb.runTransaction(async (transaction: any) => {
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
            totalPlasticBottlesRemoved: (current.totalPlasticBottlesRemoved || 0) + bottles,
            totalCarbonOffsetKg: Number(
              ((current.totalCarbonOffsetKg || 0) + carbon).toFixed(1)
            ),
            totalOrdersCount: (current.totalOrdersCount || 0) + 1,
            lastUpdated: new Date().toISOString(),
          });
        }
      });

      console.log(`Order ${orderId} successfully processed and impact verified.`);
      return NextResponse.json({ received: true, impact: 'verified' });
    }

    // Greenspark failed: save the paid order as pending, count the order
    // but NOT the unverified impact, and return 500 so Stripe redelivers.
    await orderRef.set({
      id: orderId,
      stripeSessionId: session.id,
      customerEmail,
      customerUid: null,
      shippingAddress: (session as any).shipping_details?.address || {},
      totalAmountCents: session.amount_total || 0,
      paymentStatus: 'paid',
      fulfillmentStatus: 'unfulfilled',
      trackingNumber: null,
      impactRecord: {
        greensparkTransactionId: null,
        treesPlanted: trees,
        plasticSaved: bottles,
        carbonOffset: carbon,
        verifiedAt: null,
        greensparkStatus: 'pending',
        greensparkCertificateUrl: null,
        greensparkAttempts: impactRecord.attempts,
        greensparkLastError: impactRecord.error || 'Greenspark verification failed.',
      },
      createdAt: new Date().toISOString(),
    });

    await adminDb.runTransaction(async (transaction: any) => {
      const statsDoc = await transaction.get(statsRef);
      if (!statsDoc.exists) {
        transaction.set(statsRef, {
          totalTreesPlanted: 0,
          totalPlasticBottlesRemoved: 0,
          totalCarbonOffsetKg: 0,
          totalOrdersCount: 1,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        const current = statsDoc.data()!;
        transaction.update(statsRef, {
          totalOrdersCount: (current.totalOrdersCount || 0) + 1,
          lastUpdated: new Date().toISOString(),
        });
      }
    });

    console.error(
      `Greenspark verification failed for order ${orderId}; saved as pending: ${impactRecord.error}`
    );
    return NextResponse.json(
      { error: 'Greenspark impact not verified; order saved as pending.' },
      { status: 500 }
    );
  } catch (err: any) {
    // Previously this was swallowed into a 200 response. A 500 tells
    // Stripe to redeliver, which is the recovery mechanism for this route.
    console.error('Error processing Stripe webhook event:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed; Stripe will retry.' },
      { status: 500 }
    );
  }
}
