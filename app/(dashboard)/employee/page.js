import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import EmployeeDashboardClient from './EmployeeDashboardClient';

export const metadata = { title: 'My Dashboard' };

export default async function EmployeeDashboardPage() {
  const user = await getAuthUser();
  if (user?.role !== 'employee') redirect('/hr');

  await connectDB();
  const employee = await Employee.findOne({ user: user.id }).select('-aiMetadata.resumeRawText').lean();

  return <EmployeeDashboardClient employee={employee ? JSON.parse(JSON.stringify(employee)) : null} />;
}
