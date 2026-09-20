import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
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
          className="block text-xs font-mono uppercase tracking-wider text-text-high-contrast mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-surface-obsidian border border-white/20 rounded-md px-4 py-2.5 text-optic-white placeholder-text-muted-slate text-sm focus:outline-none focus:border-team-a-core focus:ring-1 focus:ring-team-a-core/40 transition-colors ${
          error ? 'border-state-warning-rose' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs font-mono text-state-warning-rose">{error}</p>
      )}
    </div>
  );
}
