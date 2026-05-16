import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Search, Briefcase, BarChart3, ChevronRight,
  Wrench, TrendingUp, Sparkles, ArrowRight,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import EmployeeCard from '@/components/hr/EmployeeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const QUICK_ACTIONS = [
  { href: '/hr/search', icon: Search, label: 'AI Semantic Search', desc: 'Find talent with natural language', gradient: 'from-violet-500 to-indigo-500', glow: 'hover:shadow-[0_4px_20px_rgba(124,58,237,0.15)]' },
  { href: '/hr/directory', icon: Users, label: 'Employee Directory', desc: 'Browse all talent profiles', gradient: 'from-blue-500 to-cyan-500', glow: 'hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)]' },
  { href: '/hr/team-builder', icon: Wrench, label: 'Team Builder', desc: 'AI assembles optimal teams', gradient: 'from-emerald-500 to-teal-500', glow: 'hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]' },
];

export default function HRDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    api.get('/api/analytics').then(({ data: d }) => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-8">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    </div>
  );

  const stats = data?.stats ?? { total: 0, departments: 0, available: 0, avgCompleteness: 0 };
  const topSkills = data?.topSkills ?? [];
  const departments = data?.departments ?? [];
  const recentEmployees = data?.recentEmployees ?? [];

  return (
    <div className="space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/8 via-transparent to-indigo-500/5 p-6"
      >
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, hsl(var(--primary)/0.15), transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest mb-1">HR Intelligence Dashboard</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Good morning, {firstName} 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your talent pool has <span className="font-semibold text-foreground">{stats.total} employees</span>{' '}
              across <span className="font-semibold text-foreground">{stats.departments} departments</span>.
            </p>
          </div>
          <Link to="/hr/search" className="sm:shrink-0">
            <Button size="sm" className="w-full sm:w-auto">
              <Sparkles className="w-3.5 h-3.5" />
              AI Search
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Employees', value: stats.total, description: 'In talent pool', icon: Users, color: 'default' },
          { title: 'Departments', value: stats.departments, description: 'Active departments', icon: Briefcase, color: 'info' },
          { title: 'Available Now', value: stats.available, description: 'Open to new roles', icon: TrendingUp, color: 'success' },
          { title: 'Avg Profile Score', value: `${stats.avgCompleteness}%`, description: 'Profile completeness', icon: BarChart3, color: 'violet' },
        ].map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => (
          <motion.div key={action.href} variants={item}>
            <Link to={action.href}>
              <Card className={`group cursor-pointer transition-all duration-200 hover:border-primary/20 ${action.glow}`}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-md`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Skills in Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topSkills.length === 0
                ? <p className="text-sm text-muted-foreground">No skills data yet</p>
                : topSkills.map((skill, i) => (
                  <div key={skill.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground/60 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="text-xs flex-1 truncate font-medium">{skill.name}</span>
                    <div className="w-16 shrink-0">
                      <Progress value={(skill.count / topSkills[0].count) * 100} className="h-1" />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-5 text-right shrink-0">{skill.count}</span>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              {departments.length === 0
                ? <p className="text-sm text-muted-foreground">No departments yet</p>
                : <div className="flex flex-wrap gap-1.5">
                  {departments.map((dept) => (
                    <Badge key={dept} variant="secondary" className="text-xs font-medium">{dept}</Badge>
                  ))}
                </div>
              }
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Recent Profiles</CardTitle>
                <Link to="/hr/directory" className="text-xs text-primary hover:underline underline-offset-2">View all →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentEmployees.slice(0, 5).map((emp) => (
                <Link key={emp._id} to={`/hr/directory/${emp._id}`}>
                  <div className="flex items-center gap-3 px-2 py-2 -mx-2 rounded-xl hover:bg-secondary/60 transition-colors group">
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={getAvatarUrl(emp.name)} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">{getInitials(emp.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{emp.title}</p>
                    </div>
                    {emp.availability?.isAvailable && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent employee grid */}
      {recentEmployees.length > 0 && (
        <motion.div variants={item} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Recent Employees</h2>
            <Link to="/hr/directory" className="text-xs text-primary hover:underline underline-offset-2">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recentEmployees.slice(0, 6).map((emp, i) => (
              <motion.div key={emp._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="h-full">
                <EmployeeCard employee={emp} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
