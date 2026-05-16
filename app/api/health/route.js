import { NextResponse } from 'next/server';
import { healthCheck, getConnectionStatus } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await healthCheck();
    return NextResponse.json({
      status: 'ok',
      db,
      connection: getConnectionStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        db: { status: 'error', latencyMs: null },
        connection: getConnectionStatus(),
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
