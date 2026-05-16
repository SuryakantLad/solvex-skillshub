export default function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="sm:shrink-0">{action}</div>}
    </div>
  );
}
