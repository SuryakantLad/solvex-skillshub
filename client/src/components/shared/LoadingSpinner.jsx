import { cn } from '@/lib/utils';

const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };

export default function LoadingSpinner({ size = 'md', className }) {
  return (
    <div
      className={cn(
        'border-2 border-border border-t-primary rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
}
