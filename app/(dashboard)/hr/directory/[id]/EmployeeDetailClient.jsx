'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, Award, BookOpen, ArrowLeft,
  Github, Linkedin, CheckCircle, Clock, Sparkles,
  TrendingUp, Tag, CheckCircle2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  getProficiencyColor, getProficiencyLevel, getInitials,
  getAvatarUrl, formatDate, calculateExperience,
} from '@/lib/utils';

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function EmployeeDetailClient({ employee }) {
  const skillsByCategory = (employee.skills ?? []).reduce((acc, skill) => {
    const cat = skill.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  const isAvailable = employee.availability?.isAvailable;

  return (
    <div className="max-w-4xl space-y-6">

      {/* ── Back link ────────────────────────────────────────────────────── */}
      <Link
        href="/hr/directory"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to directory
      </Link>

      {/* ── Hero header ──────────────────────────────────────────────────── */}
      <motion.div variants={item} initial="hidden" animate="show">
        <Card className="overflow-hidden">
          {/* Gradient banner */}
          <div
            className="h-24 relative"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(262 80% 70%/0.06), hsl(220 80% 60%/0.08))',
            }}
          >
            <div className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <CardContent className="pt-0 pb-6 px-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              {/* Avatar with ring */}
              <div className="-mt-10 shrink-0">
                <Avatar className="w-20 h-20 ring-4 ring-background shadow-lg">
                  <AvatarImage src={getAvatarUrl(employee.name)} alt={employee.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1 min-w-0 space-y-3 pt-2">
                {/* Name + badges */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">{employee.name}</h1>
                    <p className="text-muted-foreground">{employee.title || 'No title set'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isAvailable && (
                      <Badge variant="success" className="shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Open to roles
                      </Badge>
                    )}
                    {employee.department && (
                      <Badge variant="secondary">{employee.department}</Badge>
                    )}
                    {employee.seniority && (
                      <Badge variant="outline" className="capitalize">{employee.seniority}</Badge>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {employee.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {employee.location}
                    </div>
                  )}
                  {(employee.totalYearsExperience ?? 0) > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      {employee.totalYearsExperience} years experience
                    </div>
                  )}
                </div>

                {/* Summary */}
                {employee.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{employee.summary}</p>
                )}

                {/* Domain expertise */}
                {employee.domainExpertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {employee.domainExpertise.map((d) => (
                      <Badge key={d} variant="outline" className="text-xs">
                        <Tag className="w-2.5 h-2.5 mr-1" />{d}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Links + profile completeness */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-2">
                    {employee.linkedIn && (
                      <a href={employee.linkedIn} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <Linkedin className="w-3 h-3" />LinkedIn
                        </Button>
                      </a>
                    )}
                    {employee.github && (
                      <a href={employee.github} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <Github className="w-3 h-3" />GitHub
                        </Button>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Profile {employee.profileCompleteness}%</span>
                    <div className="w-24">
                      <Progress
                        value={employee.profileCompleteness}
                        className="h-1.5"
                        indicatorClassName={
                          employee.profileCompleteness >= 80 ? 'bg-emerald-500' :
                          employee.profileCompleteness >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── AI Insights ──────────────────────────────────────────────────── */}
      {employee.aiInsights && (
        <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Career Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                {employee.aiInsights.uniqueValue && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unique Value</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{employee.aiInsights.uniqueValue}</p>
                  </div>
                )}
                {employee.aiInsights.careerTrajectory && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Career Trajectory</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <Badge variant="secondary" className="capitalize">{employee.aiInsights.careerTrajectory}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Skills ───────────────────────────────────────────────────── */}
        <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Skills <span className="font-normal text-muted-foreground">({employee.skills?.length ?? 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.keys(skillsByCategory).length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              ) : (
                Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{category}</p>
                    <div className="space-y-2.5">
                      {skills.map((skill) => (
                        <div key={skill.name} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28 sm:w-36 shrink-0">
                            <span className="text-sm truncate">{skill.name}</span>
                            {skill.inferred && (
                              <span className="text-[9px] text-muted-foreground/50 shrink-0">AI</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <Progress
                              value={getProficiencyLevel(skill.proficiency)}
                              className="h-1.5"
                              indicatorClassName={
                                skill.proficiency === 'expert' ? 'bg-violet-500' :
                                skill.proficiency === 'advanced' ? 'bg-blue-500' :
                                skill.proficiency === 'intermediate' ? 'bg-emerald-500' : 'bg-amber-400'
                              }
                            />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0 ${getProficiencyColor(skill.proficiency)}`}>
                            {skill.proficiency}
                          </span>
                          {skill.yearsOfExperience > 0 && (
                            <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">{skill.yearsOfExperience}y</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Right column: Certs + Education ──────────────────────────── */}
        <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.15 }} className="space-y-5">
          {/* Certifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {(employee.certifications ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No certifications</p>
              ) : (
                employee.certifications.map((cert, i) => (
                  <div key={i} className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
                    <p className="font-medium text-sm leading-tight">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    {cert.issueDate && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDate(cert.issueDate)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Education */}
          {(employee.education ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.education.map((edu, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="font-medium text-sm">{edu.institution}</p>
                    <p className="text-xs text-muted-foreground">
                      {edu.degree}{edu.field ? ` · ${edu.field}` : ''}
                    </p>
                    {(edu.startYear || edu.endYear) && (
                      <p className="text-[10px] text-muted-foreground/70">
                        {edu.startYear} — {edu.endYear || 'Present'}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* ── Experience timeline ───────────────────────────────────────────── */}
      {(employee.experience ?? []).length > 0 && (
        <motion.div variants={item} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {employee.experience.map((exp, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-border pb-6 last:pb-0">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-primary bg-background" />
                    {exp.current && (
                      <div className="absolute -left-[5px] top-[5px] w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                    )}
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                      <div>
                        <p className="font-semibold">{exp.role}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        {exp.location && (
                          <p className="text-xs text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" />{exp.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(exp.startDate)} — {exp.current ? 'Present' : formatDate(exp.endDate)}
                        </p>
                        {exp.startDate && (
                          <p className="text-xs font-medium text-foreground/70 mt-0.5">
                            {calculateExperience(exp.startDate, exp.endDate)}
                          </p>
                        )}
                        {exp.current && (
                          <Badge variant="success" className="text-[10px] h-4 px-1.5 mt-1">Current</Badge>
                        )}
                      </div>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{exp.description}</p>
                    )}
                    {exp.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {exp.technologies.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1.5">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
