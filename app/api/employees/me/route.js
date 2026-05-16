import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const employee = await Employee.findOne({ user: user.id }).select('-aiMetadata.resumeRawText').lean();

    if (!employee) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ employee });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
