import { randomBytes, timingSafeEqual } from 'node:crypto';

// Each booking gets a random, unguessable token. Public booking views and iCal
// downloads require it, so booking IDs (which are sequential) can no longer be
// enumerated to read other guests' details.
export function generateBookingToken(): string {
  return randomBytes(24).toString('hex'); // 48 hex chars, 192 bits of entropy
}

export function tokenMatches(expected: string | null | undefined, provided: string | null | undefined): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
