'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProficiencyColor } from '@/lib/utils';

const CATEGORIES = ['Frontend', 'Backend', 'Database', 'Cloud', 'DevOps', 'Mobile', 'AI/ML', 'Design', 'Management', 'Other'];
const PROFICIENCIES = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function SkillsEditor({ skills = [], onChange }) {
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 1 });
  const [showForm, setShowForm] = useState(false);

  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    const updated = [...skills, { ...newSkill, name: newSkill.name.trim() }];
    onChange(updated);
    setNewSkill({ name: '', category: 'Backend', proficiency: 'intermediate', yearsOfExperience: 1 });
    setShowForm(false);
  };

  const removeSkill = (index) => {
    onChange(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index, field, value) => {
    const updated = skills.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        <AnimatePresence>
          {skills.map((skill, index) => (
            <motion.div
              key={`${skill.name}-${index}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group relative"
            >
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getProficiencyColor(skill.proficiency)}`}>
                <span>{skill.name}</span>
                <span className="opacity-60">·</span>
                <Select
                  value={skill.proficiency}
                  onValueChange={(v) => updateSkill(index, 'proficiency', v)}
                >
                  <SelectTrigger className="h-auto p-0 border-0 bg-transparent text-xs font-medium w-auto min-w-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => removeSkill(index)}
                  className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {skills.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No skills added yet</p>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 p-4 rounded-xl border border-border bg-secondary/30">
              <Input
                placeholder="Skill name (e.g. React)"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                autoFocus
                className="col-span-2"
              />
              <Select value={newSkill.category} onValueChange={(v) => setNewSkill({ ...newSkill, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={newSkill.proficiency} onValueChange={(v) => setNewSkill({ ...newSkill, proficiency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFICIENCIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="30"
                  placeholder="Years"
                  value={newSkill.yearsOfExperience}
                  onChange={(e) => setNewSkill({ ...newSkill, yearsOfExperience: parseInt(e.target.value) || 0 })}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">yrs exp</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addSkill} className="flex-1">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4" />
          Add skill
        </Button>
      )}
    </div>
  );
}
