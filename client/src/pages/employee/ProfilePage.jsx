import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Plus, X, User } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getMyProfile, updateEmployee } from '@/services/employeeService';
import { getProficiencyColor } from '@/lib/utils';

const PROFICIENCY_OPTIONS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function ProfilePage() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 'intermediate' });

  useEffect(() => {
    getMyProfile()
      .then(({ employee: emp }) => {
        setEmployee(emp);
        setForm({
          title: emp?.title ?? '',
          department: emp?.department ?? '',
          location: emp?.location ?? '',
          summary: emp?.summary ?? '',
          linkedinUrl: emp?.linkedinUrl ?? '',
          githubUrl: emp?.githubUrl ?? '',
          availability: { isAvailable: emp?.availability?.isAvailable ?? false },
          skills: emp?.skills?.filter((s) => !s.inferred) ?? [],
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSkill() {
    if (!newSkill.name.trim()) return;
    const name = newSkill.name.trim();
    if (form.skills?.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    setForm((f) => ({ ...f, skills: [...(f.skills ?? []), { name, proficiency: newSkill.proficiency }] }));
    setNewSkill({ name: '', proficiency: 'intermediate' });
  }

  function removeSkill(name) {
    setForm((f) => ({ ...f, skills: f.skills?.filter((s) => s.name !== name) ?? [] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { employee: updated } = await updateEmployee(employee._id, form);
      setEmployee(updated);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-10 w-48" />
      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <PageHeader title="My Profile" description="Keep your profile updated to appear in relevant searches." />
        {employee?.profileCompleteness !== undefined && (
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-1">Completeness</p>
            <p className="text-xl font-black text-primary">{employee.profileCompleteness}%</p>
          </div>
        )}
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4 text-primary" />Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input placeholder="e.g. Senior Software Engineer" value={form.title ?? ''} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input placeholder="e.g. Engineering" value={form.department ?? ''} onChange={(e) => setField('department', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input placeholder="e.g. San Francisco, CA" value={form.location ?? ''} onChange={(e) => setField('location', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Availability</Label>
              <Select value={form.availability?.isAvailable ? 'available' : 'unavailable'} onValueChange={(v) => setField('availability', { isAvailable: v === 'available' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available for new roles</SelectItem>
                  <SelectItem value="unavailable">Not available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Professional Summary</Label>
            <Textarea
              placeholder="Brief description of your background and expertise…"
              className="min-h-[100px]"
              value={form.summary ?? ''}
              onChange={(e) => setField('summary', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>LinkedIn URL</Label>
              <Input placeholder="https://linkedin.com/in/..." value={form.linkedinUrl ?? ''} onChange={(e) => setField('linkedinUrl', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>GitHub URL</Label>
              <Input placeholder="https://github.com/..." value={form.githubUrl ?? ''} onChange={(e) => setField('githubUrl', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Skills ({form.skills?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing skills */}
          <div className="flex flex-wrap gap-2">
            {(form.skills ?? []).map((skill) => (
              <span key={skill.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}>
                {skill.name}
                <button onClick={() => removeSkill(skill.name)} className="hover:opacity-60 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add skill */}
          <div className="flex gap-2">
            <Input
              placeholder="Skill name (e.g. React)"
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
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Profile
      </Button>
    </div>
  );
}
