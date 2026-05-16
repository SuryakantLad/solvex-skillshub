import { NextResponse } from 'next/server';

// NextAuth has been replaced by a custom JWT auth system.
// All auth endpoints are now at /api/auth/login, /api/auth/signup, /api/auth/logout, /api/auth/me
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
