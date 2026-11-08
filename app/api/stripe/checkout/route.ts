import { NextResponse } from 'next/server';
import { getDb, type Room } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { generateBookingToken } from '@/lib/token';

function diffNights(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000,
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { room_id, check_in, check_out, guest_name, guest_email } = body as {
      room_id: number;
      check_in: string;
      check_out: string;
      guest_name: string;
      guest_email: string;
    };

    if (!room_id || !check_in || !check_out || !guest_name || !guest_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id) as Room | undefined;
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const nights = diffNights(check_in, check_out);
    if (nights < 1) {
      return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
    }

    // Overlap check: existing booking's check_in < requested check_out AND check_out > requested check_in
    const conflict = db.prepare(`
      SELECT COUNT(*) as c FROM bookings
      WHERE room_id = ? AND status IN ('pending', 'confirmed')
      AND check_in < ? AND check_out > ?
    `).get(room_id, check_out, check_in) as { c: number };

    if (conflict.c > 0) {
      return NextResponse.json(
        { error: 'Room is not available for the selected dates. Please choose different dates.' },
        { status: 409 },
      );
    }

    const total_price = parseFloat((nights * room.price_per_night).toFixed(2));

    // Create pending booking first, with a random token the guest needs to view it
    const publicToken = generateBookingToken();
    const result = db.prepare(`
      INSERT INTO bookings (room_id, guest_name, guest_email, check_in, check_out, nights, total_price, status, public_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(room_id, guest_name, guest_email, check_in, check_out, nights, total_price, publicToken);

    const bookingId = result.lastInsertRowid;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: guest_email,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: room.name,
              description: `${nights} night${nights > 1 ? 's' : ''} · Check-in: ${check_in} · Check-out: ${check_out}`,
              images: room.image_url ? [room.image_url] : [],
            },
            unit_amount: Math.round(total_price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}&token=${publicToken}`,
      cancel_url: `${baseUrl}/booking/cancel?booking_id=${bookingId}`,
      metadata: {
        booking_id: bookingId.toString(),
        room_id: room_id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minute window
    });

    db.prepare('UPDATE bookings SET stripe_session_id = ? WHERE id = ?').run(session.id, bookingId);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
