'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, ArrowRight, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lightbulb, CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  getInitials, getAvatarUrl, getProficiencyColor,
  getMatchScoreColor, getMatchScoreBg, cn,
} from '@/lib/utils';

const LEVEL_STYLE = {
  Excellent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
  Strong:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
  Good:      'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-800/40',
  Fair:      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
  Weak:      'bg-muted text-muted-foreground border-border',
};

export default function SearchResultCard({ result, rank }) {
  const { employee, matchScore, matchLevel, keyStrengths = [], gaps = [], reasoning, recommendedFor } = result;
  const [expanded, setExpanded] = useState(false);

  const topSkills = (employee?.skills ?? []).filter((s) => !s.inferred).slice(0, 5);
  const isAvailable = employee?.availability?.isAvailable;

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
      <Card className="group transition-all duration-200 hover:shadow-card-premium-hover hover:border-primary/20 flex flex-col h-full">
        <CardContent className="p-5 flex flex-col gap-3.5 flex-1">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar className="w-11 h-11 ring-2 ring-border group-hover:ring-primary/20 transition-all">
                <AvatarImage src={getAvatarUrl(employee.name)} alt={employee.name} />
                <AvatarFallback className="bg-primary/8 text-primary font-semibold text-xs">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              {rank <= 3 && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center shadow-md border-2 border-card">
                  {rank}
                </span>
              )}
              {isAvailable && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" title="Available" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{employee.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{employee.title || 'No title set'}</p>
              {employee.department && (
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{employee.department}</p>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className={`text-2xl font-black tabular-nums leading-none ${getMatchScoreColor(matchScore)}`}>
                {matchScore}<span className="text-xs font-semibold">%</span>
              </div>
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-semibold border',
                LEVEL_STYLE[matchLevel] ?? LEVEL_STYLE.Fair
              )}>
                {matchLevel}
              </span>
            </div>
          </div>

          {/* ── Match bar ───────────────────────────────────────────────── */}
          <Progress value={matchScore} className="h-1" indicatorClassName={getMatchScoreBg(matchScore)} />

          {/* ── Meta ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {employee.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{employee.location}</span>
              </div>
            )}
            {(employee.totalYearsExperience ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                <span>{employee.totalYearsExperience}y exp</span>
              </div>
            )}
            {isAvailable && <Badge variant="success" className="text-[10px] h-4 px-1.5">Available</Badge>}
          </div>

          {/* ── Skills ──────────────────────────────────────────────────── */}
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
              {(employee.skills?.length ?? 0) > 5 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  +{employee.skills.length - 5}
                </span>
              )}
            </div>
          )}

          {/* ── AI Reasoning ────────────────────────────────────────────── */}
          {reasoning && (
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Lightbulb className="w-3 h-3" />
                AI Analysis
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
            </div>
          )}

          {/* ── Expandable ──────────────────────────────────────────────── */}
          {(keyStrengths.length > 0 || gaps.length > 0 || recommendedFor) && (
            <div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {expanded ? 'Hide details' : 'View strengths & gaps'}
              </button>

              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-3"
                >
                  {keyStrengths.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Key Strengths</p>
                      <div className="space-y-1">
                        {keyStrengths.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-500" />
                            <span className="leading-relaxed">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {gaps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Gaps</p>
                      <div className="space-y-1">
                        {gaps.map((g, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                            <XCircle className="w-3 h-3 mt-0.5 shrink-0 text-amber-500" />
                            <span className="leading-relaxed">{g}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendedFor && (
                    <div className="p-2.5 rounded-lg bg-secondary/60 border border-border">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Best Suited For</p>
                      <p className="text-xs text-foreground">{recommendedFor}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <div className="mt-auto pt-3 border-t border-border">
            <Link
              href={`/hr/directory/${employee._id}`}
              className="flex items-center justify-between text-xs font-medium text-primary group-hover:gap-2 transition-all gap-1"
            >
              View full profile
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
