import { NextResponse, type NextRequest } from 'next/server';

// Protects the admin dashboard with HTTP Basic auth.
// Credentials come from ADMIN_USER (default "admin") and ADMIN_PASSWORD in .env.local.
// Fails CLOSED: if ADMIN_PASSWORD is not set, /admin is unreachable rather than open.
export const config = {
  matcher: ['/admin/:path*'],
};

export function middleware(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USER ?? 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedPass) {
    return new NextResponse('Admin is disabled: set ADMIN_PASSWORD in the environment.', {
      status: 503,
    });
  }

  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep < 0) return unauthorized();

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (!safeEqual(user, expectedUser) || !safeEqual(pass, expectedPass)) {
    return unauthorized();
  }

  return NextResponse.next();
}

function unauthorized(): NextResponse {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin", charset="UTF-8"' },
  });
}

// Constant-time string compare so response timing doesn't leak how many characters matched.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
