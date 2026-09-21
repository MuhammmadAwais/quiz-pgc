'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, BookOpen, Library, LayoutDashboard, Settings, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <>
      <nav className="sticky top-0 z-40 w-full bg-surface-obsidian/90 backdrop-blur-md border-b border-border-subtle px-4 sm:px-6 py-3.5 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-team-a-core flex items-center justify-center border border-border-bright/30 transition-all">
              <Swords className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-optic-white flex items-center gap-1.5 font-sans">
                PGC <span className="text-team-b-cyan">ARENA</span>
              </span>
              <span className="font-mono text-[9px] text-text-muted-slate uppercase tracking-wider hidden sm:block">
                Tournament Engine
              </span>
            </div>
          </Link>

          {/* Center Navigation Links — desktop only */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
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

          {/* Right Section: Theme Toggle, Admin badge, Logout — desktop */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md border border-border-medium bg-surface-onyx text-xs font-mono text-text-high-contrast">
              <span className="w-2 h-2 rounded-full bg-team-b-cyan" />
              <span>ADMIN</span>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors cursor-pointer border border-transparent hover:border-state-warning-rose/20"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-text-bright-slate hover:text-optic-white hover:bg-surface-onyx transition-colors cursor-pointer"
              title="Toggle menu"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Slide-Down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[57px] left-0 right-0 z-30 bg-surface-obsidian/97 backdrop-blur-md border-b border-border-subtle shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-surface-carbon text-team-a-bright border border-border-medium shadow-sm'
                      : 'text-text-bright-slate hover:text-optic-white hover:bg-surface-onyx'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-team-a-bright' : 'text-text-muted-slate'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-border-subtle flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2 text-xs font-mono text-text-high-contrast">
                <span className="w-2 h-2 rounded-full bg-team-b-cyan" />
                <span>ADMIN</span>
              </div>
              <button
                onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted-slate hover:text-state-warning-rose hover:bg-state-warning-rose/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
