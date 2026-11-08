import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { generateBookingToken } from './token';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'booking.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec('PRAGMA foreign_keys = ON');
    initSchema(_db);
    seedRooms(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price_per_night REAL NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      amenities TEXT NOT NULL DEFAULT '[]',
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      nights INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      stripe_session_id TEXT,
      stripe_payment_intent TEXT,
      public_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `);

  migrateBookingTokens(db);
}

// Adds the public_token column to databases created before it existed, and
// gives every existing booking a token so admin iCal links keep working.
function migrateBookingTokens(db: DatabaseSync): void {
  const columns = db.prepare('PRAGMA table_info(bookings)').all() as { name: string }[];
  if (!columns.some((c) => c.name === 'public_token')) {
    db.exec('ALTER TABLE bookings ADD COLUMN public_token TEXT');
  }

  const missing = db.prepare('SELECT id FROM bookings WHERE public_token IS NULL').all() as { id: number }[];
  if (missing.length > 0) {
    const update = db.prepare('UPDATE bookings SET public_token = ? WHERE id = ?');
    for (const row of missing) update.run(generateBookingToken(), row.id);
  }

  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_public_token ON bookings(public_token)');
}

function seedRooms(db: DatabaseSync): void {
  const count = (db.prepare('SELECT COUNT(*) as c FROM rooms').get() as { c: number }).c;
  if (count > 0) return;

  const insert = db.prepare(`
    INSERT INTO rooms (name, description, price_per_night, capacity, amenities, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const rooms = [
    {
      name: 'Ocean View Suite',
      description: 'Stunning panoramic ocean views with a private balcony. Features a king-size bed, luxury bath, and modern amenities perfect for a romantic getaway.',
      price_per_night: 299,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'Ocean View', 'Balcony', 'Mini Bar', 'Room Service']),
      image_url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
    },
    {
      name: 'Garden Cottage',
      description: 'A charming private cottage surrounded by lush gardens. Quiet, cozy, and equipped with a kitchenette — perfect for couples seeking a peaceful retreat.',
      price_per_night: 189,
      capacity: 2,
      amenities: JSON.stringify(['WiFi', 'Garden View', 'Kitchenette', 'Private Entrance', 'BBQ']),
      image_url: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=800&q=80',
    },
    {
      name: 'Family Loft',
      description: 'A spacious two-story loft ideal for families. Includes two bedrooms, a fully equipped kitchen, a living area, and in-unit laundry.',
      price_per_night: 349,
      capacity: 6,
      amenities: JSON.stringify(['WiFi', 'Full Kitchen', '2 Bedrooms', 'Living Room', 'Washer/Dryer']),
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    },
    {
      name: 'Executive Studio',
      description: 'A sleek, modern studio designed for business travelers. Includes a dedicated workspace, high-speed fiber internet, and express checkout.',
      price_per_night: 149,
      capacity: 1,
      amenities: JSON.stringify(['WiFi', 'Workspace', 'Smart TV', 'Coffee Machine', 'Express Checkout']),
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    },
  ];

  for (const room of rooms) {
    insert.run(room.name, room.description, room.price_per_night, room.capacity, room.amenities, room.image_url);
  }
}

export interface Room {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  amenities: string;
  image_url: string;
  created_at: string;
}

export interface Booking {
  id: number;
  room_id: number;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  public_token: string | null;
  created_at: string;
}
