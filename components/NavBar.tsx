import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600 tracking-tight">
          BookingEngine
        </Link>
        <div className="flex gap-6 text-sm font-medium text-gray-500">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Rooms</Link>
          <Link href="/admin" className="hover:text-indigo-600 transition-colors">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
