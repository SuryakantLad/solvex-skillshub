'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, User2, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const ROLES = [
  {
    value: 'employee',
    label: 'Employee',
    description: 'Upload resume & manage your skills',
    icon: User,
    emoji: '👤',
  },
  {
    value: 'hr',
    label: 'HR / Recruiter',
    description: 'Search talent & build teams',
    icon: Building2,
    emoji: '🏢',
  },
];

export default function SignupForm() {
  const { signup } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('employee');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await signup(data.name, data.email, data.password, selectedRole);
      toast.success('Account created! Welcome to TalentGraph.');
    } catch (err) {
      toast.error(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm mt-1">Join TalentGraph AI — free to get started</p>
      </div>

      {/* Role selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">I am a...</Label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map(({ value, label, description, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSelectedRole(value)}
              className={cn(
                'p-3.5 rounded-xl border-2 text-left transition-all',
                selectedRole === value
                  ? 'border-primary bg-primary/6 shadow-sm'
                  : 'border-border bg-secondary/20 hover:bg-secondary/50 hover:border-border/60'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span>{emoji}</span>
                <span className={cn('font-semibold text-sm', selectedRole === value ? 'text-primary' : 'text-foreground')}>
                  {label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">{description}</p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Full name</Label>
          <div className="relative">
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              className="pl-9 h-10"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />
          </div>
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="jane@company.com"
              autoComplete="email"
              className="pl-9 h-10"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
              })}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              className="pl-9 pr-10 h-10"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full h-10 font-medium" disabled={loading}>
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Creating account...</>
          ) : (
            <>Create account<ArrowRight className="w-4 h-4" /></>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline underline-offset-2 font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
