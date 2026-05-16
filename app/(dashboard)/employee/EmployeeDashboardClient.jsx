'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, User, Award, Briefcase, ChevronRight,
  AlertCircle, Sparkles, ArrowUpRight, CheckCircle2,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getProficiencyColor, getInitials, getAvatarUrl, formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

const PROFICIENCY_PCT = { expert: 100, advanced: 75, intermediate: 50, beginner: 25 };

export default function EmployeeDashboardClient({ employee }) {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const completeness = employee?.profileCompleteness ?? 0;
  const skillsCount = employee?.skills?.length ?? 0;
  const certCount = employee?.certifications?.length ?? 0;
  const expCount = employee?.experience?.length ?? 0;
  const inferredCount = (employee?.skills ?? []).filter((s) => s.inferred).length;
  const verifiedCount = skillsCount - inferredCount;

  return (
    <div className="space-y-8">

      {/* ── Welcome banner ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-500/8 via-transparent to-violet-500/5 p-6"
      >
        <div className="absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle at 90% 50%, hsl(220 80% 60% / 0.12), transparent 60%)' }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-500/70 uppercase tracking-widest mb-1">My Profile</p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {completeness >= 80
                ? 'Your profile is looking great. Keep your skills up to date!'
                : `Your profile is ${completeness}% complete — finishing it improves your visibility.`
              }
            </p>
          </div>
          <Link href="/employee/resume" className="sm:shrink-0">
            <Button size="sm" variant="outline" className="w-full sm:w-auto">
              <FileText className="w-3.5 h-3.5" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ── Completeness alert ────────────────────────────────────────────── */}
      {completeness < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Complete your profile to get noticed
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {completeness}% done — HR managers are more likely to find fully completed profiles.
            </p>
            <Progress value={completeness} className="h-1.5 mt-3 bg-amber-200 dark:bg-amber-900" indicatorClassName="bg-amber-500" />
          </div>
          <Link href="/employee/profile">
            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 shrink-0">
              Complete <ArrowUpRight className="w-3 h-3" />
            </Button>
          </Link>
        </motion.div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Skills', value: skillsCount, description: `${verifiedCount} verified`, icon: Sparkles, color: 'default' },
          { title: 'Experience', value: expCount, description: 'Past roles', icon: Briefcase, color: 'info' },
          { title: 'Certifications', value: certCount, description: 'Active certs', icon: Award, color: 'success' },
          { title: 'Profile Score', value: `${completeness}%`, description: 'Completeness', icon: User, color: 'violet' },
        ].map((stat) => (
          <motion.div key={stat.title} variants={item}>
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Profile card */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">My Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-14 h-14 ring-2 ring-primary/15">
                  <AvatarImage src={getAvatarUrl(user?.name || '')} />
                  <AvatarFallback className="bg-primary/8 text-primary font-bold text-sm">
                    {getInitials(user?.name || '?')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{employee?.title || 'No title set'}</p>
                  {employee?.department && (
                    <Badge variant="secondary" className="text-xs mt-1.5">{employee.department}</Badge>
                  )}
                </div>
              </div>

              {employee?.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {employee.summary}
                </p>
              )}

              {employee?.domainExpertise?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {employee.domainExpertise.map((d) => (
                    <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              )}

              {/* Completeness ring */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Profile completeness</span>
                  <span className="font-semibold">{completeness}%</span>
                </div>
                <Progress
                  value={completeness}
                  className="h-1.5"
                  indicatorClassName={completeness >= 80 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-amber-500' : 'bg-rose-500'}
                />
              </div>

              <Link href="/employee/profile">
                <Button variant="outline" size="sm" className="w-full mt-1">
                  Edit Profile
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills overview */}
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Skills Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{skillsCount} total</span>
                  <Link href="/employee/profile" className="text-xs text-primary hover:underline underline-offset-2 font-medium">
                    Edit →
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {skillsCount === 0 ? (
                <div className="text-center py-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium mb-1">No skills added yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Upload your resume to auto-extract skills with AI.</p>
                  <Link href="/employee/resume">
                    <Button size="sm">
                      <FileText className="w-4 h-4" />
                      Upload resume
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {employee.skills.filter((s) => !s.inferred).slice(0, 8).map((skill) => (
                    <div key={skill.name} className="flex items-center gap-3">
                      <span className="text-sm font-medium truncate w-28 shrink-0">{skill.name}</span>
                      <div className="flex-1">
                        <Progress
                          value={PROFICIENCY_PCT[skill.proficiency] ?? 25}
                          className="h-1.5"
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0 ${getProficiencyColor(skill.proficiency)}`}>
                        {skill.proficiency}
                      </span>
                    </div>
                  ))}
                  {skillsCount > 8 && (
                    <p className="text-xs text-muted-foreground col-span-full pt-1">
                      +{skillsCount - 8} more skills · {inferredCount} AI-inferred
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Insights */}
        {employee?.aiInsights && (
          <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Career Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Strengths */}
                  {employee.aiInsights.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Key Strengths</p>
                      {employee.aiInsights.strengths.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                          <span className="text-muted-foreground leading-relaxed">{s}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Unique value */}
                  {employee.aiInsights.uniqueValue && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unique Value</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{employee.aiInsights.uniqueValue}</p>
                    </div>
                  )}
                  {/* Career trajectory */}
                  {employee.aiInsights.careerTrajectory && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Career Trajectory</p>
                      <Badge variant="secondary" className="text-xs">{employee.aiInsights.careerTrajectory}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Experience */}
        {expCount > 0 && (
          <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {employee.experience.slice(0, 3).map((exp, i) => (
                    <div key={i} className="flex gap-4 pb-5 border-b border-border last:border-0 last:pb-0">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-semibold text-sm">{exp.role}</p>
                            <p className="text-xs text-muted-foreground">{exp.company}</p>
                          </div>
                          <div className="text-xs text-muted-foreground/70 whitespace-nowrap shrink-0">
                            {formatDate(exp.startDate)} — {exp.current ? 'Present' : formatDate(exp.endDate)}
                          </div>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{exp.description}</p>
                        )}
                        {exp.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exp.technologies.slice(0, 5).map((t) => (
                              <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5">{t}</Badge>
                            ))}
                            {exp.technologies.length > 5 && (
                              <span className="text-[10px] text-muted-foreground">+{exp.technologies.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
