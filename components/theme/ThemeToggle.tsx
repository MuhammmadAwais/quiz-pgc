'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 cursor-pointer border border-border-medium hover:border-border-bright bg-surface-subtle hover:bg-surface-interactive text-text-secondary hover:text-text-primary ${className}`}
      title={isDark ? 'Switch to Light Mode (Indigo Periwinkle)' : 'Switch to Dark Mode (Deep Slate & Petroleum)'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-brand-primary transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
