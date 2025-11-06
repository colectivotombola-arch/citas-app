import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// This endpoint handles Stripe webhook events for subscriptions.  It verifies
// the signature and updates the subscriptions table accordingly.

export async function POST(request: Request) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    return new NextResponse('Stripe secrets missing', { status: 500 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });
  const sig = request.headers.get('stripe-signature')!;
  const buf = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return new NextResponse('Webhook signature verification failed', { status: 400 });
  }
  switch (event.type) {
    case 'checkout.session.completed': {
      // Nothing to do here; we use subscription.created instead
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;
      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        current_period_end: new Date((subscription.current_period_end ?? 0) * 1000),
        updated_at: new Date(),
      }, { onConflict: 'stripe_subscription_id' });
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;
      await supabaseAdmin.from('subscriptions').update({
        status: 'canceled',
        current_period_end: new Date((subscription.current_period_end ?? 0) * 1000),
        updated_at: new Date(),
      }).eq('stripe_subscription_id', subscription.id);
      break;
    }
    default:
      // Unhandled event types are ignored
      break;
  }
  return new NextResponse('OK', { status: 200 });
}