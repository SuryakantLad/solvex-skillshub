import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ className, size = 'default', text }) {
  const sizes = { sm: 'w-4 h-4', default: 'w-6 h-6', lg: 'w-8 h-8' };

  if (text) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 className={cn('animate-spin text-primary', sizes[size])} />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  return <Loader2 className={cn('animate-spin text-primary', sizes[size], className)} />;
}
