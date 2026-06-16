'use client';

import Link from 'next/link';
import { useSearchParams, Suspense } from 'next/navigation';

function CancelContent() {
  const params = useSearchParams();
  const bookingId = params.get('booking_id');

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Cancelled</h1>
      <p className="text-gray-500 mb-8">
        Your booking{bookingId ? ` #${bookingId}` : ''} was not completed and no payment was taken.
      </p>

      <Link
        href="/"
        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
      >
        Back to Rooms
      </Link>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={null}>
      <CancelContent />
    </Suspense>
  );
}
