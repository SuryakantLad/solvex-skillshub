'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Brain, Sparkles, Users, SlidersHorizontal, ArrowUpDown,
  RotateCcw, MapPin, Briefcase, Clock, TrendingUp, CheckCircle,
  Search, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchBar from '@/components/hr/SearchBar';
import SearchResultCard from '@/components/hr/SearchResultCard';
import { SkeletonEmployeeCard } from '@/components/shared/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const DEFAULT_FILTERS = {
  available: false,
  department: 'all',
  minExperience: '',
  maxExperience: '',
  sortBy: 'score',
};

const EXAMPLE_QUERIES = [
  'Senior React developer with AWS and TypeScript experience',
  'Backend engineer with Node.js and PostgreSQL',
  'Full stack engineer with React and Python',
  'ML engineer with NLP and deep learning',
  'DevOps engineer with Kubernetes and Terraform',
  'Mobile developer with React Native experience',
];

const SORT_OPTIONS = [
  { value: 'score', label: 'Best Match' },
  { value: 'experience', label: 'Most Experience' },
  { value: 'name', label: 'Name A–Z' },
];

export default function SearchPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [departments, setDepartments] = useState([]);
  const [scannedCount, setScannedCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/search')
      .then((r) => r.json())
      .then(({ departments: d = [] }) => setDepartments(d))
      .catch(() => {});
  }, []);

  const sortedResults = results
    ? [...results].sort((a, b) => {
        if (filters.sortBy === 'experience') return (b.employee?.totalYearsExperience ?? 0) - (a.employee?.totalYearsExperience ?? 0);
        if (filters.sortBy === 'name') return (a.employee?.name ?? '').localeCompare(b.employee?.name ?? '');
        return b.matchScore - a.matchScore;
      })
    : null;

  const handleSearch = async (query, filtersOverride) => {
    const active = filtersOverride ?? filters;
    setLoading(true);
    setLastQuery(query);
    setError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, filters: active }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Search failed');
        setResults(null);
        return;
      }

      setResults(json.results);
      setScannedCount(json.scannedCount ?? json.results.length);
      if (json.departments?.length) setDepartments(json.departments);
      setFiltersOpen(false);

      if (json.results.length > 0) {
        toast.success(`${json.results.length} candidates ranked by AI`);
      }
    } catch {
      setError('Network error — check your connection and try again.');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const setFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const activeFilterCount = [
    filters.available,
    filters.department !== 'all',
    filters.minExperience !== '',
    filters.maxExperience !== '',
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Talent Search"
        description="Describe what you're looking for in plain English — Claude AI ranks every candidate."
        action={
          sortedResults !== null && (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {sortedResults.length} / {scannedCount} matched
            </Badge>
          )
        }
      />

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <SearchBar onSearch={(q) => handleSearch(q, filters)} loading={loading} />
        </div>
        <Button
          variant="outline"
          size="default"
          onClick={() => setFiltersOpen((v) => !v)}
          className={cn(
            'shrink-0 h-[50px] gap-2',
            (filtersOpen || activeFilterCount > 0) && 'border-primary text-primary bg-primary/5'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Filter panel ────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {filtersOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Refine Results</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); if (lastQuery) handleSearch(lastQuery, DEFAULT_FILTERS); }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Availability */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Availability</Label>
                  <button
                    onClick={() => setFilter('available', !filters.available)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all',
                      filters.available
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                      filters.available ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/40'
                    )}>
                      {filters.available && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    Available now
                  </button>
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Department</Label>
                  <Select value={filters.department} onValueChange={(v) => setFilter('department', v)}>
                    <SelectTrigger className="h-[42px]">
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min experience */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Min experience (yrs)</Label>
                  <Input
                    type="number" min="0" max="30" placeholder="0"
                    value={filters.minExperience}
                    onChange={(e) => setFilter('minExperience', e.target.value)}
                    className="h-[42px]"
                  />
                </div>

                {/* Max experience */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Max experience (yrs)</Label>
                  <Input
                    type="number" min="0" max="30" placeholder="Any"
                    value={filters.maxExperience}
                    onChange={(e) => setFilter('maxExperience', e.target.value)}
                    className="h-[42px]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => lastQuery && handleSearch(lastQuery, filters)}
                  disabled={!lastQuery}
                  size="sm"
                  className="gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {lastQuery ? 'Re-search with filters' : 'Enter a query first'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 p-4 rounded-xl border border-destructive/25 bg-destructive/5"
          >
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">Search failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-muted-foreground hover:text-foreground transition-colors text-xs shrink-0">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeletons ────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-5">
          <AIThinkingBanner query={lastQuery} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => <SkeletonEmployeeCard key={`skel-${i}`} />)}
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!loading && sortedResults !== null && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {sortedResults.length === 0 ? (
              <NoResultsState query={lastQuery} onReset={() => { setResults(null); setLastQuery(''); }} />
            ) : (
              <div className="space-y-4">
                {/* Results meta bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{sortedResults.length}</span>
                    {scannedCount > sortedResults.length && (
                      <span> (from {scannedCount} scanned)</span>
                    )}
                    {' '}candidates ranked for{' '}
                    <span className="font-medium text-foreground italic">"{lastQuery}"</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</Badge>
                    )}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    <Select value={filters.sortBy} onValueChange={(v) => setFilter('sortBy', v)}>
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Card grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedResults.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <SearchResultCard result={result} rank={i + 1} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Idle state */}
        {!loading && sortedResults === null && !error && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <IdleState onExampleClick={(q) => handleSearch(q, filters)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI thinking banner ───────────────────────────────────────────────────────

const THINKING_STEPS = [
  'Scanning talent pool profiles…',
  'Analysing skill requirements…',
  'Matching candidates semantically…',
  'Computing relevance scores…',
  'Generating AI reasoning…',
];

function AIThinkingBanner({ query }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_STEPS.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary animate-pulse" />
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/30"
          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </div>
      <div className="text-center sm:text-left">
        <p className="font-semibold text-sm">Claude is ranking candidates for "{query}"</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="text-xs text-muted-foreground mt-0.5"
          >
            {THINKING_STEPS[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── No results state ─────────────────────────────────────────────────────────

function NoResultsState({ query, onReset }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-4 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <Users className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-base">No matching candidates</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          No one in your talent pool matched{' '}
          <span className="italic">"{query}"</span>.
          Try a broader query or remove filters.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
        <RotateCcw className="w-3.5 h-3.5" />
        New search
      </Button>
    </div>
  );
}

// ─── Idle / landing state ─────────────────────────────────────────────────────

function IdleState({ onExampleClick }) {
  const [expanded, setExpanded] = useState(false);

  const capabilities = [
    { icon: Brain, text: 'Semantic skill matching' },
    { icon: TrendingUp, text: 'Experience-aware scoring' },
    { icon: MapPin, text: 'Location-aware ranking' },
    { icon: Clock, text: 'Availability filtering' },
    { icon: Sparkles, text: 'Related skill inference' },
    { icon: CheckCircle, text: 'Evidenced reasoning' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero prompt */}
      <div className="flex flex-col items-center text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Search className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Describe the talent you need</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md leading-relaxed">
            Claude AI understands context, infers related skills, and ranks every candidate
            by how well they match — not just keyword hits.
          </p>
        </div>

        {/* Capability chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-lg">
          {capabilities.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary/40 text-xs text-muted-foreground">
              <Icon className="w-3 h-3" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* Example queries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Try these example searches
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors sm:hidden"
          >
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Less</> : <><ChevronDown className="w-3.5 h-3.5" />More</>}
          </button>
        </div>
        <div className={cn(
          'grid grid-cols-1 sm:grid-cols-2 gap-2',
          !expanded && 'max-h-[140px] overflow-hidden sm:max-h-none'
        )}>
          {EXAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => onExampleClick(q)}
              className="group text-left px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-muted-foreground hover:text-foreground"
            >
              <span className="text-primary/50 group-hover:text-primary mr-1.5 transition-colors">→</span>
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
