import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Loader2, CheckCircle2, ChevronRight, X, Save } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { parseResume } from '@/services/resumeService';
import { updateEmployee } from '@/services/employeeService';
import { getProficiencyColor, formatDate } from '@/lib/utils';

const STEPS = ['Upload', 'Review', 'Done'];

export default function ResumePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function handleFile(f) {
    if (!f || f.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    setFile(f);
  }

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    try {
      const data = await parseResume(file);
      setParsed(data.resumeData ?? data);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const payload = {
        title: parsed.title,
        summary: parsed.summary,
        skills: parsed.skills ?? [],
        experience: parsed.experience ?? [],
        education: parsed.education ?? [],
        certifications: parsed.certifications ?? [],
      };
      // Employee ID from auth — profile update endpoint uses /me path
      await updateEmployee('me', payload);
      setStep(2);
      toast.success('Resume data saved to your profile!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Resume Parser" description="Upload your PDF resume — AI will extract and sync your skills and experience." />

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
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
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/30'}`}
            >
              <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                {file ? <FileText className="w-6 h-6 text-primary" /> : <Upload className="w-6 h-6 text-primary" />}
              </div>
              {file
                ? <div className="text-center"><p className="font-semibold text-sm">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · PDF</p></div>
                : <div className="text-center"><p className="font-semibold text-sm">Drop your resume here</p><p className="text-xs text-muted-foreground">or click to browse · PDF only</p></div>
              }
            </div>
            {file && (
              <div className="flex gap-2 mt-3">
                <Button onClick={handleParse} disabled={parsing} className="flex-1">
                  {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {parsing ? 'Parsing with AI…' : 'Parse Resume'}
                </Button>
                <Button variant="outline" size="icon" onClick={() => setFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 1: Review */}
      {step === 1 && parsed && (
        <motion.div key="review" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {parsed.title && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Detected Role</p>
                <p className="font-semibold">{parsed.title}</p>
              </CardContent>
            </Card>
          )}

          {parsed.skills?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Skills ({parsed.skills.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map((s) => (
                    <span key={s.name} className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(s.proficiency)}`}>{s.name}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {parsed.experience?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Experience ({parsed.experience.length} roles)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {parsed.experience.map((exp, i) => (
                  <div key={i} className="pl-3 border-l-2 border-border">
                    <p className="text-sm font-semibold">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">{exp.company} · {formatDate(exp.startDate)} – {formatDate(exp.endDate)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {parsed.education?.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Education</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {parsed.education.map((edu, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                    <p className="text-xs text-muted-foreground">{edu.institution} {edu.graduationYear && `· ${edu.graduationYear}`}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              ← Re-upload
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save to Profile
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Done */}
      {step === 2 && (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Updated!</h2>
          <p className="text-muted-foreground text-sm mb-6">Your resume data has been synced to your profile.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => { setStep(0); setFile(null); setParsed(null); }}>
              Upload Another
            </Button>
            <Button asChild>
              <a href="/employee/profile">View Profile →</a>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
