'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'team-a' | 'team-b' | 'console' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'console',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-semibold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantClasses = {
    'team-a':
      'bg-team-a-core hover:brightness-110 text-white shadow-sm border border-team-a-bright/30',
    'team-b':
      'bg-team-b-cyan hover:brightness-110 text-white shadow-sm border border-team-b-ice/30',
    'console':
      'bg-surface-carbon hover:bg-surface-interactive text-text-primary border border-border-medium hover:border-border-bright shadow-sm',
    'danger':
      'bg-state-warning-rose/15 hover:bg-state-warning-rose/25 text-state-warning-rose border border-state-warning-rose/40 hover:border-state-warning-rose',
    'ghost':
      'bg-transparent hover:bg-surface-onyx text-text-bright-slate hover:text-optic-white',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
