import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'carbon' | 'onyx' | 'interactive';
  children: React.ReactNode;
}

export function Card({
  variant = 'carbon',
  className = '',
  children,
  ...props
}: CardProps) {
  const variantClasses = {
    carbon: 'bg-surface-carbon border-border-subtle shadow-obsidian-card',
    onyx: 'bg-surface-onyx border-border-subtle',
    interactive: 'bg-surface-interactive border-border-medium',
  };

  return (
    <div
      className={`border rounded-lg p-6 text-optic-white ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
