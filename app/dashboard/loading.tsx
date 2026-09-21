import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton, MetricCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in transition-colors duration-200">
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton className="w-36 h-3 rounded bg-team-b-cyan/30" />
          <Skeleton className="w-64 h-8 rounded bg-surface-interactive/80" />
          <Skeleton className="w-96 h-3.5 rounded bg-surface-interactive/40" />
        </div>

        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-10 rounded-md bg-surface-interactive/40" />
          <Skeleton className="w-40 h-10 rounded-md bg-team-a-core/30 border border-team-a-core/40" />
        </div>
      </div>

      {/* Global Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>

      {/* Quick Launch & Contest History Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Contests Ledger Skeleton */}
        <Card variant="carbon" className="lg:col-span-2 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <Skeleton className="w-40 h-4 rounded bg-surface-interactive/70" />
            <Skeleton className="w-20 h-4 rounded bg-surface-interactive/40" />
          </div>

          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-surface-onyx/70 border border-border-subtle flex items-center justify-between gap-4 skeleton-shimmer"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Skeleton className="w-8 h-8 rounded-lg bg-surface-interactive/50 shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="w-48 h-4 rounded bg-surface-interactive/70" />
                    <Skeleton className="w-24 h-3 rounded bg-surface-interactive/30" />
                  </div>
                </div>
                <Skeleton className="w-20 h-6 rounded bg-surface-interactive/50 shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* Right 1 Col: Match Rules & Defaults */}
        <Card variant="carbon" className="p-6 space-y-5">
          <Skeleton className="w-36 h-4 rounded bg-surface-interactive/70" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-3.5 rounded-lg bg-surface-onyx/50 border border-border-subtle space-y-1.5">
                <Skeleton className="w-28 h-3 rounded bg-surface-interactive/60" />
                <Skeleton className="w-44 h-4 rounded bg-surface-interactive/40" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
