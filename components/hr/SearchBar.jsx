'use client';

import { useState } from 'react';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Senior React developer with 5+ years AWS experience',
  'Python ML engineer with NLP and transformers knowledge',
  'Full stack engineer with Node.js and PostgreSQL',
  'DevOps engineer certified in Kubernetes and Terraform',
  'Mobile developer experienced in React Native and Swift',
];

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = (q) => {
    const searchQuery = q || query;
    if (searchQuery.trim().length < 3) return;
    setQuery(searchQuery);
    onSearch(searchQuery);
    setFocused(false);
  };

  return (
    <div className="relative w-full">
      <div className={cn(
        'flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-all',
        focused ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      )}>
        {loading
          ? <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
          : <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        }
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Describe the talent you're looking for in natural language..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          disabled={loading}
        />
        <Button
          onClick={() => handleSearch()}
          disabled={loading || query.trim().length < 3}
          size="sm"
          className="shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Search
        </Button>
      </div>

      {/* Suggestions dropdown */}
      {focused && query.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-20 overflow-hidden">
          <div className="p-2">
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested searches
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onMouseDown={() => handleSearch(s)}
                className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
