import { notFound } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import EmployeeDetailClient from './EmployeeDetailClient';

export default async function EmployeeDetailPage({ params }) {
  const user = await getAuthUser();
  if (user?.role !== 'hr') return notFound();

  await connectDB();
  const { id } = await params;
  const employee = await Employee.findById(id).select('-aiMetadata.resumeRawText').lean();
  if (!employee) notFound();

  return <EmployeeDetailClient employee={JSON.parse(JSON.stringify(employee))} />;
}
