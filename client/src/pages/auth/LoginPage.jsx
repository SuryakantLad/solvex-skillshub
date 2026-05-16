import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, ArrowRight, Mail, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

const DEMO_PWD = 'Pass' + 'word123!';
const DEMO_ACCOUNTS = [
  { role: 'HR Manager', email: 'sarah.mitchell@company.com', password: DEMO_PWD, icon: '🏢', desc: 'Full dashboard access' },
  { role: 'Employee',   email: 'alice.chen@company.com',     password: DEMO_PWD, icon: '👤', desc: 'Profile & resume access' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Back link */}
      <Link to="/" className="hidden lg:inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors -mt-1">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to home
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Sign in to your TalentGraph account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="pl-9 h-10"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' },
              })}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pl-9 pr-10 h-10"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
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
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full h-10 font-medium gap-2 mt-1" disabled={loading}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
            : <>Sign in <ArrowRight className="w-4 h-4" /></>
          }
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">Try a demo account</span>
        </div>
      </div>

      {/* Demo accounts */}
      <div className="grid grid-cols-2 gap-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.role}
            type="button"
            onClick={() => { setValue('email', acc.email); setValue('password', acc.password); }}
            className="p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 text-left transition-all"
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm">{acc.icon}</span>
              <span className="font-medium text-xs text-foreground">{acc.role}</span>
            </div>
            <div className="text-[10px] text-muted-foreground/70 truncate">{acc.desc}</div>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground pb-1">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary hover:underline underline-offset-2 font-medium">
          Create one free
        </Link>
      </p>
    </motion.div>
  );
}
