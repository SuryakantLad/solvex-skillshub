'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const CONFIG = {
  default: {
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
    border: 'hover:border-primary/30',
    glow: 'hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.15),0_4px_20px_hsl(var(--primary)/0.06)]',
  },
  success: {
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/30',
    glow: 'hover:shadow-[0_0_0_1px_rgba(16,185,129,0.15),0_4px_20px_rgba(16,185,129,0.06)]',
  },
  warning: {
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    value: 'text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/30',
    glow: 'hover:shadow-[0_0_0_1px_rgba(245,158,11,0.15),0_4px_20px_rgba(245,158,11,0.06)]',
  },
  info: {
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500/30',
    glow: 'hover:shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_4px_20px_rgba(59,130,246,0.06)]',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    value: 'text-violet-600 dark:text-violet-400',
    border: 'hover:border-violet-500/30',
    glow: 'hover:shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_4px_20px_rgba(139,92,246,0.06)]',
  },
};

export default function StatsCard({ title, value, description, icon: Icon, trend, color = 'default' }) {
  const cfg = CONFIG[color] ?? CONFIG.default;

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'rounded-2xl border border-border bg-card p-5 transition-all duration-200 cursor-default',
        cfg.border,
        cfg.glow,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cfg.icon)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className={cn('text-3xl font-black tracking-tight', cfg.value)}>{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className={cn(
            'text-xs font-semibold flex items-center gap-1',
            trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          )}>
            {trend.positive ? '↑' : '↓'} {trend.label}
          </p>
        )}
      </div>
    </motion.div>
  );
}
