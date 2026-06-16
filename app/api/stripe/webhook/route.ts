import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getDb } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

// Raw body required for Stripe signature verification
export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing stripe-signature or STRIPE_WEBHOOK_SECRET' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const db = getDb();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      const paymentIntent =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

      if (bookingId) {
        db.prepare(`
          UPDATE bookings SET status = 'confirmed', stripe_payment_intent = ? WHERE id = ?
        `).run(paymentIntent, bookingId);
        console.log(`Booking #${bookingId} confirmed via Stripe session ${session.id}`);
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        db.prepare(`
          UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'pending'
        `).run(bookingId);
        console.log(`Booking #${bookingId} cancelled (session expired)`);
      }
      break;
    }

    case 'charge.refunded': {
      // Optional: handle refunds — mark booking cancelled
      break;
    }
  }

  return NextResponse.json({ received: true });
}
