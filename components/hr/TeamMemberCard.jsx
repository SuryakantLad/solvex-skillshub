'use client';

import Link from 'next/link';
import { MapPin, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getInitials, getAvatarUrl, getProficiencyColor, cn } from '@/lib/utils';

function fitScoreColor(score) {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-violet-600 dark:text-violet-400';
  return 'text-amber-600 dark:text-amber-400';
}

function fitScoreBg(score) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 50) return 'bg-violet-500';
  return 'bg-amber-500';
}

export default function TeamMemberCard({ member, position }) {
  const { employee, role, contribution, fitScore, criticalFor = [] } = member;
  const isAvailable = employee?.availability?.isAvailable;
  const topSkills = (employee?.skills ?? []).filter((s) => !s.inferred).slice(0, 4);

  return (
    <Card className="group hover:shadow-md hover:border-primary/30 transition-all duration-200 flex flex-col h-full">
      <CardContent className="p-5 flex flex-col gap-4 flex-1">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <Avatar className="w-11 h-11">
              <AvatarImage src={getAvatarUrl(employee?.name)} alt={employee?.name} />
              <AvatarFallback>{getInitials(employee?.name ?? '')}</AvatarFallback>
            </Avatar>
            {/* Position number badge */}
            <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow">
              {position}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{employee?.name}</h3>
              {isAvailable && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Available" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{employee?.title || 'No title set'}</p>
            {employee?.department && (
              <p className="text-xs text-muted-foreground/70">{employee.department}</p>
            )}
          </div>

          {/* Fit score */}
          <div className="text-right shrink-0">
            <div className={`text-2xl font-black tabular-nums ${fitScoreColor(fitScore)}`}>
              {fitScore}<span className="text-xs font-semibold">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">fit</p>
          </div>
        </div>

        {/* ── Fit bar ───────────────────────────────────────────────────────── */}
        <Progress value={fitScore} className="h-1.5" indicatorClassName={fitScoreBg(fitScore)} />

        {/* ── Role badge ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs font-medium">
            {role}
          </Badge>
          {!isAvailable && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:text-amber-400">
              Unavailable
            </Badge>
          )}
          {isAvailable && (
            <Badge variant="success" className="text-[10px] h-4 px-1.5">Available</Badge>
          )}
        </div>

        {/* ── Meta ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {employee?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[90px]">{employee.location}</span>
            </div>
          )}
          {(employee?.totalYearsExperience ?? 0) > 0 && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span>{employee.totalYearsExperience}y exp</span>
            </div>
          )}
        </div>

        {/* ── Skills ────────────────────────────────────────────────────────── */}
        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {topSkills.map((skill) => (
              <span
                key={skill.name}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}
              >
                {skill.name}
              </span>
            ))}
            {(employee?.skills?.length ?? 0) > 4 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                +{employee.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* ── Contribution ──────────────────────────────────────────────────── */}
        {contribution && (
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground leading-relaxed">{contribution}</p>
          </div>
        )}

        {/* ── Critical skills ───────────────────────────────────────────────── */}
        {criticalFor.length > 0 && (
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Critical coverage
              </p>
              <div className="flex flex-wrap gap-1">
                {criticalFor.map((skill) => (
                  <span
                    key={skill}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div className="mt-auto pt-2 border-t border-border">
          <Link
            href={`/hr/directory/${employee?._id}`}
            className="flex items-center justify-between text-xs font-medium text-primary hover:gap-2 transition-all gap-1"
          >
            View full profile
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </CardContent>
    </Card>
  );
}
