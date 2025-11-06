import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import Stripe from 'stripe';

// Create a Stripe Checkout session for a subscription.  The price id must be
// configured via the STRIPE_MONTHLY_PRICE_ID environment variable.
export async function POST() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!stripeSecret || !priceId || !siteUrl) {
    return NextResponse.json({ error: 'Stripe environment variables not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: user.email ?? undefined,
    metadata: {
      user_id: user.id,
      email: user.email ?? '',
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        email: user.email ?? '',
      },
    },
    success_url: `${siteUrl}/dashboard?success=1`,
    cancel_url: `${siteUrl}/dashboard?canceled=1`,
  });
  return NextResponse.json({ url: session.url });
}