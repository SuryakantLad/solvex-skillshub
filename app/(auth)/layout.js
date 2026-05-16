import Link from 'next/link';
import { Brain, Zap, Users, BarChart3 } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#030711]">

      {/* ── Left panel ────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-950/80 via-slate-950 to-indigo-950/80" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[60px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm">
            <Brain className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-white">TalentGraph AI</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-300/70 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <Zap className="w-3 h-3" />
              Powered by Claude — Anthropic AI
            </div>
            <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
              Intelligence for the
              <br />
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #a78bfa, #818cf8, #60a5fa)' }}>
                modern talent team.
              </span>
            </h2>
            <p className="text-white/45 text-lg leading-relaxed max-w-sm">
              Map skills, discover talent, and build high-performance teams with the power of AI.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              { icon: Brain, text: 'AI parses any resume in under 3 seconds' },
              { icon: Users, text: 'Semantic search across your entire talent pool' },
              { icon: BarChart3, text: 'Match scores with evidence-based reasoning' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Icon className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <p className="text-sm text-white/55">{text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: '10x', label: 'Faster hiring' },
              { value: '94%', label: 'Match accuracy' },
              { value: '<3s', label: 'Resume parse' },
            ].map((stat) => (
              <div key={stat.label}
                className="rounded-xl p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-black text-white mb-0.5">{stat.value}</div>
                <div className="text-white/35 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/20 text-xs">© 2025 TalentGraph AI. Powered by Claude.</p>
      </div>

      {/* ── Right panel ───────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">TalentGraph AI</span>
        </div>

        <div className="w-full max-w-sm">{children}</div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
