'use client';

import React from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { getTextContrastColor } from '@/lib/utils/color';

interface OptionCardProps {
  letter: string;
  text: string;
  isSelected: boolean;
  isSubmitted: boolean;
  isCorrect: boolean;
  teamTurn: 'TEAM_A' | 'TEAM_B';
  teamColor?: string;
  points?: number;
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
  teamColor,
  points = 10,
  onSelect,
  disabled,
}: OptionCardProps) {
  const isTeamA = teamTurn === 'TEAM_A';
  const fallbackColor = isTeamA ? '#8B5CF6' : '#06B6D4';
  const effectiveTeamColor = teamColor || fallbackColor;
  const teamTextColor = getTextContrastColor(effectiveTeamColor);

  // Dynamic styling state machine
  let borderBgClass =
    'bg-surface-carbon border border-border-subtle text-optic-white hover:bg-surface-interactive hover:border-border-bright';
  let animationClass = '';
  let inlineStyle: React.CSSProperties = {};

  if (isSubmitted) {
    if (isCorrect && isSelected) {
      // Team answered correctly
      borderBgClass = 'bg-state-success/15 border-2 border-state-success text-optic-white shadow-sm';
      animationClass = 'animate-correct-pop';
    } else if (isSelected && !isCorrect) {
      // Team answered incorrectly
      borderBgClass = 'bg-state-warning-rose/15 border-2 border-state-warning-rose text-optic-white shadow-sm';
      animationClass = 'animate-wrong-shake';
    } else if (!isSelected && isCorrect) {
      // Missed correct answer (spotlight for audience)
      borderBgClass = 'bg-state-success/10 border-2 border-dashed border-state-success text-optic-white';
      animationClass = 'animate-in fade-in duration-300';
    } else {
      borderBgClass = 'bg-surface-onyx/60 border border-border-subtle text-text-muted-slate opacity-40';
    }
  } else if (isSelected) {
    // Selected before submit: Use custom team color
    borderBgClass = 'text-optic-white border-2 shadow-sm';
    inlineStyle = {
      borderColor: effectiveTeamColor,
      backgroundColor: `${effectiveTeamColor}20`,
    };
  }

  return (
    <div
      onClick={() => {
        if (!disabled && !isSubmitted) {
          onSelect();
        }
      }}
      style={inlineStyle}
      className={`relative p-5 md:p-6 rounded-xl transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer select-none ${borderBgClass} ${animationClass} ${
        disabled ? 'cursor-not-allowed' : 'active:scale-[0.99]'
      }`}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Letter Indicator */}
        <div
          style={
            !isSubmitted && isSelected
              ? { backgroundColor: effectiveTeamColor, color: teamTextColor }
              : undefined
          }
          className={`w-9 h-9 md:w-11 md:h-11 rounded-lg flex items-center justify-center font-sans text-base md:text-lg font-bold shrink-0 transition-colors ${
            isSubmitted && isCorrect
              ? 'bg-state-success text-white'
              : isSubmitted && isSelected && !isCorrect
              ? 'bg-state-warning-rose text-white'
              : !isSelected
              ? 'bg-surface-onyx border border-border-medium text-text-bright-slate'
              : ''
          }`}
        >
          {letter}
        </div>

        {/* Option Text */}
        <div className="flex-1 min-w-0">
          <p className="text-body-xl font-medium tracking-normal leading-relaxed truncate-3-lines">
            {text}
          </p>
        </div>
      </div>

      {/* Result Telemetry Badge & Icons */}
      {isSubmitted && (
        <div className="shrink-0 flex items-center gap-2">
          {isCorrect && isSelected && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-state-success text-surface-obsidian text-xs font-mono font-bold animate-badge-spring shadow-sm">
              <Award className="w-3.5 h-3.5" />
              <span>+{points} PTS • CORRECT</span>
              <CheckCircle2 className="w-4 h-4 ml-0.5" />
            </div>
          )}

          {isSelected && !isCorrect && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-state-warning-rose text-white text-xs font-mono font-bold animate-badge-spring shadow-sm">
              <XCircle className="w-3.5 h-3.5" />
              <span>INCORRECT</span>
            </div>
          )}

          {!isSelected && isCorrect && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-state-success/20 border border-state-success/60 text-state-success text-[11px] font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CORRECT ANSWER</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

