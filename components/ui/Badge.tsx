import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'team-a' | 'team-b' | 'neutral';
  children: React.ReactNode;
}

export function Badge({
  variant = 'neutral',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variantClasses = {
    'success': 'bg-state-success/15 border-state-success/40 text-state-success',
    'warning': 'bg-state-warning-rose/15 border-state-warning-rose/40 text-state-warning-rose',
    'team-a': 'bg-team-a-core/15 border-team-a-core/40 text-team-a-bright',
    'team-b': 'bg-team-b-cyan/15 border-team-b-cyan/40 text-team-b-ice',
    'neutral': 'bg-surface-onyx border-white/15 text-text-high-contrast',
  };

  return (
    <span
      className={`inline-flex items-center label-caps px-2.5 py-0.5 rounded border ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
