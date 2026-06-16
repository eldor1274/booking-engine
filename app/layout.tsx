import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'Booking Engine',
  description: 'Book your perfect room or space',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <NavBar />
        <main>{children}</main>
        <footer className="mt-24 py-8 text-center text-sm text-gray-400 border-t border-gray-100">
          © {new Date().getFullYear()} Booking Engine
        </footer>
      </body>
    </html>
  );
}
