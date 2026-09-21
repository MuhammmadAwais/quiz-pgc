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

  // State styling determination (Zero glows, clean architectural borders and fills)
  let borderBgClass = 'bg-surface-carbon border border-border-subtle text-optic-white hover:bg-surface-interactive hover:border-border-bright';

  if (isSubmitted) {
    if (isCorrect) {
      borderBgClass = 'bg-state-success/15 border-2 border-state-success text-optic-white';
    } else if (isSelected && !isCorrect) {
      borderBgClass = 'bg-state-warning-rose/15 border-2 border-state-warning-rose text-optic-white';
    } else {
      borderBgClass = 'bg-surface-onyx/60 border border-border-subtle text-text-muted-slate opacity-50';
    }
  } else if (isSelected) {
    if (isTeamA) {
      borderBgClass = 'bg-team-a-core/15 border-2 border-team-a-core text-optic-white';
    } else {
      borderBgClass = 'bg-team-b-cyan/15 border-2 border-team-b-cyan text-optic-white';
    }
  }

  return (
    <div
      onClick={() => {
        if (!disabled && !isSubmitted) {
          onSelect();
        }
      }}
      className={`relative p-5 md:p-6 rounded-xl transition-all duration-150 flex items-center gap-4 cursor-pointer select-none ${borderBgClass} ${
        disabled ? 'cursor-not-allowed opacity-50' : 'active:scale-[0.99]'
      }`}
    >
      {/* Letter Indicator */}
      <div
        className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center font-sans text-base md:text-lg font-bold shrink-0 transition-colors ${
          isSubmitted && isCorrect
            ? 'bg-state-success text-white'
            : isSubmitted && isSelected && !isCorrect
            ? 'bg-state-warning-rose text-white'
            : isSelected
            ? isTeamA
              ? 'bg-team-a-core text-white'
              : 'bg-team-b-cyan text-white'
            : 'bg-surface-onyx border border-border-medium text-text-bright-slate'
        }`}
      >
        {letter}
      </div>

      {/* Option Text */}
      <div className="flex-1">
        <p className="text-body-xl font-medium tracking-normal leading-relaxed">
          {text}
        </p>
      </div>

      {/* Result Indicator Icon */}
      {isSubmitted && (
        <div className="shrink-0">
          {isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-state-success animate-in zoom-in-50 duration-200" />
          ) : isSelected ? (
            <XCircle className="w-6 h-6 text-state-warning-rose animate-in zoom-in-50 duration-200" />
          ) : null}
        </div>
      )}
    </div>
  );
}
