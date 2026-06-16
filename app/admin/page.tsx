import { getDb } from '@/lib/db';
import type { Booking } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface BookingRow extends Booking {
  room_name: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending:   'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminPage() {
  const db = getDb();
  const bookings = (db.prepare(`
    SELECT b.*, r.name as room_name
    FROM bookings b
    JOIN rooms r ON b.room_id = r.id
    ORDER BY b.created_at DESC
  `).all() as BookingRow[]).map(b => ({ ...b }));

  const revenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{bookings.filter(b => b.status === 'confirmed').length}</span> confirmed
          {' · '}
          <span className="font-semibold text-green-700">${revenue.toFixed(2)}</span> revenue
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No bookings yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Room</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Check-in</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">iCal</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{b.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{b.room_name}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{b.guest_name}</div>
                    <div className="text-gray-400 text-xs">{b.guest_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.check_in}</td>
                  <td className="px-4 py-3 text-gray-600">{b.check_out}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">${b.total_price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'confirmed' && (
                      <a
                        href={`/api/bookings/${b.id}/ical`}
                        download
                        className="text-indigo-500 hover:text-indigo-700 text-xs font-medium"
                      >
                        .ics
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
