import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowRight, Brain, Search, Users, Zap, Shield,
  BarChart3, ChevronRight, Sparkles, FileText,
  CheckCircle, Star, Globe, Layers, Sun, Moon, Monitor,
} from 'lucide-react';

// ── Theme toggle ───────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const cycles = ['light', 'dark', 'system'];
  const next = cycles[(cycles.indexOf(theme) + 1) % cycles.length];
  const Icon = resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor;

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme}`}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-foreground/60 hover:text-foreground hover:bg-foreground/8"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// ── Animation helpers ──────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

function AnimatedSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Resume Parsing',
    description: 'Upload any PDF resume and AI extracts every skill, certification, and experience — with proficiency calibration and career trajectory analysis.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: Search,
    title: 'Semantic Search',
    description: 'Type "senior React dev with fintech experience" and get ranked candidates with reasoning, match scores, and gap analysis.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'AI Team Builder',
    description: 'Describe your project and AI assembles the optimal team — with skill coverage matrix, seniority balance, and alternative candidates.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'Match Intelligence',
    description: 'Every search returns a 0–100 match score with specific evidence, strengths, gaps, and role recommendations.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'HR managers get the full intelligence suite. Employees control their own skill profiles, availability, and career goals.',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Skill Inference Engine',
    description: 'AI infers related skills from existing ones — a React expert implies JavaScript, a Docker user implies DevOps. 100+ inference rules built-in.',
    gradient: 'from-indigo-500 to-violet-500',
  },
];

const STATS = [
  { value: '10x', label: 'Faster hiring decisions' },
  { value: '94%', label: 'Semantic match accuracy' },
  { value: '<3s', label: 'Resume parse time' },
  { value: '100+', label: 'Skill inference rules' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload Resumes',
    description: 'Employees upload their PDFs. AI parses every detail — skills, experience, certifications, and career trajectory.',
    icon: FileText,
  },
  {
    step: '02',
    title: 'Search with AI',
    description: 'HR types any natural language query. AI semantically ranks candidates with match scores and detailed reasoning.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Build Optimal Teams',
    description: 'Describe your project. AI assembles the best team with skill coverage analysis and alternative suggestions.',
    icon: Layers,
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">

      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {isDark ? (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-violet-600/8 rounded-full blur-[120px]" />
            <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[80px]" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-100/60 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[80px]" />
          </>
        )}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015]"
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(0,0,0,0.4) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 inset-x-0 z-50 border-b border-border/60 backdrop-blur-xl bg-background/75"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[15px]">TalentGraph AI</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <Link
                to="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-8 border"
            style={{
              background: 'rgba(124, 58, 237, 0.1)',
              borderColor: 'rgba(139, 92, 246, 0.35)',
              color: '#8b5cf6',
            }}
          >
            <Sparkles className="w-3 h-3" />
            Powered by Gemini AI — Google's most capable model
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.05] text-balance"
          >
            The AI-Native{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)' }}
            >
              Skills Intelligence
            </span>
            <br />
            Platform
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Parse resumes in seconds, discover hidden talent with semantic search, and
            build high-performance teams — all powered by Gemini AI.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              to="/signup"
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Start building your talent graph
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/80 hover:bg-secondary transition-all"
            >
              Sign in to your account
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-xs text-muted-foreground/50"
          >
            Demo available — no credit card required
          </motion.p>
        </div>

        {/* Hero preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto mt-16"
        >
          <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-card">
            {/* Mock toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="text-xs text-muted-foreground/50 font-mono px-3 py-0.5 rounded bg-secondary border border-border">
                  talentgraph.ai / hr / search
                </div>
              </div>
            </div>
            {/* Mock content */}
            <div className="p-4 sm:p-6 space-y-4 bg-background/50">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-9 rounded-lg bg-secondary border border-border flex items-center px-3 gap-2">
                  <Search className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-xs sm:text-sm text-muted-foreground/50 truncate">
                    Senior React developer with AWS and fintech experience...
                  </span>
                </div>
                <div
                  className="h-9 px-3 sm:px-4 rounded-lg flex items-center text-xs font-medium text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <Sparkles className="w-3 h-3 mr-1.5" />Search
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Priya Sharma', score: 96, skills: ['React', 'AWS', 'TypeScript'] },
                  { name: 'Arjun Mehta', score: 87, skills: ['React', 'Node.js', 'Docker'] },
                  { name: 'Sarah Chen', score: 74, skills: ['Vue.js', 'AWS', 'Python'] },
                ].map((c, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border bg-secondary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-500 dark:text-violet-300">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <p className="text-xs font-medium">{c.name}</p>
                      </div>
                      <span className="text-sm font-black text-violet-500 dark:text-violet-400">{c.score}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                        style={{ width: `${c.score}%` }}
                      />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {c.skills.map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-300 border border-violet-500/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-border">
        <AnimatedSection className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp} className="text-center">
              <div
                className="text-4xl font-black tracking-tight mb-1 bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-full bg-violet-500/8 border border-violet-500/15 mb-4">
                <Globe className="w-3 h-3" />
                Everything HR teams need
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                AI that understands your talent
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                From ingestion to insight — TalentGraph automates the entire talent intelligence workflow.
              </p>
            </motion.div>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                className="group relative p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 cursor-default"
                whileHover={{ y: -2 }}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-md`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-primary/[0.02]" />
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Three steps from resume upload to optimal team assembly.
              </p>
            </motion.div>
          </AnimatedSection>

          <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <motion.div key={step.step} variants={fadeUp} className="relative">
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                      <step.icon className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-violet-500/60 dark:text-violet-400/60 tracking-widest mb-2 font-mono">
                      STEP {step.step}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <div className="rounded-2xl p-6 sm:p-8 border border-border bg-card text-center">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/70 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto italic mb-4">
                  "TalentGraph AI cut our time-to-hire by 60%. The semantic search actually understands what we're looking for — it's like having a brilliant recruiter on call 24/7."
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-300">
                    SM
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sarah Mitchell</p>
                    <p className="text-xs text-muted-foreground">Head of Talent, TechCorp</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-balance">
                Ready to{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
                >
                  transform
                </span>{' '}
                your talent intelligence?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Join modern HR teams using AI to make faster, better talent decisions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/signup"
                  className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  Get started free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500/70" />
                  No credit card required
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-muted-foreground">TalentGraph AI</span>
          </div>
          <p className="text-muted-foreground/50 text-sm">© 2026 TalentGraph AI. Powered by Gemini.</p>
        </div>
      </footer>
    </div>
  );
}
