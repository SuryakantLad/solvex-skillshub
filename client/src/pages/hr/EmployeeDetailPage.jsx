import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Briefcase, Mail, Github, Linkedin,
  Star, CheckCircle2, Clock, TrendingUp, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
      toast.success(`Accepted skill: ${skillName}`);
    } catch {
      toast.error('Failed to accept skill');
    }
  }

  async function handleReject(skillId, skillName) {
    try {
      const { employee: updated } = await rejectInferredSkill(id, skillId);
      setEmployee(updated);
      toast.success(`Removed inferred skill: ${skillName}`);
    } catch {
      toast.error('Failed to reject skill');
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );

  if (!employee) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Employee not found.</p>
      <Link to="/hr/directory"><Button variant="outline" className="mt-4">Back to Directory</Button></Link>
    </div>
  );

  const confirmedSkills = employee.skills?.filter((s) => !s.inferred) ?? [];
  const inferredSkills = employee.skills?.filter((s) => s.inferred) ?? [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
                  {employee.availability?.isAvailable && <Badge variant="success">Available</Badge>}
                </div>
                <p className="text-muted-foreground font-medium">{employee.title || 'No title set'}</p>
                {employee.department && <p className="text-sm text-muted-foreground mt-0.5">{employee.department}</p>}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  {employee.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{employee.location}</span>}
                  {(employee.totalYearsExperience ?? 0) > 0 && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{employee.totalYearsExperience}y experience</span>}
                  {employee.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{employee.email}</span>}
                </div>
                <div className="flex gap-2 mt-3">
                  {employee.githubUrl && <a href={employee.githubUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Github className="w-3.5 h-3.5" />GitHub<ExternalLink className="w-3 h-3" /></Button></a>}
                  {employee.linkedinUrl && <a href={employee.linkedinUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><Linkedin className="w-3.5 h-3.5" />LinkedIn<ExternalLink className="w-3 h-3" /></Button></a>}
                </div>
              </div>
              {employee.profileCompleteness !== undefined && (
                <div className="sm:text-right shrink-0">
                  <p className="text-xs text-muted-foreground mb-1">Profile completeness</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Skills */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Skills ({confirmedSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {confirmedSkills.length === 0
              ? <p className="text-sm text-muted-foreground">No skills listed yet.</p>
              : confirmedSkills.map((skill) => (
                <div key={skill.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{skill.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getProficiencyColor(skill.proficiency)}`}>{skill.proficiency}</span>
                    </div>
                    <Progress value={getProficiencyLevel(skill.proficiency)} className="h-1" />
                  </div>
                </div>
              ))
            }

            {inferredSkills.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Inferred Skills</p>
                {inferredSkills.map((skill) => (
                  <div key={skill.name} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-xs font-medium">{skill.name}</span>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => handleAccept(skill._id, skill.name)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" />Accept
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => handleReject(skill._id, skill.name)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Experience */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(employee.experience ?? []).length === 0
              ? <p className="text-sm text-muted-foreground">No experience listed.</p>
              : employee.experience.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-border">
                  <p className="font-semibold text-sm">{exp.title}</p>
                  <p className="text-xs text-muted-foreground">{exp.company}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(exp.startDate)} – {formatDate(exp.endDate)}</span>
                    <span>·</span>
                    <span>{calculateExperience(exp.startDate, exp.endDate)}</span>
                  </div>
                  {exp.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exp.description}</p>}
                </div>
              ))
            }
          </CardContent>
        </Card>

        {/* Education */}
        {(employee.education ?? []).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.education.map((edu, i) => (
                <div key={i}>
                  <p className="font-semibold text-sm">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{edu.institution}</p>
                  {edu.graduationYear && <p className="text-[10px] text-muted-foreground">{edu.graduationYear}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* GitHub data */}
        {employee.githubData?.languages && Object.keys(employee.githubData.languages).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub Languages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(employee.githubData.languages).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([lang, bytes]) => (
                  <Badge key={lang} variant="secondary" className="text-xs">{lang}</Badge>
                ))}
              </div>
              {employee.githubData.publicRepos > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{employee.githubData.publicRepos} public repositories · {employee.githubData.totalStars ?? 0} stars</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
