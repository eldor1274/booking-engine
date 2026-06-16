import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Booking } from '@/lib/db';

interface BookingWithRoom extends Booking {
  room_name: string;
  image_url: string;
  room_description: string;
}

export function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const booking = db.prepare(`
      SELECT b.*, r.name as room_name, r.image_url, r.description as room_description
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `).get(params.id) as BookingWithRoom | undefined;

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json(booking);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}
