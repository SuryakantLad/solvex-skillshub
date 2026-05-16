'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeCard from '@/components/hr/EmployeeCard';
import { SkeletonEmployeeCard } from '@/components/shared/SkeletonCard';
import EmptyState from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import useDebounce from '@/hooks/useDebounce';

export default function DirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const params = new URLSearchParams();
    if (department !== 'all') params.set('department', department);
    if (debouncedSearch) params.set('skill', debouncedSearch);

    setLoading(true);
    fetch(`/api/employees?${params}`)
      .then((r) => r.json())
      .then(({ employees: emps, pagination }) => {
        setEmployees(emps || []);
        setTotal(pagination?.total || 0);
        if (emps) {
          const depts = [...new Set(emps.map((e) => e.department).filter(Boolean))];
          if (depts.length > 0) setDepartments(depts);
        }
      })
      .finally(() => setLoading(false));
  }, [department, debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Browse and filter your entire talent pool."
        action={<Badge variant="secondary">{total} employees</Badge>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by skill (e.g. React, Python)..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => <SkeletonEmployeeCard key={`skel-${i}`} />)}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={search || department !== 'all' ? 'Try adjusting your filters.' : 'No employees in the database yet. Run the seed endpoint to add demo data.'}
        />
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={{ animate: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {employees.map((emp) => (
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
    </div>
  );
}
