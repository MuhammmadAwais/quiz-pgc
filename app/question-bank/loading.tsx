import React from 'react';
import { Card } from '@/components/ui/Card';
import { Skeleton, QuestionCardSkeleton, SubjectRowSkeleton } from '@/components/ui/Skeleton';

export default function QuestionBankLoading() {
  return (
    <div className="min-h-screen bg-surface-obsidian flex flex-col animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="bg-surface-onyx border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="w-64 h-6 rounded bg-team-a-core/30" />
            <Skeleton className="w-96 h-3 rounded bg-surface-interactive/40" />
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="w-20 h-8 rounded-md bg-surface-interactive/40" />
            <Skeleton className="w-32 h-8 rounded-md bg-surface-interactive/40" />
            <Skeleton className="w-36 h-8 rounded-md bg-team-b-cyan/20 border border-team-b-cyan/30" />
            <Skeleton className="w-32 h-8 rounded-md bg-team-a-core/30 border border-team-a-core/40" />
          </div>
        </div>
      </div>

      {/* 3-Pane Console Grid Skeleton */}
      <div className="max-w-7xl mx-auto w-full p-6 flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Pane 1: Subjects (3 cols) */}
        <div className="md:col-span-3 flex flex-col">
          <Card variant="carbon" className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <Skeleton className="w-28 h-4 rounded bg-surface-interactive/70" />
              <Skeleton className="w-5 h-5 rounded bg-team-a-core/30" />
            </div>

            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <SubjectRowSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>

        {/* Pane 2: Chapters / Topics (3 cols) */}
        <div className="md:col-span-3 flex flex-col">
          <Card variant="carbon" className="flex-1 flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <Skeleton className="w-24 h-4 rounded bg-surface-interactive/70" />
              <Skeleton className="w-5 h-5 rounded bg-team-b-cyan/30" />
            </div>

            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <SubjectRowSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>

        {/* Pane 3: Questions List (6 cols) */}
        <div className="md:col-span-6 flex flex-col">
          <Card variant="carbon" className="flex-1 flex flex-col p-4 space-y-3">
            <div className="pb-3 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="w-36 h-4 rounded bg-surface-interactive/70" />
                <Skeleton className="w-24 h-5 rounded bg-team-b-cyan/20" />
              </div>
              <Skeleton className="w-full h-8 rounded-md bg-surface-obsidian border border-white/10" />
            </div>

            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <QuestionCardSkeleton key={i} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
