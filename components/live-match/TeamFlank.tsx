'use client';

import React from 'react';
import { Team } from '@/lib/types/tournament';
import { getTextContrastColor } from '@/lib/utils/color';

interface TeamFlankProps {
  teams: { team: Team; index: number }[];
  activeTeamIndex: number;
}

export function TeamFlank({ teams, activeTeamIndex }: TeamFlankProps) {
  const isCompact = teams.length > 2;

  return (
    <div className="w-full flex flex-col gap-3 justify-center h-full">
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
                    boxShadow: `0 0 16px ${color}30`,
                  }
                : undefined
            }
            className={`relative rounded-xl transition-all duration-200 overflow-hidden shadow-sm flex flex-col justify-between ${
              isCompact ? 'p-3 md:p-4' : 'p-5 md:p-6 min-h-[140px]'
            } ${
              isActive
                ? 'bg-surface-carbon border-2'
                : 'bg-surface-onyx border border-border-subtle opacity-75'
            }`}
          >
            {/* Top row: Indicator dot + Status */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isActive ? color : `${color}80`,
                  }}
                />
                <span
                  className="font-mono text-[11px] font-bold uppercase tracking-wider truncate"
                  style={{ color }}
                >
                  TEAM #{index + 1}
                </span>
              </div>

              {isActive && (
                <span
                  className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm animate-badge-spring shrink-0 ml-1.5"
                  style={{
                    backgroundColor: color,
                    color: badgeTextColor,
                  }}
                >
                  ACTIVE TURN
                </span>
              )}
            </div>

            {/* Team Name */}
            <div className={`z-10 ${isCompact ? 'my-2' : 'my-4'}`}>
              <h3
                className={`font-bold text-optic-white truncate tracking-tight font-sans ${
                  isCompact ? 'text-base md:text-lg' : 'text-xl md:text-2xl'
                }`}
                title={team.name}
              >
                {team.name}
              </h3>
            </div>

            {/* Score row */}
            <div className="z-10 flex items-baseline justify-between pt-2 border-t border-border-subtle">
              <span className="label-caps text-text-muted-slate font-sans text-[10px]">
                POINTS
              </span>
              <span
                className={`font-mono font-black tabular-nums ${
                  isCompact ? 'text-2xl md:text-3xl' : 'score-display'
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
