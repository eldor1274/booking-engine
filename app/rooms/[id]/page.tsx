import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb, type Room } from '@/lib/db';
import BookingForm from '@/components/BookingForm';

export const dynamic = 'force-dynamic';

export default function RoomPage({ params }: { params: { id: string } }) {
  const db = getDb();
  const raw = db.prepare('SELECT * FROM rooms WHERE id = ?').get(params.id) as Room | undefined;
  if (!raw) notFound();
  const room = { ...raw } as Room;

  const amenities: string[] = JSON.parse(room.amenities);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-6">
        ← Back to rooms
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left: room details */}
        <div className="lg:col-span-3">
          <div className="relative h-72 rounded-2xl overflow-hidden mb-6">
            <Image
              src={room.image_url}
              alt={room.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{room.name}</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">{room.description}</p>

          <div className="mb-6">
            <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span key={a} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}</span>
            <span>·</span>
            <span>
              <span className="text-indigo-600 font-bold text-xl">${room.price_per_night}</span>
              <span className="text-gray-400"> / night</span>
            </span>
          </div>
        </div>

        {/* Right: booking form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Reserve this space</h2>
            <BookingForm room={room} />
          </div>
        </div>
      </div>
    </div>
  );
}
