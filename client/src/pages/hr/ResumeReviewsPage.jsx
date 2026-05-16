import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Briefcase, Award, GraduationCap, Sparkles, Edit3,
  AlertCircle, Loader2, User, Plus,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getInitials, getAvatarUrl, getProficiencyColor, formatDate } from '@/lib/utils';
import { getResumeReviews, approveReview, rejectReview, editApproveReview } from '@/services/resumeService';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];

function SkillsPreview({ skills = [] }) {
  if (!skills.length) return <p className="text-xs text-muted-foreground">No skills extracted</p>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 10).map((s) => (
        <span key={s.name} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getProficiencyColor(s.proficiency)}`}>
          {s.name}
        </span>
      ))}
      {skills.length > 10 && <span className="text-[10px] text-muted-foreground self-center">+{skills.length - 10} more</span>}
    </div>
  );
}

function EditModal({ review, onClose, onSaved }) {
  const d = review.pendingResumeData ?? {};
  const [title, setTitle] = useState(d.title ?? '');
  const [summary, setSummary] = useState(d.summary ?? '');
  const [totalYearsExperience, setTotalYearsExperience] = useState(d.totalYearsExperience ?? 0);
  const [skills, setSkills] = useState(d.skills ?? []);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProf, setNewSkillProf] = useState('intermediate');

  function addSkill() {
    const name = newSkillName.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setSkills((prev) => [...prev, { name, proficiency: newSkillProf, category: 'Other', source: 'resume_parse' }]);
    setNewSkillName('');
  }

  function removeSkill(name) {
    setSkills((prev) => prev.filter((s) => s.name !== name));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await editApproveReview(review._id, {
        title,
        summary,
        totalYearsExperience: Number(totalYearsExperience),
        skills,
        experience: d.experience,
        education: d.education,
        certifications: d.certifications,
        notes,
      });
      toast.success('Approved with edits!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Edit3 className="w-4 h-4 text-primary" />
            Edit & Approve — {review.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Job Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Engineer…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Years of Experience</Label>
              <Input type="number" min={0} max={50} value={totalYearsExperience} onChange={(e) => setTotalYearsExperience(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Professional Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[80px] resize-none text-sm"
              placeholder="Professional summary…"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Skills ({skills.length})</Label>
            <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 rounded-xl border border-border bg-secondary/30">
              {skills.length === 0 && <p className="text-xs text-muted-foreground self-center">No skills yet</p>}
              {skills.map((s) => (
                <span key={s.name} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(s.proficiency)}`}>
                  {s.name}
                  <button onClick={() => removeSkill(s.name)} className="hover:opacity-60 transition-opacity">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill…"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1"
              />
              <Select value={newSkillProf} onValueChange={setNewSkillProf}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_OPTIONS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={addSkill}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

          {(d.experience ?? []).length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />Experience ({d.experience.length} roles — applied as-is)</Label>
              <div className="space-y-1.5 pl-3 border-l-2 border-border">
                {d.experience.slice(0, 4).map((exp, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium">{exp.role ?? exp.title}</p>
                    <p className="text-[10px] text-muted-foreground">{exp.company} · {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}</p>
                  </div>
                ))}
                {d.experience.length > 4 && <p className="text-[10px] text-muted-foreground">+{d.experience.length - 4} more</p>}
              </div>
            </div>
          )}

          {(d.education ?? []).length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />Education</Label>
              <div className="space-y-1 pl-3 border-l-2 border-border">
                {d.education.map((edu, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                    <p className="text-[10px] text-muted-foreground">{edu.institution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />
          <div className="space-y-1.5">
            <Label className="text-xs">Review Note (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              placeholder="Add a note for the employee…"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Approve with Edits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewCard({ review, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(null);

  const d = review.pendingResumeData ?? {};
  const submittedAt = d.submittedAt
    ? new Date(d.submittedAt)
    : review.approval?.submittedAt
    ? new Date(review.approval.submittedAt)
    : null;

  async function handleApprove() {
    setActing('approve');
    try {
      await approveReview(review._id, notes);
      toast.success(`Approved ${review.name}'s resume`);
      onUpdate(review._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setActing(null);
    }
  }

  async function handleReject() {
    setActing('reject');
    try {
      await rejectReview(review._id, notes);
      toast.success(`Rejected ${review.name}'s resume`);
      onUpdate(review._id);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      {showEdit && (
        <EditModal
          review={review}
          onClose={() => setShowEdit(false)}
          onSaved={() => onUpdate(review._id)}
        />
      )}

      <Card className="transition-all duration-200 hover:shadow-sm hover:border-border/80">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0 ring-2 ring-border">
              <AvatarImage src={getAvatarUrl(review.name)} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {getInitials(review.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{review.name}</p>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10">
                  <Clock className="w-2.5 h-2.5 mr-1" />Pending Review
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {d.title || review.title || 'No title'}
                {review.department && ` · ${review.department}`}
              </p>
              {submittedAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Submitted {submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex gap-2 text-[10px] text-muted-foreground">
                {(d.skills ?? []).length > 0 && (
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-primary" />{d.skills.length}</span>
                )}
                {(d.experience ?? []).length > 0 && (
                  <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{d.experience.length}</span>
                )}
              </div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Skills preview */}
          {(d.skills ?? []).length > 0 && (
            <div className="mt-3">
              <SkillsPreview skills={d.skills} />
            </div>
          )}

          {/* Expanded view */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {d.title && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                        <User className="w-3 h-3" />Job Title
                      </p>
                      <p className="text-sm font-medium">{d.title}</p>
                    </div>
                  )}
                  {d.summary && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Summary</p>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">{d.summary}</p>
                    </div>
                  )}
                  {(d.experience ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />Experience
                      </p>
                      <div className="space-y-2 pl-3 border-l-2 border-border">
                        {d.experience.map((exp, i) => (
                          <div key={i}>
                            <p className="text-xs font-semibold">{exp.role ?? exp.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {exp.company} · {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                            </p>
                            {exp.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(d.education ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />Education
                      </p>
                      <div className="space-y-1 pl-3 border-l-2 border-border">
                        {d.education.map((edu, i) => (
                          <div key={i}>
                            <p className="text-xs font-medium">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                            <p className="text-[10px] text-muted-foreground">{edu.institution}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(d.certifications ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Award className="w-3 h-3" />Certifications
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.certifications.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{c.name ?? c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-xs">Review Note (optional)</Label>
                    <Textarea
                      placeholder="Add a note for the employee…"
                      className="min-h-[56px] resize-none text-xs"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
              disabled={!!acting}
              onClick={handleApprove}
            >
              {acting === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
              disabled={!!acting}
              onClick={() => setShowEdit(true)}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit & Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-900/40 dark:hover:bg-rose-900/10 dark:text-rose-400"
              disabled={!!acting}
              onClick={handleReject}
            >
              {acting === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function ResumeReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    getResumeReviews()
      .then(({ reviews: r }) => setReviews(r ?? []))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function handleUpdate(id) {
    setReviews((prev) => prev.filter((r) => r._id !== id));
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Resume Reviews"
          description="Review and approve employee-submitted resume data before it applies to their profiles."
        />
        <Badge variant="secondary" className="shrink-0 mt-1">{reviews.length} pending</Badge>
      </div>

      {loading ? (
        <div className="space-y-4">
          {['a', 'b', 'c'].map((k) => <Skeleton key={k} className="h-36 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-base mb-1">All caught up!</h3>
            <p className="text-sm text-muted-foreground">No pending resume reviews at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-900/5">
            <CardContent className="p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                Approving merges the parsed data into the employee's profile. Use <strong>Edit & Approve</strong> to correct any AI errors before applying.
              </p>
            </CardContent>
          </Card>

          <motion.div
            initial="initial"
            animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-4"
          >
            {reviews.map((review) => (
              <motion.div
                key={review._id}
                variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
              >
                <ReviewCard review={review} onUpdate={handleUpdate} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
