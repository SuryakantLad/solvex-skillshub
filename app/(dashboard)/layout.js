import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth/guards';
import DashboardShell from '@/components/shared/DashboardShell';

export default async function DashboardLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
