import Link from 'next/link';
import Image from 'next/image';
import type { Room } from '@/lib/db';

export default function RoomCard({ room }: { room: Room }) {
  const amenities: string[] = JSON.parse(room.amenities);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
      <div className="relative h-56 w-full">
        <Image
          src={room.image_url}
          alt={room.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
          <div className="text-right shrink-0 ml-3">
            <span className="text-indigo-600 font-bold text-lg">${room.price_per_night}</span>
            <span className="text-sm font-normal text-gray-400">/night</span>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{room.description}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {amenities.slice(0, 4).map((a) => (
            <span key={a} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
              {a}
            </span>
          ))}
          {amenities.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">
              +{amenities.length - 4} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''}
          </span>
          <Link
            href={`/rooms/${room.id}`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
