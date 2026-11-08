'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BookingDetails {
  id: number;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  status: string;
  room_name: string;
}

function SuccessContent() {
  const params = useSearchParams();
  const bookingId = params.get('booking_id');
  const token = params.get('token');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId || !token) { setLoading(false); return; }

    let attempts = 0;
    const maxAttempts = 12; // 24 seconds

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (data.error) { setError(data.error); setLoading(false); return; }
        setBooking(data);
        setLoading(false);
        // Poll until confirmed (webhook may be a second behind)
        if (data.status !== 'confirmed' && attempts < maxAttempts) {
          attempts++;
          setTimeout(fetchBooking, 2000);
        }
      } catch {
        setError('Failed to load booking details.');
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, token]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-gray-400 animate-pulse">Confirming your booking…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">Back to rooms</Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Booking not found.</p>
        <Link href="/" className="text-indigo-600 hover:underline text-sm">Back to rooms</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
      <p className="text-gray-500 mb-8">
        A confirmation has been sent to <span className="font-medium">{booking.guest_email}</span>
      </p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-left space-y-2.5 mb-6">
        <h2 className="font-semibold text-gray-900 text-lg mb-1">{booking.room_name}</h2>
        {[
          ['Guest', booking.guest_name],
          ['Check-in', booking.check_in],
          ['Check-out', booking.check_out],
          ['Duration', `${booking.nights} night${booking.nights > 1 ? 's' : ''}`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{value}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-100 font-semibold text-gray-900">
          <span>Total paid</span>
          <span>${booking.total_price.toFixed(2)}</span>
        </div>
        <div className="text-xs text-center text-gray-400 pt-1">
          Booking ref: #{booking.id}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {booking.status === 'confirmed' ? (
          <a
            href={`/api/bookings/${booking.id}/ical?token=${encodeURIComponent(token ?? '')}`}
            download={`booking-${booking.id}.ics`}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center block"
          >
            Add to Calendar (.ics)
          </a>
        ) : (
          <div className="w-full py-3 bg-gray-100 text-gray-400 rounded-lg text-sm text-center">
            iCal download will be available momentarily…
          </div>
        )}
        <Link
          href="/"
          className="w-full py-3 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center block"
        >
          Back to Rooms
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400 animate-pulse">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
