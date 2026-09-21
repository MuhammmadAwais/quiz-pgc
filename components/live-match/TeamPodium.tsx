'use client';

import React from 'react';

interface TeamPodiumProps {
  faction: 'TEAM_A' | 'TEAM_B';
  name: string;
  score: number;
  isActiveTurn: boolean;
}

export function TeamPodium({
  faction,
  name,
  score,
  isActiveTurn,
}: TeamPodiumProps) {
  const isTeamA = faction === 'TEAM_A';

  return (
    <div
      className={`relative rounded-xl transition-all duration-200 p-6 flex flex-col justify-between overflow-hidden ${
        isTeamA
          ? isActiveTurn
            ? 'bg-surface-carbon border-2 border-team-a-core shadow-md'
            : 'bg-surface-onyx border border-border-subtle opacity-75'
          : isActiveTurn
          ? 'bg-surface-carbon border-2 border-team-b-cyan shadow-md'
          : 'bg-surface-onyx border border-border-subtle opacity-75'
      }`}
    >
      {/* Team Identifier Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isTeamA
                ? isActiveTurn ? 'bg-team-a-core' : 'bg-team-a-deep/50'
                : isActiveTurn ? 'bg-team-b-cyan' : 'bg-team-b-deep/50'
            }`}
          />
          <span
            className={`font-mono text-xs font-bold uppercase tracking-widest ${
              isTeamA ? 'text-team-a-bright' : 'text-team-b-cyan'
            }`}
          >
            {isTeamA ? 'TEAM ALPHA' : 'TEAM BETA'}
          </span>
        </div>

        {isActiveTurn && (
          <span
            className={`font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              isTeamA
                ? 'bg-team-a-core text-white'
                : 'bg-team-b-cyan text-white'
            }`}
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
          className={`score-display ${
            isTeamA ? 'text-team-a-bright' : 'text-team-b-cyan'
          }`}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
