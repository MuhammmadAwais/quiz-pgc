'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface MysteryBoxGridProps {
  onSelectBox: (index: number) => void;
  selectedBox: number | null;
  activeTeamName: string;
  isTeamA: boolean;
}

export function MysteryBoxGrid({
  onSelectBox,
  selectedBox,
  activeTeamName,
  isTeamA,
}: MysteryBoxGridProps) {
  const boxes = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-full max-w-3xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="space-y-2">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-state-warning-rose flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>SUPER OVER TIE-BREAKER</span>
          <Sparkles className="w-4 h-4" />
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-optic-white font-sans">
          {activeTeamName}: Pick a Mystery Box
        </h2>
        <p className="text-sm text-text-muted-slate font-sans">
          Each box conceals an unused question from a surprise category. Sudden-death rules apply!
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
        {boxes.map((num, idx) => {
          const isPicked = selectedBox === idx;

          return (
            <div
              key={num}
              onClick={() => {
                if (selectedBox === null) {
                  onSelectBox(idx);
                }
              }}
              className={`h-36 rounded-xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-200 select-none ${
                isPicked
                  ? isTeamA
                    ? 'bg-team-a-core/15 border-team-a-bright scale-105'
                    : 'bg-team-b-cyan/15 border-team-b-ice scale-105'
                  : 'bg-surface-carbon border-border-medium hover:border-border-bright hover:scale-102 hover:bg-surface-interactive shadow-sm'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 font-mono text-xl font-extrabold ${
                  isPicked
                    ? isTeamA
                      ? 'bg-team-a-core text-white'
                      : 'bg-team-b-cyan text-white'
                    : 'bg-surface-onyx border border-border-subtle text-optic-white'
                }`}
              >
                {num}
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted-slate">
                MYSTERY BOX
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
