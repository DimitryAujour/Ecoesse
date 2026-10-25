import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { recordGreensparkImpact } from '@/lib/greenspark/client';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const trees = Number(session.metadata?.totalTrees || 1);
    const bottles = Number(session.metadata?.totalBottles || 10);
    const carbon = Number(session.metadata?.totalCarbon || 2);
    const customerEmail = session.customer_details?.email || 'customer@example.com';
    const orderId = session.id;

    try {
      // 1. Record Greenspark Environmental Impact
      const impactRecord = await recordGreensparkImpact({
        orderId,
        customerEmail,
        trees,
        plasticBottles: bottles,
        carbonKg: carbon,
      });

      // 2. Create Order in Firestore 'orders' collection
      const orderRef = adminDb.collection('orders').doc(orderId);
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
          verifiedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      });

      // 3. Atomically Increment 'site_stats/global_impact'
      const statsRef = adminDb.collection('site_stats').doc('global_impact');
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
            totalCarbonOffsetKg: Number(((current.totalCarbonOffsetKg || 0) + carbon).toFixed(1)),
            totalOrdersCount: (current.totalOrdersCount || 0) + 1,
            lastUpdated: new Date().toISOString(),
          });
        }
      });

      console.log(`Order ${orderId} successfully processed and impact verified.`);
    } catch (dbError) {
      console.error('Error writing order/impact to Firestore:', dbError);
    }
  }

  return NextResponse.json({ received: true });
}
