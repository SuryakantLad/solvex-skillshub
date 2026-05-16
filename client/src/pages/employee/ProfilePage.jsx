import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Plus, X, User, MapPin, Link2, Star, Github, Sparkles } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getMyProfile, updateEmployee } from '@/services/employeeService';
import { syncGitHub } from '@/services/githubService';
import { getProficiencyColor } from '@/lib/utils';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Data Science', 'DevOps', 'QA', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Other'];

function extractGithubUsername(urlOrUsername) {
  if (!urlOrUsername) return null;
  const trimmed = urlOrUsername.trim();
  // Handle full URL: https://github.com/username or github.com/username
  const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^/?\s]+)/i);
  if (match) return match[1];
  // Raw username (no slashes)
  if (!trimmed.includes('/') && !trimmed.includes('.')) return trimmed;
  return null;
}

export default function ProfilePage() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'intermediate' });
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubSuggestions, setGithubSuggestions] = useState([]); // skills detected from GitHub not yet in profile

  useEffect(() => {
    getMyProfile()
      .then(({ employee: emp }) => {
        setEmployee(emp);
        setForm({
          title: emp?.title ?? '',
          department: emp?.department ?? '',
          location: emp?.location ?? '',
          summary: emp?.summary ?? '',
          linkedIn: emp?.linkedIn ?? '',
          github: emp?.github ?? '',
          phone: emp?.phone ?? '',
          availability: { isAvailable: emp?.availability?.isAvailable ?? false },
          skills: (emp?.skills ?? []).filter((s) => !s.isInferred),
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const setField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  function addSkill() {
    if (!newSkill.name.trim()) return;
    const name = newSkill.name.trim();
    if (form.skills?.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setForm((f) => ({ ...f, skills: [...(f.skills ?? []), { name, proficiency: newSkill.proficiency, source: 'manual' }] }));
    setNewSkill({ name: '', proficiency: 'intermediate' });
  }

  function removeSkill(name) {
    setForm((f) => ({ ...f, skills: f.skills?.filter((s) => s.name !== name) ?? [] }));
  }

  function addSuggestedSkill(skillName) {
    if (form.skills?.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      toast.error('Already in your skills');
      setGithubSuggestions((prev) => prev.filter((s) => s !== skillName));
      return;
    }
    setForm((f) => ({ ...f, skills: [...(f.skills ?? []), { name: skillName, proficiency: 'intermediate', source: 'ai_inferred' }] }));
    setGithubSuggestions((prev) => prev.filter((s) => s !== skillName));
    toast.success(`Added ${skillName} to skills`);
  }

  function addAllSuggested() {
    const toAdd = githubSuggestions.filter(
      (s) => !form.skills?.some((sk) => sk.name.toLowerCase() === s.toLowerCase())
    );
    if (toAdd.length === 0) { toast.error('All suggestions already in your skills'); return; }
    setForm((f) => ({
      ...f,
      skills: [
        ...(f.skills ?? []),
        ...toAdd.map((name) => ({ name, proficiency: 'intermediate', source: 'ai_inferred' })),
      ],
    }));
    setGithubSuggestions([]);
    toast.success(`Added ${toAdd.length} GitHub skills`);
  }

  async function handleGithubSync() {
    const username = extractGithubUsername(form.github);
    if (!username) {
      toast.error('Enter a valid GitHub URL or username first');
      return;
    }
    setGithubSyncing(true);
    try {
      const result = await syncGitHub(username);
      const detected = result.detectedSkills ?? [];
      // Filter out skills already in profile
      const currentNames = new Set((form.skills ?? []).map((s) => s.name.toLowerCase()));
      const fresh = detected.filter((s) => !currentNames.has(s.toLowerCase()));
      setGithubSuggestions(fresh);
      if (fresh.length > 0) {
        toast.success(`Found ${fresh.length} new skills from GitHub`);
      } else {
        toast.success('GitHub synced — no new skills detected');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sync GitHub');
    } finally {
      setGithubSyncing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { employee: updated } = await updateEmployee(employee._id, form);
      setEmployee(updated);
      toast.success('Profile saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-10 w-48" />
      {['info', 'links', 'skills'].map((k) => <Skeleton key={k} className="h-40 rounded-2xl" />)}
    </div>
  );

  const completeness = employee?.profileCompleteness ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="My Profile" description="Keep your profile updated to appear in relevant searches." />
        {completeness !== undefined && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-1">Completeness</p>
            <p className="text-2xl font-black text-primary">{completeness}%</p>
            <Progress value={completeness} className="w-24 h-1.5 mt-1" />
          </div>
        )}
      </div>

      {/* Basic info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Senior Software Engineer" value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department ?? ''} onValueChange={(v) => setField('department', v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input className="pl-9" placeholder="e.g. San Francisco, CA" value={form.location ?? ''} onChange={(e) => setField('location', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 (555) 000-0000" value={form.phone ?? ''} onChange={(e) => setField('phone', e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Availability</Label>
                <Select value={form.availability?.isAvailable ? 'available' : 'unavailable'} onValueChange={(v) => setField('availability', { isAvailable: v === 'available' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available for new roles</SelectItem>
                    <SelectItem value="unavailable">Not currently available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Professional Summary</Label>
              <Textarea
                placeholder="Brief description of your background and expertise…"
                className="min-h-[100px] resize-none"
                value={form.summary ?? ''}
                onChange={(e) => setField('summary', e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">{(form.summary ?? '').length}/2000 characters</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Links */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              Professional Links
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>LinkedIn URL</Label>
              <Input placeholder="https://linkedin.com/in/..." value={form.linkedIn ?? ''} onChange={(e) => setField('linkedIn', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Github className="w-3.5 h-3.5" />
                GitHub URL
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://github.com/..."
                  value={form.github ?? ''}
                  onChange={(e) => setField('github', e.target.value)}
                  className="flex-1"
                />
                {form.github && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGithubSync}
                    disabled={githubSyncing}
                    className="shrink-0 px-2.5"
                  >
                    {githubSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span className="ml-1 text-xs">{githubSyncing ? 'Syncing…' : 'Sync Skills'}</span>
                  </Button>
                )}
              </div>
              {form.github && (
                <p className="text-[10px] text-muted-foreground">Click "Sync Skills" to import skills detected from your GitHub repos</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* GitHub Suggested Skills */}
      {githubSuggestions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Github className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                GitHub Detected Skills
                <span className="ml-auto text-xs font-normal text-muted-foreground">{githubSuggestions.length} new</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Skills detected from your GitHub repos. Click to add them to your profile.</p>
              <div className="flex flex-wrap gap-2">
                {githubSuggestions.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => addSuggestedSkill(skill)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {skill}
                  </button>
                ))}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={addAllSuggested}
                >
                  Add All {githubSuggestions.length} Skills
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setGithubSuggestions([])}
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Skills */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Skills ({form.skills?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[2rem]">
              {(form.skills ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">No skills added yet. Add your first skill below.</p>
              )}
              {(form.skills ?? []).map((skill) => (
                <span key={skill.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}>
                  {skill.name}
                  <button onClick={() => removeSkill(skill.name)} className="hover:opacity-60 transition-opacity ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Skill name (e.g. React, Python, AWS)"
                value={newSkill.name}
                onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="flex-1"
              />
              <Select value={newSkill.proficiency} onValueChange={(v) => setNewSkill((s) => ({ ...s, proficiency: v }))}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_OPTIONS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Press Enter or click + to add a skill</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-3 pb-6">
        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none sm:w-auto">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
