import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton, SubjectRowSkeleton } from '@/components/ui/Skeleton';

export default function MatchSetupLoading() {
  return (
    <div className="min-h-screen bg-surface-obsidian p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1.5">
          <Skeleton className="w-56 h-7 rounded bg-team-a-core/30" />
          <Skeleton className="w-80 h-3 rounded bg-surface-interactive/40" />
        </div>
        <Skeleton className="w-40 h-8 rounded-md bg-surface-interactive/30" />
      </div>

      {/* Two Column Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Teams Card */}
          <Card variant="carbon" className="p-5 space-y-4">
            <Skeleton className="w-32 h-3.5 rounded bg-surface-interactive/60" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="w-full h-10 rounded-md bg-surface-obsidian border border-white/10" />
              <Skeleton className="w-full h-10 rounded-md bg-surface-obsidian border border-white/10" />
            </div>
          </Card>

          {/* Subjects Card */}
          <Card variant="carbon" className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <Skeleton className="w-44 h-3.5 rounded bg-surface-interactive/60" />
              <Skeleton className="w-16 h-3 rounded bg-surface-interactive/40" />
            </div>
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <SubjectRowSkeleton key={i} />
              ))}
            </div>
          </Card>

          {/* Match Rules Card */}
          <Card variant="carbon" className="p-5 space-y-4">
            <Skeleton className="w-28 h-3.5 rounded bg-surface-interactive/60" />
            <div className="flex items-center justify-between">
              <Skeleton className="w-48 h-4 rounded bg-surface-interactive/40" />
              <Skeleton className="w-24 h-8 rounded-md bg-surface-carbon border border-white/10" />
            </div>
          </Card>
        </div>

        {/* Right Column: Live Match Validation Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="carbon" className="p-6 space-y-6 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <Skeleton className="w-36 h-4 rounded bg-surface-interactive/70" />
              <Skeleton className="w-20 h-5 rounded-full bg-team-b-cyan/20" />
            </div>

            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="w-32 h-3.5 rounded bg-surface-interactive/50" />
                  <Skeleton className="w-16 h-4 rounded bg-surface-interactive/70" />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Skeleton className="w-full h-12 rounded-xl bg-team-a-core/20 border border-team-a-core/30" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
