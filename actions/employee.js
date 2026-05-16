'use server';

import { revalidatePath } from 'next/cache';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';

export async function updateEmployeeProfile(data) {
  const user = await getAuthUser();
  if (!user) throw new Error('Unauthorized');

  await connectDB();

  const employee = await Employee.findOne({ user: user.id });
  if (!employee) throw new Error('Employee profile not found');

  const allowedFields = [
    'title', 'department', 'location', 'summary', 'linkedIn',
    'github', 'phone', 'skills', 'experience', 'certifications',
    'education', 'projects', 'availability', 'totalYearsExperience',
  ];

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      employee[field] = data[field];
    }
  }

  employee.calculateCompleteness();
  await employee.save();

  revalidatePath('/employee');
  revalidatePath('/employee/profile');

  return { success: true };
}

export async function getMyProfile() {
  const user = await getAuthUser();
  if (!user) return null;

  await connectDB();
  const employee = await Employee.findOne({ user: user.id }).select('-aiMetadata.resumeRawText').lean();
  return employee ? JSON.parse(JSON.stringify(employee)) : null;
}
