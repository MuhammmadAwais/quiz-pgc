import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  error,
  rightElement,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={inputId}
          className={`w-full bg-surface-obsidian border border-border-medium rounded-lg px-4 py-2.5 text-optic-white placeholder-text-muted-slate text-sm focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary/40 transition-colors ${
            rightElement ? 'pr-11' : ''
          } ${error ? 'border-state-warning-rose' : ''} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs font-mono text-state-warning-rose">{error}</p>
      )}
    </div>
  );
}
