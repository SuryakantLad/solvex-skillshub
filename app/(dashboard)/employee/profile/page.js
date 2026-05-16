'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Save, Loader2, User, MapPin, Briefcase, Github, Linkedin } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SkillsEditor from '@/components/employee/SkillsEditor';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetch('/api/employees/me')
      .then((r) => r.json())
      .then(({ employee: emp }) => {
        setEmployee(emp);
        setForm({
          title: emp?.title || '',
          department: emp?.department || '',
          location: emp?.location || '',
          summary: emp?.summary || '',
          linkedIn: emp?.linkedIn || '',
          github: emp?.github || '',
          phone: emp?.phone || '',
          totalYearsExperience: emp?.totalYearsExperience || 0,
          skills: emp?.skills || [],
          availability: emp?.availability ?? { isAvailable: true },
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employee._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
        return;
      }

      const { employee: updated } = await res.json();
      setEmployee(updated);
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your profile..." />;

  return (
    <div className="max-w-3xl space-y-8">
      <PageHeader
        title="My Profile"
        description="Keep your professional profile accurate and up-to-date."
        action={
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        }
      />

      {/* Profile completeness */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={getAvatarUrl(user?.name || '')} />
              <AvatarFallback className="text-lg">{getInitials(user?.name || '?')}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold">{user?.name}</p>
                <span className="text-sm font-medium text-primary">{employee?.profileCompleteness || 0}%</span>
              </div>
              <Progress value={employee?.profileCompleteness || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">Profile completeness</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Job Title</Label>
              <Input
                placeholder="e.g. Senior Frontend Engineer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                placeholder="e.g. Engineering"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                <MapPin className="w-3.5 h-3.5 inline mr-1" />Location
              </Label>
              <Input
                placeholder="e.g. San Francisco, CA"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                <Briefcase className="w-3.5 h-3.5 inline mr-1" />Years of Experience
              </Label>
              <Input
                type="number"
                min="0"
                max="40"
                value={form.totalYearsExperience}
                onChange={(e) => setForm({ ...form, totalYearsExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Professional Summary</Label>
            <Textarea
              placeholder="Describe your professional background, expertise, and what you're looking for..."
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={4}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links</CardTitle>
          <CardDescription>Add your professional links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>
              <Linkedin className="w-3.5 h-3.5 inline mr-1" />LinkedIn URL
            </Label>
            <Input
              placeholder="https://linkedin.com/in/yourname"
              value={form.linkedIn}
              onChange={(e) => setForm({ ...form, linkedIn: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              <Github className="w-3.5 h-3.5 inline mr-1" />GitHub URL
            </Label>
            <Input
              placeholder="https://github.com/yourname"
              value={form.github}
              onChange={(e) => setForm({ ...form, github: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills</CardTitle>
          <CardDescription>Add your technical and professional skills</CardDescription>
        </CardHeader>
        <CardContent>
          <SkillsEditor
            skills={form.skills || []}
            onChange={(skills) => setForm({ ...form, skills })}
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
}
