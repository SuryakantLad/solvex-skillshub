'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Wrench, Brain, Users, AlertTriangle, CheckCircle,
  Loader2, Sparkles, ChevronDown, ChevronUp,
  ShieldAlert, TrendingUp, UserPlus, BarChart3,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import TeamMemberCard from '@/components/hr/TeamMemberCard';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import Link from 'next/link';

const EXAMPLES = [
  'Build a fintech mobile app with real-time payments, fraud detection, and a React dashboard',
  'Migrate a monolithic Java application to microservices on AWS with Kubernetes orchestration',
  'Create an ML pipeline for customer churn prediction with a React admin dashboard',
  'Deploy a real-time data streaming platform with Kafka, Spark, and analytics dashboards',
];

// ─── Loading animation ────────────────────────────────────────────────────────

const LOADING_STEPS = [
  'Scanning your entire talent pool...',
  'Analyzing skill coverage requirements...',
  'Evaluating seniority balance...',
  'Identifying single points of failure...',
  'Composing optimal team configuration...',
];

function AIBuildingState() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % LOADING_STEPS.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 relative">
        <Brain className="w-10 h-10 text-primary animate-pulse" />
        <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-30" />
      </div>
      <p className="font-bold text-lg mb-1">Building your optimal team...</p>
      <AnimatePresence mode="wait">
        <motion.p
          key={stepIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-sm text-muted-foreground"
        >
          {LOADING_STEPS[stepIdx]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ─── Skill coverage row ───────────────────────────────────────────────────────

function SkillCoverageRow({ coverage }) {
  const levelConfig = {
    strong:  { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', bar: 100 },
    partial: { bg: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',  bar: 50 },
    missing: { bg: 'bg-rose-100   text-rose-700   dark:bg-rose-900/40   dark:text-rose-300',   bar: 0 },
  };
  const cfg = levelConfig[coverage.level] ?? levelConfig.missing;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{coverage.skill}</p>
        {coverage.coveredBy?.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {coverage.coveredBy.length} member{coverage.coveredBy.length > 1 ? 's' : ''} cover this
          </p>
        )}
      </div>
      <div className="w-24 flex-shrink-0">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              coverage.level === 'strong' ? 'bg-emerald-500' :
              coverage.level === 'partial' ? 'bg-amber-500' : 'bg-rose-400'
            }`}
            style={{ width: `${cfg.bar}%` }}
          />
        </div>
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize whitespace-nowrap ${cfg.bg}`}>
        {coverage.level}
      </span>
    </div>
  );
}

// ─── Alternative candidate row ────────────────────────────────────────────────

