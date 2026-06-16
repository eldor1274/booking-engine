'use client';

import { useState } from 'react';
import type { Room } from '@/lib/db';

export default function BookingForm({ room }: { room: Room }) {
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    check_in: '',
    check_out: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const nights =
    form.check_in && form.check_out
      ? Math.max(0, Math.round((new Date(form.check_out).getTime() - new Date(form.check_in).getTime()) / 86_400_000))
      : 0;

  const total = (nights * room.price_per_night).toFixed(2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (nights < 1) {
      setError('Check-out must be at least 1 night after check-in.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, room_id: room.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
          <input
            type="date"
            required
            min={today}
            value={form.check_in}
            onChange={(e) => setForm({ ...form, check_in: e.target.value, check_out: '' })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
          <input
            type="date"
            required
            min={form.check_in || today}
            value={form.check_out}
            onChange={(e) => setForm({ ...form, check_out: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
        <input
          type="text"
          required
          placeholder="Jane Smith"
          value={form.guest_name}
          onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
        <input
          type="email"
          required
          placeholder="jane@example.com"
          value={form.guest_email}
          onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {nights > 0 && (
        <div className="bg-indigo-50 rounded-lg p-4 text-sm space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>${room.price_per_night} × {nights} night{nights > 1 ? 's' : ''}</span>
            <span>${total}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-indigo-100">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || nights < 1}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting to payment…' : nights > 0 ? `Pay $${total}` : 'Select dates to continue'}
      </button>

      <p className="text-xs text-center text-gray-400">
        Secured by Stripe · No payment taken until checkout
      </p>
    </form>
  );
}
