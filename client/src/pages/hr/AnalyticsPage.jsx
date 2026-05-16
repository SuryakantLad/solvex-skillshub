import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getAnalytics, getSkillGap } from '@/services/analyticsService';
import { getProficiencyColor } from '@/lib/utils';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const PIE_COLORS = { expert: '#10b981', advanced: '#6366f1', intermediate: '#06b6d4', beginner: '#94a3b8' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gapRole, setGapRole] = useState('');
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const handleSkillGap = useCallback(async () => {
    if (!gapRole.trim()) return;
    setGapLoading(true);
    setGapResult(null);
    try {
      const result = await getSkillGap(gapRole);
      setGapResult(result);
    } catch {
      toast.error('Skill gap analysis failed');
    } finally {
      setGapLoading(false);
    }
  }, [gapRole]);

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {['a', 'b', 'c', 'd'].map((k) => <Skeleton key={k} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );

  const {
    stats = {},
    topSkills = [],
    skillsByCategory = {},
    proficiencyDistribution = {},
    seniorityDistribution = {},
    departmentSkills = [],
    departments = [],
  } = data ?? {};

  // Prepare chart data
  const topSkillsChart = topSkills.slice(0, 12).map((s) => ({ name: s.name.length > 14 ? `${s.name.slice(0, 14)}…` : s.name, fullName: s.name, count: s.count }));

  const proficiencyChart = Object.entries(proficiencyDistribution)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: PIE_COLORS[name] ?? '#94a3b8' }));

  const seniorityChart = Object.entries(seniorityDistribution)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  const categoryChart = Object.entries(skillsByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <PageHeader title="Talent Analytics" description="Organization-wide skill intelligence and workforce insights." />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Employees', value: stats.total ?? 0, icon: Users, color: 'default' },
          { title: 'Departments', value: stats.departments ?? 0, icon: BarChart3, color: 'info' },
          { title: 'Available Now', value: stats.available ?? 0, icon: TrendingUp, color: 'success' },
          { title: 'Avg Completeness', value: `${stats.avgCompleteness ?? 0}%`, icon: BarChart3, color: 'violet' },
        ].map((s) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <StatsCard {...s} />
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="gap">Gap Analysis</TabsTrigger>
        </TabsList>

        {/* Skills tab */}
        <TabsContent value="skills" className="mt-5 space-y-5">
          {/* Top skills bar chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Top Skills by Employee Count</CardTitle>
            </CardHeader>
            <CardContent>
              {topSkillsChart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No skills data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topSkillsChart} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      angle={-40}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                      {topSkillsChart.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top skills table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Skill Detail ({topSkills.length} skills)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topSkills.slice(0, 15).map((skill, i) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground/50 w-5 text-right shrink-0">{i + 1}</span>
                  <span className="text-xs font-medium flex-1 truncate">{skill.name}</span>
                  {skill.category && (
                    <span className="text-[10px] text-muted-foreground hidden sm:inline shrink-0">{skill.category}</span>
                  )}
                  <div className="w-20 shrink-0">
                    <Progress value={topSkills[0]?.count ? (skill.count / topSkills[0].count) * 100 : 0} className="h-1.5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px] tabular-nums shrink-0 w-7 justify-center">{skill.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Proficiency distribution */}
          {proficiencyChart.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Proficiency Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={proficiencyChart} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {proficiencyChart.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Skills by Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {categoryChart.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-xs font-medium flex-1 truncate">{name}</span>
                      <Progress value={categoryChart[0]?.value ? (value / categoryChart[0].value) * 100 : 0} className="w-16 h-1.5" />
                      <Badge variant="outline" className="text-[10px] tabular-nums shrink-0">{value}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Workforce tab */}
        <TabsContent value="workforce" className="mt-5 space-y-5">
          {/* Seniority distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Seniority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {seniorityChart.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No seniority data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={seniorityChart} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Employees" radius={[0, 4, 4, 0]}>
                      {seniorityChart.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Seniority detail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Experience Bands</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {seniorityChart.length === 0
                ? <p className="text-sm text-muted-foreground">No data yet</p>
                : seniorityChart.map(({ name, value }) => {
                  const total = seniorityChart.reduce((s, v) => s + v.value, 0);
                  const pct = total ? Math.round((value / total) * 100) : 0;
                  return (
                    <div key={name} className="flex items-center gap-3">
                      <span className="text-xs font-medium w-32 truncate shrink-0">{name}</span>
                      <div className="flex-1"><Progress value={pct} className="h-2" /></div>
                      <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{value}</span>
                      <Badge variant="secondary" className="text-[10px] w-10 justify-center shrink-0">{pct}%</Badge>
                    </div>
                  );
                })
              }
            </CardContent>
          </Card>

          {departments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Active Departments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {departments.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Departments tab */}
        <TabsContent value="departments" className="mt-5">
          {departmentSkills.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No department data yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departmentSkills.map((dept) => (
                <Card key={dept.department}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{dept.department}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {(dept.topSkills ?? []).map((skill, i) => (
                      <div key={skill.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/50 w-3 text-right shrink-0">{i + 1}</span>
                        <span className="text-xs flex-1 truncate">{skill.name}</span>
                        <Badge variant="secondary" className="text-[10px] tabular-nums shrink-0">{skill.count}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Gap Analysis tab */}
        <TabsContent value="gap" className="mt-5 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Skill Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a target role (e.g. Senior React Developer, ML Engineer, DevOps Lead)…"
                  value={gapRole}
                  onChange={(e) => setGapRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSkillGap()}
                  className="flex-1"
                />
                <Button onClick={handleSkillGap} disabled={gapLoading || !gapRole.trim()}>
                  {gapLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                  Analyze
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Compares your organization's current skills against what's needed for a given role.</p>

              {gapLoading && (
                <div className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                  AI is analyzing skill gaps…
                </div>
              )}

              {gapResult && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Readiness score */}
                  {gapResult.readinessScore !== undefined && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-center shrink-0">
                        <p className="text-3xl font-black text-primary">{gapResult.readinessScore}%</p>
                        <p className="text-[10px] text-muted-foreground">Readiness</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-1">Readiness for <span className="text-primary">{gapRole}</span></p>
                        {gapResult.summary && <p className="text-xs text-muted-foreground leading-relaxed">{gapResult.summary}</p>}
                      </div>
                    </div>
                  )}

                  {!gapResult.readinessScore && gapResult.summary && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-sm leading-relaxed">{gapResult.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Missing skills */}
                    {(gapResult.missingSkills ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          Missing Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(gapResult.missingSkills ?? []).map((s) => {
                            const name = typeof s === 'string' ? s : s.skill ?? s.name ?? s;
                            return <Badge key={name} className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0">{name}</Badge>;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Strong skills */}
                    {(gapResult.strongSkills ?? gapResult.existingStrengths ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                          Existing Strengths
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(gapResult.strongSkills ?? gapResult.existingStrengths ?? []).map((s) => {
                            const name = typeof s === 'string' ? s : s.skill ?? s.name ?? s;
                            return <Badge key={name} className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">{name}</Badge>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  {(gapResult.recommendations ?? gapResult.learningPath ?? []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</p>
                      {(gapResult.recommendations ?? gapResult.learningPath ?? []).map((r, i) => {
                        const text = typeof r === 'string' ? r : r.step ?? r.action ?? JSON.stringify(r);
                        return (
                          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="font-mono text-primary/60 shrink-0 mt-0.5">{i + 1}.</span>
                            <span className="leading-relaxed">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
