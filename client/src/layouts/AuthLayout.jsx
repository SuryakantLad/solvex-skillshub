import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Brain, Sparkles, Users, Zap, Shield } from 'lucide-react';

import { motion } from 'framer-motion';

const FEATURES = [
  { icon: Zap,      text: 'AI-powered resume parsing in seconds' },
  { icon: Users,    text: 'Semantic talent search across your org' },
  { icon: Sparkles, text: 'Skill inference from GitHub & projects' },
  { icon: Shield,   text: 'Role-based access for HR & employees' },
];

const STATS = [
  { value: '10x', label: 'Faster hiring' },
  { value: '94%', label: 'Match accuracy' },
  { value: '100+', label: 'Skills tracked' },
];

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'hr' ? '/hr' : '/employee'} replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700">
        {/* Ambient blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-violet-400/15 blur-2xl pointer-events-none" />

        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full px-10 py-8 xl:px-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group w-fit">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:bg-white/30 transition-colors">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">TalentGraph AI</span>
          </Link>

          {/* Main copy */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-3xl xl:text-[2.6rem] font-black text-white leading-tight tracking-tight">
                The AI-Native<br />
                <span className="text-blue-200">Skills Intelligence</span><br />
                Platform
              </h1>

              <p className="mt-3 text-white/70 text-sm xl:text-base leading-relaxed max-w-sm">
                Connect people to opportunities using deep skill graphs, semantic search, and AI-powered matching.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.ul
              className="mt-8 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {FEATURES.map(({ icon: Icon, text }, i) => (
                <motion.li
                  key={text}
                  className="flex items-center gap-3 text-white/80 text-sm"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.4 }}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  {text}
                </motion.li>
              ))}
            </motion.ul>

            {/* Stats */}
            <motion.div
              className="mt-8 grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {STATS.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="text-[11px] text-white/60 mt-0.5">{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Testimonial */}
          <motion.div
            className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p className="text-white/80 text-xs leading-relaxed italic">
              "TalentGraph cut our time-to-hire by 60%. The semantic search actually understands what we're looking for."
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">S</div>
              <div>
                <p className="text-white text-[11px] font-semibold">Sarah Mitchell</p>
                <p className="text-white/50 text-[10px]">Head of Talent · Acme Corp</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto bg-background px-6 py-8">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-7 group lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">TalentGraph AI</span>
        </Link>

        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
