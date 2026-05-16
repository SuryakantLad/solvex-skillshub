import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Loader2, CheckCircle2, ChevronRight, X,
  Brain, Sparkles, Clock, Send, Plus, Pencil, GraduationCap,
  Briefcase, Award, Zap,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { parseResume, applyResumeDirect, submitResumeForReview } from '@/services/resumeService';
import { getProficiencyColor, formatDate } from '@/lib/utils';

const STEPS = ['Upload', 'Edit & Apply', 'Done'];
const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];

function initEditData(parsed) {
  return {
    title: parsed.title || '',
    summary: parsed.summary || '',
    totalYearsExperience: parsed.totalYearsExperience || 0,
    skills: (parsed.skills || []).map((s) => ({ ...s })),
    experience: (parsed.experience || []).map((e) => ({ ...e })),
    education: (parsed.education || []).map((e) => ({ ...e })),
    certifications: (parsed.certifications || []).map((c) => (typeof c === 'string' ? { name: c } : { ...c })),
  };
}

export default function ResumePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [editData, setEditData] = useState(null);
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneMode, setDoneMode] = useState('applied'); // 'applied' | 'submitted'
  const [dragActive, setDragActive] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'intermediate' });
  const [newCert, setNewCert] = useState('');
  const inputRef = useRef(null);

  function handleFile(f) {
    if (!f || f.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    setFile(f);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    try {
      const result = await parseResume(file);
      const data = result.resumeData;
      if (!data) throw new Error('No data extracted from resume');
      setParsed(data);
      setMetadata(result.metadata);
      setEditData(initEditData(data));
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  }

  function setEdit(key, value) {
    setEditData((d) => ({ ...d, [key]: value }));
  }

  function addSkill() {
    const name = newSkill.name.trim();
    if (!name) return;
    if (editData.skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already in list'); return;
    }
    setEdit('skills', [...editData.skills, { name, proficiency: newSkill.proficiency, source: 'resume_parse', confidence: 90 }]);
    setNewSkill({ name: '', proficiency: 'intermediate' });
  }

  function removeSkill(name) {
    setEdit('skills', editData.skills.filter((s) => s.name !== name));
  }

  function removeExperience(i) {
    setEdit('experience', editData.experience.filter((_, idx) => idx !== i));
  }

  function removeEducation(i) {
    setEdit('education', editData.education.filter((_, idx) => idx !== i));
  }

  function addCert() {
    const name = newCert.trim();
    if (!name) return;
    setEdit('certifications', [...editData.certifications, { name }]);
    setNewCert('');
  }

  function removeCert(i) {
    setEdit('certifications', editData.certifications.filter((_, idx) => idx !== i));
  }

  async function handleApply() {
    setApplying(true);
    try {
      await applyResumeDirect({
        title: editData.title,
        summary: editData.summary,
        totalYearsExperience: editData.totalYearsExperience,
        skills: editData.skills.map((s) => ({ ...s, source: 'resume_parse' })),
        experience: editData.experience,
        education: editData.education,
        certifications: editData.certifications,
      });
      setDoneMode('applied');
      setStep(2);
      toast.success('Profile updated from resume!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply resume data');
    } finally {
      setApplying(false);
    }
  }

  async function handleSubmitForReview() {
    setSubmitting(true);
    try {
      await submitResumeForReview({
        title: editData.title,
        summary: editData.summary,
        totalYearsExperience: editData.totalYearsExperience,
        skills: editData.skills.map((s) => ({ ...s, source: 'resume_parse' })),
        experience: editData.experience,
        education: editData.education,
        certifications: editData.certifications,
        domainExpertise: parsed?.domainExpertise,
        fileName: file?.name,
        confidence: metadata?.confidence ?? parsed?._meta?.confidence,
      });
      setDoneMode('submitted');
      setStep(2);
      toast.success('Resume submitted for HR review!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit resume');
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setStep(0); setFile(null); setParsed(null); setMetadata(null);
    setEditData(null); setNewSkill({ name: '', proficiency: 'intermediate' }); setNewCert('');
  }

  const confidence = parsed?._meta?.confidence ?? parsed?.metadata?.confidence ?? parsed?.confidence;

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Resume Parser"
        description="Upload your PDF — AI extracts your data. Edit it, then apply directly to your profile or send to HR."
      />

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 0: Upload */}
      {step === 0 && (
        <AnimatePresence mode="wait">
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                dragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40 hover:bg-secondary/30'
              }`}
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                {file ? <FileText className="w-7 h-7 text-primary" /> : <Upload className="w-7 h-7 text-primary" />}
              </div>
              {file ? (
                <div className="text-center">
                  <p className="font-semibold text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(0)} KB · PDF</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-semibold text-sm">Drop your resume here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse · PDF only</p>
                </div>
              )}
            </div>

            {file && (
              <div className="flex gap-2">
                <Button onClick={handleParse} disabled={parsing} className="flex-1">
                  {parsing ? <><Loader2 className="w-4 h-4 animate-spin" />Parsing with AI…</> : <><Brain className="w-4 h-4" />Parse with AI</>}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {parsing && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
                    <p className="font-medium">Claude AI is reading your resume…</p>
                  </div>
                  <Progress value={undefined} className="h-1 animate-pulse" />
                  <p className="text-xs text-muted-foreground">Extracting skills, experience, education and certifications</p>
                </CardContent>
              </Card>
            )}

            <Card className="border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/5">
              <CardContent className="p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  After AI parsing you can review and edit the extracted data, then apply it directly to your profile — or send it to HR for review.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 1: Edit & Apply */}
      {step === 1 && editData && (
        <motion.div key="edit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Header / Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 text-primary" />
                Overview
                {confidence !== undefined && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    AI confidence: <span className="font-bold text-primary">{confidence}%</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Job Title</Label>
                  <Input value={editData.title} onChange={(e) => setEdit('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Years of Experience</Label>
                  <Input
                    type="number" min={0} max={60}
                    value={editData.totalYearsExperience}
                    onChange={(e) => setEdit('totalYearsExperience', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Professional Summary</Label>
                <Textarea
                  className="min-h-[80px] resize-none text-sm"
                  value={editData.summary}
                  onChange={(e) => setEdit('summary', e.target.value)}
                  placeholder="Your professional summary…"
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-primary" />
                Skills
                <Badge variant="secondary" className="ml-auto">{editData.skills.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                {editData.skills.length === 0 && <p className="text-xs text-muted-foreground">No skills extracted. Add them below.</p>}
                {editData.skills.map((s) => (
                  <span key={s.name} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(s.proficiency)}`}>
                    {s.name}
                    <button onClick={() => removeSkill(s.name)} className="hover:opacity-60 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill…"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1 h-8 text-sm"
                />
                <Select value={newSkill.proficiency} onValueChange={(v) => setNewSkill((s) => ({ ...s, proficiency: v }))}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_OPTIONS.map((p) => <SelectItem key={p} value={p} className="capitalize text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addSkill}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          {editData.experience.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  Experience
                  <Badge variant="secondary" className="ml-auto">{editData.experience.length} roles</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {editData.experience.map((exp, i) => (
                  <div key={i} className="flex items-start gap-2 pl-3 border-l-2 border-border group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{exp.role ?? exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.company} · {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                      </p>
                    </div>
                    <button onClick={() => removeExperience(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {editData.education.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {editData.education.map((edu, i) => (
                  <div key={i} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution}</p>
                    </div>
                    <button onClick={() => removeEducation(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-primary" />
                Certifications
                <Badge variant="secondary" className="ml-auto">{editData.certifications.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                {editData.certifications.length === 0 && <p className="text-xs text-muted-foreground">No certifications extracted.</p>}
                {editData.certifications.map((c, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {c.name ?? c}
                    <button onClick={() => removeCert(i)} className="hover:opacity-60 ml-0.5"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Input
                  placeholder="Add certification…"
                  value={newCert}
                  onChange={(e) => setNewCert(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCert()}
                  className="flex-1 h-8 text-sm"
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addCert}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={resetAll} className="shrink-0">
              ← Re-upload
            </Button>
            <Button variant="outline" onClick={handleSubmitForReview} disabled={submitting} className="shrink-0">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit for HR Review
            </Button>
            <Button onClick={handleApply} disabled={applying} className="flex-1">
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {applying ? 'Applying…' : 'Apply to My Profile'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Done */}
      {step === 2 && (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          {doneMode === 'applied' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Profile Updated!</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                Your skills, experience, education and certifications have been applied to your profile.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">Submitted for Review</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                Your resume has been sent to HR. Changes will appear on your profile once approved.
              </p>
            </>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" onClick={resetAll}>Upload Another</Button>
            <Button asChild><a href="/employee">Back to Dashboard →</a></Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
