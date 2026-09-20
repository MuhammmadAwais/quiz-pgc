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
    carbon: 'bg-surface-carbon border-white/10 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.85)]',
    onyx: 'bg-surface-onyx border-white/8',
    interactive: 'bg-surface-interactive border-white/15',
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
