'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, BookOpen, Library, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide the global navbar during active live match on stage
  if (pathname === '/live-match' || pathname === '/') {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Question Bank', href: '/question-bank', icon: BookOpen },
    { label: 'Books Bank', href: '/books-bank', icon: Library },
    { label: 'New Match', href: '/match-setup', icon: Swords },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-surface-obsidian/90 backdrop-blur-md border-b border-border-subtle px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-team-a-core flex items-center justify-center border border-border-bright/30 transition-all">
            <Swords className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-wider text-optic-white flex items-center gap-1.5 font-sans">
              PGC <span className="text-team-b-cyan">ARENA</span>
            </span>
            <span className="font-mono text-[9px] text-text-muted-slate uppercase tracking-wider">
              Tournament Engine
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-surface-carbon text-team-a-bright border border-border-medium shadow-sm'
                    : 'text-text-bright-slate hover:text-optic-white hover:bg-surface-onyx'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-team-a-bright' : 'text-text-muted-slate'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Section: Theme Toggle & Admin Profile */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md border border-border-medium bg-surface-onyx text-xs font-mono text-text-high-contrast">
            <span className="w-2 h-2 rounded-full bg-team-b-cyan" />
            <span>ADMIN</span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors cursor-pointer border border-transparent hover:border-state-warning-rose/20"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
