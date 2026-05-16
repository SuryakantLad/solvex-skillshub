import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeCard from '@/components/hr/EmployeeCard';
import EmptyState from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useDebounce from '@/hooks/useDebounce';
import { listEmployees } from '@/services/employeeService';
import { getDepartments } from '@/services/searchService';

const PAGE_SIZE = 12;

export default function DirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [availability, setAvailability] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    getDepartments().then(({ departments: d }) => setDepartments(d ?? [])).catch(() => {});
  }, []);

  const fetchEmployees = useCallback(() => {
    setLoading(true);
    listEmployees({ department, skill: debouncedSearch, page, limit: PAGE_SIZE })
      .then(({ employees: emps, pagination }) => {
        setEmployees(emps ?? []);
        setTotal(pagination?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [department, debouncedSearch, page]);

  useEffect(() => {
    setPage(1);
  }, [department, debouncedSearch, availability]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  function clearFilters() {
    setSearch('');
    setDepartment('all');
    setAvailability('all');
    setPage(1);
  }

  const hasFilters = search || department !== 'all' || availability !== 'all';
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side availability filter
  const displayed = availability === 'all'
    ? employees
    : employees.filter((e) => availability === 'available' ? e.availability?.isAvailable : !e.availability?.isAvailable);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Employee Directory"
          description="Browse and filter your entire talent pool."
        />
        <Badge variant="secondary" className="shrink-0 mt-1">{total} employees</Badge>
      </div>

      {/* Search + filter bar */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Filter by skill (e.g. React, Python, AWS)…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            className="shrink-0"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                <Select value={department} onValueChange={(v) => { setDepartment(v); setPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any availability</SelectItem>
                    <SelectItem value="available">Available now</SelectItem>
                    <SelectItem value="unavailable">Not available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5">
            {search && (
              <Badge variant="secondary" className="gap-1 pr-1">
                Skill: {search}
                <button onClick={() => setSearch('')} className="ml-0.5 hover:opacity-60"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            )}
            {department !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {department}
                <button onClick={() => setDepartment('all')} className="ml-0.5 hover:opacity-60"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            )}
            {availability !== 'all' && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {availability === 'available' ? 'Available' : 'Not available'}
                <button onClick={() => setAvailability('all')} className="ml-0.5 hover:opacity-60"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {['a', 'b', 'c', 'd', 'e', 'f'].map((k) => <Skeleton key={k} className="h-52 rounded-2xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={hasFilters ? 'Try adjusting or clearing your filters.' : 'No employees yet. Use Bulk Import to add employees.'}
          action={hasFilters ? <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button> : null}
        />
      ) : (
        <motion.div
          initial="initial" animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.04 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {displayed.map((emp) => (
            <motion.div
              key={emp._id}
              variants={{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }}
              className="h-full"
            >
              <EmployeeCard employee={emp} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {total} employees
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              return p <= totalPages ? (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ) : null;
            })}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
