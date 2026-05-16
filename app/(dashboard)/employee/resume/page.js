'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Brain, RotateCcw, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import ResumeUpload from '@/components/employee/ResumeUpload';
import ParsedResumeReview from '@/components/employee/ParsedResumeReview';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const STEPS = ['upload', 'review', 'saved'];

export default function ResumePage() {
  const [step, setStep] = useState('upload'); // upload | review | saved
  const [parsed, setParsed] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleParsed = (data, meta) => {
    setParsed(data);
    setMetadata(meta);
    setSaved(false);
    setStep('review');
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      // Fetch the current employee profile to get the ID
      const meRes = await fetch('/api/employees/me');
      const { employee } = await meRes.json();

      if (!employee?._id) {
        toast.error('Could not find your employee profile');
        return;
      }

      const updates = {
        title: data.title || employee.title,
        summary: data.summary || employee.summary,
        totalYearsExperience: data.totalYearsExperience ?? employee.totalYearsExperience ?? 0,
        skills: data.skills ?? [],
        experience: data.experience ?? [],
        certifications: data.certifications ?? [],
        education: data.education ?? [],
        projects: data.projects ?? [],
      };

      if (data.location) updates.location = data.location;
      if (data.phone) updates.phone = data.phone;

      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to save profile');
        return;
      }

      setSaved(true);
      setStep('saved');
      toast.success('Profile updated from resume!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setParsed(null);
    setMetadata(null);
    setSaved(false);
    setStep('upload');
  };

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="Resume Parser"
        description="Upload your PDF resume and AI will automatically extract your skills, experience, and certifications."
        action={
          step !== 'upload' && (
            <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Parse another
            </Button>
          )
        }
      />

      {/* Step indicator */}
      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        {/* ── Upload step ───────────────────────────────────────────────────── */}
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="w-4 h-4 text-primary" />
                  Upload Resume
                </CardTitle>
                <CardDescription>
                  Powered by Claude AI — supports any text-based PDF resume format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResumeUpload onParsed={handleParsed} />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Review step ───────────────────────────────────────────────────── */}
        {step === 'review' && parsed && (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
          >
            <ParsedResumeReview
              data={parsed}
              metadata={metadata}
              onSave={handleSave}
              saving={saving}
              saved={saved}
            />
          </motion.div>
        )}

        {/* ── Success step ──────────────────────────────────────────────────── */}
        {step === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
          >
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardContent className="py-12 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold">Profile Updated!</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Your skills, experience, and certifications have been saved to your profile.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button asChild variant="outline" size="sm">
                    <a href="/employee/profile">View Profile</a>
                  </Button>
                  <Button size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4" />
                    Parse another resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_META = [
  { key: 'upload', label: 'Upload' },
  { key: 'review', label: 'Review' },
  { key: 'saved', label: 'Saved' },
];

function StepIndicator({ current }) {
  const idx = STEP_META.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center gap-0">
      {STEP_META.map((step, i) => {
        const done = i < idx;
        const active = i === idx;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done ? 'bg-emerald-500 text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}
              `}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs transition-colors ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {i < STEP_META.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-colors ${done ? 'bg-emerald-400' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
