import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, FileText, GitBranch, ArrowRight, Star, Lightbulb, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getInitials, getAvatarUrl, getProficiencyColor } from '@/lib/utils';
import { getMyProfile, acceptInferredSkill, rejectInferredSkill } from '@/services/employeeService';

const QUICK_ACTIONS = [
  { href: '/employee/profile', icon: User, label: 'Edit Profile', desc: 'Update your info and skills', gradient: 'from-violet-500 to-indigo-500' },
  { href: '/employee/resume', icon: FileText, label: 'Upload Resume', desc: 'Parse & sync your resume', gradient: 'from-blue-500 to-cyan-500' },
  { href: '/employee/github', icon: GitBranch, label: 'GitHub Sync', desc: 'Import your repositories', gradient: 'from-emerald-500 to-teal-500' },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    getMyProfile().then(({ employee: emp }) => setEmployee(emp)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleAccept(skillId, skillName) {
    try {
      const { employee: updated } = await acceptInferredSkill(employee._id, skillId);
      setEmployee(updated);
      toast.success(`Accepted skill: ${skillName}`);
    } catch { toast.error('Failed to accept skill'); }
  }

  async function handleReject(skillId) {
    try {
      const { employee: updated } = await rejectInferredSkill(employee._id, skillId);
      setEmployee(updated);
    } catch { toast.error('Failed to reject skill'); }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
    </div>
  );

  const confirmedSkills = employee?.skills?.filter((s) => !s.inferred) ?? [];
  const inferredSkills = employee?.skills?.filter((s) => s.inferred) ?? [];

  return (
    <div className="space-y-8">

      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-500/8 via-transparent to-indigo-500/5 p-6"
      >
        <div className="relative flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="w-14 h-14 ring-4 ring-border shrink-0">
            <AvatarImage src={getAvatarUrl(user?.name ?? '')} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{getInitials(user?.name ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Employee Portal</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
            {employee && (
              <p className="text-muted-foreground text-sm mt-1">{employee.title || 'No title set'} {employee.department && `· ${employee.department}`}</p>
            )}
          </div>
          {employee?.profileCompleteness !== undefined && (
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Profile completeness</p>
              <p className="text-3xl font-black text-primary">{employee.profileCompleteness}%</p>
              <Progress value={employee.profileCompleteness} className="w-20 h-1 mt-1" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div key={action.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Link to={action.href}>
              <Card className="group cursor-pointer hover:border-primary/20 hover:shadow-md transition-all duration-200">
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
      </div>

      {/* Skills */}
      {confirmedSkills.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  My Skills ({confirmedSkills.length})
                </CardTitle>
                <Link to="/employee/profile" className="text-xs text-primary hover:underline">Edit →</Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {confirmedSkills.slice(0, 8).map((skill) => (
                  <div key={skill.name} className="flex items-center gap-3">
                    <span className="text-xs font-medium flex-1 truncate">{skill.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${getProficiencyColor(skill.proficiency)}`}>
                      {skill.proficiency}
                    </span>
                  </div>
                ))}
                {confirmedSkills.length > 8 && (
                  <Link to="/employee/profile" className="text-xs text-primary hover:underline col-span-full">
                    +{confirmedSkills.length - 8} more skills →
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inferred skills */}
      {inferredSkills.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                AI Inferred Skills — Review Needed
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {inferredSkills.map((skill) => (
                <div key={skill.name} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background border border-border">
                  <div>
                    <p className="text-xs font-medium">{skill.name}</p>
                    {skill.inferenceReason && <p className="text-[10px] text-muted-foreground">{skill.inferenceReason}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleAccept(skill._id, skill.name)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Accept
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => handleReject(skill._id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
