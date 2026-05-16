export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-64 max-w-full rounded-md bg-muted" />
      </div>
      {/* Profile + stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-56 rounded-xl bg-muted md:col-span-1" />
        <div className="h-56 rounded-xl bg-muted md:col-span-2" />
      </div>
      {/* Skills section */}
      <div className="h-48 rounded-xl bg-muted" />
      {/* Experience */}
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-20 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
