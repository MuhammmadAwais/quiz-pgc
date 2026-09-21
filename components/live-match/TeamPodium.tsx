'use client';

import React from 'react';
import { getTextContrastColor } from '@/lib/utils/color';

interface TeamPodiumProps {
  faction: 'TEAM_A' | 'TEAM_B';
  name: string;
  score: number;
  isActiveTurn: boolean;
  teamColor?: string;
}

export function TeamPodium({
  faction,
  name,
  score,
  isActiveTurn,
  teamColor,
}: TeamPodiumProps) {
  const isTeamA = faction === 'TEAM_A';
  const defaultColor = isTeamA ? '#8B5CF6' : '#06B6D4';
  const effectiveColor = teamColor || defaultColor;
  const badgeTextColor = getTextContrastColor(effectiveColor);

  return (
    <div
      style={
        isActiveTurn
          ? { borderColor: effectiveColor }
          : undefined
      }
      className={`relative rounded-xl transition-all duration-200 p-6 flex flex-col justify-between overflow-hidden shadow-sm ${
        isActiveTurn
          ? 'bg-surface-carbon border-2'
          : 'bg-surface-onyx border border-border-subtle opacity-80'
      }`}
    >
      {/* Team Identifier Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: isActiveTurn ? effectiveColor : `${effectiveColor}80`,
            }}
          />
          <span
            className="font-mono text-xs font-bold uppercase tracking-widest"
            style={{ color: effectiveColor }}
          >
            {isTeamA ? 'TEAM ALPHA' : 'TEAM BETA'}
          </span>
        </div>

        {isActiveTurn && (
          <span
            className="font-mono text-[10px] font-bold uppercase px-2.5 py-0.5 rounded shadow-sm animate-badge-spring"
            style={{
              backgroundColor: effectiveColor,
              color: badgeTextColor,
            }}
          >
            ACTIVE TURN
          </span>
        )}
      </div>

      {/* Team Name */}
      <div className="my-6 z-10">
        <h3 className="text-xl md:text-2xl font-bold text-optic-white truncate tracking-tight font-sans">
          {name}
        </h3>
      </div>

      {/* Digital Tabular Score */}
      <div className="z-10 flex items-baseline justify-between pt-4 border-t border-border-subtle">
        <span className="label-caps text-text-muted-slate font-sans">
          POINTS
        </span>
        <span
          className="score-display font-extrabold"
          style={{ color: effectiveColor }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}

