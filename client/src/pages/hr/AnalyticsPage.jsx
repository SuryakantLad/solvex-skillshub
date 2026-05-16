import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Loader2, Sparkles } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getAnalytics, getSkillGap } from '@/services/analyticsService';
import { getProficiencyColor } from '@/lib/utils';

const PROFICIENCY_COLORS = {
  expert: 'bg-emerald-500',
  advanced: 'bg-violet-500',
  intermediate: 'bg-blue-500',
  beginner: 'bg-slate-400',
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gapRole, setGapRole] = useState('');
  const [gapResult, setGapResult] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);

  useEffect(() => {
    getAnalytics().then(setData).catch(() => toast.error('Failed to load analytics')).finally(() => setLoading(false));
  }, []);

  async function handleSkillGap() {
    if (!gapRole.trim()) return;
    setGapLoading(true);
    try {
      const result = await getSkillGap(gapRole);
      setGapResult(result);
    } catch {
      toast.error('Skill gap analysis failed');
    } finally {
      setGapLoading(false);
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    </div>
  );

  const { stats = {}, topSkills = [], skillsByCategory = {}, proficiencyDistribution = {}, departments = [], seniorityDistribution = {} } = data ?? {};

  return (
    <div className="space-y-8">
      <PageHeader title="Talent Analytics" description="Org-wide talent intelligence and skill insights." />

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Skills ({topSkills.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {topSkills.slice(0, 10).map((skill, i) => (
              <div key={skill.name} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground/60 w-5 text-right shrink-0">{i + 1}</span>
                <span className="text-xs font-medium flex-1 truncate">{skill.name}</span>
                <div className="w-24 shrink-0">
                  <Progress value={topSkills[0]?.count ? (skill.count / topSkills[0].count) * 100 : 0} className="h-1.5" />
                </div>
                <Badge variant="secondary" className="text-[10px] tabular-nums shrink-0">{skill.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Seniority distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Seniority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(seniorityDistribution).length === 0
              ? <p className="text-sm text-muted-foreground">No data yet</p>
              : Object.entries(seniorityDistribution).sort((a, b) => b[1] - a[1]).map(([level, count]) => {
                const total = Object.values(seniorityDistribution).reduce((s, v) => s + v, 0);
                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-24 capitalize truncate shrink-0">{level}</span>
                    <div className="flex-1">
                      <Progress value={total ? (count / total) * 100 : 0} className="h-2" />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{count}</span>
                  </div>
                );
              })
            }
          </CardContent>
        </Card>

        {/* Skills by category */}
        {Object.keys(skillsByCategory).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Skills by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(skillsByCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-medium flex-1 truncate capitalize">{cat}</span>
                    <Badge variant="outline" className="text-[10px] tabular-nums">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Departments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length === 0
              ? <p className="text-sm text-muted-foreground">No departments yet</p>
              : <div className="flex flex-wrap gap-2">
                {departments.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
              </div>
            }
          </CardContent>
        </Card>
      </div>

      {/* Skill gap analysis */}
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
              placeholder="Enter a role (e.g. Senior React Developer, ML Engineer)..."
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

          {gapResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm leading-relaxed">{gapResult.summary}</p>
              </div>
              {gapResult.missingSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gapResult.missingSkills.map((s) => <Badge key={s} variant="warning">{s}</Badge>)}
                  </div>
                </div>
              )}
              {gapResult.strongSkills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Strong Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gapResult.strongSkills.map((s) => <Badge key={s} variant="success">{s}</Badge>)}
                  </div>
                </div>
              )}
              {gapResult.recommendations?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommendations</p>
                  {gapResult.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-primary/60 shrink-0 mt-0.5">{i + 1}.</span>
                      <span className="leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
