import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-change-me'
);

const COOKIE_NAME = 'talentgraph_token';

const ROLE_HOME = {
  hr: '/hr',
  employee: '/employee',
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // ── Verify JWT ─────────────────────────────────────────────────────────────
  let payload = null;
  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, SECRET, { issuer: 'talentgraph' });
      payload = p;
    } catch {
      // expired or tampered — treat as logged-out
    }
  }

  const isAuthenticated = !!payload;

  // ── Auth pages: redirect to dashboard if already logged in ─────────────────
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (isAuthenticated) {
      const home = ROLE_HOME[payload.role] ?? '/';
      return NextResponse.redirect(new URL(home, request.url));
    }
    return NextResponse.next();
  }

  // ── Protected routes: redirect to login if not authenticated ───────────────
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Role enforcement ───────────────────────────────────────────────────────
  if (pathname.startsWith('/hr') && payload.role !== 'hr') {
    return NextResponse.redirect(new URL('/employee', request.url));
  }
  if (pathname.startsWith('/employee') && payload.role !== 'employee') {
    return NextResponse.redirect(new URL('/hr', request.url));
  }

  // ── Inject user identity headers for server components ────────────────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.id);
  requestHeaders.set('x-user-role', payload.role);
  requestHeaders.set('x-user-email', payload.email);
  requestHeaders.set('x-user-name', payload.name ?? '');

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    '/employee/:path*',
    '/hr/:path*',
    '/login',
    '/signup',
  ],
};
