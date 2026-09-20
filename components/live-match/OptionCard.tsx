'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface OptionCardProps {
  letter: string;
  text: string;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrect: boolean;
  teamTurn: 'TEAM_A' | 'TEAM_B';
  onSelect: () => void;
  disabled: boolean;
}

export function OptionCard({
  letter,
  text,
  isSelected,
  isSubmitted,
  isCorrect,
  teamTurn,
  onSelect,
  disabled,
}: OptionCardProps) {
  const isTeamA = teamTurn === 'TEAM_A';

  // State styling determination
  let borderBgClass = 'bg-surface-carbon border border-white/10 text-optic-white hover:bg-surface-interactive hover:border-white/30';
  let glowClass = '';

  if (isSubmitted) {
    if (isCorrect) {
      borderBgClass = 'bg-state-success/15 border-2 border-state-success text-optic-white shadow-[0_0_24px_rgba(34,211,238,0.45)]';
      glowClass = 'glow-success';
    } else if (isSelected && !isCorrect) {
      borderBgClass = 'bg-state-warning-rose/15 border-2 border-state-warning-rose text-optic-white shadow-[0_0_24px_rgba(225,29,72,0.45)]';
      glowClass = 'glow-miss';
    } else {
      borderBgClass = 'bg-surface-onyx/60 border border-white/5 text-text-muted-slate opacity-60';
    }
  } else if (isSelected) {
    if (isTeamA) {
      borderBgClass = 'bg-team-a-core/15 border-2 border-team-a-core text-optic-white shadow-[0_0_20px_rgba(139,92,246,0.35)]';
    } else {
      borderBgClass = 'bg-team-b-cyan/15 border-2 border-team-b-cyan text-optic-white shadow-[0_0_20px_rgba(6,182,212,0.35)]';
    }
  }

  return (
    <div
      onClick={() => {
        if (!disabled && !isSubmitted) {
          onSelect();
        }
      }}
      className={`relative p-5 md:p-6 rounded-xl transition-all duration-200 flex items-center gap-4 cursor-pointer select-none ${borderBgClass} ${glowClass} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-[0.99]'
      }`}
    >
      {/* Letter Indicator */}
      <div
        className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center font-mono text-base md:text-lg font-bold shrink-0 transition-colors ${
          isSubmitted && isCorrect
            ? 'bg-state-success text-surface-obsidian'
            : isSubmitted && isSelected && !isCorrect
            ? 'bg-state-warning-rose text-surface-obsidian'
            : isSelected
            ? isTeamA
              ? 'bg-team-a-core text-surface-obsidian'
              : 'bg-team-b-cyan text-surface-obsidian'
            : 'bg-surface-obsidian border border-white/20 text-text-bright-slate'
        }`}
      >
        {letter}
      </div>

      {/* Option Text */}
      <div className="flex-1">
        <p className="text-base md:text-xl font-semibold tracking-wide leading-relaxed">
          {text}
        </p>
      </div>

      {/* Result Indicator Icon */}
      {isSubmitted && (
        <div className="shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-state-success animate-in zoom-in-50 duration-300" />
          ) : isSelected ? (
            <XCircle className="w-6 h-6 text-state-warning-rose animate-in zoom-in-50 duration-300" />
          ) : null}
        </div>
      )}
    </div>
  );
}
