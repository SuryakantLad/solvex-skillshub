'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Users, TrendingUp, Award, Layers, Building2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const PROFICIENCY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_COLORS = {
  beginner: 'bg-slate-400',
  intermediate: 'bg-blue-500',
  advanced: 'bg-violet-500',
  expert: 'bg-amber-500',
};
const PROFICIENCY_TEXT = {
  beginner: 'text-slate-500',
  intermediate: 'text-blue-600',
  advanced: 'text-violet-600',
  expert: 'text-amber-600',
};

const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#0ea5e9', '#84cc16', '#a78bfa', '#fb923c',
];

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium">{label}</span>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function HorizontalBar({ label, value, max, color, sub }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate flex-1 mr-2">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
          <span className="font-semibold tabular-nums">{value}</span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function ProficiencyPill({ level }) {
  return (
    <span className={cn(
      'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded',
      PROFICIENCY_TEXT[level],
      'bg-current/10'
    )}>
      {level}
    </span>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('skills');

  function load() {
    setLoading(true);
    setError('');
    fetch('/api/analytics/skill-gap')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const proficiencyMap = useMemo(() => {
    if (!data?.proficiencyDistribution) return {};
    return data.proficiencyDistribution.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
  }, [data?.proficiencyDistribution]);

  const totalProficiency = useMemo(
    () => Object.values(proficiencyMap).reduce((s, v) => s + v, 0),
    [proficiencyMap]
  );

  const tabs = [
    { id: 'skills', label: 'Top Skills' },
    { id: 'categories', label: 'Categories' },
    { id: 'departments', label: 'Departments' },
    { id: 'seniority', label: 'Seniority' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Gap Analytics"
        description="Org-wide talent intelligence — skill coverage, depth, and distribution."
        action={
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      {/* Summary KPIs */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Employees" value={data.summary.totalEmployees} />
          <StatCard icon={Layers} label="Avg Skills / Person" value={data.summary.avgSkillsPerEmployee} />
          <StatCard icon={TrendingUp} label="Avg Experience" value={`${data.summary.avgYearsExperience}y`} />
          <StatCard
            icon={Award}
            label="Available Now"
            value={data.summary.availableCount}
            sub={`${Math.round((data.summary.availableCount / Math.max(1, data.summary.totalEmployees)) * 100)}% of workforce`}
          />
        </div>
      )}

      {/* Proficiency overview */}
      {totalProficiency > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proficiency Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-4 rounded-full overflow-hidden gap-px mb-3">
              {PROFICIENCY_ORDER.map((level) => {
                const pct = ((proficiencyMap[level] ?? 0) / totalProficiency) * 100;
                return pct > 0 ? (
                  <div
                    key={level}
                    className={cn(PROFICIENCY_COLORS[level])}
                    style={{ width: `${pct}%` }}
                    title={`${level}: ${pct.toFixed(1)}%`}
                  />
                ) : null;
              })}
            </div>
            <div className="flex flex-wrap gap-4">
              {PROFICIENCY_ORDER.map((level) => {
                const count = proficiencyMap[level] ?? 0;
                const pct = totalProficiency > 0 ? ((count / totalProficiency) * 100).toFixed(1) : '0.0';
                return (
                  <div key={level} className="flex items-center gap-2 text-sm">
                    <span className={cn('w-2.5 h-2.5 rounded-sm', PROFICIENCY_COLORS[level])} />
                    <span className="capitalize font-medium">{level}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={`skel-an-${i}`} className="h-8 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && data && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Top Skills */}
          {activeTab === 'skills' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Top 40 Skills by Frequency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.skillFrequency.map((skill, idx) => (
                  <div key={skill.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}</span>
                        <span className="font-medium truncate">{skill.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">{skill.category}</Badge>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-muted-foreground">{skill.avgYears}y avg</span>
                        <span className="font-semibold tabular-nums">{skill.count}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(skill.count / data.skillFrequency[0].count) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.02 }}
                      />
                    </div>
                    <div className="flex gap-2 mt-1">
                      {skill.expertCount > 0 && (
                        <span className="text-[10px] text-amber-600 font-medium">{skill.expertCount} expert</span>
                      )}
                      {skill.advancedCount > 0 && (
                        <span className="text-[10px] text-violet-600 font-medium">{skill.advancedCount} advanced</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.categoryBreakdown.map((cat, idx) => (
                <Card key={cat.category}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{cat.category || 'Uncategorized'}</h3>
                        <p className="text-xs text-muted-foreground">{cat.uniqueSkillCount} unique skills</p>
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] + '20' }}
                      >
                        <Layers className="w-4 h-4" style={{ color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-2xl font-bold">{cat.employeeCount}</span>
                        <span className="text-xs text-muted-foreground ml-1">employees</span>
                      </div>
                      <div>
                        <span className="text-2xl font-bold">{cat.totalSkillInstances}</span>
                        <span className="text-xs text-muted-foreground ml-1">skill instances</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Departments */}
          {activeTab === 'departments' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.departmentSkills.map((dept) => (
                <Card key={dept.department}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5" />
                      {dept.department}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {dept.topSkills.map((s, si) => (
                      <HorizontalBar
                        key={s.name}
                        label={s.name}
                        value={s.count}
                        max={dept.topSkills[0]?.count || 1}
                        color={CATEGORY_COLORS[si % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Seniority */}
          {activeTab === 'seniority' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Seniority Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.seniorityStats
                  .sort((a, b) => b.count - a.count)
                  .map((band, idx) => (
                    <div key={band.band} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{band.band}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">avg {band.avgSkills} skills</span>
                          <span className="font-bold">{band.count}</span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[idx] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(band.count / Math.max(...data.seniorityStats.map((b) => b.count))) * 100}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
