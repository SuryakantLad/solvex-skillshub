import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/guards';
import connectDB from '@/lib/db/connection';
import Employee from '@/lib/db/models/Employee';
import HRDashboardClient from './HRDashboardClient';

export const metadata = { title: 'HR Dashboard' };

export default async function HRDashboardPage() {
  const user = await getAuthUser();
  if (user?.role !== 'hr') redirect('/employee');

  await connectDB();

  // Two parallel queries: one lightweight for stats, one limited for display cards
  const [statsEmployees, recentEmployees, totalCount] = await Promise.all([
    Employee.find({})
      .select('department totalYearsExperience profileCompleteness availability skills.name')
      .lean(),
    Employee.find({})
      .select('name title department skills totalYearsExperience profileCompleteness availability')
      .sort({ profileCompleteness: -1 })
      .limit(6)
      .lean(),
    Employee.countDocuments(),
  ]);

  const departments = [...new Set(statsEmployees.map((e) => e.department).filter(Boolean))];
  const allSkills = statsEmployees.flatMap((e) => e.skills.map((s) => s.name));
  const skillFreq = allSkills.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const topSkills = Object.entries(skillFreq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

  const avgCompleteness = statsEmployees.length
    ? Math.round(statsEmployees.reduce((s, e) => s + (e.profileCompleteness || 0), 0) / statsEmployees.length)
    : 0;

  return (
    <HRDashboardClient
      stats={{
        total: totalCount,
        departments: departments.length,
        available: statsEmployees.filter((e) => e.availability?.isAvailable).length,
        avgCompleteness,
      }}
      topSkills={topSkills}
      departments={departments}
      recentEmployees={JSON.parse(JSON.stringify(recentEmployees))}
    />
  );
}
