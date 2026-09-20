'use client';

import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

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
    <div className="w-full max-w-3xl mx-auto text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="space-y-2">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-state-warning-rose flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>SUPER OVER TIE-BREAKER</span>
          <Sparkles className="w-4 h-4" />
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-optic-white">
          {activeTeamName}: Pick a Mystery Box
        </h2>
        <p className="text-sm text-text-muted-slate">
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
              className={`h-36 rounded-xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 select-none ${
                isPicked
                  ? isTeamA
                    ? 'bg-team-a-core/20 border-team-a-bright glow-team-a scale-105'
                    : 'bg-team-b-cyan/20 border-team-b-ice glow-team-b scale-105'
                  : 'bg-surface-carbon border-white/15 hover:border-white/40 hover:scale-105 hover:bg-surface-interactive shadow-[0_12px_24px_rgba(0,0,0,0.6)]'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 font-mono text-xl font-extrabold ${
                  isPicked
                    ? isTeamA
                      ? 'bg-team-a-core text-surface-obsidian'
                      : 'bg-team-b-cyan text-surface-obsidian'
                    : 'bg-surface-obsidian border border-white/20 text-optic-white'
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
