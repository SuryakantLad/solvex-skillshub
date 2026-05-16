import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Users } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmployeeCard from '@/components/hr/EmployeeCard';
import EmptyState from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import useDebounce from '@/hooks/useDebounce';
import { listEmployees } from '@/services/employeeService';
import { getDepartments } from '@/services/searchService';

export default function DirectoryPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    getDepartments().then(({ departments: d }) => setDepartments(d ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    listEmployees({ department, skill: debouncedSearch })
      .then(({ employees: emps, pagination }) => {
        setEmployees(emps ?? []);
        setTotal(pagination?.total ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [department, debouncedSearch]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Browse and filter your entire talent pool."
        action={<Badge variant="secondary">{total} employees</Badge>}
      />

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
            {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={search || department !== 'all' ? 'Try adjusting your filters.' : 'No employees yet. Use Bulk Import or seed the database.'}
        />
      ) : (
        <motion.div
          initial="initial" animate="animate"
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
