import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, FileText, GitBranch, ArrowRight, Star, Lightbulb, CheckCircle2, X, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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

const COMPLETENESS_TIPS = [
  { threshold: 0, label: 'Add your job title', key: 'title' },
  { threshold: 0, label: 'Write a professional summary', key: 'summary' },
  { threshold: 0, label: 'Add your skills', key: 'skills' },
  { threshold: 0, label: 'Add work experience', key: 'experience' },
  { threshold: 0, label: 'Connect GitHub', key: 'github' },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  useEffect(() => {
    getMyProfile()
      .then(({ employee: emp }) => setEmployee(emp))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept(skillId, skillName) {
    try {
      const { employee: updated } = await acceptInferredSkill(employee._id, skillId);
      setEmployee(updated);
      toast.success(`Accepted: ${skillName}`);
    } catch {
      toast.error('Failed to accept skill');
    }
  }

  async function handleReject(skillId, skillName) {
    try {
      const { employee: updated } = await rejectInferredSkill(employee._id, skillId);
      setEmployee(updated);
      toast.success(`Removed: ${skillName}`);
    } catch {
      toast.error('Failed to reject skill');
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['a', 'b', 'c'].map((k) => <Skeleton key={k} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-48 rounded-2xl" />
    </div>
  );

  const confirmedSkills = employee?.skills?.filter((s) => !s.isInferred) ?? [];
  const pendingInferred = employee?.inferredSkills?.filter((s) => s.status === 'pending') ?? [];
  const completeness = employee?.profileCompleteness ?? 0;

  const missingItems = [];
  if (!employee?.title) missingItems.push('Add your job title');
  if (!employee?.summary || employee.summary.length < 50) missingItems.push('Write a professional summary');
  if (confirmedSkills.length === 0) missingItems.push('Add your skills');
  if ((employee?.experience ?? []).length === 0) missingItems.push('Add work experience');
  if (!employee?.github) missingItems.push('Connect your GitHub profile');

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-500/8 via-transparent to-indigo-500/5 p-6"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 90% 50%, hsl(var(--primary)/0.2), transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="w-14 h-14 ring-4 ring-border shrink-0">
            <AvatarImage src={getAvatarUrl(user?.name ?? '')} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">{getInitials(user?.name ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Employee Portal</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {firstName} 👋</h1>
            {employee && (
              <p className="text-muted-foreground text-sm mt-1">
                {employee.title || 'No title set'}
                {employee.department && <span> · {employee.department}</span>}
                {employee.location && <span> · {employee.location}</span>}
              </p>
            )}
          </div>
          {completeness !== undefined && (
            <div className="sm:text-right shrink-0">
              <p className="text-xs text-muted-foreground mb-1">Profile completeness</p>
              <p className="text-3xl font-black text-primary">{completeness}%</p>
              <Progress value={completeness} className="w-24 h-1.5 mt-1" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Skills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  My Skills
                  <Badge variant="secondary" className="text-[10px]">{confirmedSkills.length}</Badge>
                </CardTitle>
                <Link to="/employee/profile" className="text-xs text-primary hover:underline">Edit →</Link>
              </div>
            </CardHeader>
            <CardContent>
              {confirmedSkills.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center gap-2">
                  <Star className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No skills added yet</p>
                  <Link to="/employee/profile">
                    <Button size="sm" variant="outline" className="text-xs mt-1">Add Skills</Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {confirmedSkills.slice(0, 12).map((skill) => (
                    <span key={skill.name} className={`px-2.5 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}>
                      {skill.name}
                    </span>
                  ))}
                  {confirmedSkills.length > 12 && (
                    <Link to="/employee/profile">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors">
                        +{confirmedSkills.length - 12} more
                      </span>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile completeness tips */}
        {missingItems.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Card className="h-full border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-900/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Improve Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {missingItems.slice(0, 4).map((tip) => (
                  <div key={tip} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {tip}
                  </div>
                ))}
                <Link to="/employee/profile">
                  <Button size="sm" variant="outline" className="text-xs mt-3 w-full">Complete Profile</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* AI Inferred Skills */}
      {pendingInferred.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                AI Inferred Skills — Review Needed
                <Badge variant="default" className="text-[10px] ml-auto">{pendingInferred.length} pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pendingInferred.map((skill) => (
                <div key={skill._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background border border-border">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{skill.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{skill.category}</Badge>
                      {skill.confidence && (
                        <span className="text-[10px] text-muted-foreground">{skill.confidence}% confidence</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost"
                      className="h-7 px-2.5 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700"
                      onClick={() => handleAccept(skill._id, skill.name)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Accept
                    </Button>
                    <Button size="sm" variant="ghost"
                      className="h-7 px-2.5 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-700"
                      onClick={() => handleReject(skill._id, skill.name)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent experience */}
      {(employee?.experience ?? []).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Recent Experience
                </CardTitle>
                <Link to="/employee/profile" className="text-xs text-primary hover:underline">Edit →</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.experience.slice(0, 3).map((exp, i) => (
                <div key={exp._id ?? i} className="relative pl-4 border-l-2 border-border">
                  <p className="font-semibold text-xs">{exp.role ?? exp.title}</p>
                  <p className="text-[11px] text-muted-foreground">{exp.company}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

    </div>
  );
}
