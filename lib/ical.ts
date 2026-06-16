import ical, { ICalCalendarMethod } from 'ical-generator';
import type { Booking, Room } from './db';

export function generateBookingIcal(booking: Booking, room: Room): string {
  const cal = ical({
    name: 'Booking Confirmation',
    method: ICalCalendarMethod.REQUEST,
    prodId: '//BookingEngine//EN',
  });

  // Standard check-in 3 PM, check-out 11 AM
  const checkIn = new Date(`${booking.check_in}T15:00:00`);
  const checkOut = new Date(`${booking.check_out}T11:00:00`);

  cal.createEvent({
    start: checkIn,
    end: checkOut,
    summary: `${room.name} — Booking #${booking.id}`,
    description: [
      `Guest: ${booking.guest_name}`,
      `Room: ${room.name}`,
      `Check-in: ${booking.check_in} at 3:00 PM`,
      `Check-out: ${booking.check_out} at 11:00 AM`,
      `Duration: ${booking.nights} night(s)`,
      `Total paid: $${booking.total_price.toFixed(2)}`,
      `Booking reference: #${booking.id}`,
    ].join('\n'),
    location: room.name,
    organizer: {
      name: 'Booking Engine',
      email: process.env.CONTACT_EMAIL ?? 'bookings@example.com',
    },
  });

  return cal.toString();
}
