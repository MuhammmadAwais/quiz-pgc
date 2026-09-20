'use client';

import React from 'react';
import { Check, X, AlertTriangle, Inbox } from 'lucide-react';
import { useAiStudioStore } from '@/lib/store/useAiStudioStore';

export function ReviewProgressRail() {
  const { stagedQuestions, activeCardIndex, setActiveCardIndex } = useAiStudioStore();

  if (stagedQuestions.length === 0) return null;

  return (
    <div className="w-full lg:w-48 shrink-0 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted-slate">
          Questions ({stagedQuestions.length})
        </span>
      </div>

      <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto max-h-[60vh] pb-2 lg:pb-0 pr-1">
        {stagedQuestions.map((q, idx) => {
          const isActive = idx === activeCardIndex;
          const isAccepted = q.reviewStatus === 'ACCEPTED';
          const isRejected = q.reviewStatus === 'REJECTED';
          const hasWarnings = q.warnings && q.warnings.length > 0;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveCardIndex(idx)}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all text-left cursor-pointer shrink-0 lg:shrink ${
                isActive
                  ? 'bg-team-b-cyan/20 border-team-b-cyan text-optic-white shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                  : 'bg-surface-carbon border-white/10 hover:bg-surface-interactive text-text-muted-slate'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold min-w-[20px]">#{idx + 1}</span>
                {hasWarnings && (
                  <span title={q.warnings?.[0] || 'Please check this question'}>
                    <AlertTriangle className="w-3 h-3 text-state-warning-rose shrink-0" />
                  </span>
                )}
                <span className="truncate text-[11px] hidden lg:inline max-w-[80px]">
                  {q.prompt.slice(0, 15)}...
                </span>
              </div>

              <div className="shrink-0 ml-1.5">
                {isAccepted && (
                  <span className="w-4 h-4 rounded-full bg-state-success/20 border border-state-success/40 flex items-center justify-center text-state-success">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {isRejected && (
                  <span className="w-4 h-4 rounded-full bg-state-warning-rose/20 border border-state-warning-rose/40 flex items-center justify-center text-state-warning-rose">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
                {!isAccepted && !isRejected && (
                  <span className="w-4 h-4 rounded-full bg-surface-interactive flex items-center justify-center text-text-muted-slate">
                    <Inbox className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
