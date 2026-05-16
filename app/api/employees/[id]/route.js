import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';

export async function GET(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const employee = await Employee.findById(id).select('-aiMetadata.resumeRawText').lean();
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    return NextResponse.json({ employee });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const employee = await Employee.findById(id);
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

    if (user.role === 'employee') {
      const userEmployee = await Employee.findOne({ user: user.id });
      if (!userEmployee || userEmployee._id.toString() !== id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const allowedFields = [
      'title', 'department', 'location', 'summary', 'avatar',
      'linkedIn', 'github', 'website', 'phone', 'skills',
      'experience', 'certifications', 'education', 'projects',
      'availability', 'totalYearsExperience',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        employee[field] = body[field];
      }
    }

    employee.calculateCompleteness();
    await employee.save();

    return NextResponse.json({ employee: employee.toObject() });
  } catch (error) {
    console.error('PUT /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}
