import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { SAMPLE_PRODUCTS } from '@/lib/seed/products';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
    }

    // Verify products & build line items
    let totalTrees = 0;
    let totalBottles = 0;
    let totalCarbon = 0;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of items) {
      const product = SAMPLE_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ID ${item.productId} not found in catalog.` },
          { status: 404 }
        );
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      totalTrees += (product.sustainabilityMetrics.treesPlanted || 0) * qty;
      totalBottles += (product.sustainabilityMetrics.plasticBottlesSaved || 0) * qty;
      totalCarbon += (product.sustainabilityMetrics.carbonOffsetKg || 0) * qty;

      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: product.title,
            description: `Eco-Impact: +${product.sustainabilityMetrics.treesPlanted} tree, +${product.sustainabilityMetrics.plasticBottlesSaved} bottles saved.`,
            images: product.images[0] ? [product.images[0]] : [],
          },
          unit_amount: product.price, // cents
        },
        quantity: qty,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const stripeSecret = process.env.STRIPE_SECRET_KEY;

    // Check if Stripe is configured with a real test key
    if (stripeSecret && stripeSecret.startsWith('sk_') && !stripeSecret.includes('placeholder')) {
      const stripe = new Stripe(stripeSecret, {
        apiVersion: '2025-01-27.acacia' as any,
      });

      const session = await stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'required',
        shipping_address_collection: {
          allowed_countries: ['CA', 'US'],
        },
        automatic_tax: {
          enabled: true, // Enables Quebec GST/QST & Canadian tax calculation
        },
        success_url: `${baseUrl}/impact/{CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/`,
        metadata: {
          totalTrees: String(totalTrees),
          totalBottles: String(totalBottles),
          totalCarbon: String(totalCarbon),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Development / Mock Demonstration Mode
    const simulatedOrderId = `ord_eco_${Date.now().toString(36)}`;
    return NextResponse.json({
      demoMode: true,
      orderId: simulatedOrderId,
      message: 'Stripe running in development preview mode. Redirecting to verified impact certificate.',
    });
  } catch (error: any) {
    console.error('Checkout API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
