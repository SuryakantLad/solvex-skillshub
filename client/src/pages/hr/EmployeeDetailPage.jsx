import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Briefcase, Mail, Github, Linkedin,
  Star, CheckCircle2, Clock, TrendingUp, ExternalLink, Award, Code2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl, getProficiencyColor, getProficiencyLevel, formatDate, calculateExperience } from '@/lib/utils';
import { getEmployee, acceptInferredSkill, rejectInferredSkill } from '@/services/employeeService';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEmployee(id)
      .then(({ employee: emp }) => setEmployee(emp))
      .catch(() => toast.error('Failed to load employee'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleAccept(skillId, skillName) {
    try {
      const { employee: updated } = await acceptInferredSkill(id, skillId);
      setEmployee(updated);
      toast.success(`Accepted: ${skillName}`);
    } catch {
      toast.error('Failed to accept skill');
    }
  }

  async function handleReject(skillId, skillName) {
    try {
      const { employee: updated } = await rejectInferredSkill(id, skillId);
      setEmployee(updated);
      toast.success(`Rejected: ${skillName}`);
    } catch {
      toast.error('Failed to reject skill');
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-52 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {['a', 'b', 'c', 'd'].map((k) => <Skeleton key={k} className="h-56 rounded-2xl" />)}
      </div>
    </div>
  );

  if (!employee) return (
    <div className="text-center py-16">
      <AlertCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-muted-foreground font-medium">Employee not found.</p>
      <Link to="/hr/directory"><Button variant="outline" className="mt-4">Back to Directory</Button></Link>
    </div>
  );

  const confirmedSkills = employee.skills?.filter((s) => !s.isInferred) ?? [];
  const acceptedInferred = employee.skills?.filter((s) => s.isInferred) ?? [];
  const pendingInferred = employee.inferredSkills?.filter((s) => s.status === 'pending') ?? [];

  const byCategory = confirmedSkills.reduce((acc, s) => {
    const cat = s.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/hr/directory" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="relative shrink-0">
                <Avatar className="w-20 h-20 ring-4 ring-border">
                  <AvatarImage src={getAvatarUrl(employee.name)} alt={employee.name} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
                {employee.availability?.isAvailable && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{employee.name}</h1>
                  {employee.availability?.isAvailable
                    ? <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">Available</Badge>
                    : <Badge variant="secondary">Not Available</Badge>
                  }
                </div>
                <p className="text-muted-foreground font-medium">{employee.title || 'No title set'}</p>
                {employee.department && <p className="text-sm text-muted-foreground mt-0.5">{employee.department}</p>}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  {employee.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{employee.location}</span>}
                  {(employee.totalYearsExperience ?? 0) > 0 && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{employee.totalYearsExperience}y exp</span>}
                  {employee.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{employee.email}</span>}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {employee.github && (
                    <a href={employee.github.startsWith('http') ? employee.github : `https://github.com/${employee.github}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Github className="w-3.5 h-3.5" />GitHub<ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                  {employee.linkedIn && (
                    <a href={employee.linkedIn} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Linkedin className="w-3.5 h-3.5" />LinkedIn<ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
              {employee.profileCompleteness !== undefined && (
                <div className="sm:text-right shrink-0">
                  <p className="text-xs text-muted-foreground mb-1">Profile</p>
                  <p className="text-3xl font-black text-primary">{employee.profileCompleteness}%</p>
                  <Progress value={employee.profileCompleteness} className="w-24 h-1.5 mt-1" />
                </div>
              )}
            </div>
            {employee.summary && (
              <>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground leading-relaxed">{employee.summary}</p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="skills">
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
        </TabsList>

        {/* Skills tab */}
        <TabsContent value="skills" className="mt-5 space-y-4">
          {/* By category */}
          {Object.keys(byCategory).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(byCategory).map(([cat, skills]) => (
                <Card key={cat}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {skills.map((skill) => (
                      <div key={skill.name} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium truncate">{skill.name}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ml-2 ${getProficiencyColor(skill.proficiency)}`}>
                              {skill.proficiency}
                            </span>
                          </div>
                          <Progress value={getProficiencyLevel(skill.proficiency)} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Accepted inferred skills */}
          {acceptedInferred.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  AI-Inferred Skills (Accepted)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {acceptedInferred.map((s) => (
                    <Badge key={s.name} variant="secondary" className="text-xs">{s.name}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending inferred — HR can approve/reject */}
          {pendingInferred.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-primary" />
                  AI Inferred Skills — Pending Review
                  <Badge className="ml-auto text-[10px]">{pendingInferred.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingInferred.map((skill) => (
                  <div key={skill._id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background border border-border">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{skill.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{skill.category}</span>
                        {skill.confidence && <span className="text-[10px] text-muted-foreground">{skill.confidence}% confidence</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost"
                        className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        onClick={() => handleAccept(skill._id, skill.name)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="ghost"
                        className="h-6 px-2 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        onClick={() => handleReject(skill._id, skill.name)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {confirmedSkills.length === 0 && pendingInferred.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No skills listed yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Experience tab */}
        <TabsContent value="experience" className="mt-5">
          <Card>
            <CardContent className="p-5 space-y-5">
              {(employee.experience ?? []).length === 0 ? (
                <div className="py-8 text-center">
                  <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No experience listed.</p>
                </div>
              ) : employee.experience.map((exp, i) => (
                <div key={exp._id ?? i} className="relative pl-5 border-l-2 border-border">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary" />
                  <p className="font-semibold text-sm">{exp.role ?? exp.title}</p>
                  <p className="text-xs text-muted-foreground font-medium">{exp.company}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</span>
                    {exp.startDate && <span>· {calculateExperience(exp.startDate, exp.current ? null : exp.endDate)}</span>}
                    {exp.location && <span>· {exp.location}</span>}
                  </div>
                  {exp.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{exp.description}</p>}
                  {exp.technologies?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exp.technologies.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education tab */}
        <TabsContent value="education" className="mt-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              {(employee.education ?? []).length === 0 ? (
                <div className="py-8 text-center">
                  <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No education listed.</p>
                </div>
              ) : employee.education.map((edu, i) => (
                <div key={edu._id ?? i}>
                  <p className="font-semibold text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                  {(edu.startYear || edu.endYear) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {edu.startYear}{edu.endYear && edu.startYear !== edu.endYear ? ` – ${edu.endYear}` : ''}
                    </p>
                  )}
                  {edu.grade && <p className="text-[10px] text-muted-foreground">Grade: {edu.grade}</p>}
                  {i < employee.education.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Certifications */}
          {(employee.certifications ?? []).length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.certifications.map((cert, i) => (
                  <div key={cert._id ?? i}>
                    <p className="text-xs font-semibold">{cert.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cert.issuer}</p>
                    {cert.issueDate && <p className="text-[10px] text-muted-foreground">{formatDate(cert.issueDate)}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GitHub tab */}
        <TabsContent value="github" className="mt-5">
          {employee.githubData?.username ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {employee.githubData.avatarUrl && (
                      <img src={employee.githubData.avatarUrl} alt={employee.githubData.username} className="w-12 h-12 rounded-full ring-2 ring-border" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">@{employee.githubData.username}</p>
                      {employee.githubData.bio && <p className="text-xs text-muted-foreground mt-0.5 truncate">{employee.githubData.bio}</p>}
                      <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                        <span>{employee.githubData.publicRepos ?? 0} repos</span>
                        <span>{employee.githubData.followers ?? 0} followers</span>
                      </div>
                    </div>
                    <a href={`https://github.com/${employee.githubData.username}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><Github className="w-3.5 h-3.5" /><ExternalLink className="w-3 h-3" /></Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              {(employee.githubData.languages ?? []).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {employee.githubData.languages.slice(0, 10).map(({ name }) => (
                        <Badge key={name} variant="secondary">{name}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(employee.githubData.topRepos ?? []).length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Top Repositories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {employee.githubData.topRepos.slice(0, 5).map((repo) => (
                      <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/20 transition-all group">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-primary group-hover:underline">{repo.name}</p>
                          {repo.description && <p className="text-[10px] text-muted-foreground truncate">{repo.description}</p>}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                          {repo.stars > 0 && <span>★ {repo.stars}</span>}
                          {repo.language && <span>{repo.language}</span>}
                        </div>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Github className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No GitHub data synced yet.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
