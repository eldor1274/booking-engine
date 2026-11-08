import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Booking } from '@/lib/db';
import { tokenMatches } from '@/lib/token';

interface BookingWithRoom extends Booking {
  room_name: string;
  image_url: string;
  room_description: string;
}

// Requires ?token=<booking's public_token>. Booking IDs are sequential, so without
// this check anyone could read every guest's details by counting upward.
// A wrong or missing token returns 404 (not 403) so it doesn't confirm the ID exists.
export function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = new URL(req.url).searchParams.get('token');

    const db = getDb();
    const booking = db.prepare(`
      SELECT b.*, r.name as room_name, r.image_url, r.description as room_description
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `).get(params.id) as BookingWithRoom | undefined;

    if (!booking || !tokenMatches(booking.public_token, token)) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Don't echo internal fields back to the browser.
    const { public_token: _token, stripe_session_id: _sess, stripe_payment_intent: _pi, ...safe } = booking;
    return NextResponse.json(safe);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}
