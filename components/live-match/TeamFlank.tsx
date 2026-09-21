'use client';

import React from 'react';
import { Team } from '@/lib/types/tournament';
import { getTextContrastColor } from '@/lib/utils/color';

interface TeamFlankProps {
  teams: { team: Team; index: number }[];
  activeTeamIndex: number;
}

export function TeamFlank({ teams, activeTeamIndex }: TeamFlankProps) {
  // If 2 or more teams on this flank, arrange into a 2-column grid to utilize horizontal projector space cleanly
  const isMultiColumn = teams.length >= 2;
  const isCompact = teams.length > 2;

  return (
    <div
      className={`w-full grid gap-2.5 ${
        isMultiColumn ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
      }`}
    >
      {teams.map(({ team, index }) => {
        const isActive = index === activeTeamIndex;
        const color = team.color || '#8B5CF6';
        const badgeTextColor = getTextContrastColor(color);

        return (
          <div
            key={team.id || index}
            style={
              isActive
                ? {
                    borderColor: color,
                    boxShadow: `0 0 16px ${color}35`,
                  }
                : undefined
            }
            className={`relative rounded-xl transition-all duration-200 overflow-hidden shadow-sm flex flex-col justify-between ${
              isCompact
                ? 'p-3 min-h-[96px]'
                : isMultiColumn
                ? 'p-3.5 min-h-[110px]'
                : 'p-5 md:p-6 min-h-[140px]'
            } ${
              isActive
                ? 'bg-surface-carbon border-2'
                : 'bg-surface-onyx border border-border-subtle opacity-75'
            }`}
          >
            {/* Top row: Indicator dot + Team Number + Status */}
            <div className="flex items-center justify-between z-10 gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isActive ? color : `${color}80`,
                  }}
                />
                <span
                  className="font-mono text-[10px] font-bold uppercase tracking-wider truncate"
                  style={{ color }}
                >
                  TEAM #{index + 1}
                </span>
              </div>

              {isActive && (
                <span
                  className="font-mono text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shadow-sm animate-badge-spring shrink-0"
                  style={{
                    backgroundColor: color,
                    color: badgeTextColor,
                  }}
                >
                  ACTIVE
                </span>
              )}
            </div>

            {/* Team Name */}
            <div className={`z-10 ${isCompact ? 'my-1' : 'my-2'}`}>
              <h3
                className={`font-bold text-optic-white truncate tracking-tight font-sans ${
                  isCompact ? 'text-sm md:text-base' : 'text-base md:text-lg'
                }`}
                title={team.name}
              >
                {team.name}
              </h3>
            </div>

            {/* Score row */}
            <div className="z-10 flex items-baseline justify-between pt-1.5 border-t border-border-subtle">
              <span className="label-caps text-text-muted-slate font-sans text-[9px]">
                PTS
              </span>
              <span
                className={`font-mono font-black tabular-nums ${
                  isCompact ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
                }`}
                style={{ color }}
              >
                {team.score}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
