'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Brain } from 'lucide-react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

export default function DashboardShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const closeSidebar = useCallback(() => setMobileOpen(false), []);
  const openSidebar  = useCallback(() => setMobileOpen(true),  []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile backdrop — button so it is keyboard/screen-reader accessible */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 w-full bg-black/50 backdrop-blur-sm lg:hidden cursor-default"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar wrapper — handles mobile slide */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 h-full',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:transition-none',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={openSidebar}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors -ml-1"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">TalentGraph AI</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
