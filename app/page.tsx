import { getDb, type Room } from '@/lib/db';
import RoomCard from '@/components/RoomCard';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const db = getDb();
  const rooms = (db.prepare('SELECT * FROM rooms ORDER BY price_per_night ASC').all() as unknown as Room[]).map(r => ({ ...r }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Your Perfect Space</h1>
        <p className="text-lg text-gray-500">Choose from our handpicked rooms and spaces</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>
    </div>
  );
}
