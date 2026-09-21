import React from 'react';
import { Skeleton, BookCardSkeleton } from '@/components/ui/Skeleton';

export default function BooksBankLoading() {
  return (
    <div className="min-h-screen bg-surface-obsidian flex flex-col font-sans animate-fade-in">
      {/* Top Action Header Skeleton */}
      <div className="bg-surface-onyx border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="w-36 h-3 rounded bg-surface-interactive/40" />
            <Skeleton className="w-48 h-6 rounded bg-team-b-cyan/30" />
            <Skeleton className="w-80 h-3 rounded bg-surface-interactive/40" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="w-24 h-10 rounded-xl bg-surface-interactive/40" />
            <Skeleton className="w-64 h-10 rounded-xl bg-surface-carbon border border-white/10" />
            <Skeleton className="w-36 h-10 rounded-xl bg-team-b-cyan/20 border border-team-b-cyan/30" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Tag Filters Strip Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Skeleton className="w-28 h-7 rounded-full bg-team-b-cyan/20 shrink-0" />
          <Skeleton className="w-20 h-7 rounded-full bg-surface-carbon shrink-0" />
          <Skeleton className="w-24 h-7 rounded-full bg-surface-carbon shrink-0" />
          <Skeleton className="w-20 h-7 rounded-full bg-surface-carbon shrink-0" />
        </div>

        {/* 6-Card Books Shelf Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
