import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const check_in = searchParams.get('check_in');
  const check_out = searchParams.get('check_out');

  if (!check_in || !check_out) {
    return NextResponse.json({ error: 'check_in and check_out are required' }, { status: 400 });
  }

  const db = getDb();
  const conflict = db.prepare(`
    SELECT COUNT(*) as c FROM bookings
    WHERE room_id = ? AND status IN ('pending', 'confirmed')
    AND check_in < ? AND check_out > ?
  `).get(params.id, check_out, check_in) as { c: number };

  return NextResponse.json({ available: conflict.c === 0 });
}
