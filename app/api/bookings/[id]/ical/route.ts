import { getDb, type Booking, type Room } from '@/lib/db';
import { generateBookingIcal } from '@/lib/ical';

export function GET(_req: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(params.id) as Booking | undefined;

  if (!booking) return new Response('Booking not found', { status: 404 });
  if (booking.status !== 'confirmed') {
    return new Response('iCal is only available for confirmed bookings', { status: 400 });
  }

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(booking.room_id) as Room | undefined;
  if (!room) return new Response('Room not found', { status: 404 });

  const icsContent = generateBookingIcal(booking, room);

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="booking-${booking.id}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
