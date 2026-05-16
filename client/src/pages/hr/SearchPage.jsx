import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Filter, Loader2, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeCard from '@/components/hr/EmployeeCard';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { semanticSearch, getDepartments } from '@/services/searchService';

const EXAMPLES = [
  'Senior React developer with TypeScript and team lead experience',
  'Machine learning engineer with Python and cloud deployment skills',
  'Full-stack developer available for new projects',
  'DevOps engineer with Kubernetes and CI/CD expertise',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ department: 'all', availability: 'all', minExperience: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getDepartments().then(({ departments: d }) => setDepartments(d ?? [])).catch(() => {});
  }, []);

  async function handleSearch(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const filterPayload = {};
      if (filters.department !== 'all') filterPayload.department = filters.department;
      if (filters.availability !== 'all') filterPayload.availability = filters.availability === 'available';
      if (filters.minExperience) filterPayload.minExperience = Number(filters.minExperience);
      const data = await semanticSearch(q, filterPayload);
      setResults(data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Semantic Search"
        description="Describe who you're looking for in plain English. AI will find the best matches."
      />

      {/* Search box */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="e.g. Senior React developer with TypeScript experience..."
              className="pl-9 h-11 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={() => setShowFilters((v) => !v)} variant="outline" size="icon" className="h-11 w-11 shrink-0">
            <Filter className="w-4 h-4" />
          </Button>
          <Button onClick={() => handleSearch()} disabled={loading || !query.trim()} className="h-11 px-5 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Select value={filters.department} onValueChange={(v) => setFilters((f) => ({ ...f, department: v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filters.availability} onValueChange={(v) => setFilters((f) => ({ ...f, availability: v }))}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Availability" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any availability</SelectItem>
                    <SelectItem value="available">Available now</SelectItem>
                    <SelectItem value="unavailable">Not available</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Min. years exp."
                  type="number"
                  className="w-[140px]"
                  value={filters.minExperience}
                  onChange={(e) => setFilters((f) => ({ ...f, minExperience: e.target.value }))}
                />
                <Button variant="ghost" size="sm" onClick={() => setFilters({ department: 'all', availability: 'all', minExperience: '' })}>
                  <X className="w-3.5 h-3.5 mr-1" />Clear
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Example queries */}
        {!results && !loading && (
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => { setQuery(ex); handleSearch(ex); }}
                className="px-3 py-1.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-border"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium">AI is analyzing your query…</p>
          <p className="text-xs text-muted-foreground">Searching {results?.searchedCount ?? '…'} profiles with semantic matching</p>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{results.results?.length ?? 0}</span> matches
              {results.searchedCount && <> from {results.searchedCount} profiles</>}
            </p>
            {results.interpretation && (
              <Badge variant="secondary" className="text-xs max-w-xs truncate">{results.interpretation}</Badge>
            )}
          </div>

          {results.results?.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matching candidates"
              description="Try broadening your search or removing filters."
            />
          ) : (
            <motion.div
              initial="initial" animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.06 } } }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {results.results.map((r) => (
                <motion.div
                  key={r.employee?._id}
                  variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
                  className="h-full"
                >
                  <EmployeeCard
                    employee={r.employee}
                    matchScore={r.matchScore}
                    matchLevel={r.matchLevel}
                    keyStrengths={r.keyStrengths}
                    reasoning={r.reasoning}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
