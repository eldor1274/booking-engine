import { NextResponse } from 'next/server';
import { getDb, type Room } from '@/lib/db';

export function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(params.id) as Room | undefined;
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json(room);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}
