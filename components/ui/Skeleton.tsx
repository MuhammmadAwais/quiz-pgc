import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  shimmer?: boolean;
}

/**
 * Base atomic Skeleton block with Dual Theme styling.
 */
export function Skeleton({
  className = '',
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`bg-surface-onyx/80 border border-border-subtle rounded-md ${
        shimmer ? 'skeleton-shimmer' : 'animate-pulse'
      } ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton for Question Card in Question Bank.
 */
export function QuestionCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-surface-onyx border border-border-subtle space-y-3 skeleton-shimmer">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          <Skeleton className="w-6 h-4 rounded bg-surface-interactive/60 shrink-0 mt-0.5" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-4/5 h-4 rounded bg-surface-interactive/60" />
            <Skeleton className="w-2/3 h-3.5 rounded bg-surface-interactive/40" />
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Skeleton className="w-6 h-6 rounded bg-surface-interactive/40" />
          <Skeleton className="w-6 h-6 rounded bg-surface-interactive/40" />
        </div>
      </div>

      {/* 2x2 Option Preview Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-border-subtle">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded bg-surface-carbon/80 border border-border-subtle"
          >
            <Skeleton className="w-4 h-3.5 rounded bg-surface-interactive/60 shrink-0" />
            <Skeleton className="w-3/4 h-3 rounded bg-surface-interactive/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Textbook Card in Books Bank.
 */
export function BookCardSkeleton() {
  return (
    <div className="p-5 rounded-2xl bg-surface-carbon border border-border-subtle flex flex-col justify-between shadow-sm space-y-4 skeleton-shimmer">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-surface-onyx border border-border-medium flex items-center justify-center shrink-0">
              <Skeleton className="w-5 h-5 rounded-md bg-surface-interactive/80" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="w-5/6 h-4 rounded bg-surface-interactive/70" />
              <div className="flex items-center gap-2">
                <Skeleton className="w-16 h-3 rounded bg-surface-interactive/40" />
                <Skeleton className="w-12 h-3 rounded bg-surface-interactive/30" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Skeleton className="w-7 h-7 rounded-lg bg-surface-interactive/40" />
            <Skeleton className="w-7 h-7 rounded-lg bg-surface-interactive/40" />
          </div>
        </div>

        {/* Tag pills */}
        <div className="flex items-center gap-1.5 pt-1 min-h-[26px]">
          <Skeleton className="w-16 h-5 rounded-md bg-surface-onyx" />
          <Skeleton className="w-20 h-5 rounded-md bg-surface-onyx" />
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
        <Skeleton className="w-16 h-4 rounded bg-surface-interactive/40" />
        <Skeleton className="w-28 h-9 rounded-xl bg-team-b-cyan/20 border border-team-b-cyan/30" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Subject Row / Card in Question Bank & Match Setup.
 */
export function SubjectRowSkeleton() {
  return (
    <div className="p-3 rounded-xl border border-border-subtle bg-surface-onyx/40 flex items-center justify-between gap-3 skeleton-shimmer">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-5 h-5 rounded border border-border-medium bg-surface-carbon shrink-0" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <Skeleton className="w-3/5 h-3.5 rounded bg-surface-interactive/60" />
          <Skeleton className="w-2/5 h-2.5 rounded bg-surface-interactive/30" />
        </div>
      </div>
      <Skeleton className="w-6 h-6 rounded-md bg-surface-interactive/40 shrink-0" />
    </div>
  );
}

/**
 * Skeleton for Dashboard Telemetry Metric Card.
 */
export function MetricCardSkeleton() {
  return (
    <div className="p-6 rounded-lg bg-surface-carbon border border-border-subtle flex items-center gap-5 skeleton-shimmer">
      <div className="w-12 h-12 rounded-xl bg-surface-onyx border border-border-medium shrink-0 flex items-center justify-center">
        <Skeleton className="w-6 h-6 rounded-md bg-surface-interactive/60" />
      </div>
      <div className="space-y-2 flex-1">
        <Skeleton className="w-28 h-3 rounded bg-surface-interactive/40" />
        <Skeleton className="w-16 h-7 rounded bg-surface-interactive/80" />
      </div>
    </div>
  );
}