function AlternativeRow({ alt, teamMembers }) {
  const { employee, alternativeFor, reason } = alt;
  const originalMember = teamMembers.find((m) => m.id === alternativeFor);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarImage src={getAvatarUrl(employee?.name)} alt={employee?.name} />
        <AvatarFallback className="text-xs">{getInitials(employee?.name ?? '')}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{employee?.name}</p>
          <span className="text-[10px] text-muted-foreground">→ replaces {originalMember?.employee?.name ?? 'team member'}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{reason}</p>
      </div>
      <Link href={`/hr/directory/${employee?._id}`} className="text-xs text-primary hover:underline shrink-0">
        View
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamBuilderPage() {
  const [requirement, setRequirement] = useState('');
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const handleBuild = async () => {
    if (requirement.trim().length < 10) {
      toast.error('Please describe your project in more detail');
      return;
    }

    setLoading(true);
    setTeam(null);
    setShowAlternatives(false);

    try {
      const res = await fetch('/api/team-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Failed to build team');
        return;
      }

      setTeam(json.team);
      toast.success(`Team assembled: ${json.team.teamName}`);
    } catch {
      toast.error('Failed to build team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const coverageStats = useMemo(() => team?.skillCoverage
    ? {
        strong:  team.skillCoverage.filter((s) => s.level === 'strong').length,
        partial: team.skillCoverage.filter((s) => s.level === 'partial').length,
        missing: team.skillCoverage.filter((s) => s.level === 'missing').length,
      }
    : null,
  [team?.skillCoverage]);

  const sortedCoverage = useMemo(() => {
    if (!team?.skillCoverage) return [];
    const order = { missing: 0, partial: 1, strong: 2 };
    return [...team.skillCoverage].sort((a, b) => (order[a.level] ?? 1) - (order[b.level] ?? 1));
  }, [team?.skillCoverage]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Team Builder"
        description="Describe your project and AI will assemble the optimal team from your entire talent pool."
      />

      {/* ── Input card ──────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-primary" />
            Project Requirement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Describe what you need to build</Label>
            <Textarea
              placeholder="e.g. We need a team to build a real-time data processing pipeline with ML capabilities, a modern React dashboard, and AWS deployment..."
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setRequirement(ex)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors text-left"
                >
                  {ex.length > 65 ? ex.slice(0, 62) + '…' : ex}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleBuild}
            disabled={loading || requirement.trim().length < 10}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Building optimal team...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Build Team with AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && <AIBuildingState />}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {team && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* ── Team header ───────────────────────────────────────────────── */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-5">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">{team.teamName}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>{team.teamSize} members</span>
                      {team.teamScore != null && (
                        <>
                          <span className="text-border">·</span>
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>{team.teamScore}% overall fit</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="default" className="shrink-0">AI Recommended</Badge>
                </div>

                {/* Team score bar */}
                {team.teamScore != null && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Team fitness score</span>
                      <span className="font-semibold">{team.teamScore}%</span>
                    </div>
                    <Progress
                      value={team.teamScore}
                      className="h-2"
                      indicatorClassName={
                        team.teamScore >= 80 ? 'bg-emerald-500' :
                        team.teamScore >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                      }
                    />
                  </div>
                )}

                {/* Recommendation */}
                <p className="text-sm text-muted-foreground leading-relaxed">{team.recommendation}</p>

                {/* Seniority balance */}
                {team.seniorityBalance && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold mb-0.5">Seniority Balance</p>
                      <p className="text-xs text-muted-foreground">{team.seniorityBalance.description}</p>
                    </div>
                    {team.seniorityBalance.score != null && (
                      <span className={`ml-auto text-sm font-bold shrink-0 ${
                        team.seniorityBalance.score >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                        team.seniorityBalance.score >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'
                      }`}>
                        {team.seniorityBalance.score}%
                      </span>
                    )}
                  </div>
                )}

                {/* Strengths / Risks grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {team.teamStrengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Team Strengths
                      </p>
                      <div className="space-y-1.5">
                        {team.teamStrengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {team.potentialRisks?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Risks to Watch
                      </p>
                      <div className="space-y-1.5">
                        {team.potentialRisks.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Missing skills */}
                {team.missingSkills?.length > 0 && (
                  <div className="pt-4 border-t border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Missing Skills (consider hiring)
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {team.missingSkills.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs border-rose-300 text-rose-600 dark:text-rose-400">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Skill coverage matrix ──────────────────────────────────────── */}
            {team.skillCoverage?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Skill Coverage Matrix
                    </CardTitle>
                    {coverageStats && (
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {coverageStats.strong} strong
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          {coverageStats.partial} partial
                        </span>
                        {coverageStats.missing > 0 && (
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            {coverageStats.missing} missing
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="divide-y divide-border">
                    {sortedCoverage.map((coverage, i) => (
                      <SkillCoverageRow key={coverage.skill ?? i} coverage={coverage} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Team members grid ──────────────────────────────────────────── */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Team Members
                <span className="text-sm font-normal text-muted-foreground">({team.members.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {team.members.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <TeamMemberCard member={member} position={i + 1} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── Alternative candidates ─────────────────────────────────────── */}
            {team.alternativeCandidates?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <button
                    onClick={() => setShowAlternatives((v) => !v)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <CardTitle className="text-base flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-primary" />
                      Alternative Candidates
                      <Badge variant="secondary" className="text-xs">
                        {team.alternativeCandidates.length}
                      </Badge>
                    </CardTitle>
                    {showAlternatives
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                </CardHeader>

                {showAlternatives && (
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">
                      These candidates could substitute specific team members if needed.
                    </p>
                    <div className="divide-y divide-border">
                      {team.alternativeCandidates.map((alt, i) => (
                        <AlternativeRow key={i} alt={alt} teamMembers={team.members} />
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state ───────────────────────────────────────────────────────── */}
      {!team && !loading && (
        <EmptyState
          icon={Wrench}
          title="No team built yet"
          description="Describe your project requirements above and let AI assemble the perfect team from your talent pool."
        />
      )}
    </div>
  );
}
