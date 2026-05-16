'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Brain, LayoutDashboard, Users, Search, Wrench, User,
  FileText, LogOut, ChevronLeft, ChevronRight, X,
  Sun, Moon, Monitor, BarChart3, MessageSquare, Upload, Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials, getAvatarUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';

const HR_LINKS = [
  { href: '/hr', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/hr/directory', icon: Users, label: 'Directory' },
  { href: '/hr/search', icon: Search, label: 'AI Search' },
  { href: '/hr/team-builder', icon: Wrench, label: 'Team Builder' },
  { href: '/hr/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/hr/chat', icon: MessageSquare, label: 'AI Chat' },
  { href: '/hr/bulk-import', icon: Upload, label: 'Bulk Import' },
];

const EMPLOYEE_LINKS = [
  { href: '/employee', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/employee/profile', icon: User, label: 'My Profile' },
  { href: '/employee/resume', icon: FileText, label: 'Resume' },
  { href: '/employee/github', icon: Github, label: 'GitHub' },
];

function ThemeCycler({ collapsed }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const cycles = ['light', 'dark', 'system'];
  const icons = { light: Sun, dark: Moon, system: Monitor };
  const next = cycles[(cycles.indexOf(theme) + 1) % cycles.length];
  const Icon = icons[resolvedTheme] ?? Monitor;

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme} (click to change)`}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
        collapsed && 'justify-center'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className={cn(
        'capitalize transition-[opacity,width] duration-150 overflow-hidden whitespace-nowrap',
        collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
      )}>
        {theme} mode
      </span>
    </button>
  );
}

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const links = user?.role === 'hr' ? HR_LINKS : EMPLOYEE_LINKS;
  const isHR = user?.role === 'hr';

  function isActive(link) {
    if (link.exact) return pathname === link.href;
    return pathname === link.href || pathname.startsWith(link.href + '/');
  }

  return (
    // CSS transition replaces motion.aside — no JS animation loop, no React re-renders during collapse
    <aside
      className={cn(
        'relative flex flex-col h-full border-r border-border bg-card shrink-0 overflow-hidden',
        'transition-[width] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0 overflow-hidden">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-glow-sm shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className={cn(
          'font-bold text-sm flex-1 truncate transition-[opacity,transform] duration-150',
          collapsed ? 'opacity-0 -translate-x-2 pointer-events-none' : 'opacity-100 translate-x-0'
        )}>
          TalentGraph AI
        </span>
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Role label ───────────────────────────────────────────────────── */}
      <div className={cn(
        'overflow-hidden transition-[max-height,opacity] duration-150',
        collapsed ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
      )}>
        <div className="px-4 pt-4 pb-1">
          <div className={cn(
            'inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest',
            isHR
              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          )}>
            {isHR ? 'HR Dashboard' : 'Employee Portal'}
          </div>
        </div>
      </div>

      {/* ── Nav links ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {links.map((link) => {
          const active = isActive(link);
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              onClick={onClose}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 group',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center'
              )}
            >
              {/* Active background — still uses Framer layoutId for the spring slide effect */}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <link.icon className={cn(
                'w-4 h-4 shrink-0 relative z-10 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )} />
              <span className={cn(
                'relative z-10 transition-[opacity,width] duration-150 overflow-hidden whitespace-nowrap',
                collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
              )}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom section ───────────────────────────────────────────────── */}
      <div className="border-t border-border p-2 space-y-0.5 shrink-0">
        <ThemeCycler collapsed={collapsed} />

        {/* User profile card */}
        <div className={cn(
          'overflow-hidden transition-[max-height,opacity] duration-150',
          (!collapsed && user) ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
        )}>
          {user && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
              <Avatar className="w-7 h-7 shrink-0 ring-2 ring-primary/20">
                <AvatarImage src={getAvatarUrl(user.name || '')} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {getInitials(user.name || '?')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-destructive/8 hover:text-destructive transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className={cn(
            'transition-[opacity,width] duration-150 overflow-hidden whitespace-nowrap',
            collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
          )}>
            Sign out
          </span>
        </button>
      </div>

      {/* ── Collapse toggle (desktop only) ──────────────────────────────── */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-background border border-border items-center justify-center shadow-sm hover:bg-secondary hover:border-primary/30 transition-all z-20"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        }
      </button>
    </aside>
  );
}
