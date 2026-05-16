'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, User, Briefcase, Award, Folder, GraduationCap,
  CheckCircle2, Sparkles, Star, TrendingUp, Save, Loader2,
  ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import SkillsEditor from './SkillsEditor';
import { formatDate, getProficiencyColor, cn } from '@/lib/utils';

// ─── Config ───────────────────────────────────────────────────────────────────

const SENIORITY = {
  junior:     { label: 'Junior',     cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  'mid-level':{ label: 'Mid-Level',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  senior:     { label: 'Senior',     cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  lead:       { label: 'Lead',       cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  principal:  { label: 'Principal',  cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  executive:  { label: 'Executive',  cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

const PROFICIENCY_PCT = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };

// ─── Main component ───────────────────────────────────────────────────────────

export default function ParsedResumeReview({ data: initial, metadata, onSave, saving, saved }) {
  const [data, setData] = useState(initial);

  const set = (field, value) => setData((d) => ({ ...d, [field]: value }));

  const seniority = SENIORITY[data.seniority] ?? SENIORITY['mid-level'];

  const skillsByCategory = (data.skills ?? []).reduce((acc, s) => {
    const cat = s.category || 'Other';
    (acc[cat] = acc[cat] ?? []).push(s);
    return acc;
  }, {});

  const tabCounts = {
    skills: data.skills?.length ?? 0,
    experience: data.experience?.length ?? 0,
    projects: data.projects?.length ?? 0,
    certs: (data.certifications?.length ?? 0) + (data.education?.length ?? 0),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* ── Result header ──────────────────────────────────────────────────── */}
      <Card className="border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base">{data.name || 'Candidate'}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${seniority.cls}`}>
                  {seniority.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{data.title}</p>

              {data.domainExpertise?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {data.domainExpertise.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded-md text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {metadata && (
              <div className="text-right shrink-0 space-y-0.5">
                {metadata.pages > 0 && <p className="text-xs text-muted-foreground">{metadata.pages}p PDF</p>}
                {metadata.wordCount > 0 && <p className="text-xs text-muted-foreground">{metadata.wordCount} words</p>}
                {metadata.parseTimeMs > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {(metadata.parseTimeMs / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-emerald-200/60 dark:border-emerald-800/40">
            {[
              { label: 'Skills', value: tabCounts.skills },
              { label: 'Yrs Exp', value: data.totalYearsExperience ?? 0 },
              { label: 'Jobs', value: tabCounts.experience },
              { label: 'Certs', value: data.certifications?.length ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="text-xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── AI Insights ────────────────────────────────────────────────────── */}
      {data.aiInsights && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {data.aiInsights.uniqueValue && (
              <p className="text-sm text-muted-foreground leading-relaxed italic border-l-2 border-amber-300 dark:border-amber-700 pl-3">
                &ldquo;{data.aiInsights.uniqueValue}&rdquo;
              </p>
            )}
            {data.aiInsights.strengths?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.aiInsights.strengths.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40"
                  >
                    <Star className="w-3 h-3" />
                    {s}
                  </div>
                ))}
              </div>
            )}
            {data.aiInsights.careerTrajectory && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Career trajectory:
                <span className="font-medium text-foreground">{data.aiInsights.careerTrajectory}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Extracted data tabs ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-0 pt-5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-primary" />
            Extracted Data
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              Review &amp; edit before saving
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5 h-auto mb-5">
              {[
                { value: 'overview', icon: User, label: 'Overview' },
                { value: 'skills', icon: Brain, label: `Skills (${tabCounts.skills})` },
                { value: 'experience', icon: Briefcase, label: `Jobs (${tabCounts.experience})` },
                { value: 'projects', icon: Folder, label: `Projects (${tabCounts.projects})` },
                { value: 'certs', icon: Award, label: `Certs (${tabCounts.certs})` },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-xs py-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline truncate">{label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Full Name', field: 'name', type: 'text' },
                  { label: 'Job Title', field: 'title', type: 'text' },
                  { label: 'Email', field: 'email', type: 'email' },
                  { label: 'Phone', field: 'phone', type: 'tel' },
                  { label: 'Location', field: 'location', type: 'text' },
                  { label: 'Years of Experience', field: 'totalYearsExperience', type: 'number' },
                ].map(({ label, field, type }) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type={type}
                      value={data[field] ?? ''}
                      min={type === 'number' ? 0 : undefined}
                      max={type === 'number' ? 60 : undefined}
                      onChange={(e) => set(field, type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Professional Summary</Label>
                <Textarea
                  value={data.summary ?? ''}
                  onChange={(e) => set('summary', e.target.value)}
                  rows={4}
                  className="resize-none text-sm"
                />
              </div>
            </TabsContent>

            {/* Skills */}
            <TabsContent value="skills" className="mt-0 space-y-5">
              {Object.keys(skillsByCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No skills extracted</p>
              ) : (
                Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category}
                      </span>
                      <span className="text-xs text-muted-foreground">({skills.length})</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="space-y-2.5">
                      {skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm font-medium w-36 truncate shrink-0">{skill.name}</span>
                          <Progress
                            value={PROFICIENCY_PCT[skill.proficiency] ?? 50}
                            className="flex-1 h-1.5"
                          />
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                          {skill.yearsOfExperience > 0 && (
                            <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                              {skill.yearsOfExperience}y
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground font-medium mb-3">Add or remove skills</p>
                <SkillsEditor
                  skills={data.skills ?? []}
                  onChange={(skills) => set('skills', skills)}
                />
              </div>
            </TabsContent>

            {/* Experience */}
            <TabsContent value="experience" className="mt-0">
              {(data.experience ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No experience extracted</p>
              ) : (
                <div className="space-y-0">
                  {(data.experience ?? []).map((exp, i) => (
                    <ExperienceCard
                      key={i}
                      exp={exp}
                      isLast={i === (data.experience?.length ?? 0) - 1}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Projects */}
            <TabsContent value="projects" className="mt-0">
              {(data.projects ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No projects extracted</p>
              ) : (
                <div className="space-y-3">
                  {(data.projects ?? []).map((p, i) => (
                    <ProjectCard key={i} project={p} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Certs + Education */}
            <TabsContent value="certs" className="mt-0 space-y-3">
              {(data.certifications ?? []).length === 0 && (data.education ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No certifications or education extracted</p>
              ) : (
                <>
                  {(data.certifications ?? []).map((cert, i) => (
                    <CertCard key={i} cert={cert} />
                  ))}
                  {(data.education ?? []).length > 0 && (
                    <div className={cn((data.certifications ?? []).length > 0 && 'pt-4 border-t border-border')}>
                      {(data.certifications ?? []).length > 0 && (
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                          Education
                        </p>
                      )}
                      <div className="space-y-3">
                        {(data.education ?? []).map((edu, i) => (
                          <EducationCard key={i} edu={edu} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save button */}
      <Button
        onClick={() => onSave(data)}
        disabled={saving || saved}
        size="lg"
        className="w-full gap-2"
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Saving to profile...</>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" />Profile Updated!</>
        ) : (
          <><Save className="w-4 h-4" />Save to My Profile</>
        )}
      </Button>
    </motion.div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

function ExperienceCard({ exp, isLast }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex gap-3 pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center pt-1">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-sm font-bold text-muted-foreground border border-border">
          {exp.company?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-0 min-h-[24px]" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-5', isLast && 'pb-2')}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-semibold text-sm leading-tight">{exp.role}</p>
            <p className="text-xs text-muted-foreground">
              {exp.company}
              {exp.location ? ` · ${exp.location}` : ''}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
            </p>
            {exp.current && (
              <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                Current
              </span>
            )}
          </div>
        </div>

        {exp.description && (
          <div>
            <p className={cn('text-xs text-muted-foreground leading-relaxed', !expanded && 'line-clamp-2')}>
              {exp.description}
            </p>
            {exp.description.length > 120 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-primary hover:underline mt-0.5 flex items-center gap-0.5"
              >
                {expanded ? <><ChevronUp className="w-3 h-3" />Less</> : <><ChevronDown className="w-3 h-3" />More</>}
              </button>
            )}
          </div>
        )}

        {exp.technologies?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {exp.technologies.slice(0, 7).map((t) => (
              <Badge key={t} variant="secondary" className="text-xs h-5 px-1.5">{t}</Badge>
            ))}
            {exp.technologies.length > 7 && (
              <span className="text-xs text-muted-foreground self-center">
                +{exp.technologies.length - 7} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2.5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm">{project.name}</p>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      {project.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
      )}
      {project.technologies?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {project.technologies.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs h-5 px-1.5">{t}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function CertCard({ cert }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-secondary/20 hover:border-amber-300/50 dark:hover:border-amber-700/50 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
        <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{cert.name}</p>
        <p className="text-xs text-muted-foreground">
          {cert.issuer}
          {cert.issueDate ? ` · ${formatDate(cert.issueDate)}` : ''}
        </p>
        {cert.credentialId && (
          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
            ID: {cert.credentialId}
          </p>
        )}
      </div>
      {cert.expiryDate && (
        <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
          Exp: {formatDate(cert.expiryDate)}
        </p>
      )}
    </div>
  );
}

function EducationCard({ edu }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-secondary/20">
      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
        <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{edu.institution}</p>
        <p className="text-xs text-muted-foreground">
          {edu.degree}
          {edu.field ? ` in ${edu.field}` : ''}
        </p>
        {(edu.startYear || edu.endYear) && (
          <p className="text-xs text-muted-foreground">
            {edu.startYear} – {edu.endYear ?? 'Present'}
          </p>
        )}
      </div>
      {edu.grade && (
        <span className="text-xs font-semibold text-foreground shrink-0 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md">
          {edu.grade}
        </span>
      )}
    </div>
  );
}
