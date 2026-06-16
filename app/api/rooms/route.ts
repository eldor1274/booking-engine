import { NextResponse } from 'next/server';
import { getDb, type Room } from '@/lib/db';

export function GET() {
  try {
    const db = getDb();
    const rooms = db.prepare('SELECT * FROM rooms ORDER BY price_per_night ASC').all() as Room[];
    return NextResponse.json(rooms);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}
